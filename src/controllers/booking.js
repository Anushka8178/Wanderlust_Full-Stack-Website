const { Booking } = require("../models/booking");
const { Listing } = require("../models/listing");

// Show booking confirmation
module.exports.showConfirmation = async (req, res) => {
    const { id } = req.params;
    
    const booking = await Booking.findById(id)
        .populate("listing")
        .populate("user");
    
    if (!booking) {
        req.flash("error", "Booking not found.");
        return res.redirect("/listings");
    }
    
    // Check if user owns this booking
    if (!booking.user._id.equals(req.user._id)) {
        req.flash("error", "You don't have permission to view this booking.");
        return res.redirect("/listings");
    }
    
    res.render("bookings/confirmation", { booking });
};

// Show all bookings for current user
module.exports.showMyBookings = async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
        .populate("listing")
        .sort({ createdAt: -1 });
    
    res.render("bookings/index", { bookings });
};
