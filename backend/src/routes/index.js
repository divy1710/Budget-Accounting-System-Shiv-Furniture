const express = require("express");
const router = express.Router();

const contactRoutes = require("./contact.routes");
const productRoutes = require("./product.routes");
const categoryRoutes = require("./category.routes");
const analyticalAccountRoutes = require("./analyticalAccount.routes");
const budgetRoutes = require("./budget.routes");
const autoAnalyticalRoutes = require("./autoAnalytical.routes");
const transactionRoutes = require("./transaction.routes");
const paymentRoutes = require("./payment.routes");
const dashboardRoutes = require("./dashboard.routes");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const uploadRoutes = require("./upload.routes");
const razorpayRoutes = require("./razorpay.routes");

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Auth routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/upload", uploadRoutes);

// API routes
router.use("/contacts", contactRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/analytical-accounts", analyticalAccountRoutes);
router.use("/budgets", budgetRoutes);
router.use("/auto-analytical", autoAnalyticalRoutes);
router.use("/transactions", transactionRoutes);
router.use("/payments", paymentRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/razorpay", razorpayRoutes);

module.exports = router;
