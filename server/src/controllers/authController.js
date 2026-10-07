const { registerUser, loginUser } = require("../services/authService");

const register = async (req, res) => {
  try {
    const data = await registerUser(req.body);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      ...data,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const data = await loginUser(req.body);

    res.json({
      success: true,
      message: "Login successful",
      ...data,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  register,
  login,
};
