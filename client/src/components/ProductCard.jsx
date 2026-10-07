import { useState, memo } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { toast } from "react-toastify";
import LazyImage from "./LazyImage";

const ProductCard = memo(({ product }) => {
  const { addToCart } = useCart();
  const { addToWishlist, wishlist } = useWishlist();

  const [wishlistAnimating, setWishlistAnimating] = useState(false);
  const [cartAnimating, setCartAnimating] = useState(false);

  if (!product) return null;

  const rawImage =
    product.thumbnail ||
    (product.images && product.images.length > 0
      ? typeof product.images[0] === "object"
        ? product.images[0].url
        : product.images[0]
      : product.image);

  const isWishlisted = wishlist?.some((item) => item._id === product._id);

  // Stock calculation
  const totalStock =
    product.variants && product.variants.length > 0
      ? product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
      : product.stock !== undefined
      ? product.stock
      : 0;

  const isOutOfStock = totalStock <= 0;

  // Discount percentage calculation
  const hasDiscount =
    product.discountPrice > 0 && product.discountPrice < product.price;

  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) {
      toast.error("This product is currently out of stock");
      return;
    }

    setCartAnimating(true);
    setTimeout(() => setCartAnimating(false), 400);

    const defaultColor = product.variants?.[0]?.color || "";
    const defaultSize = product.variants?.[0]?.size || "";
    const defaultSku = product.variants?.[0]?.sku || "";

    addToCart(product, 1, defaultColor, defaultSize, defaultSku);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setWishlistAnimating(true);
    setTimeout(() => setWishlistAnimating(false), 400);

    addToWishlist(product);
  };

  return (
    <div className="group relative bg-white/80 backdrop-blur-md rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden">
      {/* Image & Badges with Lazy Loading */}
      <Link to={`/product/${product._id}`} className="block relative overflow-hidden bg-gray-50 aspect-[4/5]">
        <LazyImage
          src={rawImage}
          alt={product.title}
          aspectRatio="aspect-[4/5]"
          className="group-hover:scale-108 transition-transform duration-500"
        />

        {/* Badges Container */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {hasDiscount && (
            <span className="bg-rose-500 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-md">
              {discountPercent}% OFF
            </span>
          )}
          {product.isFeatured && (
            <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm">
              Featured
            </span>
          )}
          {product.isTrending && (
            <span className="bg-purple-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm">
              Trending
            </span>
          )}
        </div>

        {/* Wishlist Button with Micro-Animation */}
        <button
          onClick={handleWishlist}
          className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-all duration-300 z-10 shadow-md ${
            wishlistAnimating ? "animate-heart-pop" : ""
          } ${
            isWishlisted
              ? "bg-rose-500 text-white scale-110"
              : "bg-white/80 text-gray-700 hover:bg-white hover:text-rose-500 hover:scale-110"
          }`}
          title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="bg-red-600 text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Product Details */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
            <span className="font-semibold uppercase tracking-wider text-indigo-600 truncate max-w-[120px]">
              {product.brand}
            </span>
            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">
              {product.category}
            </span>
          </div>

          <Link to={`/product/${product._id}`}>
            <h3 className="font-bold text-gray-900 line-clamp-1 hover:text-indigo-600 transition duration-200">
              {product.title}
            </h3>
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-2 text-sm">
            <span className="flex items-center text-amber-500 font-bold">
              ★ {product.rating ? Number(product.rating).toFixed(1) : "4.5"}
            </span>
            <span className="text-gray-400 text-xs">
              ({product.reviewCount || product.numReviews || 0})
            </span>
          </div>
        </div>

        {/* Price & Cart Action */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div>
            {hasDiscount ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-extrabold text-gray-900">₹{product.discountPrice}</span>
                <span className="text-xs text-gray-400 line-through">₹{product.price}</span>
              </div>
            ) : (
              <span className="text-xl font-extrabold text-gray-900">₹{product.price}</span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`flex items-center justify-center p-3 rounded-2xl transition-all duration-200 shadow-md ${
              cartAnimating ? "animate-cart-bounce" : ""
            } ${
              isOutOfStock
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gray-900 hover:bg-indigo-600 text-white hover:shadow-lg active:scale-95"
            }`}
            title={isOutOfStock ? "Out of Stock" : "Add to Cart"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = "ProductCard";

export default ProductCard;
