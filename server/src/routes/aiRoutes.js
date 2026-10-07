const express = require("express");
const router = express.Router();
const {
  customerChat,
  adminChat,
  getChatHistory,
  clearChatHistory,
  naturalLanguageSearch,
  completeTheLook,
  personalizedRecommendations,
} = require("../controllers/aiController");

const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/adminMiddleware");

// Role-based AI Endpoints
router.post("/customer", protect, customerChat);
router.post("/admin", protect, admin, adminChat);

// Chat History Management Endpoints
router.get("/history/:role", protect, getChatHistory);
router.delete("/history/:role", protect, clearChatHistory);

// Preserved Utility AI Endpoints
router.get("/search", naturalLanguageSearch);
router.get("/complete-the-look/:productId", completeTheLook);
router.get("/recommendations", personalizedRecommendations);

module.exports = router;
