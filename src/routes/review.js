const express=require("express");
const router=express.Router({mergeParams:true});
const ExpressError = global.ExpressError;
const wrapAsync = global.wrapAsync;
const Review = require("../models/review.js");
const { Listing } = require("../models/listing.js");
const {validateReview, isReviewAuthor}=require("../middleware.js");
const {isLoggedIn}=require("../middleware.js");

const reviewController=require("../controllers/review.js");
// Reviews 
//Post Review Route
router.post("/", isLoggedIn,validateReview, wrapAsync(reviewController.postReview));

//Delete Review Route
router.delete("/:reviewId",isLoggedIn,isReviewAuthor,wrapAsync(reviewController.destroyReview));

module.exports=router;
