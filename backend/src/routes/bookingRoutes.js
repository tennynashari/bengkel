const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

router.post('/', bookingController.createBooking);
router.get('/', bookingController.getAllBookings);
router.get('/track/:code', bookingController.trackBooking);
router.put('/:id/status', bookingController.updateBookingStatus);
router.post('/:id/payment-proof', bookingController.uploadPaymentProof);
router.post('/:id/inspection', bookingController.saveInspection);
router.post('/:id/progress', bookingController.addProgressUpdate);
router.delete('/:id', bookingController.deleteBooking);

module.exports = router;
