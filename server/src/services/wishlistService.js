const Wishlist = require("../models/wishlistModel");

// Get Wishlist
const getWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId }).populate("products");

  if (!wishlist) {
    wishlist = await Wishlist.create({
      user: userId,
      products: [],
    });
  }

  return wishlist;
};

// Add Product
const addToWishlist = async (userId, productId) => {
  let wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    wishlist = await Wishlist.create({
      user: userId,
      products: [],
    });
  }

  const exists = wishlist.products.find((id) => id.toString() === productId);

  if (exists) {
    throw new Error("Product already exists in wishlist");
  }

  wishlist.products.push(productId);

  await wishlist.save();

  return await Wishlist.findOne({ user: userId }).populate("products");
};

// Remove Product
const removeFromWishlist = async (userId, productId) => {
  const wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    throw new Error("Wishlist not found");
  }

  wishlist.products = wishlist.products.filter(
    (id) => id.toString() !== productId,
  );

  await wishlist.save();

  return await Wishlist.findOne({ user: userId }).populate("products");
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
