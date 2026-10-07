const Conversation = require("../models/Conversation");
const Wishlist = require("../models/wishlistModel");
const { generateCustomerResponse, generateAdminResponse } = require("../services/geminiService");
const { extractSearchIntent, searchProductsByIntent } = require("../services/aiService");
const Product = require("../models/Product");
const User = require("../models/User");

// ==========================================
// 1. CUSTOMER AI CHAT ENDPOINT
// ==========================================
const customerChat = async (req, res) => {
  try {
    // Validate authenticated user
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Validate request body message
    if (!req.body || !req.body.message || typeof req.body.message !== "string" || req.body.message.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const message = req.body.message.trim();

    // Verify Gemini API key exists
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "" || apiKey === "YOUR_API_KEY" || apiKey === "YOUR_GEMINI_API_KEY") {
      return res.status(400).json({
        success: false,
        message: "Gemini API key missing",
      });
    }

    const userId = req.user._id;

    // Validate MongoDB operations (findOne / create)
    let conversation = null;
    try {
      conversation = await Conversation.findOne({ user: userId, role: "customer" });
      if (!conversation) {
        conversation = await Conversation.create({
          user: userId,
          role: "customer",
          messages: [],
        });
      }
    } catch (dbErr) {
      console.error("Customer AI DB Conversation Error:", dbErr.stack || dbErr);
      return res.status(500).json({
        success: false,
        message: "Database error while retrieving customer chat history",
        stack: process.env.NODE_ENV === "development" ? dbErr.stack : undefined,
      });
    }

    // Generate response using Gemini Service & Validate Gemini Response
    let result = null;
    try {
      result = await generateCustomerResponse({
        user: req.user,
        message,
        history: conversation.messages || [],
      });
    } catch (geminiErr) {
      console.error("Customer AI Gemini Generation Exception:", geminiErr.stack || geminiErr);
      return res.status(500).json({
        success: false,
        message: geminiErr.message || "Gemini failed to generate response",
        stack: process.env.NODE_ENV === "development" ? geminiErr.stack : undefined,
      });
    }

    // Check Gemini result object
    if (!result || result.error || !result.reply) {
      const actualError = result?.error || "Gemini failed to generate response";
      if (actualError.toLowerCase().includes("api key missing")) {
        return res.status(400).json({
          success: false,
          message: "Gemini API key missing",
        });
      }
      return res.status(500).json({
        success: false,
        message: actualError,
        stack: process.env.NODE_ENV === "development" ? actualError : undefined,
      });
    }

    const productIds = (result.products || []).map((p) => p._id).filter(Boolean);

    // Validate MongoDB save operation
    try {
      conversation.messages.push(
        { sender: "user", text: message, timestamp: new Date() },
        { sender: "assistant", text: result.reply, products: productIds, timestamp: new Date() }
      );
      await conversation.save({ validateBeforeSave: false });
    } catch (saveErr) {
      console.error("Customer AI DB Save Error:", saveErr.stack || saveErr);
    }

    return res.status(200).json({
      success: true,
      reply: result.reply,
      products: result.products || [],
      conversationId: conversation ? conversation._id : null,
    });
  } catch (err) {
    console.error("Customer AI Error:", err.stack || err);
    return res.status(500).json({
      success: false,
      message: err.message || "Customer AI Error",
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

// ==========================================
// 2. ADMIN AI BUSINESS ASSISTANT ENDPOINT
// ==========================================
const adminChat = async (req, res) => {
  try {
    // Validate authenticated user
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Validate request body message
    if (!req.body || !req.body.message || typeof req.body.message !== "string" || req.body.message.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const message = req.body.message.trim();

    // Verify Gemini API key exists
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "" || apiKey === "YOUR_API_KEY" || apiKey === "YOUR_GEMINI_API_KEY") {
      return res.status(400).json({
        success: false,
        message: "Gemini API key missing",
      });
    }

    const userId = req.user._id;

    // Validate MongoDB operations
    let conversation = null;
    try {
      conversation = await Conversation.findOne({ user: userId, role: "admin" });
      if (!conversation) {
        conversation = await Conversation.create({
          user: userId,
          role: "admin",
          messages: [],
        });
      }
    } catch (dbErr) {
      console.error("Admin AI DB Conversation Error:", dbErr.stack || dbErr);
      return res.status(500).json({
        success: false,
        message: "Database error while retrieving admin chat history",
        stack: process.env.NODE_ENV === "development" ? dbErr.stack : undefined,
      });
    }

    // Generate Admin AI Response & Validate Gemini Response
    let result = null;
    try {
      result = await generateAdminResponse({
        user: req.user,
        message,
        history: conversation.messages || [],
      });
    } catch (geminiErr) {
      console.error("Admin AI Gemini Generation Exception:", geminiErr.stack || geminiErr);
      return res.status(500).json({
        success: false,
        message: geminiErr.message || "Gemini failed to generate response",
        stack: process.env.NODE_ENV === "development" ? geminiErr.stack : undefined,
      });
    }

    if (!result || result.error || !result.reply) {
      const actualError = result?.error || "Gemini failed to generate response";
      if (actualError.toLowerCase().includes("api key missing")) {
        return res.status(400).json({
          success: false,
          message: "Gemini API key missing",
        });
      }
      return res.status(500).json({
        success: false,
        message: actualError,
        stack: process.env.NODE_ENV === "development" ? actualError : undefined,
      });
    }

    // Validate MongoDB save operation
    try {
      conversation.messages.push(
        { sender: "user", text: message, timestamp: new Date() },
        { sender: "assistant", text: result.reply, timestamp: new Date() }
      );
      await conversation.save({ validateBeforeSave: false });
    } catch (saveErr) {
      console.error("Admin AI DB Save Error:", saveErr.stack || saveErr);
    }

    return res.status(200).json({
      success: true,
      reply: result.reply,
      conversationId: conversation ? conversation._id : null,
    });
  } catch (err) {
    console.error("Admin AI Error:", err.stack || err);
    return res.status(500).json({
      success: false,
      message: err.message || "Admin AI Error",
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

// ==========================================
// 3. GET CHAT HISTORY ENDPOINT
// ==========================================
const getChatHistory = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    const { role } = req.params;
    const targetRole = role === "admin" ? "admin" : "customer";

    let conversation = null;
    try {
      conversation = await Conversation.findOne({ user: req.user._id, role: targetRole })
        .populate("messages.products", "title price discountPrice rating thumbnail images")
        .lean();
    } catch (dbErr) {
      console.error("Get Chat History DB Error:", dbErr.stack || dbErr);
      return res.status(500).json({
        success: false,
        message: "Database query failed",
        stack: process.env.NODE_ENV === "development" ? dbErr.stack : undefined,
      });
    }

    return res.status(200).json({
      success: true,
      messages: conversation ? conversation.messages || [] : [],
    });
  } catch (err) {
    console.error("Get Chat History Error:", err.stack || err);
    return res.status(500).json({
      success: false,
      message: err.message || "Get Chat History Error",
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

// ==========================================
// 4. CLEAR CHAT HISTORY ENDPOINT
// ==========================================
const clearChatHistory = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    const { role } = req.params;
    const targetRole = role === "admin" ? "admin" : "customer";

    try {
      await Conversation.findOneAndUpdate(
        { user: req.user._id, role: targetRole },
        { $set: { messages: [] } }
      );
    } catch (dbErr) {
      console.error("Clear Chat History DB Error:", dbErr.stack || dbErr);
      return res.status(500).json({
        success: false,
        message: "Database update failed",
        stack: process.env.NODE_ENV === "development" ? dbErr.stack : undefined,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Chat history cleared successfully",
    });
  } catch (err) {
    console.error("Clear Chat History Error:", err.stack || err);
    return res.status(500).json({
      success: false,
      message: err.message || "Clear Chat History Error",
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

// ==========================================
// 5. NATURAL LANGUAGE SEARCH ENDPOINT
// ==========================================
const naturalLanguageSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== "string" || q.trim() === "") {
      return res.status(400).json({ success: false, message: "Search query is required" });
    }

    let intent = {};
    let products = [];
    try {
      intent = extractSearchIntent(q);
      products = await searchProductsByIntent(intent, q);
    } catch (searchErr) {
      console.error("Natural Language Search Processing Error:", searchErr.stack || searchErr);
      return res.status(500).json({
        success: false,
        message: "Failed to search products",
        stack: process.env.NODE_ENV === "development" ? searchErr.stack : undefined,
      });
    }

    return res.status(200).json({
      success: true,
      query: q,
      intent,
      totalProducts: products.length,
      products,
    });
  } catch (err) {
    console.error("Natural Language Search Error:", err.stack || err);
    return res.status(500).json({
      success: false,
      message: err.message || "Natural Language Search Error",
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

// ==========================================
// 6. COMPLETE THE LOOK ENDPOINT
// ==========================================
const completeTheLook = async (req, res) => {
  try {
    const { productId } = req.params;

    let currentProduct = null;
    try {
      currentProduct = await Product.findById(productId);
    } catch (dbErr) {
      console.error("Complete The Look DB Error:", dbErr.stack || dbErr);
      return res.status(500).json({
        success: false,
        message: "Database query error",
        stack: process.env.NODE_ENV === "development" ? dbErr.stack : undefined,
      });
    }

    if (!currentProduct) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    let complementaryCategories = [];
    const mainCat = (currentProduct.category || "").toLowerCase();

    if (["shirts", "t-shirts", "dresses", "tops", "jackets"].includes(mainCat)) {
      complementaryCategories = ["Jeans", "Footwear", "Accessories"];
    } else if (["jeans", "pants", "trousers"].includes(mainCat)) {
      complementaryCategories = ["Shirts", "T-Shirts", "Footwear", "Accessories"];
    } else if (["footwear", "shoes"].includes(mainCat)) {
      complementaryCategories = ["Jeans", "Shirts", "Accessories"];
    } else {
      complementaryCategories = ["Footwear", "Accessories", "Jeans"];
    }

    const outfitItems = [];
    for (const cat of complementaryCategories) {
      try {
        const match = await Product.findOne({
          _id: { $ne: currentProduct._id },
          category: { $regex: cat, $options: "i" },
          $or: [{ gender: currentProduct.gender }, { gender: "Unisex" }],
        })
          .sort({ rating: -1, soldCount: -1 })
          .lean();

        if (match) outfitItems.push(match);
      } catch (catErr) {
        console.error(`Error fetching category ${cat}:`, catErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      mainProduct: {
        _id: currentProduct._id,
        title: currentProduct.title,
        category: currentProduct.category,
      },
      outfitItems,
    });
  } catch (err) {
    console.error("Complete The Look Error:", err.stack || err);
    return res.status(500).json({
      success: false,
      message: err.message || "Complete The Look Error",
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

// ==========================================
// 7. PERSONALIZED RECOMMENDATIONS ENDPOINT
// ==========================================
const personalizedRecommendations = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;
    let preferredCategories = [];

    if (userId) {
      try {
        const wishlistDoc = await Wishlist.findOne({ user: userId }).populate("products");
        if (wishlistDoc && wishlistDoc.products && wishlistDoc.products.length > 0) {
          preferredCategories = wishlistDoc.products.map((item) => (item ? item.category : null)).filter(Boolean);
        }
      } catch (userErr) {
        console.error("Personalized Recs Wishlist DB Error:", userErr.message);
      }
    }

    let recommendations = [];
    if (preferredCategories.length > 0) {
      try {
        recommendations = await Product.find({
          category: { $in: preferredCategories },
        })
          .sort({ rating: -1, soldCount: -1 })
          .limit(8)
          .lean();
      } catch (recErr) {
        console.error("Personalized Recs Preferred DB Error:", recErr.message);
      }
    }

    if (recommendations.length < 4) {
      try {
        const popularProducts = await Product.find()
          .sort({ isTrending: -1, soldCount: -1, rating: -1 })
          .limit(8)
          .lean();

        const existingIds = new Set(recommendations.map((r) => (r && r._id ? r._id.toString() : "")));
        for (const p of popularProducts) {
          if (p && p._id && !existingIds.has(p._id.toString())) {
            recommendations.push(p);
          }
        }
      } catch (popErr) {
        console.error("Personalized Recs Popular DB Error:", popErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      recommendations: recommendations.slice(0, 8),
    });
  } catch (err) {
    console.error("Personalized Recommendations Error:", err.stack || err);
    return res.status(500).json({
      success: false,
      message: err.message || "Personalized Recommendations Error",
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

module.exports = {
  customerChat,
  adminChat,
  getChatHistory,
  clearChatHistory,
  naturalLanguageSearch,
  completeTheLook,
  personalizedRecommendations,
};
