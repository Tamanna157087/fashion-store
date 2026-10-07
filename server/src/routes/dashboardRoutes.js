const express = require("express");
const router = express.Router();

const {
  getDashboardStats,
  getInventoryStats,
  globalSearch,
} = require("../controllers/dashboardController");

const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");

router.get("/stats", protect, admin, getDashboardStats);
router.get("/inventory", protect, admin, getInventoryStats);
router.get("/search", protect, admin, globalSearch);

// Default fallback for legacy endpoint
router.get("/", protect, admin, getDashboardStats);

module.exports = router;
