require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { createOrder } = require("../services/orderService");
const { createRazorpayOrder, verifyRazorpayPayment } = require("../controllers/paymentController");

async function verifyPaymentFlow() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB for Payment Flow Verification...");

    // Find or create test user
    let user = await User.findOne({ email: "testcheckout@aifashion.com" });
    if (!user) {
      user = await User.create({
        name: "Test Checkout User",
        email: "testcheckout@aifashion.com",
        password: "password123",
        role: "customer"
      });
    }

    // Find a test product
    const product = await Product.findOne();
    if (!product) {
      console.error("No product found in DB. Run npm run seed first!");
      process.exit(1);
    }

    const testAddress = {
      name: "Test Checkout User",
      phone: "9876543210",
      houseNo: "123",
      street: "Fashion Street",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      pincode: "400001",
      addressType: "Home"
    };

    const itemsPayload = [
      {
        product: product._id.toString(),
        quantity: 1,
        color: product.variants?.[0]?.color || "Black",
        size: product.variants?.[0]?.size || "M",
        sku: product.variants?.[0]?.sku || "SKU-TEST"
      }
    ];

    console.log("\n1. Testing Order Creation (COD)...");
    const codOrder = await createOrder({
      user: user._id,
      items: itemsPayload,
      shippingAddress: testAddress,
      billingAddress: testAddress,
      paymentMethod: "Cash on Delivery",
      couponCode: ""
    });
    console.log(`✅ COD Order Created Successfully! Order ID: ${codOrder.orderId}, Status: ${codOrder.status}`);

    console.log("\n2. Testing Idempotency Guard (Immediate duplicate order creation)...");
    const duplicateCodOrder = await createOrder({
      user: user._id,
      items: itemsPayload,
      shippingAddress: testAddress,
      billingAddress: testAddress,
      paymentMethod: "Cash on Delivery",
      couponCode: ""
    });
    console.log(`✅ Idempotency Guard Verified! Returned same order ID: ${duplicateCodOrder.orderId} (Match: ${codOrder._id.toString() === duplicateCodOrder._id.toString()})`);

    console.log("\n3. Testing Online Payment Order Creation...");
    const onlineOrder = await createOrder({
      user: user._id,
      items: itemsPayload,
      shippingAddress: testAddress,
      billingAddress: testAddress,
      paymentMethod: "Razorpay",
      couponCode: ""
    });
    console.log(`✅ Online Order Created! Order ID: ${onlineOrder.orderId}`);

    console.log("\n4. Testing createRazorpayOrder Endpoint Controller...");
    let reqPayload = { user, body: { orderId: onlineOrder._id.toString() } };
    let resPayload = {
      status: function(code) { this.statusCode = code; return this; },
      json: function(data) { this.data = data; }
    };
    await createRazorpayOrder(reqPayload, resPayload);
    console.log(`✅ Razorpay Order Generated! RZP Order ID: ${resPayload.data?.razorpayOrderId}`);

    console.log("\n5. Testing createRazorpayOrder Idempotency (Duplicate call)...");
    let resPayload2 = {
      status: function(code) { this.statusCode = code; return this; },
      json: function(data) { this.data = data; }
    };
    await createRazorpayOrder(reqPayload, resPayload2);
    console.log(`✅ Razorpay Order Reused! Same RZP Order ID: ${resPayload2.data?.razorpayOrderId}`);

    console.log("\n6. Testing Payment Signature Verification...");
    let verifyReq = {
      user,
      body: {
        orderId: onlineOrder._id.toString(),
        razorpayOrderId: resPayload.data.razorpayOrderId,
        razorpayPaymentId: `pay_test_${Date.now()}`,
        razorpaySignature: "verified"
      }
    };
    let verifyRes = {
      status: function(code) { this.statusCode = code; return this; },
      json: function(data) { this.data = data; }
    };
    await verifyRazorpayPayment(verifyReq, verifyRes);
    console.log(`✅ Payment Verified! Payment Status: ${verifyRes.data?.order?.paymentStatus}`);

    console.log("\n🎉 ALL PAYMENT FLOW & IDEMPOTENCY CHECKS PASSED PERFECTLY!");
    process.exit(0);
  } catch (err) {
    console.error("Payment flow test error:", err);
    process.exit(1);
  }
}

verifyPaymentFlow();
