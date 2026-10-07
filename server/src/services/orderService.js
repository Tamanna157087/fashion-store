const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/cartModel");
const Coupon = require("../models/Coupon");
const { validateAndCalculateCoupon } = require("./couponService");
const { createNotification } = require("./notificationService");
const {
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendOrderCancelledEmail,
  sendReturnApprovedEmail,
} = require("./emailService");

// ===================================
// Server-Side Price Engine & Summary Calculation
// ===================================
const calculateOrderSummary = async ({ items, couponCode }) => {
  if (!items || items.length === 0) {
    throw new Error("No items provided for price summary calculation");
  }

  const verifiedItems = [];
  let subtotal = 0;

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) {
      throw new Error(`Product not found (ID: ${item.product})`);
    }

    // Determine price (discountPrice if active, else regular price)
    const effectivePrice =
      product.discountPrice > 0 && product.discountPrice < product.price
        ? product.discountPrice
        : product.price;

    // Determine variant stock
    let availableStock = 0;
    if (product.variants && product.variants.length > 0) {
      let variant = null;
      if (item.color && item.size) {
        variant = product.variants.find(
          (v) =>
            v.color.toLowerCase() === item.color.toLowerCase() &&
            v.size.toLowerCase() === item.size.toLowerCase()
        );
      }
      if (!variant) {
        variant = product.variants.find((v) => (v.stock || 0) > 0) || product.variants[0];
      }
      availableStock = variant ? variant.stock : 0;
    } else {
      availableStock = product.stock || 0;
    }

    if (availableStock < item.quantity) {
      throw new Error(`Insufficient stock for "${product.title}". Only ${availableStock} available.`);
    }

    const itemTotal = effectivePrice * item.quantity;
    subtotal += itemTotal;

    const mainImg =
      product.thumbnail ||
      (product.images && product.images[0]?.url) ||
      product.image ||
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Crect width='400' height='500' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' font-weight='bold' fill='%239ca3af'%3EFashion Item%3C/text%3E%3C/svg%3E";

    verifiedItems.push({
      product: product._id,
      title: product.title,
      image: mainImg,
      price: effectivePrice,
      color: item.color || "",
      size: item.size || "",
      sku: item.sku || "",
      quantity: item.quantity,
    });
  }

  // Coupon Calculation
  let discountAmount = 0;
  let appliedCouponInfo = null;

  if (couponCode) {
    const couponResult = await validateAndCalculateCoupon(couponCode, subtotal);
    discountAmount = couponResult.discountAmount;
    appliedCouponInfo = {
      code: couponResult.code,
      discountAmount,
    };
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);

  // GST Calculation (Default 18%)
  const gstAmount = Math.round(taxableAmount * 0.18 * 100) / 100;

  // Shipping Charges Calculation (Free above ₹999, else ₹99)
  const shippingAmount = subtotal >= 999 ? 0 : 99;

  // Platform Fee
  const platformFee = 10;

  // Grand Total Calculation
  const grandTotal = Math.round((taxableAmount + gstAmount + shippingAmount + platformFee) * 100) / 100;

  return {
    verifiedItems,
    subtotal,
    discountAmount,
    appliedCouponInfo,
    gstAmount,
    shippingAmount,
    platformFee,
    grandTotal,
  };
};

