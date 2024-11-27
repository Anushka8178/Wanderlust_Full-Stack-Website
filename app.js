if (process.env.NODE_ENV != "production") {
    require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
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

// Ensure the database URL is provided
const dbUrl = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/defaultdb"; // Fallback for local dev
if (!process.env.ATLASDB_URL) {
    console.error("Error: ATLASDB_URL is not set in environment variables.");
    process.exit(1);
}

// Database connection
mongoose.connect(dbUrl)
    .then(() => {
        console.log("Connected to DB");
    })
    .catch((err) => {
        console.error("Database connection error:", err);
    });

// Middleware
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
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
app.use("/", userRouter);

// Catch-all route for undefined routes
app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page not found!!"));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err); // Log error for debugging
    let { statusCode = 500, message = "Something went wrong!" } = err;

    if (typeof statusCode !== "number" || statusCode < 100 || statusCode > 599) {
        console.error("Invalid status code detected, defaulting to 500.");
        statusCode = 500;
    }

    // Render error page or send JSON response
    if (req.accepts("html")) {
        res.status(statusCode).render("error", { message });
    } else {
        res.status(statusCode).json({ error: message });
    }
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
