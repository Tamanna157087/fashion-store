const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadMiddleware");

const {
  getAllProducts,
  getAllAdminProducts,
  getProductById,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkProductAction,
  duplicateProduct,
  createReview,
} = require("../controllers/productController");

const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");

// Public Routes
router.get("/", getAllProducts);
router.get("/admin/all", protect, admin, getAllAdminProducts);
router.get("/:id/related", getRelatedProducts);
router.get("/:id", getProductById);

// Customer Review
router.post("/:id/reviews", protect, createReview);

// Admin Routes
router.post("/bulk-action", protect, admin, bulkProductAction);
router.post("/:id/duplicate", protect, admin, duplicateProduct);
router.post("/", protect, admin, upload.array("images", 10), createProduct);
router.put("/:id", protect, admin, upload.array("images", 10), updateProduct);
router.delete("/:id", protect, admin, deleteProduct);

module.exports = router;
