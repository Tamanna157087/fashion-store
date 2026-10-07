const Cart = require("../models/cartModel");
const Product = require("../models/Product");

// Get User Cart
const getCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate("items.product");

  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: [],
    });

    cart = await Cart.findOne({ user: userId }).populate("items.product");
  }

  return cart;
};

// Add Product to Cart with Variant & Stock validation
const addToCart = async (userId, productId, quantity = 1, color = "", size = "", sku = "") => {
  const product = await Product.findById(productId);

  if (!product) {
    throw new Error("Product not found");
  }

  // Determine available stock for variant or total stock
  let availableStock = 0;

  if (product.variants && product.variants.length > 0) {
    if (color && size) {
      const variant = product.variants.find(
        (v) => v.color.toLowerCase() === color.toLowerCase() && v.size.toLowerCase() === size.toLowerCase()
      );

      if (!variant) {
        throw new Error(`Variant (${color} - ${size}) is not available`);
      }

      availableStock = variant.stock;
    } else {
      // Pick first available variant stock or total stock
      availableStock = product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
      color = color || product.variants[0]?.color || "";
      size = size || product.variants[0]?.size || "";
      sku = sku || product.variants[0]?.sku || "";
    }
  } else {
    availableStock = product.stock || 0;
  }

  if (availableStock <= 0) {
    throw new Error("Selected product/variant is out of stock");
  }

  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: [],
    });
  }

  // Match existing item by product, color, and size
  const itemIndex = cart.items.findIndex(
    (item) =>
      item.product.toString() === productId &&
      (item.color || "").toLowerCase() === color.toLowerCase() &&
      (item.size || "").toLowerCase() === size.toLowerCase()
  );

  const existingQty = itemIndex > -1 ? cart.items[itemIndex].quantity : 0;
  const newQty = existingQty + Number(quantity);

  if (newQty > availableStock) {
    throw new Error(`Only ${availableStock} item(s) available in stock`);
  }

  if (itemIndex > -1) {
    cart.items[itemIndex].quantity = newQty;
  } else {
    cart.items.push({
      product: productId,
      color,
      size,
      sku,
      quantity: Number(quantity),
    });
  }

  await cart.save();

  return await Cart.findOne({ user: userId }).populate("items.product");
};

// Update Quantity with Stock check
const updateCartItem = async (userId, cartItemId, quantity) => {
  const cart = await Cart.findOne({ user: userId }).populate("items.product");

  if (!cart) {
    throw new Error("Cart not found");
  }

  // Find item by item _id or product _id
  const item = cart.items.find(
    (i) => i._id.toString() === cartItemId || i.product._id.toString() === cartItemId
  );

  if (!item) {
    throw new Error("Product not found in cart");
  }

  const product = item.product;
  let availableStock = 0;

  if (product.variants && product.variants.length > 0 && item.color && item.size) {
    const variant = product.variants.find(
      (v) => v.color.toLowerCase() === item.color.toLowerCase() && v.size.toLowerCase() === item.size.toLowerCase()
    );
    availableStock = variant ? variant.stock : product.stock;
  } else {
    availableStock = product.stock || 0;
  }

  if (quantity > availableStock) {
    throw new Error(`Only ${availableStock} item(s) available in stock`);
  }

  item.quantity = quantity;

  await cart.save();

  return await Cart.findOne({ user: userId }).populate("items.product");
};

// Remove Product
const removeFromCart = async (userId, cartItemId) => {
  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    throw new Error("Cart not found");
  }

  cart.items = cart.items.filter(
    (item) => item._id.toString() !== cartItemId && item.product.toString() !== cartItemId
  );

  await cart.save();

  return await Cart.findOne({ user: userId }).populate("items.product");
};

// Clear Cart
const clearCart = async (userId) => {
  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    throw new Error("Cart not found");
  }

  cart.items = [];

  await cart.save();

  return cart;
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
