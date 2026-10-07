const express = require("express");
const router = express.Router();

const { register, login } = require("../controllers/authController");
const validate = require("../middleware/validateMiddleware");
const { registerValidation, loginValidation } = require("../validators/authValidator");
const { authLimiter } = require("../middleware/rateLimiter");

router.post("/register", authLimiter, registerValidation, validate, register);
router.post("/login", authLimiter, loginValidation, validate, login);

module.exports = router;
