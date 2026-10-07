const express = require("express");
const router = express.Router();

const {
  getOrderSummary,
  placeOrder,
  myOrders,
  getOrderDetails,
  cancelMyOrder,
  returnMyOrder,
  adminOrders,
  updateStatus,
  processReturn,
  updateTracking,
} = require("../controllers/orderController");

const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");

// Customer Routes
router.post("/calculate-summary", protect, getOrderSummary);
router.post("/", protect, placeOrder);
router.get("/my-orders", protect, myOrders);

// Admin Order Management Routes
router.get("/admin/all", protect, admin, adminOrders);
router.put("/admin/:id/status", protect, admin, updateStatus);
router.put("/admin/:id/refund", protect, admin, processReturn);
router.put("/admin/:id/tracking", protect, admin, updateTracking);

// Customer Param Routes
router.get("/:id", protect, getOrderDetails);
router.post("/:id/cancel", protect, cancelMyOrder);
router.post("/:id/return", protect, returnMyOrder);

module.exports = router;
