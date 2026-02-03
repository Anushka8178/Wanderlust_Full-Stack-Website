const Review = require("../models/review.js");
const { Listing } = require("../models/listing.js");
const ExpressError = global.ExpressError;

module.exports.postReview=async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) {
            req.flash("error", "Listing not found");
            return res.redirect("/listings");
        }
        
        // Validate review data
        if (!req.body.review) {
            req.flash("error", "Review data is missing");
            return res.redirect(`/listings/${req.params.id}`);
        }
        
        const rating = Number(req.body.review.rating);
        const comment = req.body.review.comment ? req.body.review.comment.trim() : '';
        
        if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
            req.flash("error", "Please select a valid rating (1-5 stars)");
            return res.redirect(`/listings/${req.params.id}`);
        }
        
        if (!comment || comment.length === 0) {
            req.flash("error", "Please provide a comment");
            return res.redirect(`/listings/${req.params.id}`);
        }
        
        const newReview = new Review({
            rating: rating,
            comment: comment
        });
        newReview.author = req.user._id;
        
        await newReview.save();
        listing.reviews.push(newReview._id);
        await listing.save();
        
        req.flash("success", "New Review Created!");
        res.redirect(`/listings/${listing._id}`);
    } catch (error) {
        console.error("Error creating review:", error);
        req.flash("error", error.message || "Something went wrong while creating the review");
        res.redirect(`/listings/${req.params.id}`);
    }
};

module.exports.destroyReview=async(req,res)=>{
    let{id,reviewId}=req.params;
    await Listing.findByIdAndUpdate(id,{$pull:{reviews:reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash("success","Review Deleted!");
    res.redirect(`/listings/${id}`);

};