// ===================================
// Create Order (Place Order)
// ===================================
const createOrder = async ({ user, items, shippingAddress, billingAddress, paymentMethod, couponCode }) => {
  // Idempotency check: Return recent duplicate request if sent within last 10 seconds
  const tenSecondsAgo = new Date(Date.now() - 10000);
  const existingRecentOrder = await Order.findOne({
    user,
    createdAt: { $gte: tenSecondsAgo },
    paymentMethod,
  });

  if (existingRecentOrder) {
    console.log(`[ORDER LOG] Timestamp: ${new Date().toISOString()} | User ID: ${user} | Order ID: ${existingRecentOrder.orderId} | Action: Reusing existing recent order (Idempotency)`);
    return existingRecentOrder;
  }

  const summary = await calculateOrderSummary({ items, couponCode });

  // Unique Order ID & Invoice Number Generation
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderId = `ORD-${dateStr}-${randomSuffix}`;
  const invoiceNumber = `INV-${dateStr}-${randomSuffix}`;

  console.log(`[ORDER LOG] Timestamp: ${new Date().toISOString()} | User ID: ${user} | Generated Order ID: ${orderId} | Payment Method: ${paymentMethod}`);

  // Deduct Inventory Stock
  for (const item of summary.verifiedItems) {
    const product = await Product.findById(item.product);
    if (product) {
      if (product.variants && product.variants.length > 0) {
        let variantIndex = -1;
        if (item.color && item.size) {
          variantIndex = product.variants.findIndex(
            (v) =>
              v.color.toLowerCase() === item.color.toLowerCase() &&
              v.size.toLowerCase() === item.size.toLowerCase()
          );
        }
        if (variantIndex === -1) {
          variantIndex = product.variants.findIndex((v) => (v.stock || 0) >= item.quantity);
        }
        if (variantIndex === -1) {
          variantIndex = 0;
        }
        product.variants[variantIndex].stock = Math.max(
          0,
          (product.variants[variantIndex].stock || 0) - item.quantity
        );
      } else {
        product.stock = Math.max(
          0,
          (product.stock || 0) - item.quantity
        );
      }
      product.soldCount = (product.soldCount || 0) + item.quantity;
      await product.save({ validateBeforeSave: false });
    }
  }

  // Estimated delivery = 5 days from today
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

  const initialStatus = paymentMethod === "Cash on Delivery" ? "Confirmed" : "Pending";
  const initialPaymentStatus = "Pending";

  const order = await Order.create({
    orderId,
    user,
    items: summary.verifiedItems,
    shippingAddress,
    billingAddress: billingAddress || shippingAddress,
    subtotal: summary.subtotal,
    coupon: summary.appliedCouponInfo || { code: "", discountAmount: 0 },
    discountAmount: summary.discountAmount,
    gstAmount: summary.gstAmount,
    shippingAmount: summary.shippingAmount,
    platformFee: summary.platformFee,
    totalAmount: summary.grandTotal,
    paymentMethod,
    paymentStatus: initialPaymentStatus,
    status: initialStatus,
    statusHistory: [
      {
        status: "Pending",
        comment: "Order placed successfully",
        timestamp: new Date(),
      },
      ...(initialStatus === "Confirmed"
        ? [
            {
              status: "Confirmed",
              comment: "Cash on Delivery order confirmed",
              timestamp: new Date(),
            },
          ]
        : []),
    ],
    estimatedDelivery,
    invoiceNumber,
  });

  // Clear User's Cart
  await Cart.findOneAndUpdate({ user }, { items: [] });

  // Increment Coupon usedCount if applied
  if (couponCode) {
    await Coupon.findOneAndUpdate({ code: couponCode.trim().toUpperCase() }, { $inc: { usedCount: 1 } });
  }

  // Trigger Admin Notification
  await createNotification({
    type: "New Order",
    title: `New Order #${order.orderId}`,
    message: `Order #${order.orderId} placed for ₹${order.totalAmount}`,
    link: "/admin/orders",
  });

  // Trigger Confirmation Email
  const populatedOrder = await Order.findById(order._id).populate("user", "email name");
  if (populatedOrder && populatedOrder.user?.email) {
    sendOrderConfirmationEmail(populatedOrder, populatedOrder.user.email);
  }

  return order;
};

// ===================================
// Get Logged-in User Orders
// ===================================
const getUserOrders = async (userId) => {
  return await Order.find({ user: userId }).sort({ createdAt: -1 });
};

