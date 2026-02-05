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

// Decide DB URL based on environment
const isProduction = process.env.NODE_ENV === "production";
const dbUrl = isProduction
    ? process.env.ATLASDB_URL // use Atlas only in production
    : "mongodb://127.0.0.1:27017/wanderlust"; // always use local Mongo in dev

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
