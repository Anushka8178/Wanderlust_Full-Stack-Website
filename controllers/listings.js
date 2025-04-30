const { Listing, validCategories } = require("../models/listing");
const mapToken = process.env.MAPTOKEN;
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

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
    
    res.render("listings/show", { listing, mapToken: process.env.MAPTOKEN });
};

// Create a new listing
module.exports.createListing = async (req, res) => {
    try {
        const { category } = req.body.listing;
        if (!category) {
            req.flash("error", "Category is required!");
            return res.redirect("/listings/new");
        }

        let response;
        try {
            response = await geocodingClient.forwardGeocode({
                query: req.body.listing.location,
                limit: 1,
            }).send();
        } catch (geoError) {
            console.error("Geocoding error:", geoError);
            req.flash("error", "Geocoding failed!");
            return res.redirect("/listings/new");
        }

        if (!req.file) {
            console.log("No file uploaded.");
            req.flash("error", "Image upload failed!");
            return res.redirect("/listings/new");
        }

        const url = req.file.path;
        const filename = req.file.filename;

        const newListing = new Listing(req.body.listing);
        newListing.owner = req.user._id;
        newListing.image = { url, filename };
        newListing.geometry = response.body.features[0].geometry;

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
