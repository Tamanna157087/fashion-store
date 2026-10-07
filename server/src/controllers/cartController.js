const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require("../services/cartService");

// Get Cart
const getCartController = async (req, res) => {
  try {
    const cart = await getCart(req.user._id);

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Add Product to Cart
const addToCartController = async (req, res) => {
  try {
    const { productId, quantity, color, size, sku } = req.body;

    const cart = await addToCart(
      req.user._id,
      productId,
      quantity || 1,
      color || "",
      size || "",
      sku || ""
    );

    res.status(200).json({
      success: true,
      message: "Product added to cart",
      cart,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Quantity
const updateCartItemController = async (req, res) => {
  try {
    const { quantity } = req.body;

    const cart = await updateCartItem(
      req.user._id,
      req.params.productId,
      quantity
    );

    res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      cart,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Remove Product
const removeFromCartController = async (req, res) => {
  try {
    const cart = await removeFromCart(req.user._id, req.params.productId);

    res.status(200).json({
      success: true,
      message: "Product removed from cart",
      cart,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Clear Cart
const clearCartController = async (req, res) => {
  try {
    await clearCart(req.user._id);

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getCartController,
  addToCartController,
  updateCartItemController,
  removeFromCartController,
  clearCartController,
};
