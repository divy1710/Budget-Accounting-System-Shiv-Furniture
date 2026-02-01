const express = require("express");
const router = express.Router();
const razorpayController = require("../controllers/razorpay.controller");

// Get Razorpay Key ID (public)
router.get("/key", razorpayController.getKeyId);

// Create order for payment
router.post("/create-order", razorpayController.createOrder);

// Verify payment after completion
router.post("/verify-payment", razorpayController.verifyPayment);

// Get payment status
router.get("/payment/:paymentId", razorpayController.getPaymentStatus);

// Initiate refund
router.post("/refund", razorpayController.initiateRefund);

module.exports = router;
