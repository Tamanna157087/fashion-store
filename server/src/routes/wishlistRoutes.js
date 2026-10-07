const express = require("express");

const {
  getWishlistController,
  addProductToWishlist,
  removeProductFromWishlist,
} = require("../controllers/wishlistController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getWishlistController);

router.post("/", protect, addProductToWishlist);

router.delete("/:productId", protect, removeProductFromWishlist);

module.exports = router;