// ===================================
// Get Single Order Details
// ===================================
const getOrderById = async (orderId, userId, isAdmin = false) => {
  const query = isAdmin ? { _id: orderId } : { _id: orderId, user: userId };
  const order = await Order.findOne(query).populate("user", "name email phone");
  if (!order) {
    throw new Error("Order not found");
  }
  return order;
};

// ===================================
// Get All Orders (Admin with Search & Filters)
// ===================================
const getAllOrdersAdmin = async ({ status, paymentStatus, search, page = 1, limit = 10 }) => {
  const query = {};

  if (status && status !== "All") {
    query.status = status;
  }

  if (paymentStatus && paymentStatus !== "All") {
    query.paymentStatus = paymentStatus;
  }

  if (search && search.trim() !== "") {
    const s = search.trim();
    query.$or = [
      { orderId: { $regex: s, $options: "i" } },
      { invoiceNumber: { $regex: s, $options: "i" } },
      { "shippingAddress.name": { $regex: s, $options: "i" } },
      { "shippingAddress.phone": { $regex: s, $options: "i" } },
    ];
  }

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Number(limit));
  const skip = (pageNum - 1) * limitNum;

  const totalOrders = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  return {
    orders,
    totalOrders,
    currentPage: pageNum,
    totalPages: Math.ceil(totalOrders / limitNum) || 1,
  };
};

// ===================================
// Update Order Status (Admin)
// ===================================
const updateOrderStatus = async (id, status, comment = "") => {
  const order = await Order.findById(id).populate("user", "email name");

  if (!order) {
    throw new Error("Order not found");
  }

  order.status = status;

  if (!order.trackingId && (status === "Shipped" || status === "Out For Delivery")) {
    order.trackingId = `TRK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  if (status === "Delivered") {
    order.deliveredAt = new Date();
    if (order.paymentMethod === "Cash on Delivery") {
      order.paymentStatus = "Paid";
    }
  }

  order.statusHistory.push({
    status,
    comment: comment || `Order status updated to ${status}`,
    timestamp: new Date(),
  });

  await order.save({ validateBeforeSave: false });

  // Send email alerts based on status update
  if (order.user?.email) {
    if (status === "Shipped") sendOrderShippedEmail(order, order.user.email);
    if (status === "Delivered") sendOrderDeliveredEmail(order, order.user.email);
  }

  return order;
};

// ===================================
// Cancel Order (Customer - Before Shipment)
// ===================================
const cancelOrder = async (orderId, userId, cancelReason = "") => {
  const order = await Order.findOne({
    _id: orderId,
    user: userId,
  });

  if (!order) {
    throw new Error("Order not found");
  }

  const cancellableStatuses = ["Pending", "Confirmed", "Packed"];

  if (!cancellableStatuses.includes(order.status)) {
    throw new Error(
      `Order cannot be cancelled once it is ${order.status}`
    );
  }

  // Restore stock
  for (const item of order.items) {
    const product = await Product.findById(item.product);

    if (!product) continue;

    if (product.variants?.length) {
      const variant =
        product.variants.find(
          (v) =>
            v.color === item.color &&
            v.size === item.size
        ) || product.variants[0];

      variant.stock += item.quantity;
    } else {
      product.stock += item.quantity;
    }

    product.soldCount = Math.max(
      0,
      (product.soldCount || 0) - item.quantity
    );

    await product.save({ validateBeforeSave: false });
  }

  order.status = "Cancelled";
  order.cancelReason = cancelReason || "Cancelled by customer";
  order.statusHistory.push({
    status: "Cancelled",
    comment: cancelReason || "Cancelled by customer",
    timestamp: new Date(),
  });

  await order.save({ validateBeforeSave: false });

  await createNotification({
    type: "Cancelled Order",
    title: `Order Cancelled #${order.orderId}`,
    message: `Order #${order.orderId} was cancelled by customer.`,
    link: "/admin/orders",
  });

  const populated = await Order.findById(order._id).populate("user", "email");

  if (populated?.user?.email) {
    sendOrderCancelledEmail(populated, populated.user.email);
  }

  return order;
};

