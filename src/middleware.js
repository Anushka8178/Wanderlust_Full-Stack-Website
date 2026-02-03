const { Listing } = require("./models/listing");
const { listingSchema } = require("./schema.js");
const ExpressError = global.ExpressError;
const { reviewSchema } = require("./schema.js");
const Review = require("./models/review.js");

module.exports.isLoggedIn=(req,res,next)=>{
    // console.log(req.path,"..",req.originalUrl)
    if(!req.isAuthenticated()){
        req.session.redirectUrl=req.originalUrl;
        req.flash("error","You must be logged in to create a listing!");
        return res.redirect("/login");
    }
    next();
};
module.exports.saveRedirectUrl=(req,res,next)=>{
    if (req.session.redirectUrl){
        res.locals.redirectUrl=req.session.redirectUrl;
    }
    next();
};

module.exports.isOwner=async(req,res,next)=>{
    let { id } = req.params;
    let listing=await Listing.findById(id).populate('owner');
    if(!listing.owner._id.equals(res.locals.currUser._id)){
        req.flash("error","You're not the owner of this listing");
        return res.redirect(`/listings/${id}`)
    }
    next();

};

module.exports.validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(errMsg, 400);
    } else {
        next();
    }
};

module.exports.validateReview = (req, res, next) => {
    // Ensure review object exists
    if (!req.body.review) {
        req.flash("error", "Review data is required");
        return res.redirect(`/listings/${req.params.id}`);
    }
    
    // Check and convert rating - handle empty string from "no-rate" option
    const ratingValue = req.body.review.rating;
    if (!ratingValue || ratingValue === '' || ratingValue === '0') {
        req.flash("error", "Please select a rating");
        return res.redirect(`/listings/${req.params.id}`);
    }
    
    const rating = Number(ratingValue);
    if (isNaN(rating) || rating < 1 || rating > 5) {
        req.flash("error", "Rating must be between 1 and 5");
        return res.redirect(`/listings/${req.params.id}`);
    }
    
    // Update the rating to be a number
    req.body.review.rating = rating;
    
    // Validate comment
    const comment = req.body.review.comment ? req.body.review.comment.trim() : '';
    if (!comment || comment.length === 0) {
        req.flash("error", "Comment is required");
        return res.redirect(`/listings/${req.params.id}`);
    }
    
    // Validate with schema
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const errMsg = error.details.map(el => el.message).join(", ");
        req.flash("error", errMsg);
        return res.redirect(`/listings/${req.params.id}`);
    }
    
    next();
};

module.exports.isReviewAuthor=async(req,res,next)=>{
    let { id,reviewId } = req.params;
    let review=await Review.findById(reviewId);
    if(!review.author._id.equals(res.locals.currUser._id)){
        req.flash("error","You're not the author of this review");
        return res.redirect(`/listings/${id}`)
    }
    next();

};
