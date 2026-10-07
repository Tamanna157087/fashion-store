const {
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
} = require("../services/orderService");

// Calculate Price Summary (Server-Side Price Engine)
const getOrderSummary = async (req, res) => {
  try {
    const { items, couponCode } = req.body;

    const summary = await calculateOrderSummary({
      items,
      couponCode,
    });

    res.status(200).json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("SUMMARY ERROR:");
    console.error(error);

    res.status(400).json({
      success: false,
      message: error.message || "Failed to calculate order summary",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Place Order
const placeOrder = async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      couponCode,
    } = req.body;

    const order = await createOrder({
      user: req.user._id,
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      couponCode,
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      order,
    });
  } catch (error) {
    console.log("\n======================================");
    console.log("🚨 CREATE ORDER ERROR");
    console.log("======================================");
    console.error(error);

    if (req.body) {
      console.log("\nREQUEST BODY:");
      console.dir(req.body, { depth: null });
    }

    console.log("======================================\n");

    res.status(400).json({
      success: false,
      message: error.message || "Failed to place order",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Logged-in User Orders
const myOrders = async (req, res) => {
  try {
    const orders = await getUserOrders(req.user._id);

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Logged-in User Single Order Details
const getOrderDetails = async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";

    const order = await getOrderById(req.params.id, req.user._id, isAdmin);

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(error);

    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Customer Cancel Order
const cancelMyOrder = async (req, res) => {
  try {
    const order = await cancelOrder(
      req.params.id,
      req.user._id,
      req.body.reason
    );

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully.",
      order,
    });
  } catch (err) {
    console.error("Cancel Order Error:", err);

    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// Customer Return Order
const returnMyOrder = async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await requestReturnOrder(req.params.id, req.user._id, reason);

    res.status(200).json({
      success: true,
      message: "Return request submitted successfully",
      order,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Admin - Get All Orders
const adminOrders = async (req, res) => {
  try {
    const { status, paymentStatus, search, page, limit } = req.query;

    const result = await getAllOrdersAdmin({
      status,
      paymentStatus,
      search,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Admin - Update Order Status
const updateStatus = async (req, res) => {
  try {
    const { status, comment } = req.body;

    const allowedStatus = [
      "Pending",
      "Confirmed",
      "Packed",
      "Shipped",
      "Out For Delivery",
      "Delivered",
      "Cancelled",
      "Returned",
      "Refunded",
    ];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await updateOrderStatus(req.params.id, status, comment);

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("UPDATE ORDER STATUS ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Failed to update order status",
    });
  }
};

// Admin - Process Return & Refund Decision
const processReturn = async (req, res) => {
  try {
    const { decision, comment } = req.body;

    if (!["Approved", "Rejected"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Decision must be Approved or Rejected",
      });
    }

    const order = await processReturnRefundAdmin(
      req.params.id,
      decision,
      comment,
    );

    res.status(200).json({
      success: true,
      message: `Return request ${decision.toLowerCase()} successfully`,
      order,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Admin - Update Tracking
const updateTracking = async (req, res) => {
  try {
    const { trackingId, estimatedDelivery, courierName } = req.body;

    const order = await updateOrderTrackingAdmin(req.params.id, {
      trackingId,
      estimatedDelivery,
      courierName,
    });

    res.status(200).json({
      success: true,
      message: "Order tracking info updated successfully",
      order,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getOrderSummary,
  placeOrder,
  myOrders,
  getOrderDetails,
  cancelMyOrder,
  returnMyOrder,
  adminOrders,
  updateStatus,
  processReturn,
  updateTracking,
};
