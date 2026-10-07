import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import axios from "../api/axios";
import ImageGallery from "../components/ImageGallery";
import CompleteTheLook from "../components/CompleteTheLook";
import RelatedProducts from "../components/RelatedProducts";
import RecentlyViewed from "../components/RecentlyViewed";
import { ProductDetailsSkeleton } from "../components/ProductSkeleton";
import SEO from "../components/SEO";
import { addRecentlyViewed } from "../utils/recentlyViewed";
import { toast } from "react-toastify";

const ProductDetails = () => {
  const { id } = useParams();

  const { addToCart } = useCart();
  const { addToWishlist, wishlist } = useWishlist();
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Variant selection state
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Micro interaction animation states
  const [wishlistAnimating, setWishlistAnimating] = useState(false);
  const [cartAnimating, setCartAnimating] = useState(false);

  // Review submission state
  const [review, setReview] = useState({
    rating: 5,
    comment: "",
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  const isWishlisted = useMemo(
    () => wishlist?.some((item) => item._id === id),
    [wishlist, id]
  );

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/products/${id}`);
      const prodData = res.data.product;
      setProduct(prodData);

      // Save to Recently Viewed in LocalStorage
      addRecentlyViewed(prodData);

      // Auto-select first available variant color and size
      if (prodData.variants && prodData.variants.length > 0) {
        const availableVar =
          prodData.variants.find((v) => (v.stock || 0) > 0) || prodData.variants[0];
        setSelectedColor(availableVar.color);
        setSelectedSize(availableVar.size);
      }
    } catch {
      toast.error("Failed to load product details");
    } flex: {
      setLoading(false);
    }
  }, [id]);

  const fetchRelatedProducts = useCallback(async () => {
    try {
      const res = await axios.get(`/products/${id}/related`);
      setRelatedProducts(res.data.products || []);
    } catch {
      // ignore related error
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
    fetchRelatedProducts();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [fetchProduct, fetchRelatedProducts]);

  // Derived Variant Stock calculation
  const availableColors = useMemo(() => {
    if (!product?.variants) return [];
    return Array.from(new Set(product.variants.map((v) => v.color)));
  }, [product]);

  const availableSizes = useMemo(() => {
    if (!product?.variants) return [];
    return Array.from(new Set(product.variants.map((v) => v.size)));
  }, [product]);

  // Find current selected variant object
  const currentVariant = useMemo(() => {
    if (!product?.variants || !selectedColor || !selectedSize) return null;
    return product.variants.find(
      (v) =>
        v.color.toLowerCase() === selectedColor.toLowerCase() &&
        v.size.toLowerCase() === selectedSize.toLowerCase()
    );
  }, [product, selectedColor, selectedSize]);

  // Stock for current variant or total product stock
  const currentStock = useMemo(() => {
    if (currentVariant) return currentVariant.stock || 0;
    if (product?.variants && product.variants.length > 0) {
      const colorVariants = product.variants.filter(
        (v) => v.color.toLowerCase() === selectedColor.toLowerCase()
      );
      if (colorVariants.length > 0) {
        return colorVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
      }
    }
    return product?.stock || 0;
  }, [currentVariant, product, selectedColor]);

  // Helper to check stock of a size for selected color
  const getStockForSize = (size) => {
    if (!product?.variants) return product?.stock || 0;
    const matched = product.variants.find(
      (v) =>
        v.color.toLowerCase() === selectedColor.toLowerCase() &&
        v.size.toLowerCase() === size.toLowerCase()
    );
    return matched ? matched.stock || 0 : 0;
  };

  // Reset quantity if stock changes
  useEffect(() => {
    setQuantity(1);
  }, [selectedColor, selectedSize]);

  const handleAddToCart = () => {
    if (!selectedColor || !selectedSize) {
      toast.warning("Please select color and size");
      return;
    }
    if (currentStock <= 0) {
      toast.error("Selected variant is out of stock");
      return;
    }

    setCartAnimating(true);
    setTimeout(() => setCartAnimating(false), 400);

    addToCart(
      product,
      quantity,
      selectedColor,
      selectedSize,
      currentVariant?.sku || ""
    );
  };

  const handleWishlistClick = () => {
    setWishlistAnimating(true);
    setTimeout(() => setWishlistAnimating(false), 400);
    addToWishlist(product);
  };

  // Share Product Feature with Web Share API & Clipboard Fallback
  const handleShare = async () => {
    const effectivePrice = product.discountPrice > 0 && product.discountPrice < product.price
      ? product.discountPrice
      : product.price;

    const shareData = {
      title: product.title,
      text: `Check out ${product.title} for ₹${effectivePrice} on Fashion Store!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user canceled share sheet
      }
    } else {
      try {
        await navigator.clipboard.writeText(
          `${product.title} - ₹${effectivePrice}\n${window.location.href}`
        );
        toast.success("Product link copied successfully");
      } catch {
        toast.error("Failed to copy link");
      }
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Please login to submit a review");
      return;
    }

    if (!review.comment.trim()) {
      toast.error("Please write a review comment");
      return;
    }

    try {
      setSubmittingReview(true);
      await axios.post(`/products/${id}/reviews`, review, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Review submitted successfully!");
      setReview({ rating: 5, comment: "" });
      fetchProduct();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <ProductDetailsSkeleton />;
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-800">Product Not Found</h2>
        <p className="text-gray-500">The requested product does not exist.</p>
        <Link
          to="/products"
          className="inline-block bg-gray-900 text-white font-bold px-8 py-3 rounded-2xl hover:bg-indigo-600 transition"
        >
          Back to Catalog
        </Link>
      </div>
    );
  }

  const hasDiscount = product.discountPrice > 0 && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const displayImage = product.thumbnail || (product.images && product.images[0]?.url) || product.image;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-16 font-sans">
      <SEO
        title={`${product.title} | Fashion Store`}
        description={product.description || `Shop ${product.title} on Fashion Store.`}
        image={displayImage}
        url={window.location.href}
        type="product"
      />

      {/* Top Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
        {/* Left Column: Image Gallery */}
        <ImageGallery
          images={product.images}
          thumbnail={product.thumbnail}
          title={product.title}
        />

        {/* Right Column: Product Information & Controls */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                {product.brand}
              </span>
              <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                {product.category}
              </span>
              {product.gender && (
                <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {product.gender}
                </span>
              )}
              {product.occasion && (
                <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-full">
                  {product.occasion}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
              {product.title}
            </h1>

            {/* Rating & Share */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center text-amber-500 font-bold bg-amber-50 px-2.5 py-1 rounded-lg">
                  ★ {product.rating ? Number(product.rating).toFixed(1) : "4.5"}
                </div>
                <span className="text-gray-500">
                  ({product.reviewCount || product.numReviews || 0} customer reviews)
                </span>
              </div>

              {/* Enhanced Share Button */}
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-indigo-600 bg-gray-100 hover:bg-indigo-50 px-3.5 py-2 rounded-xl transition active:scale-95 shadow-sm"
                title="Share product link"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
            </div>

            {/* Pricing Section */}
            <div className="flex items-baseline gap-3 pt-2">
              {hasDiscount ? (
                <>
                  <span className="text-4xl font-extrabold text-gray-900">
                    ₹{product.discountPrice}
                  </span>
                  <span className="text-lg text-gray-400 line-through">
                    ₹{product.price}
                  </span>
                  <span className="bg-rose-500 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-md">
                    Save {discountPercent}%
                  </span>
                </>
              ) : (
                <span className="text-4xl font-extrabold text-gray-900">
                  ₹{product.price}
                </span>
              )}
            </div>

            {/* Stock Status Banner */}
            <div className="pt-2">
              {currentStock > 5 ? (
                <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  In Stock ({currentStock} available)
                </span>
              ) : currentStock > 0 ? (
                <span className="inline-flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 px-3.5 py-1.5 rounded-full border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  Low Stock! Only {currentStock} left
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-xs font-bold text-rose-700 bg-rose-50 px-3.5 py-1.5 rounded-full border border-rose-200">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  Out of Stock
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed text-sm pt-2">
              {product.description}
            </p>

            {/* Variant Selectors */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-5 pt-4 border-t border-gray-100">
                {/* Color Selector */}
                {availableColors.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Color: <span className="text-indigo-600">{selectedColor}</span>
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      {availableColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                            selectedColor.toLowerCase() === color.toLowerCase()
                              ? "bg-gray-900 text-white border-gray-900 shadow-md scale-105"
                              : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size Selector */}
                {availableSizes.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Size: <span className="text-indigo-600">{selectedSize}</span>
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      {availableSizes.map((size) => {
                        const stockForSize = getStockForSize(size);
                        const isOutOfStockSize = stockForSize <= 0;
                        const isSelected = selectedSize.toLowerCase() === size.toLowerCase();

                        return (
                          <button
                            key={size}
                            onClick={() => !isOutOfStockSize && setSelectedSize(size)}
                            disabled={isOutOfStockSize}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                              isSelected
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md scale-105"
                                : isOutOfStockSize
                                ? "bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed line-through"
                                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            {size} {isOutOfStockSize ? "(Out)" : ""}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quantity Selector & Action Buttons */}
            {!isAdmin && (
              <div className="space-y-4 pt-6 border-t border-gray-100">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Quantity selector */}
                  <div className="flex items-center border border-gray-200 rounded-2xl bg-gray-50 p-1">
                    <button
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                      disabled={currentStock <= 0 || quantity <= 1}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-50 transition"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-bold text-gray-900">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((prev) => Math.min(currentStock, prev + 1))}
                      disabled={currentStock <= 0 || quantity >= currentStock}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-50 transition"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={handleAddToCart}
                    disabled={currentStock <= 0}
                    className={`flex-1 min-w-[200px] py-4 rounded-2xl font-extrabold shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                      cartAnimating ? "animate-cart-bounce" : ""
                    } ${
                      currentStock <= 0
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-gray-900 hover:bg-indigo-600 text-white hover:shadow-xl active:scale-98"
                    }`}
                  >
                    🛒 {currentStock <= 0 ? "Out of Stock" : "Add to Cart"}
                  </button>

                  {/* Wishlist Button */}
                  <button
                    onClick={handleWishlistClick}
                    className={`p-4 rounded-2xl border transition-all duration-300 shadow-md ${
                      wishlistAnimating ? "animate-heart-pop" : ""
                    } ${
                      isWishlisted
                        ? "bg-rose-500 text-white border-rose-500 scale-105"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200"
                    }`}
                    title={isWishlisted ? "In Wishlist" : "Add to Wishlist"}
                  >
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Estimated Delivery Notice */}
            <div className="bg-indigo-50/60 rounded-2xl p-4 border border-indigo-100 flex items-center gap-3 text-xs text-indigo-900 font-semibold">
              <span className="text-xl">🚚</span>
              <div>
                <div>Estimated Delivery</div>
                <div className="text-gray-600 font-normal">
                  Delivered in {product.deliveryDays || 5} Business Days with Express Shipping
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Complete The Look AI Section */}
      <CompleteTheLook
        productId={product._id}
        onAddToCart={(item) => addToCart(item, 1)}
      />

      {/* Related Products Section */}
      <RelatedProducts currentProduct={product} relatedList={relatedProducts} />

      {/* Recently Viewed Products Section */}
      <RecentlyViewed currentProductId={product._id} />

      {/* Customer Reviews Section */}
      <div className="border-t border-gray-100 pt-12 space-y-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
          Customer Reviews ({product.reviews?.length || 0})
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-4">
            {product.reviews && product.reviews.length > 0 ? (
              product.reviews.map((item) => (
                <div key={item._id} className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-gray-100 shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">{item.name}</span>
                    <span className="text-xs text-amber-500 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                      ★ {item.rating}/5
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{item.comment}</p>
                  <span className="text-[10px] text-gray-400 block pt-1">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm italic">No reviews submitted yet for this product.</p>
            )}
          </div>

          {/* Write a Review Form */}
          {!isAdmin && (
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-gray-100 shadow-lg h-fit space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Write a Review</h3>

              <form onSubmit={submitReview} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Rating</label>
                  <select
                    value={review.rating}
                    onChange={(e) => setReview({ ...review, rating: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                    <option value={3}>⭐⭐⭐ (3 Stars)</option>
                    <option value={2}>⭐⭐ (2 Stars)</option>
                    <option value={1}>⭐ (1 Star)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Your Feedback</label>
                  <textarea
                    rows="4"
                    placeholder="Share your experience with this item..."
                    value={review.comment}
                    onChange={(e) => setReview({ ...review, comment: e.target.value })}
                    required
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full bg-gray-900 hover:bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-md transition duration-200"
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
