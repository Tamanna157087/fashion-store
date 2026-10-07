const Coupon = require("../models/Coupon");

// Validate and Calculate Coupon Discount
const validateAndCalculateCoupon = async (code, subtotal) => {
  if (!code || typeof code !== "string") {
    throw new Error("Invalid coupon code");
  }

  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });

  if (!coupon) {
    throw new Error("Coupon code not found");
  }

  if (!coupon.isActive) {
    throw new Error("This coupon is no longer active");
  }

  if (new Date() > new Date(coupon.expiryDate)) {
    throw new Error("This coupon has expired");
  }

  if (coupon.usedCount >= coupon.usageLimit) {
    throw new Error("Coupon usage limit exceeded");
  }

  if (subtotal < coupon.minOrderAmount) {
    throw new Error(
      `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`
    );
  }

  let discountAmount = 0;

  if (coupon.discountType === "Percentage") {
    discountAmount = (subtotal * coupon.discountValue) / 100;
    if (coupon.maxDiscountAmount > 0) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
    }
  } else if (coupon.discountType === "Flat") {
    discountAmount = coupon.discountValue;
  }

  discountAmount = Math.min(discountAmount, subtotal);
  discountAmount = Math.round(discountAmount * 100) / 100;

  return {
    coupon,
    discountAmount,
    code: coupon.code,
  };
};

module.exports = {
  validateAndCalculateCoupon,
};
