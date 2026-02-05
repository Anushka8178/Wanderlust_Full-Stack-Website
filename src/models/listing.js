const mongoose=require("mongoose");
const Schema=mongoose.Schema;
const Review = require("../models/review");

const validCategories = [
    "Budget Rooms",
    "Heart of the City",
    "Mountains",
    "Castles",
    "Beaches",
    "Forest Resorts",
    "Bed & Breakfasts",
    "Vineyards"
];

const listingSchema=new Schema({
    title:{
        type:String,
        required:true,
    },
    description:String,
    image:{
        url:String,
        filename:String,
    },
    price:Number,
    location:String,
    country:String,
    reviews:[{
        type:Schema.Types.ObjectId,
        ref:"Review",
    }],
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
    },
    geometry:{
        type: {
          type: String,
          enum: ['Point'],
          required: true
        },
        coordinates: {
          type: [Number],
          required: true
        }
    },
    category: {
        type: String,
        enum: validCategories,
        required: true,
        default: "Budget Rooms",
        validate: {
            validator: function(v) {
                return validCategories.includes(v);
            },
            message: props => `${props.value} is not a valid category!`
        }
    },
    unavailableDates: [{
        start: Date,
        end: Date
    }],
    roomLimit: {
        type: Number,
        default: 1,
        min: 1,
        required: true
    }
});

// Add pre-save middleware to ensure category is valid
listingSchema.pre('save', function(next) {
    if (!this.category || !validCategories.includes(this.category)) {
        this.category = "Budget Rooms";
    }
    next();
});

// Add pre-update middleware
listingSchema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate();
    if (update.$set && update.$set.category && !validCategories.includes(update.$set.category)) {
        update.$set.category = "Budget Rooms";
    }
    next();
});

listingSchema.post("findOneAndDelete",async(listing)=>{
    if (listing) {
        try {
            console.log(`Deleting reviews for listing: ${listing._id}`);
            console.log(`Reviews to delete: ${listing.reviews}`);
            await Review.deleteMany({ _id: { $in: listing.reviews } });
            console.log(`Reviews deleted`);
        } catch (error) {
            console.error(`Error deleting reviews: ${error}`);
        }
    }
});

const Listing=mongoose.model("Listing",listingSchema);
module.exports = { Listing, validCategories };

