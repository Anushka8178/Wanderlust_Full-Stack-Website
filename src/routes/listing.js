const express=require("express");
const router=express.Router();
const wrapAsync = global.wrapAsync;
const { Listing } = require("../models/listing.js");
const {isLoggedIn,isOwner,validateListing}=require("../middleware.js");
const listingController=require("../controllers/listings.js");
const multer  = require('multer');
const {storage}=require("../cloudConfig.js");
const upload = multer({ storage })




router
.route("/")
.get(wrapAsync(listingController.index))
.post(isLoggedIn, upload.single('listing[image]'),validateListing,wrapAsync(listingController.createListing));

// New Route
router.get("/new",isLoggedIn, listingController.renderNewForm);

// Razorpay payment routes (must be before /:id route)
router.post("/:id/create-order", isLoggedIn, wrapAsync(listingController.createOrder));
router.post("/:id/verify-payment", isLoggedIn, wrapAsync(listingController.verifyPayment));

router
.route("/:id")
.get(wrapAsync(listingController.showListing))
.put(isLoggedIn,isOwner,upload.single('listing[image]'), validateListing, wrapAsync(listingController.updateListing))
.delete(isLoggedIn,isOwner, wrapAsync(listingController.destroyListing));

// Edit Route
router.get("/:id/edit",isLoggedIn,isOwner, wrapAsync(listingController.editListing));


// routes/listing.js

router.get("/filter", wrapAsync(listingController.filterListings));
router.get("/filter/:category", wrapAsync(async (req, res) => {
    const { category } = req.params;
    let filteredListings;
    
    if (category === "Trending") {
        // For trending, get all listings (can modify logic later)
        filteredListings = await Listing.find({});
    } else {
        // Filter by the specific category
        filteredListings = await Listing.find({ category: category });
    }

    res.render("listings/index", { allListings: filteredListings });
}));

// Add route for marking dates as unavailable
router.post("/:id/unavailable", isLoggedIn, wrapAsync(listingController.markUnavailable));

module.exports=router;