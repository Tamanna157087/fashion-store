const express = require("express");
const router = express.Router();

const {
  getAllNotificationsController,
  markAllReadController,
  markSingleReadController,
} = require("../controllers/notificationController");

const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");

router.get("/", protect, admin, getAllNotificationsController);
router.patch("/read-all", protect, admin, markAllReadController);
router.patch("/:id/read", protect, admin, markSingleReadController);

module.exports = router;
