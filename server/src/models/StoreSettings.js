const mongoose = require("mongoose");

const storeSettingsSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      default: "AI Fashion Store",
    },
    gstNumber: {
      type: String,
      default: "27AAACA1234A1Z5",
    },
    supportEmail: {
      type: String,
      default: "support@aifashionstore.com",
    },
    supportPhone: {
      type: String,
      default: "+91 98765 43210",
    },
    shippingCharge: {
      type: Number,
      default: 99,
    },
    freeShippingThreshold: {
      type: Number,
      default: 999,
    },
    platformFee: {
      type: Number,
      default: 10,
    },
    taxPercentage: {
      type: Number,
      default: 18,
    },
    logo: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("StoreSettings", storeSettingsSchema);
