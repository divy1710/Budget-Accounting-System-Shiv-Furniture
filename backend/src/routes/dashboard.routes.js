const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard.controller");

router.get("/stats", dashboardController.getStats);
router.get("/budget-cockpit", dashboardController.getBudgetCockpit);
router.get("/yearly-trend", dashboardController.getYearlyTrend);
router.get("/recent-activities", dashboardController.getRecentActivities);

module.exports = router;
