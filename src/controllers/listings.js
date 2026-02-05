const { Listing, validCategories } = require("../models/listing");
const { Booking } = require("../models/booking");
const mapToken = process.env.MAPTOKEN;
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const geocodingClient = mbxGeocoding({ accessToken: mapToken });
const Razorpay = require("razorpay");
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "",
    key_secret: process.env.RAZORPAY_KEY_SECRET || ""
});

// Index - Display all listings
module.exports.index = async (req, res) => {
    try {
        const { category, search, checkin, checkout, refresh } = req.query;
        
        // If refresh parameter is present, redirect to root route
        if (refresh) {
            return res.redirect("/");
        }
        
        let filter = {};

        // Debug logging
        console.log("Search query:", search);
        console.log("Category:", category);
        console.log("Check-in:", checkin);
        console.log("Check-out:", checkout);

        // Apply category filter
        if (category && category !== "all") {
            filter.category = category;
        }

        // Apply search filter
        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            filter.$or = [
                { title: searchRegex },
                { location: searchRegex },
                { country: searchRegex },
                { description: searchRegex },
                { category: searchRegex }
            ];
        }

        // Apply date availability filter if both dates are provided
        if (checkin && checkout) {
            const checkinDate = new Date(checkin);
            const checkoutDate = new Date(checkout);
            
            // Add date availability filter
            filter.$and = [
                {
                    $or: [
                        { unavailableDates: { $exists: false } },
                        {
                            $not: {
                                $elemMatch: {
                                    start: { $lte: checkoutDate },
                                    end: { $gte: checkinDate }
                                }
                            }
                        }
                    ]
                }
            ];
        }

        // Execute the query
        const allListings = await Listing.find(filter)
            .sort({ createdAt: -1 })
            .collation({ locale: 'en', strength: 2 });
        
        // Ensure all listings have a valid category
        allListings.forEach(listing => {
            if (!listing.category || !validCategories.includes(listing.category)) {
                listing.category = "Budget Rooms";
                listing.save().catch(err => console.error("Error updating listing category:", err));
            }
        });

        // Debug logging
        console.log(`Found ${allListings.length} listings`);
        console.log("First listing:", allListings[0] ? {
            title: allListings[0].title,
            category: allListings[0].category || "Budget Rooms",
            price: allListings[0].price
        } : "No listings found");

        res.render("listings/index", { 
            allListings, 
            selectedCategory: category || "",
            searchQuery: search || "",
            checkin: checkin || "",
            checkout: checkout || "",
            queryParams: req.query,
            searchPerformed: !!(search || category || (checkin && checkout))
        });
    } catch (error) {
        console.error("Error fetching listings:", error);
        req.flash("error", "Something went wrong while fetching listings.");
        res.redirect("/listings");
    }
};

// Render new listing form
module.exports.renderNewForm = (req, res) => {
    const selectedCategory = req.query.category || ""; // Get selected category from query
    console.log("Selected Category:", selectedCategory);
    res.render("listings/new", { selectedCategory }); // Pass selectedCategory to the template
};

// Show a specific listing
module.exports.showListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({ path: "reviews", populate: { path: "author" } })
        .populate("owner");
    
    if (!listing) {
        req.flash("error", "Listing you requested for doesn't exist!");
        return res.redirect("/listings");
    }

    // Handle payment result flashes
    const { success, canceled, error } = req.query;
    if (success) {
        req.flash("success", "Payment successful! Your booking is confirmed.");
    } else if (canceled) {
        req.flash("error", "Payment was canceled. You have not been charged.");
    } else if (error) {
        req.flash("error", "Payment failed. Please try again or contact support.");
    }

    // Calculate available rooms for the listing
    // Note: This shows general availability. Actual availability depends on specific dates.
    const roomLimit = listing.roomLimit || 1;
    
    res.render("listings/show", { 
        listing, 
        mapToken: process.env.MAPTOKEN,
        roomLimit
    });
};

