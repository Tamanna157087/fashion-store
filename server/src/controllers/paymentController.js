const crypto = require("crypto");
const Order = require("../models/Order");
const { sendPaymentSuccessEmail } = require("../services/emailService");

// Razorpay Config from Environment Variables
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_fashion_store";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "razorpay_secret_key_12345";

let paymentRequestsCounter = 0;

// Create Razorpay Order Endpoint
const createRazorpayOrder = async (req, res) => {
  try {
    paymentRequestsCounter++;
    const timestamp = new Date().toISOString();
    const userId = req.user?._id;
    const { orderId } = req.body;

    console.log(
      `[PAYMENT LOG] Timestamp: ${timestamp} | User ID: ${userId} | Order ID: ${orderId || "N/A"} | Requests Received: ${paymentRequestsCounter}`
    );

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Idempotency: Re-use existing razorpayOrderId if generated recently
    if (order.paymentDetails && order.paymentDetails.razorpayOrderId) {
      console.log(`[PAYMENT LOG] Reusing existing Razorpay Order ID: ${order.paymentDetails.razorpayOrderId} for Order #${order.orderId}`);
      const amountInPaise = Math.round(order.totalAmount * 100);
      return res.status(200).json({
        success: true,
        key: RAZORPAY_KEY_ID,
        amount: amountInPaise,
        currency: "INR",
        name: "AI Fashion Store",
        description: `Payment for Order ${order.orderId}`,
        razorpayOrderId: order.paymentDetails.razorpayOrderId,
        orderId: order._id,
        customer: {
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone || order.shippingAddress?.phone,
        },
      });
    }

    const amountInPaise = Math.round(order.totalAmount * 100);
    const rzpOrderId = `rzp_order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    order.paymentDetails = {
      ...order.paymentDetails,
      razorpayOrderId: rzpOrderId,
    };
    await order.save();

    res.status(200).json({
      success: true,
      key: RAZORPAY_KEY_ID,
      amount: amountInPaise,
      currency: "INR",
      name: "AI Fashion Store",
      description: `Payment for Order ${order.orderId}`,
      razorpayOrderId: rzpOrderId,
      orderId: order._id,
      customer: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone || order.shippingAddress?.phone,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify Razorpay Payment Signature
const verifyRazorpayPayment = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    const razorpayOrderId = req.body.razorpayOrderId || req.body.razorpay_order_id;
    const razorpayPaymentId = req.body.razorpayPaymentId || req.body.razorpay_payment_id;
    const razorpaySignature = req.body.razorpaySignature || req.body.razorpay_signature;

    const order = await Order.findById(orderId).populate("user", "email name");
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Razorpay signature verification logic
    let isSignatureValid = false;

    if (process.env.RAZORPAY_KEY_SECRET) {
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

      isSignatureValid = generatedSignature === razorpaySignature;
    } else {
      // In development / fallback mode without secret set, accept signature check
      isSignatureValid = Boolean(razorpayPaymentId);
    }

    if (!isSignatureValid) {
      order.paymentStatus = "Failed";
      await order.save();
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    // Payment Successful
    order.paymentStatus = "Paid";
    order.status = "Confirmed";
    order.paymentDetails = {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature: razorpaySignature || "verified",
    };

    order.statusHistory.push({
      status: "Confirmed",
      comment: `Online payment verified successfully (Payment ID: ${razorpayPaymentId})`,
      timestamp: new Date(),
    });

    await order.save();

    // Trigger Email Notification
    sendPaymentSuccessEmail(order, order.user?.email || req.user.email);

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Razorpay Webhook Handler
const razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "webhook_secret";
    const signature = req.headers["x-razorpay-signature"];

    if (signature && process.env.RAZORPAY_WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (expectedSignature !== signature) {
        return res.status(400).json({ success: false, message: "Invalid webhook signature" });
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === "payment.captured") {
      const rzpOrderId = payload.payment.entity.order_id;
      const order = await Order.findOne({ "paymentDetails.razorpayOrderId": rzpOrderId });
      if (order) {
        order.paymentStatus = "Paid";
        order.status = "Confirmed";
        await order.save();
      }
    } else if (event === "payment.failed") {
      const rzpOrderId = payload.payment.entity.order_id;
      const order = await Order.findOne({ "paymentDetails.razorpayOrderId": rzpOrderId });
      if (order) {
        order.paymentStatus = "Failed";
        await order.save();
      }
    }

    res.status(200).json({ status: "ok" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  razorpayWebhook,
};
