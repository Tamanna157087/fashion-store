const express = require("express");
const router = express.Router();

const {
  getStoreSettings,
  updateStoreSettings,
} = require("../controllers/settingsController");

const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");

router.get("/", getStoreSettings);
router.put("/", protect, admin, updateStoreSettings);

module.exports = router;