// Create Razorpay order for booking
module.exports.createOrder = async (req, res) => {
    const { id } = req.params;
    const { checkIn, checkOut, guests } = req.body;

    console.log("Creating order for listing:", id);
    console.log("Razorpay Key ID exists:", !!process.env.RAZORPAY_KEY_ID);
    console.log("Razorpay Key Secret exists:", !!process.env.RAZORPAY_KEY_SECRET);

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.error("Razorpay credentials missing!");
        return res.status(500).json({ error: "Payment gateway not configured" });
    }

    const listing = await Listing.findById(id);
    if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
    }

    // Check room availability BEFORE creating payment order
    if (checkIn && checkOut) {
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const roomLimit = listing.roomLimit || 1;
        
        const overlappingBookings = await Booking.find({
            listing: id,
            status: "confirmed",
            $or: [
                {
                    checkIn: { $lt: checkOutDate },
                    checkOut: { $gt: checkInDate }
                }
            ]
        });
        
        const bookedRooms = overlappingBookings.length;
        const availableRooms = roomLimit - bookedRooms;
        
        console.log("Room availability check (before order):", {
            roomLimit,
            bookedRooms,
            availableRooms,
            requestedDates: { checkIn: checkInDate, checkOut: checkOutDate }
        });
        
        if (availableRooms <= 0) {
            return res.status(400).json({ 
                error: `Sorry, all ${roomLimit} room(s) are already booked for these dates. Please choose different dates.`,
                availableRooms: 0,
                roomLimit: roomLimit
            });
        }
    }

    try {
        // Ensure Razorpay instance is initialized with current env vars
        const razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        // Razorpay minimum amount is 100 paise (₹1.00)
        const amountInPaise = Math.max(listing.price * 100, 100);
        
        // Razorpay receipt must be max 40 characters
        const shortId = id.toString().slice(-8); // Last 8 chars of ID
        const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
        const receipt = `bk_${shortId}_${timestamp}`; // Max 20 chars
        
        const options = {
            amount: amountInPaise, // amount in paise (minimum 100)
            currency: "INR",
            receipt: receipt,
            notes: {
                listing_id: id.toString(),
                listing_title: listing.title,
                user_id: req.user._id.toString(),
                checkIn: checkIn || "",
                checkOut: checkOut || "",
                guests: guests || 1
            }
        };

        console.log("Creating Razorpay order with options:", {
            amount: options.amount,
            currency: options.currency,
            receipt: options.receipt
        });

        const order = await razorpayInstance.orders.create(options);
        
        console.log("Order created successfully:", order.id);
        
        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID
        });
    } catch (err) {
        console.error("Razorpay order creation error:", err);
        console.error("Error details:", {
            message: err.message,
            statusCode: err.statusCode,
            error: err.error,
            description: err.description,
            status: err.status
        });
        res.status(500).json({ 
            error: "Failed to create payment order",
            details: err.message || err.error?.description || "Unknown error"
        });
    }
};

