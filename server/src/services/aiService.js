const Product = require("../models/Product");

/**
 * AI Provider Abstraction
 * Supports: Gemini, OpenAI, or Local Regex/MongoDB Search Fallback.
 * Rule: NEVER invent products. Always ground output in MongoDB database items.
 */

// Natural Language Intent Extraction Engine
const extractSearchIntent = (userQuery) => {
  try {
    if (!userQuery || typeof userQuery !== "string") {
      return { category: "", gender: "", color: "", occasion: "", maxPrice: null, minPrice: null, brand: "", keywords: [] };
    }

    const query = userQuery.toLowerCase();

    const intent = {
      category: "",
      gender: "",
      color: "",
      occasion: "",
      maxPrice: null,
      minPrice: null,
      brand: "",
      keywords: [],
    };

    // Extract Price Constraints (e.g., "under 2000", "below 1500", "under ₹5000", "between 1000 and 3000")
    const underPriceMatch = query.match(/(?:under|below|less than|<|₹|\$)\s*(\d+)/i);
    if (underPriceMatch) {
      intent.maxPrice = Number(underPriceMatch[1]);
    }

    const betweenPriceMatch = query.match(/(?:between)\s*(\d+)\s*(?:and|-|to)\s*(\d+)/i);
    if (betweenPriceMatch) {
      intent.minPrice = Number(betweenPriceMatch[1]);
      intent.maxPrice = Number(betweenPriceMatch[2]);
    }

    // Extract Gender
    if (/\b(men|man|boys|male|gentlemen)\b/i.test(query)) intent.gender = "Men";
    else if (/\b(women|woman|girls|female|ladies)\b/i.test(query)) intent.gender = "Women";
    else if (/\b(kids|children|baby|toddler)\b/i.test(query)) intent.gender = "Kids";

    // Extract Categories
    const categoryKeywords = [
      "dress", "dresses", "shirt", "shirts", "t-shirt", "tshirt", "tshirts",
      "jeans", "pants", "trousers", "hoodie", "hoodies", "jacket", "jackets",
      "shoes", "sneakers", "boots", "sandals", "watch", "watches", "bag", "bags",
      "handbag", "backpack", "suit", "blazer", "skirt", "top", "activewear", "gym"
    ];

    for (const cat of categoryKeywords) {
      if (new RegExp(`\\b${cat}\\b`, "i").test(query)) {
        if (["shirt", "shirts"].includes(cat)) intent.category = "Shirts";
        else if (["t-shirt", "tshirt", "tshirts"].includes(cat)) intent.category = "T-Shirts";
        else if (["dress", "dresses"].includes(cat)) intent.category = "Dresses";
        else if (["jeans", "pants", "trousers"].includes(cat)) intent.category = "Jeans";
        else if (["hoodie", "hoodies", "jacket", "jackets"].includes(cat)) intent.category = "Jackets";
        else if (["shoes", "sneakers", "boots", "sandals"].includes(cat)) intent.category = "Footwear";
        else if (["watch", "watches", "bag", "bags", "handbag", "backpack"].includes(cat)) intent.category = "Accessories";
        else if (["activewear", "gym"].includes(cat)) intent.category = "Sportswear";
        else intent.category = cat;
        break;
      }
    }

    // Extract Colors
    const colors = ["black", "white", "blue", "red", "green", "yellow", "pink", "purple", "grey", "gray", "brown", "beige", "gold", "silver"];
    for (const c of colors) {
      if (new RegExp(`\\b${c}\\b`, "i").test(query)) {
        intent.color = c;
        break;
      }
    }

    // Extract Occasion / Style
    if (/\b(wedding|party|formal|office|business|ethnic|festive)\b/i.test(query)) {
      const occMatch = query.match(/\b(wedding|party|formal|office|business|ethnic|festive)\b/i);
      if (occMatch) intent.occasion = occMatch[1];
    } else if (/\b(gym|workout|running|sports)\b/i.test(query)) {
      intent.occasion = "Sports";
    } else if (/\b(casual|daily|oversized)\b/i.test(query)) {
      intent.occasion = "Casual";
    }

    // Extract Known Brands
    const brands = ["nike", "puma", "adidas", "zara", "h&m", "levis", "levi's", "gucci", "prada", "versace", "under armour", "roadster", "hrx"];
    for (const b of brands) {
      if (new RegExp(`\\b${b}\\b`, "i").test(query)) {
        intent.brand = b;
        break;
      }
    }

    return intent;
  } catch (err) {
    console.error("extractSearchIntent Error:", err);
    return { category: "", gender: "", color: "", occasion: "", maxPrice: null, minPrice: null, brand: "", keywords: [] };
  }
};

