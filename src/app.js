// Inline so Render never fails on missing utils/lib (no file or package dependency)
class ExpressError extends Error {
    constructor(statusCode, message) {
        super();
        this.statusCode = statusCode;
        this.message = message;
    }
}
const wrapAsync = (fn) => (req, res, next) => fn(req, res, next).catch(next);
global.ExpressError = ExpressError;
global.wrapAsync = wrapAsync;

if (process.env.NODE_ENV != "production") {
    require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const flash = require("connect-flash");
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const app = express();

// Decide DB URL: prefer ATLASDB_URL if present, otherwise fallback to local MongoDB
const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

// Database connection (never crash the server)
(async () => {
    try {
        if (!dbUrl) {
            console.warn("No database URL configured. Continuing without DB connection.");
            return;
        }
        await mongoose.connect(dbUrl);
        console.log("Connected to DB");
    } catch (err) {
        console.error("Database connection error (server will still run):", err.message || err);
    }
})().catch(() => {}); // prevent any unhandled rejection from crashing the process

// Middleware
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 60 * 60, // Prevent frequent session updates
});

store.on("error", (err) => {
    console.error("ERROR in Mongo Session Store:", err);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET || "fallbackSecret", // Fallback secret for development
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

app.use(session(sessionOptions));
app.use(flash());

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Global variables for views
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// Seed route for populating demo listings
app.get("/seed-demo-data", wrapAsync(async (req, res) => {
    const { Listing } = require("./models/listing.js");
    const Review = require("./models/review.js");
    const User = require("./models/user.js");

    let ownerUser = await User.findOne({ username: "anushka" });
    if (!ownerUser) {
        ownerUser = await User.findOne({});
    }
    if (!ownerUser) {
        const newUser = new User({ email: "demo@wanderlust.com", username: "anushka" });
        ownerUser = await User.register(newUser, "Password@123");
    }

    await Listing.deleteMany({});
    await Review.deleteMany({});

    const demoListings = [
        {
            title: "Luxury Beachfront Villa",
            description: "Experience coastal paradise in this stunning beachfront villa featuring a private infinity pool, panoramic Arabian Sea views, sun loungers, and direct private beach access.",
            image: { url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&auto=format&fit=crop&q=80", filename: "beach-villa-1" },
            price: 15500,
            location: "Candolim, Goa",
            country: "India",
            category: "Beaches",
            roomLimit: 4,
            geometry: { type: "Point", coordinates: [73.7634, 15.5177] }
        },
        {
            title: "Himalayan Alpine Chalet",
            description: "Nestled amidst cedar pine forests, this wooden chalet offers warm fireplace hearths, private balconies overlooking snow-capped peaks, and guided trekking trails.",
            image: { url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80", filename: "mountain-cabin-1" },
            price: 8500,
            location: "Old Manali, Himachal Pradesh",
            country: "India",
            category: "Mountains",
            roomLimit: 3,
            geometry: { type: "Point", coordinates: [77.1861, 32.2432] }
        },
        {
            title: "Royal Heritage Fort Palace",
            description: "Step into 300 years of royal grandeur. Features jharokha balconies, traditional Marwari cuisine dining, sprawling courtyard gardens, and sunset terrace views.",
            image: { url: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1200&auto=format&fit=crop&q=80", filename: "castle-suite-1" },
            price: 22000,
            location: "Jaipur, Rajasthan",
            country: "India",
            category: "Castles",
            roomLimit: 5,
            geometry: { type: "Point", coordinates: [75.7873, 26.9124] }
        },
        {
            title: "Downtown Glasshouse Penthouse",
            description: "Ultra-modern duplex penthouse overlooking the city skyline. Features floor-to-ceiling glass windows, high-speed Wi-Fi, smart lighting, and rooftop lounge.",
            image: { url: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=1200&auto=format&fit=crop&q=80", filename: "urban-loft-1" },
            price: 9800,
            location: "Bandra West, Mumbai",
            country: "India",
            category: "Heart of the City",
            roomLimit: 2,
            geometry: { type: "Point", coordinates: [72.8333, 19.0544] }
        },
        {
            title: "Mist & Canopy Forest Lodge",
            description: "Immerse in tranquility at this secluded coffee plantation lodge. Features open-air jacuzzi, birdsong mornings, organic estate breakfast, and nature walks.",
            image: { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80", filename: "forest-cottage-1" },
            price: 7200,
            location: "Madikeri, Coorg",
            country: "India",
            category: "Forest Resorts",
            roomLimit: 3,
            geometry: { type: "Point", coordinates: [75.7333, 12.4200] }
        },
        {
            title: "Valley View Vineyard Estate",
            description: "Stay in the heart of lush grape orchards. Includes complimentary wine tasting tours, cellar master sessions, and farm-to-table gourmet dining.",
            image: { url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&auto=format&fit=crop&q=80", filename: "vineyard-estate-1" },
            price: 13500,
            location: "Nashik, Maharashtra",
            country: "India",
            category: "Vineyards",
            roomLimit: 4,
            geometry: { type: "Point", coordinates: [73.7898, 20.0059] }
        },
        {
            title: "Nomad Backpackers Pod",
            description: "Clean, vibrant, and minimalist budget pods designed for digital nomads. Includes high-speed fiber internet, co-working space access, and community kitchen.",
            image: { url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop&q=80", filename: "budget-hostel-1" },
            price: 1200,
            location: "Hauz Khas, New Delhi",
            country: "India",
            category: "Budget Rooms",
            roomLimit: 1,
            geometry: { type: "Point", coordinates: [77.2060, 28.5494] }
        },
        {
            title: "Tea Plantation Heritage B&B",
            description: "Charming colonial bungalow nestled amidst rolling tea gardens. Sip freshly brewed artisanal tea on the wrap-around veranda while misty clouds roll by.",
            image: { url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop&q=80", filename: "bed-breakfast-1" },
            price: 4800,
            location: "Munnar, Kerala",
            country: "India",
            category: "Bed & Breakfasts",
            roomLimit: 2,
            geometry: { type: "Point", coordinates: [77.0597, 10.0889] }
        },
        {
            title: "Clifftop Sunset Villa",
            description: "Perched dramatically over red seaside cliffs, this eco-resort features open bamboo architecture, yoga decks, fresh seafood dining, and private beach pathways.",
            image: { url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&auto=format&fit=crop&q=80", filename: "beach-villa-2" },
            price: 16800,
            location: "Varkala Cliff, Kerala",
            country: "India",
            category: "Beaches",
            roomLimit: 3,
            geometry: { type: "Point", coordinates: [76.7163, 8.7379] }
        },
        {
            title: "Portuguese Heritage Manor",
            description: "Restored 19th-century Portuguese villa with high wooden ceilings, hand-painted Azulejo tiles, private swimming pool, and tropical courtyard garden.",
            image: { url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&auto=format&fit=crop&q=80", filename: "trending-villa-1" },
            price: 18900,
            location: "Assagao, North Goa",
            country: "India",
            category: "Trending",
            roomLimit: 4,
            geometry: { type: "Point", coordinates: [73.7820, 15.5900] }
        },
        {
            title: "Udaipur Lakefront Haveli",
            description: "Overlooking the tranquil waters of Lake Pichola and the City Palace. Enjoy rooftop candlelight dinners, traditional folk performances, and royal hospitality.",
            image: { url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&auto=format&fit=crop&q=80", filename: "castle-haveli-2" },
            price: 24500,
            location: "Udaipur, Rajasthan",
            country: "India",
            category: "Castles",
            roomLimit: 4,
            geometry: { type: "Point", coordinates: [73.6833, 24.5854] }
        },
        {
            title: "Silicon Valley Tech Hub Loft",
            description: "Sleek, minimalist studio located in the tech heart of Indiranagar. Smart locks, ergonomic workstation, 4K projector entertainment, and espresso bar.",
            image: { url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop&q=80", filename: "city-loft-2" },
            price: 6500,
            location: "Indiranagar, Bengaluru",
            country: "India",
            category: "Heart of the City",
            roomLimit: 2,
            geometry: { type: "Point", coordinates: [77.6412, 12.9784] }
        },
        {
            title: "Treehouse Eco-Resort Sanctuary",
            description: "Suspended 30 feet above the forest floor among giant banyan branches. Listen to stream waters and tropical bird calls from your private open canopy hammock.",
            image: { url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&auto=format&fit=crop&q=80", filename: "forest-treehouse" },
            price: 11000,
            location: "Vythiri, Wayanad",
            country: "India",
            category: "Forest Resorts",
            roomLimit: 2,
            geometry: { type: "Point", coordinates: [76.0384, 11.5524] }
        },
        {
            title: "Sunlit Hilltop Studio",
            description: "Budget-friendly, cozy hilltop studio with sweeping views of the valley. Includes private balcony, tea kettle, solar water heating, and high-speed Wi-Fi.",
            image: { url: "https://images.unsplash.com/photo-1499696010180-025ef6e1a8f9?w=1200&auto=format&fit=crop&q=80", filename: "budget-studio" },
            price: 2200,
            location: "Shimla, Himachal Pradesh",
            country: "India",
            category: "Budget Rooms",
            roomLimit: 1,
            geometry: { type: "Point", coordinates: [77.1734, 31.1048] }
        },
        {
            title: "Highland Organic Vineyard Cottage",
            description: "Boutique vineyard cottage nestled in wine country. Wake up to fresh mountain air, enjoy artisanal cheese platters, and walk through private estate vines.",
            image: { url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80", filename: "vineyard-cottage-2" },
            price: 14200,
            location: "Solan, Himachal Pradesh",
            country: "India",
            category: "Vineyards",
            roomLimit: 3,
            geometry: { type: "Point", coordinates: [77.1089, 30.9084] }
        },
        {
            title: "Botanical Garden Heritage B&B",
            description: "Quaint colonial B&B surrounded by century-old botanical gardens. Homemade berry jams, roaring brick fireplaces, and afternoon high-tea served daily.",
            image: { url: "https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=1200&auto=format&fit=crop&q=80", filename: "bed-breakfast-2" },
            price: 5200,
            location: "Ooty, Tamil Nadu",
            country: "India",
            category: "Bed & Breakfasts",
            roomLimit: 2,
            geometry: { type: "Point", coordinates: [76.6937, 11.4102] }
        }
    ];

    const sampleReviews = [
        { rating: 5, comment: "Absolutely breathtaking views and top-notch hospitality! Will definitely visit again." },
        { rating: 5, comment: "Super clean rooms, seamless check-in, and peaceful vibes. Highly recommended!" }
    ];

    for (let lData of demoListings) {
        const reviewIds = [];
        for (let revData of sampleReviews) {
            const newRev = new Review({
                rating: revData.rating,
                comment: revData.comment,
                author: ownerUser._id
            });
            await newRev.save();
            reviewIds.push(newRev._id);
        }

        const newListing = new Listing({
            ...lData,
            owner: ownerUser._id,
            reviews: reviewIds
        });
        await newListing.save();
    }

    req.flash("success", "Successfully seeded database with 16 high-quality demo listings & reviews!");
    res.redirect("/listings");
}));

// Routes
app.get("/", (req, res) => {
    res.redirect("/listings");
});

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/bookings", require("./routes/booking.js"));
app.use("/", userRouter);

// Catch-all route for undefined routes
app.all("*", (req, res, next) => {
    // Skip logging for common non-critical requests
    const skipLogging = ["/favicon.ico", "/robots.txt", "/apple-touch-icon.png"].includes(req.path);
    if (!skipLogging) {
        console.log(`404: ${req.method} ${req.path}`);
    }
    next(new ExpressError(404, "Page not found!!"));
});

// Error handling middleware
app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong!" } = err;

    if (typeof statusCode !== "number" || statusCode < 100 || statusCode > 599) {
        console.error("Invalid status code detected, defaulting to 500.");
        statusCode = 500;
    }

    // Only log full error details for non-404 errors
    if (statusCode !== 404) {
        console.error("Error:", err);
    }

    // Render error page or send JSON response
    if (req.accepts("html")) {
        res.status(statusCode).render("error", { message });
    } else {
        res.status(statusCode).json({ error: message });
    }
});

// Start the server (use PORT from env for deployment)
const port = process.env.PORT || 3001;
const server = app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Please try a different port.`);
        process.exit(1);
    } else {
        console.error('Server error:', err);
        process.exit(1);
    }
});