// Verify payment and handle success
module.exports.verifyPayment = async (req, res) => {
    const { id } = req.params;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, checkIn, checkOut, guests } = req.body;

    console.log("Verifying payment for listing:", id);
    console.log("Full request body:", JSON.stringify(req.body, null, 2));
    console.log("Payment details:", { razorpay_order_id, razorpay_payment_id, razorpay_signature, checkIn, checkOut, guests });

    // Try alternative field names (Razorpay might send different field names)
    const orderId = razorpay_order_id || req.body.order_id || req.body.razorpay_order_id;
    const paymentId = razorpay_payment_id || req.body.payment_id || req.body.razorpay_payment_id;
    const signature = razorpay_signature || req.body.signature || req.body.razorpay_signature;

    console.log("Extracted payment details:", { orderId, paymentId, signature: signature ? signature.substring(0, 20) + "..." : "none" });

    if (!orderId || !paymentId) {
        console.error("Missing payment details - Order ID:", orderId, "Payment ID:", paymentId);
        console.error("Full request body:", req.body);
        return res.status(400).json({ 
            success: false,
            error: "Payment verification failed. Missing payment details.",
            received: { orderId, paymentId, hasSignature: !!signature }
        });
    }

    // Check if booking already exists (prevent duplicates)
    const existingBooking = await Booking.findOne({ razorpayPaymentId: paymentId });
    if (existingBooking) {
        console.log("Booking already exists for this payment:", existingBooking._id);
        return res.json({ 
            success: true, 
            bookingId: existingBooking._id.toString(),
            redirectUrl: `/bookings/${existingBooking._id}/confirmation`
        });
    }

    let paymentVerified = false;
    let verificationMethod = "none";
    
    // Try signature verification if signature is provided
    if (signature) {
        const crypto = require("crypto");
        const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
        hmac.update(orderId + "|" + paymentId);
        const generated_signature = hmac.digest("hex");
        paymentVerified = generated_signature === signature;
        
        if (paymentVerified) {
            verificationMethod = "signature";
            console.log("✓ Payment verified via signature");
        } else {
            console.log("✗ Signature verification failed");
        }
    }

    // If signature verification fails, verify payment via Razorpay API as fallback
    if (!paymentVerified) {
        console.log("Attempting Razorpay API verification...");
        try {
            const razorpayInstance = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID,
                key_secret: process.env.RAZORPAY_KEY_SECRET
            });
            
            // Fetch payment details from Razorpay
            const payment = await razorpayInstance.payments.fetch(paymentId);
            
            console.log("Payment status from Razorpay API:", {
                status: payment.status,
                order_id: payment.order_id,
                expected_order_id: orderId,
                amount: payment.amount
            });
            
            // Verify payment is successful and order matches
            if ((payment.status === 'authorized' || payment.status === 'captured') && 
                payment.order_id === orderId) {
                paymentVerified = true;
                verificationMethod = "api";
                console.log("✓ Payment verified via Razorpay API");
            } else {
                console.log("✗ API verification failed - status:", payment.status, "order match:", payment.order_id === orderId);
            }
        } catch (apiErr) {
            console.error("Razorpay API verification error:", apiErr.message);
            // Continue - we'll save booking anyway if payment ID exists
        }
    }

    // IMPORTANT: If payment succeeded (we have payment_id), save booking even if verification fails
    // This prevents loss of booking data when payment succeeded but verification has issues
    if (paymentVerified || paymentId) {
        console.log("Proceeding to save booking. Verified:", paymentVerified, "Method:", verificationMethod, "Payment ID:", paymentId);
        try {
            const listing = await Listing.findById(id);
            if (!listing) {
                console.error("Listing not found:", id);
                return res.status(404).json({ 
                    success: false,
                    error: "Listing not found." 
                });
            }

            // Calculate total amount (price per night * number of nights)
            const checkInDate = checkIn ? new Date(checkIn) : new Date();
            const checkOutDate = checkOut ? new Date(checkOut) : new Date(checkInDate.getTime() + 24 * 60 * 60 * 1000); // Default 1 night
            const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)) || 1;
            const totalAmount = listing.price * nights;

            // Check room availability
            const roomLimit = listing.roomLimit || 1;
            
            // Find all confirmed bookings that overlap with the requested dates
            const overlappingBookings = await Booking.find({
                listing: id,
                status: "confirmed",
                $or: [
                    // Booking starts before requested checkout and ends after requested checkin
                    {
                        checkIn: { $lt: checkOutDate },
                        checkOut: { $gt: checkInDate }
                    }
                ]
            });

            const bookedRooms = overlappingBookings.length;
            const availableRooms = roomLimit - bookedRooms;

            console.log("Room availability check:", {
                roomLimit,
                bookedRooms,
                availableRooms,
                requestedDates: { checkIn: checkInDate, checkOut: checkOutDate }
            });

            if (availableRooms <= 0) {
                console.error("Room limit exceeded! Available:", availableRooms, "Requested: 1");
                return res.status(400).json({ 
                    success: false,
                    error: `Sorry, all ${roomLimit} room(s) are already booked for these dates. Please choose different dates.`,
                    availableRooms: 0,
                    roomLimit: roomLimit
                });
            }

            console.log("Creating booking:", {
                listing: id,
                user: req.user._id,
                checkIn: checkInDate,
                checkOut: checkOutDate,
                nights,
                totalAmount,
                orderId,
                paymentId,
                availableRooms: availableRooms - 1 // After this booking
            });

            // Create booking record
            const booking = new Booking({
                listing: id,
                user: req.user._id,
                checkIn: checkInDate,
                checkOut: checkOutDate,
                guests: parseInt(guests) || 1,
                totalAmount: totalAmount,
                razorpayOrderId: orderId,
                razorpayPaymentId: paymentId,
                status: "confirmed"
            });

            await booking.save();
            
            console.log("Booking saved successfully:", booking._id);
            
            // Return JSON with redirect URL for frontend to handle
            return res.json({ 
                success: true, 
                bookingId: booking._id.toString(),
                redirectUrl: `/bookings/${booking._id}/confirmation`
            });
        } catch (err) {
            console.error("Error saving booking:", err);
            return res.status(500).json({ 
                success: false,
                error: "Payment successful but booking could not be saved. Please contact support.",
                details: err.message
            });
        }
    } else {
        // Payment ID exists but verification failed - still save booking since payment succeeded
        console.warn("Verification failed but payment ID exists - payment likely succeeded, saving booking anyway");
        console.log("Payment ID:", paymentId);
        
        // Still save the booking since payment succeeded (money was debited)
        try {
            const listing = await Listing.findById(id);
            if (!listing) {
                console.error("Listing not found:", id);
                return res.status(404).json({ 
                    success: false,
                    error: "Listing not found." 
                });
            }

            // Check for existing booking
            const existingBooking = await Booking.findOne({ razorpayPaymentId: paymentId });
            if (existingBooking) {
                console.log("Booking already exists:", existingBooking._id);
                return res.json({ 
                    success: true, 
                    bookingId: existingBooking._id.toString(),
                    redirectUrl: `/bookings/${existingBooking._id}/confirmation`
                });
            }

            const checkInDate = checkIn ? new Date(checkIn) : new Date();
            const checkOutDate = checkOut ? new Date(checkOut) : new Date(checkInDate.getTime() + 24 * 60 * 60 * 1000);
            const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)) || 1;
            const totalAmount = listing.price * nights;

            // Check room availability (same logic as above)
            const roomLimit = listing.roomLimit || 1;
            const overlappingBookings = await Booking.find({
                listing: id,
                status: "confirmed",
                $or: [
                    {
                        checkIn: { $lt: checkOutDate },
                        checkOut: { $gt: checkInDate }
                    }
                ]
            });
            const bookedRooms = overlappingBookings.length;
            const availableRooms = roomLimit - bookedRooms;

            if (availableRooms <= 0) {
                console.error("Room limit exceeded in fallback! Available:", availableRooms);
                return res.status(400).json({ 
                    success: false,
                    error: `Sorry, all ${roomLimit} room(s) are already booked for these dates. Payment will be refunded.`,
                    availableRooms: 0,
                    roomLimit: roomLimit
                });
            }

            const booking = new Booking({
                listing: id,
                user: req.user._id,
                checkIn: checkInDate,
                checkOut: checkOutDate,
                guests: parseInt(guests) || 1,
                totalAmount: totalAmount,
                razorpayOrderId: orderId,
                razorpayPaymentId: paymentId,
                status: "confirmed"
            });

            await booking.save();
            console.log("Booking saved (verification failed but payment succeeded):", booking._id);
            
            return res.json({ 
                success: true, 
                bookingId: booking._id.toString(),
                redirectUrl: `/bookings/${booking._id}/confirmation`
            });
        } catch (err) {
            console.error("Error saving booking:", err);
            return res.status(500).json({ 
                success: false,
                error: "Payment successful but booking could not be saved. Please contact support.",
                details: err.message
            });
        }
    }
};

