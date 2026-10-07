const { body } = require("express-validator");

const placeOrderValidation = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("Order must contain at least one item"),
  body("items.*.product")
    .notEmpty()
    .withMessage("Product ID is required for each item"),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be a positive integer"),
  body("shippingAddress.fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required"),
  body("shippingAddress.phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required"),
  body("shippingAddress.address")
    .trim()
    .notEmpty()
    .withMessage("Address is required"),
  body("shippingAddress.city")
    .trim()
    .notEmpty()
    .withMessage("City is required"),
  body("shippingAddress.state")
    .trim()
    .notEmpty()
    .withMessage("State is required"),
  body("shippingAddress.pincode")
    .trim()
    .notEmpty()
    .withMessage("Pincode is required"),
  body("paymentMethod")
    .isIn(["Cash on Delivery", "UPI", "Credit / Debit Card", "Net Banking"])
    .withMessage("Invalid payment method"),
];

module.exports = {
  placeOrderValidation,
};
