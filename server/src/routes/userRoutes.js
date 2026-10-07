const express = require("express");
const router = express.Router();

const {
  getProfile,
  updateProfile,
  getAllUsersAdmin,
  toggleDeactivateUserAdmin,
  changeUserRoleAdmin,
  deleteUserAdmin,
} = require("../controllers/userController");

const {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require("../controllers/addressController");

const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");

// User Profile Routes
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

// Address Routes
router.get("/addresses", protect, getAddresses);
router.post("/addresses", protect, addAddress);
router.put("/addresses/:addressId", protect, updateAddress);
router.delete("/addresses/:addressId", protect, deleteAddress);
router.put("/addresses/:addressId/default", protect, setDefaultAddress);

// Admin User Management Routes
router.get("/admin/all", protect, admin, getAllUsersAdmin);
router.patch("/admin/:id/deactivate", protect, admin, toggleDeactivateUserAdmin);
router.patch("/admin/:id/role", protect, admin, changeUserRoleAdmin);
router.delete("/admin/:id", protect, admin, deleteUserAdmin);

module.exports = router;
