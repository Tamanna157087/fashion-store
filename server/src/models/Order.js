const mongoose = require("mongoose");

const addressSnapshotSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  houseNo: { type: String, required: true },
  street: { type: String, required: true },
  landmark: { type: String, default: "" },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, default: "India" },
  pincode: { type: String, required: true },
  addressType: { type: String, default: "Home" },
});

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
  },
  comment: {
    type: String,
    default: "",
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        title: { type: String, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        color: { type: String, default: "" },
        size: { type: String, default: "" },
        sku: { type: String, default: "" },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],

    shippingAddress: addressSnapshotSchema,
    billingAddress: addressSnapshotSchema,

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    coupon: {
      code: { type: String, default: "" },
      discountAmount: { type: Number, default: 0 },
    },

    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    gstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    shippingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    platformFee: {
      type: Number,
      default: 10,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["Cash on Delivery", "Razorpay", "UPI", "Credit / Debit Card", "Net Banking", "Wallet"],
      default: "Cash on Delivery",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },

    paymentDetails: {
      razorpayOrderId: { type: String, default: "" },
      razorpayPaymentId: { type: String, default: "" },
      razorpaySignature: { type: String, default: "" },
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Packed",
        "Shipped",
        "Out For Delivery",
        "Delivered",
        "Cancelled",
        "Returned",
        "Refunded",
      ],
      default: "Pending",
    },

    statusHistory: [statusHistorySchema],

    trackingId: {
      type: String,
      default: "",
    },

    estimatedDelivery: {
      type: Date,
    },

    invoiceNumber: {
      type: String,
      default: "",
    },

    cancelReason: {
      type: String,
      default: "",
    },

    returnReason: {
      type: String,
      default: "",
    },

    refundStatus: {
      type: String,
      enum: ["None", "Requested", "Approved", "Rejected", "Refunded"],
      default: "None",
    },

    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model("Order", orderSchema);