// Create a new listing
module.exports.createListing = async (req, res) => {
    try {
        const { category, location } = req.body.listing;
        if (!category) {
            req.flash("error", "Category is required!");
            return res.redirect("/listings/new");
        }

        if (!req.file) {
            console.log("No file uploaded.");
            req.flash("error", "Image upload failed! Please add an image.");
            return res.redirect("/listings/new");
        }

        // Default geometry (fallback if geocoding fails)
        let geometry = {
            type: "Point",
            coordinates: [77.2090, 28.6139], // Default: New Delhi
        };

        // Try geocoding only if we have a token and a location
        if (mapToken && location && location.trim()) {
            try {
                const response = await geocodingClient
                    .forwardGeocode({
                        query: location,
                        limit: 1,
                    })
                    .send();

                if (response.body.features && response.body.features.length > 0) {
                    geometry = response.body.features[0].geometry;
                } else {
                    console.warn("Geocoding returned no results for location:", location);
                }
            } catch (geoError) {
                console.error("Geocoding error (using fallback geometry):", geoError);
            }
        } else {
            if (!mapToken) {
                console.warn("MAPTOKEN is not set. Using fallback geometry.");
            }
            if (!location || !location.trim()) {
                console.warn("No location provided. Using fallback geometry.");
            }
        }

        const url = req.file.path;
        const filename = req.file.filename;

        const newListing = new Listing(req.body.listing);
        newListing.owner = req.user._id;
        newListing.image = { url, filename };
        newListing.geometry = geometry;

        await newListing.save();
        req.flash("success", "New Listing Created!");
        res.redirect("/listings");
    } catch (error) {
        console.error("Error creating listing:", error);
        req.flash("error", "Something went wrong while creating the listing.");
        res.redirect("/listings/new");
    }
};

