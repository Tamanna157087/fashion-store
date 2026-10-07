const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require("../services/wishlistService");

// Get Wishlist
const getWishlistController = async (req, res) => {
  try {
    const wishlist = await getWishlist(req.user._id);

    res.status(200).json({
      success: true,
      wishlist: wishlist.products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Add Product
const addProductToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    const wishlist = await addToWishlist(req.user._id, productId);

    res.status(200).json({
      success: true,
      message: "Product added to wishlist",
      wishlist: wishlist.products,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Remove Product
const removeProductFromWishlist = async (req, res) => {
  try {
    const wishlist = await removeFromWishlist(
      req.user._id,
      req.params.productId,
    );

    res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
      wishlist: wishlist.products,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getWishlistController,
  addProductToWishlist,
  removeProductFromWishlist,
};
