const rateLimit = require("express-rate-limit");

// General API rate limiter (500 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: {
    success: false,
    message: "Too many requests, please try again after a few minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip global rate limiting for payment & order endpoints
    return (
      req.originalUrl.includes("/api/payment") ||
      req.originalUrl.includes("/api/orders")
    );
  },
});

// Strict rate limiter for Auth (login / register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Specialized Checkout / Payment rate limiter with custom JSON error response
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: "Too many payment requests. Please wait a few seconds.",
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Webhooks should never be blocked by IP rate limiters
    return req.originalUrl.includes("/api/payment/webhook");
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  paymentLimiter,
};
