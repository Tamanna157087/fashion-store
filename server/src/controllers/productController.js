const Product = require("../models/Product");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

// Escape Regex safely for search queries
const escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

// Helper: Upload file buffer to Cloudinary
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "ai-fashion-store/products",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

// Helper: Delete image from Cloudinary
const deleteFromCloudinary = async (imgObjOrUrl) => {
  try {
    if (!imgObjOrUrl) return;
    let publicId = typeof imgObjOrUrl === "object" ? imgObjOrUrl.public_id : null;

    if (!publicId && typeof imgObjOrUrl === "string") {
      const parts = imgObjOrUrl.split("/");
      const filenameWithExt = parts.pop();
      const filename = filenameWithExt.split(".")[0];
      const folderIndex = parts.indexOf("ai-fashion-store");

      if (folderIndex !== -1) {
        publicId = parts.slice(folderIndex).join("/") + "/" + filename;
      } else {
        publicId = filename;
      }
    }

    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error("Cloudinary Deletion Error:", error);
  }
};

// ===============================
// Get All Products (Customer & Public)
// ===============================
const getAllProducts = async (req, res, next) => {
  try {
    const {
      keyword,
      category,
      subcategory,
      brand,
      gender,
      color,
      size,
      minPrice,
      maxPrice,
      sort,
      isFeatured,
      isTrending,
    } = req.query;

    const pageNumber = Number(req.query.page) || 1;
    const pageSize = Number(req.query.limit) || 12;
    const skip = (pageNumber - 1) * pageSize;

    const query = {};

    // Search (ReDoS Safe)
    if (keyword && keyword.trim() !== "") {
      const safeKeyword = escapeRegex(keyword.trim());
      query.$or = [
        { title: { $regex: safeKeyword, $options: "i" } },
        { brand: { $regex: safeKeyword, $options: "i" } },
        { category: { $regex: safeKeyword, $options: "i" } },
        { subcategory: { $regex: safeKeyword, $options: "i" } },
        { tags: { $regex: safeKeyword, $options: "i" } },
        { description: { $regex: safeKeyword, $options: "i" } },
      ];
    }

    // Category Filter (matches category, subcategory, or gender)
    if (category && category !== "All") {
      const safeCat = escapeRegex(category);
      query.$or = [
        { category: { $regex: new RegExp(`^${safeCat}$`, "i") } },
        { subcategory: { $regex: new RegExp(`^${safeCat}$`, "i") } },
        { gender: { $regex: new RegExp(`^${safeCat}$`, "i") } },
      ];
    }

    // Direct Subcategory Filter
    if (subcategory && subcategory !== "All") {
      query.subcategory = { $regex: new RegExp(`^${escapeRegex(subcategory)}$`, "i") };
    }

    // Brand Filter
    if (brand && brand !== "All") {
      query.brand = brand;
    }

    // Gender Filter
    if (gender && gender !== "All") {
      query.gender = gender;
    }

    // Color Filter
    if (color && color !== "All") {
      query["variants.color"] = { $regex: new RegExp(`^${escapeRegex(color)}$`, "i") };
    }

    // Size Filter
    if (size && size !== "All") {
      query["variants.size"] = { $regex: new RegExp(`^${escapeRegex(size)}$`, "i") };
    }

    // Price Range Filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined && minPrice !== "") {
        query.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined && maxPrice !== "") {
        query.price.$lte = Number(maxPrice);
      }
    }

    // Featured / Trending Filters
    if (isFeatured === "true") {
      query.isFeatured = true;
    }
    if (isTrending === "true") {
      query.isTrending = true;
    }

    // Sorting Options
    let sortOption = {};

    switch (sort) {
      case "priceLow":
        sortOption = { price: 1 };
        break;
      case "priceHigh":
        sortOption = { price: -1 };
        break;
      case "rating":
        sortOption = { rating: -1 };
        break;
      case "sold":
        sortOption = { soldCount: -1 };
        break;
      case "newest":
        sortOption = { createdAt: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / pageSize) || 1;

    const rawProducts = await Product.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(pageSize)
      .lean({ virtuals: true });

    // Format virtual stock and image if missing in lean query
    const formattedProducts = rawProducts.map((p) => ({
      ...p,
      image: p.thumbnail || (p.images && p.images.length > 0 ? p.images[0].url : ""),
      stock: p.variants && p.variants.length > 0 ? p.variants.reduce((acc, v) => acc + (v.stock || 0), 0) : 0,
    }));

    res.status(200).json({
      success: true,
      products: formattedProducts,
      page: pageNumber,
      currentPage: pageNumber,
      totalPages,
      totalProducts,
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// Get All Products (Admin)
// ===============================
const getAllAdminProducts = async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean({ virtuals: true });

    const formattedProducts = products.map((p) => ({
      ...p,
      image: p.thumbnail || (p.images && p.images.length > 0 ? p.images[0].url : ""),
      stock: p.variants && p.variants.length > 0 ? p.variants.reduce((acc, v) => acc + (v.stock || 0), 0) : 0,
    }));

    res.status(200).json({
      success: true,
      products: formattedProducts,
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// Get Single Product
// ===============================
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).lean({ virtuals: true });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const formattedProduct = {
      ...product,
      image: product.thumbnail || (product.images && product.images.length > 0 ? product.images[0].url : ""),
      stock: product.variants && product.variants.length > 0
        ? product.variants.reduce((acc, v) => acc + (v.stock || 0), 0)
        : 0,
    };

    res.status(200).json({
      success: true,
      product: formattedProduct,
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// Get Related Products
// ===============================
const getRelatedProducts = async (req, res, next) => {
  try {
    const { id } = req.params;

    const currentProduct = await Product.findById(id).lean();

    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const query = {
      _id: { $ne: currentProduct._id },
      $or: [
        { category: currentProduct.category },
        { brand: currentProduct.brand },
        { tags: { $in: currentProduct.tags || [] } },
      ],
    };

    const relatedProducts = await Product.find(query)
      .sort({ rating: -1, createdAt: -1 })
      .limit(8)
      .lean({ virtuals: true });

    const formattedProducts = relatedProducts.map((p) => ({
      ...p,
      image: p.thumbnail || (p.images && p.images.length > 0 ? p.images[0].url : ""),
      stock: p.variants && p.variants.length > 0 ? p.variants.reduce((acc, v) => acc + (v.stock || 0), 0) : 0,
    }));

    res.status(200).json({
      success: true,
      products: formattedProducts,
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// Create Product (Admin)
// ===============================
const createProduct = async (req, res, next) => {
  try {
    const {
      title,
      description,
      brand,
      category,
      subcategory,
      gender,
      price,
      discountPrice,
      thumbnail,
      variants,
      tags,
      occasion,
      material,
      careInstructions,
      deliveryDays,
      isFeatured,
      isTrending,
    } = req.body;

    // Validation
    const numPrice = Number(price);
    const numDiscount = Number(discountPrice || 0);

    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a positive number",
      });
    }

    if (numDiscount < 0 || numDiscount > numPrice) {
      return res.status(400).json({
        success: false,
        message: "Discount price must be non-negative and less than or equal to original price",
      });
    }

    // Process Images
    let uploadedImages = [];

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) => uploadToCloudinary(file.buffer));
      uploadedImages = await Promise.all(uploadPromises);
    }

    // Handle existing images passed in body as URLs or JSON
    let existingImages = [];
    if (req.body.existingImages) {
      try {
        existingImages = typeof req.body.existingImages === "string"
          ? JSON.parse(req.body.existingImages)
          : req.body.existingImages;
      } catch (e) {
        existingImages = [];
      }
    }

    const images = [...uploadedImages, ...existingImages.map((img) => typeof img === "string" ? { url: img, public_id: "" } : img)];

    if (images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one product image",
      });
    }

    // Process Variants
    let parsedVariants = [];
    if (variants) {
      try {
        parsedVariants = typeof variants === "string" ? JSON.parse(variants) : variants;
      } catch (e) {
        parsedVariants = [];
      }
    }

    if (!Array.isArray(parsedVariants) || parsedVariants.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Product must have at least one valid variant with color, size, stock, and SKU",
      });
    }

    // Validate Variants Stock
    for (const v of parsedVariants) {
      if (!v.color || !v.size) {
        return res.status(400).json({
          success: false,
          message: "All variants must have color and size specified",
        });
      }
      if (v.stock === undefined || Number(v.stock) < 0) {
        return res.status(400).json({
          success: false,
          message: `Stock for variant (${v.color} - ${v.size}) must be non-negative`,
        });
      }
    }

    // Process Tags
    let parsedTags = [];
    if (tags) {
      if (typeof tags === "string") {
        try {
          parsedTags = JSON.parse(tags);
        } catch (e) {
          parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
        }
      } else if (Array.isArray(tags)) {
        parsedTags = tags;
      }
    }

    const selectedThumbnail = thumbnail || (images[0] ? images[0].url : "");

    const product = await Product.create({
      title,
      description,
      brand,
      category,
      subcategory: subcategory || "",
      gender: gender || "Unisex",
      price: numPrice,
      discountPrice: numDiscount,
      images,
      thumbnail: selectedThumbnail,
      variants: parsedVariants.map((v) => ({
        color: v.color.trim(),
        size: v.size.trim(),
        stock: Number(v.stock || 0),
        sku: v.sku ? v.sku.trim() : `${title.slice(0, 3).toUpperCase()}-${v.color.slice(0, 3).toUpperCase()}-${v.size.toUpperCase()}`,
      })),
      tags: parsedTags,
      occasion: occasion || "Casual",
      material: material || "Cotton Blend",
      careInstructions: careInstructions || "Machine wash cold",
      deliveryDays: Number(deliveryDays || 5),
      isFeatured: isFeatured === "true" || isFeatured === true,
      isTrending: isTrending === "true" || isTrending === true,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// Update Product (Admin)
// ===============================
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    let product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const {
      title,
      description,
      brand,
      category,
      subcategory,
      gender,
      price,
      discountPrice,
      thumbnail,
      variants,
      tags,
      occasion,
      material,
      careInstructions,
      deliveryDays,
      isFeatured,
      isTrending,
      deletedImagePublicIds,
    } = req.body;

    // Delete removed Cloudinary images if requested
    if (deletedImagePublicIds) {
      let idsToDelete = [];
      try {
        idsToDelete = typeof deletedImagePublicIds === "string"
          ? JSON.parse(deletedImagePublicIds)
          : deletedImagePublicIds;
      } catch (e) {
        idsToDelete = [];
      }
      for (const pId of idsToDelete) {
        await deleteFromCloudinary(pId);
      }
    }

    // Upload any newly attached files
    let newlyUploadedImages = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) => uploadToCloudinary(file.buffer));
      newlyUploadedImages = await Promise.all(uploadPromises);
    }

    // Existing images to retain
    let retainedImages = [];
    if (req.body.images) {
      try {
        retainedImages = typeof req.body.images === "string" ? JSON.parse(req.body.images) : req.body.images;
      } catch (e) {
        retainedImages = product.images;
      }
    } else {
      retainedImages = product.images;
    }

    const finalImages = [...retainedImages, ...newlyUploadedImages];

    // Process Variants
    let parsedVariants = product.variants;
    if (variants !== undefined) {
      try {
        parsedVariants = typeof variants === "string" ? JSON.parse(variants) : variants;
      } catch (e) {
        parsedVariants = product.variants;
      }
    }

    // Process Tags
    let parsedTags = product.tags;
    if (tags !== undefined) {
      if (typeof tags === "string") {
        try {
          parsedTags = JSON.parse(tags);
        } catch (e) {
          parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
        }
      } else if (Array.isArray(tags)) {
        parsedTags = tags;
      }
    }

    if (title) product.title = title.trim();
    if (description) product.description = description;
    if (brand) product.brand = brand.trim();
    if (category) product.category = category.trim();
    if (subcategory !== undefined) product.subcategory = subcategory.trim();
    if (gender) product.gender = gender;
    if (price !== undefined) product.price = Number(price);
    if (discountPrice !== undefined) product.discountPrice = Number(discountPrice);

    product.images = finalImages;
    product.thumbnail = thumbnail || (finalImages[0] ? finalImages[0].url : product.thumbnail);
    product.variants = parsedVariants.map((v) => ({
      color: v.color.trim(),
      size: v.size.trim(),
      stock: Number(v.stock || 0),
      sku: v.sku || `${product.title.slice(0, 3).toUpperCase()}-${v.color.slice(0, 3).toUpperCase()}-${v.size.toUpperCase()}`,
    }));
    product.tags = parsedTags;
    if (occasion) product.occasion = occasion;
    if (material) product.material = material;
    if (careInstructions) product.careInstructions = careInstructions;
    if (deliveryDays !== undefined) product.deliveryDays = Number(deliveryDays);

    if (isFeatured !== undefined) {
      product.isFeatured = isFeatured === "true" || isFeatured === true;
    }
    if (isTrending !== undefined) {
      product.isTrending = isTrending === "true" || isTrending === true;
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// Delete Product (Admin)
// ===============================
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Delete all images associated with this product from Cloudinary
    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        await deleteFromCloudinary(img);
      }
    } else if (product.thumbnail) {
      await deleteFromCloudinary(product.thumbnail);
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: "Product and associated Cloudinary images deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// Bulk Product Actions (Admin)
// ===============================
const bulkProductAction = async (req, res, next) => {
  try {
    const { productIds, action, value } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, message: "Please select at least one product" });
    }

    if (action === "delete") {
      const products = await Product.find({ _id: { $in: productIds } });
      for (const p of products) {
        if (p.images && p.images.length > 0) {
          for (const img of p.images) await deleteFromCloudinary(img);
        }
        await p.deleteOne();
      }
      return res.status(200).json({ success: true, message: `Successfully deleted ${productIds.length} products` });
    }

    if (action === "updateCategory") {
      await Product.updateMany({ _id: { $in: productIds } }, { category: value });
      return res.status(200).json({ success: true, message: `Updated category to "${value}" for ${productIds.length} products` });
    }

    if (action === "updateBrand") {
      await Product.updateMany({ _id: { $in: productIds } }, { brand: value });
      return res.status(200).json({ success: true, message: `Updated brand to "${value}" for ${productIds.length} products` });
    }

    if (action === "updateDiscount") {
      const percent = Number(value);
      const products = await Product.find({ _id: { $in: productIds } });
      for (const p of products) {
        p.discountPrice = Math.round(p.price * (1 - percent / 100));
        await p.save();
      }
      return res.status(200).json({ success: true, message: `Applied ${percent}% discount to ${productIds.length} products` });
    }

    if (action === "updateStock") {
      const stockVal = Math.max(0, Number(value));
      const products = await Product.find({ _id: { $in: productIds } });
      for (const p of products) {
        if (p.variants && p.variants.length > 0) {
          p.variants.forEach((v) => (v.stock = stockVal));
        } else {
          p.stock = stockVal;
        }
        await p.save();
      }
      return res.status(200).json({ success: true, message: `Updated stock to ${stockVal} for ${productIds.length} products` });
    }

    if (action === "toggleFeatured") {
      await Product.updateMany({ _id: { $in: productIds } }, { isFeatured: value });
      return res.status(200).json({ success: true, message: `Updated featured status for ${productIds.length} products` });
    }

    if (action === "toggleTrending") {
      await Product.updateMany({ _id: { $in: productIds } }, { isTrending: value });
      return res.status(200).json({ success: true, message: `Updated trending status for ${productIds.length} products` });
    }

    res.status(400).json({ success: false, message: "Invalid bulk action" });
  } catch (error) {
    next(error);
  }
};

// ===============================
// Duplicate Product (Admin)
// ===============================
const duplicateProduct = async (req, res, next) => {
  try {
    const original = await Product.findById(req.params.id).lean();
    if (!original) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    delete original._id;
    delete original.createdAt;
    delete original.updatedAt;

    original.title = `${original.title} (Copy)`;
    original.slug = `${original.slug}-copy-${Date.now()}`;
    original.reviews = [];
    original.numReviews = 0;
    original.reviewCount = 0;
    original.rating = 0;

    const clone = await Product.create(original);

    res.status(201).json({
      success: true,
      message: "Product duplicated successfully",
      product: clone,
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// Create Review
// ===============================
const createReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const alreadyReviewed = product.reviews.find(
      (review) => review.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    const review = {
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.reviewCount = product.reviews.length;

    product.rating = Number(
      (
        product.reviews.reduce((acc, item) => acc + item.rating, 0) /
        product.reviews.length
      ).toFixed(1)
    );

    await product.save();

    res.status(201).json({
      success: true,
      message: "Review added successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
