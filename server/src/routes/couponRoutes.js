const express = require("express");
const router = express.Router();

const {
  applyCoupon,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
} = require("../controllers/couponController");

const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");

// Customer - Apply Coupon
router.post("/apply", protect, applyCoupon);

// Admin Coupon Management Routes
router.get("/", protect, admin, getCoupons);
router.post("/", protect, admin, createCoupon);
router.put("/:id", protect, admin, updateCoupon);
router.delete("/:id", protect, admin, deleteCoupon);
router.patch("/:id/toggle", protect, admin, toggleCouponStatus);

module.exports = router;
