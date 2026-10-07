const mongoose = require("mongoose");

// Review Schema
const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Variant Schema
const variantSchema = new mongoose.Schema({
  color: {
    type: String,
    required: true,
    trim: true,
  },
  size: {
    type: String,
    required: true,
    trim: true,
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  sku: {
    type: String,
    trim: true,
  },
});

// Image Schema (supports string or object with url & public_id)
const imageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  public_id: {
    type: String,
    default: "",
  },
});

// Product Schema
const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    subcategory: {
      type: String,
      trim: true,
      default: "",
    },
    gender: {
      type: String,
      enum: ["Men", "Women", "Unisex", "Kids"],
      default: "Unisex",
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    images: [imageSchema],
    thumbnail: {
      type: String,
      default: "",
    },
    variants: [variantSchema],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    soldCount: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isTrending: {
      type: Boolean,
      default: false,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    occasion: {
      type: String,
      default: "Casual",
      trim: true,
    },
    material: {
      type: String,
      default: "Cotton Blend",
      trim: true,
    },
    careInstructions: {
      type: String,
      default: "Machine wash cold with like colors",
      trim: true,
    },
    deliveryDays: {
      type: Number,
      default: 5,
      min: 1,
    },
    reviews: [reviewSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes for performance & search
productSchema.index({
  title: "text",
  description: "text",
  brand: "text",
  category: "text",
  subcategory: "text",
  tags: "text",
});
productSchema.index({ category: 1, subcategory: 1, brand: 1, gender: 1 });
productSchema.index({ price: 1, discountPrice: 1 });
productSchema.index({ rating: -1, soldCount: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ "variants.color": 1, "variants.size": 1 });

// Virtual getter for backward compatibility: image
productSchema.virtual("image").get(function () {
  if (this.thumbnail) return this.thumbnail;
  if (this.images && this.images.length > 0) return this.images[0].url;
  return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Crect width='400' height='500' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' font-weight='bold' fill='%239ca3af'%3EFashion Item%3C/text%3E%3C/svg%3E";
});

// Virtual getter and setter for backward compatibility: total stock
productSchema
  .virtual("stock")
  .get(function () {
    if (this.variants && this.variants.length > 0) {
      return this.variants.reduce((total, v) => total + (v.stock || 0), 0);
    }
    return typeof this._doc?.stock === "number" ? this._doc.stock : 0;
  })
  .set(function (val) {
    if (this.variants && this.variants.length > 0) {
      this.variants[0].stock = val;
    } else {
      this.variants = [
        {
          color: "Default",
          size: "Default",
          stock: val,
          sku: `${(this.title || "PROD")
            .replace(/[^a-zA-Z0-9]/g, "")
            .substring(0, 3)
            .toUpperCase()}-${Date.now().toString().slice(-4)}`,
        },
      ];
    }
  });

// Pre-save middleware to calculate slug, thumbnail, and reviewCount
productSchema.pre("save", function () {
  if (!this.slug && this.title) {
    this.slug =
      this.title
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "") +
      "-" +
      Date.now();
  }

  if (this.reviews) {
    this.numReviews = this.reviews.length;
    this.reviewCount = this.reviews.length;
    if (this.reviews.length > 0) {
      const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
      this.rating = Number((sum / this.reviews.length).toFixed(1));
    }
  }

  if (!this.thumbnail && this.images && this.images.length > 0) {
    this.thumbnail = this.images[0].url;
  }
});

module.exports = mongoose.model("Product", productSchema);