// ===================================
// Return Order Request (Customer - Within 7 Days of Delivery)
// ===================================
const requestReturnOrder = async (orderId, userId, returnReason = "") => {
  const order = await Order.findOne({ _id: orderId, user: userId });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status !== "Delivered") {
    throw new Error("Only delivered orders can be returned");
  }

  const deliveryTime = order.deliveredAt ? new Date(order.deliveredAt).getTime() : new Date(order.updatedAt).getTime();
  const daysSinceDelivery = (Date.now() - deliveryTime) / (1000 * 60 * 60 * 24);

  if (daysSinceDelivery > 7) {
    throw new Error("Return window of 7 days has expired for this order");
  }

  order.refundStatus = "Requested";
  order.returnReason = returnReason || "Requested return by customer";
  order.statusHistory.push({
    status: "Returned",
    comment: `Return requested. Reason: ${order.returnReason}`,
    timestamp: new Date(),
  });

  await order.save({ validateBeforeSave: false });
  return order;
};

// ===================================
// Process Return & Refund Decision (Admin)
// ===================================
const processReturnRefundAdmin = async (id, decision, comment = "") => {
  const order = await Order.findById(id).populate("user", "email");

  if (!order) {
    throw new Error("Order not found");
  }

  if (decision === "Approved") {
    order.refundStatus = "Approved";
    order.status = "Returned";
    order.paymentStatus = "Refunded";

    // Restore Stock on Return Approved
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        if (product.variants && product.variants.length > 0) {
          let variantIndex = -1;
          if (item.color && item.size) {
            variantIndex = product.variants.findIndex(
              (v) =>
                v.color.toLowerCase() === item.color.toLowerCase() &&
                v.size.toLowerCase() === item.size.toLowerCase()
            );
          }
          if (variantIndex === -1) {
            variantIndex = 0;
          }
          product.variants[variantIndex].stock = (product.variants[variantIndex].stock || 0) + item.quantity;
        } else {
          product.stock = (product.stock || 0) + item.quantity;
        }
        product.soldCount = Math.max(0, (product.soldCount || 0) - item.quantity);
        await product.save({ validateBeforeSave: false });
      }
    }

    if (order.user?.email) {
      sendReturnApprovedEmail(order, order.user.email);
    }
  } else if (decision === "Rejected") {
    order.refundStatus = "Rejected";
  }

  order.statusHistory.push({
    status: decision === "Approved" ? "Returned" : order.status,
    comment: `Return ${decision}. ${comment}`,
    timestamp: new Date(),
  });

  await order.save({ validateBeforeSave: false });
  return order;
};

// Update Order Tracking Details & Delivery Date (Admin)
const updateOrderTrackingAdmin = async (id, { trackingId, estimatedDelivery, courierName }) => {
  const order = await Order.findById(id);
  if (!order) {
    throw new Error("Order not found");
  }

  if (trackingId) order.trackingId = trackingId;
  if (estimatedDelivery) order.estimatedDelivery = new Date(estimatedDelivery);

  order.statusHistory.push({
    status: order.status,
    comment: `Tracking updated: ${trackingId || "N/A"} (${courierName || "Courier"}). Est: ${
      estimatedDelivery ? new Date(estimatedDelivery).toLocaleDateString() : "N/A"
    }`,
    timestamp: new Date(),
  });

  await order.save({ validateBeforeSave: false });
  return order;
};

module.exports = {
  calculateOrderSummary,
  createOrder,
  getUserOrders,
  getOrderById,
  getAllOrdersAdmin,
  updateOrderStatus,
  cancelOrder,
  requestReturnOrder,
  processReturnRefundAdmin,
  updateOrderTrackingAdmin,
};
