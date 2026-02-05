const express = require("express");
const router = express.Router();
const wrapAsync = global.wrapAsync;
const { isLoggedIn } = require("../middleware.js");
const bookingController = require("../controllers/booking.js");

router.get("/my-bookings", isLoggedIn, wrapAsync(bookingController.showMyBookings));
router.get("/:id/confirmation", isLoggedIn, wrapAsync(bookingController.showConfirmation));

module.exports = router;