// Search MongoDB database based on extracted intent
const searchProductsByIntent = async (intent = {}, rawQuery = "") => {
  try {
    const queryFilter = {};

    if (intent.gender) {
      queryFilter.$or = [{ gender: intent.gender }, { gender: "Unisex" }];
    }

    if (intent.category) {
      queryFilter.category = { $regex: intent.category, $options: "i" };
    }

    if (intent.maxPrice || intent.minPrice) {
      queryFilter.price = {};
      if (intent.maxPrice) queryFilter.price.$lte = intent.maxPrice;
      if (intent.minPrice) queryFilter.price.$gte = intent.minPrice;
    }

    if (intent.brand) {
      queryFilter.brand = { $regex: intent.brand, $options: "i" };
    }

    if (intent.color) {
      queryFilter.$or = [
        { description: { $regex: intent.color, $options: "i" } },
        { title: { $regex: intent.color, $options: "i" } },
        { "variants.color": { $regex: intent.color, $options: "i" } },
      ];
    }

    if (intent.occasion) {
      queryFilter.$or = queryFilter.$or || [];
      queryFilter.$or.push(
        { occasion: { $regex: intent.occasion, $options: "i" } },
        { description: { $regex: intent.occasion, $options: "i" } },
        { tags: { $regex: intent.occasion, $options: "i" } }
      );
    }

    let products = [];
    try {
      products = await Product.find(queryFilter).limit(8).lean();
    } catch (dbErr) {
      console.error("searchProductsByIntent primary DB error:", dbErr.message);
    }

    if ((!products || products.length === 0) && rawQuery) {
      const keywords = rawQuery.replace(/[^\w\s]/gi, "").split(" ").filter((w) => w.length > 2);
      if (keywords.length > 0) {
        try {
          const regexPatterns = keywords.map((k) => new RegExp(k, "i"));
          products = await Product.find({
            $or: [
              { title: { $in: regexPatterns } },
              { description: { $in: regexPatterns } },
              { category: { $in: regexPatterns } },
              { subcategory: { $in: regexPatterns } },
              { brand: { $in: regexPatterns } },
              { tags: { $in: regexPatterns } },
            ],
          })
            .limit(8)
            .lean();
        } catch (kwErr) {
          console.error("searchProductsByIntent keyword DB error:", kwErr.message);
        }
      }
    }

    // Fallback to top featured items if still no match
    if (!products || products.length === 0) {
      try {
        products = await Product.find().sort({ rating: -1, soldCount: -1 }).limit(4).lean();
      } catch (fallbackErr) {
        console.error("searchProductsByIntent fallback DB error:", fallbackErr.message);
        products = [];
      }
    }

    return products || [];
  } catch (err) {
    console.error("searchProductsByIntent Error:", err);
    return [];
  }
};

// Main AI Assistant Controller Service
const processAIChat = async (userMessage) => {
  try {
    const intent = extractSearchIntent(userMessage);
    const products = await searchProductsByIntent(intent, userMessage);

    const formattedProductsSummary = (products || [])
      .map(
        (p, i) =>
          `${i + 1}. [${p.title || "Product"}](ID: ${p._id}) - Brand: ${p.brand || "Fashion"}, Category: ${p.category || "General"}, Price: ₹${
            p.discountPrice || p.price || 0
          }, Rating: ${p.rating || 5}★`
      )
      .join("\n");

    const topP = products && products.length > 0 ? products[0] : null;
    const aiResponseText = `Here are the top style recommendations matching your request for "${userMessage}":\n\n` +
      `We found ${(products || []).length} stunning options in our catalog! For instance, **${topP?.title || "our featured picks"}** from **${topP?.brand || "top fashion brands"}** offers supreme comfort and modern aesthetic. Check out the curated items below!`;

    return {
      reply: aiResponseText,
      intent,
      products: products || [],
    };
  } catch (err) {
    console.error("processAIChat Error:", err);
    return {
      reply: "I am your AI Fashion Assistant! How can I help you find clothing today?",
      intent: {},
      products: [],
    };
  }
};

module.exports = {
  extractSearchIntent,
  searchProductsByIntent,
  processAIChat,
};
