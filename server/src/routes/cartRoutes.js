const express = require("express");
const router = express.Router();

const {
  getCartController,
  addToCartController,
  updateCartItemController,
  removeFromCartController,
  clearCartController,
} = require("../controllers/cartController");

const { protect } = require("../middleware/authMiddleware");

// Get user's cart
router.get("/", protect, getCartController);

// Add product to cart
router.post("/", protect, addToCartController);

// Update quantity
router.put("/:productId", protect, updateCartItemController);

// Remove a product
router.delete("/:productId", protect, removeFromCartController);

// Clear cart
router.delete("/", protect, clearCartController);

module.exports = router;
