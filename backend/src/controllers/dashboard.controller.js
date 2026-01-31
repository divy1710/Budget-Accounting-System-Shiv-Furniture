const dashboardService = require('../services/dashboard.service');

const getStats = async (req, res) => {
  try {
    const stats = await dashboardService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getBudgetCockpit = async (req, res) => {
  try {
    const cockpit = await dashboardService.getBudgetCockpit(req.query);
    res.json(cockpit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getYearlyTrend = async (req, res) => {
  try {
    const trend = await dashboardService.getYearlyTrend(req.query.year);
    res.json(trend);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRecentActivities = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const activities = await dashboardService.getRecentActivities(limit);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getStats, getBudgetCockpit, getYearlyTrend, getRecentActivities };
