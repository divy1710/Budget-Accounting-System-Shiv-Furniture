const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// POST /api/auth/login - Login
router.post("/login", authController.login);

// POST /api/auth/signup - Signup (customer portal)
router.post("/signup", authController.signup);

// GET /api/auth/verify - Verify token
router.get("/verify", authController.verifyToken);

module.exports = router;