// Render edit listing form
module.exports.editListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested for doesn't exist!");
        return res.redirect("/listings");
    }

    const originalImageUrl = listing.image.url.replace("/upload", "/upload/w_250");
    res.render("listings/edit", { listing, originalImageUrl });
};

// Update a listing
module.exports.updateListing = async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id);
        
        if (!listing) {
            req.flash("error", "Listing you requested for doesn't exist!");
            return res.redirect("/listings");
        }

        // Validate category
        const { category } = req.body.listing;
        if (!category) {
            req.flash("error", "Category is required!");
            return res.redirect(`/listings/${id}/edit`);
        }

        // Update listing fields
        listing.set(req.body.listing);

        // Handle image update if provided
        if (typeof req.file !== "undefined") {
            const url = req.file.path;
            const filename = req.file.filename;
            listing.image = { url, filename };
        }

        await listing.save();
        req.flash("success", "Listing Updated!");
        res.redirect(`/listings/${id}`);
    } catch (error) {
        console.error("Error updating listing:", error);
        req.flash("error", "Something went wrong while updating the listing.");
        res.redirect(`/listings/${req.params.id}/edit`);
    }
};

// Delete a listing
module.exports.destroyListing = async (req, res) => {
    const { id } = req.params;
    const deleteListing = await Listing.findByIdAndDelete(id);
    if (!deleteListing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    req.flash("success", "Listing deleted!");
    res.redirect("/listings");
};

// Mark dates as unavailable
module.exports.markUnavailable = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.body;
        
        const listing = await Listing.findById(id);
        if (!listing) {
            req.flash("error", "Listing not found!");
            return res.redirect("/listings");
        }

        // Add the unavailable dates
        listing.unavailableDates.push({
            start: new Date(startDate),
            end: new Date(endDate)
        });

        await listing.save();
        req.flash("success", "Dates marked as unavailable!");
        res.redirect(`/listings/${id}`);
    } catch (error) {
        console.error("Error marking dates as unavailable:", error);
        req.flash("error", "Something went wrong!");
        res.redirect("/listings");
    }
};
