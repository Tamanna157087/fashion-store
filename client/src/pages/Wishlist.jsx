import { useState } from "react";
import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import LazyImage from "../components/LazyImage";
import SEO from "../components/SEO";
import { toast } from "react-toastify";

const Wishlist = () => {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [savedForLater, setSavedForLater] = useState([]);

  const handleMoveToCart = (product) => {
    const defaultColor =
      product.variants && product.variants.length > 0 ? product.variants[0].color : "Standard";
    const defaultSize =
      product.variants && product.variants.length > 0 ? product.variants[0].size : "Standard";

    addToCart(product, 1, defaultColor, defaultSize);
    removeFromWishlist(product._id);
    toast.success(`Moved "${product.title}" to cart!`);
  };

  const handleMoveAllToCart = () => {
    wishlist.forEach((product) => {
      const defaultColor =
        product.variants && product.variants.length > 0 ? product.variants[0].color : "Standard";
      const defaultSize =
        product.variants && product.variants.length > 0 ? product.variants[0].size : "Standard";
      addToCart(product, 1, defaultColor, defaultSize);
      removeFromWishlist(product._id);
    });
    toast.success("Moved all wishlist items to cart!");
  };

  const handleSaveForLater = (product) => {
    setSavedForLater((prev) => [...prev, product]);
    removeFromWishlist(product._id);
    toast.info(`Saved "${product.title}" for later`);
  };

  const handleMoveSavedToWishlist = (product) => {
    setSavedForLater((prev) => prev.filter((p) => p._id !== product._id));
    toast.success(`Restored "${product.title}" to wishlist`);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 font-sans">
      <SEO
        title="My Wishlist | Fashion Store"
        description="View your saved fashion items and move them to cart."
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            My Wishlist <span className="text-rose-500">❤️</span>
          </h1>
          <p className="text-gray-500 text-sm">Saved items waiting for your purchase ({wishlist.length} items)</p>
        </div>

        {wishlist.length > 0 && (
          <button
            onClick={handleMoveAllToCart}
            className="bg-gray-900 hover:bg-indigo-600 text-white font-extrabold text-xs px-6 py-3 rounded-2xl shadow-md hover:scale-105 active:scale-95 transition"
          >
            🛒 Move All to Cart
          </button>
        )}
      </div>

      {wishlist.length === 0 && savedForLater.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-16 text-center border border-gray-100 shadow-sm space-y-4">
          <span className="text-5xl">❤️</span>
          <h3 className="text-xl font-bold text-gray-800">Your Wishlist is Empty</h3>
          <p className="text-gray-500 text-sm">Explore our fashion catalog and save your favorite items here.</p>
          <Link
            to="/products"
            className="inline-block bg-indigo-600 text-white font-extrabold px-8 py-3.5 rounded-2xl shadow-lg hover:bg-indigo-700 transition text-xs"
          >
            Explore Catalog &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlist.map((product) => {
            const img = product.thumbnail || (product.images && product.images[0]?.url) || product.image;
            const hasDiscount = product.discountPrice > 0 && product.discountPrice < product.price;

            return (
              <div
                key={product._id}
                className="bg-white/80 backdrop-blur-md rounded-3xl border border-gray-100 p-4 shadow-sm hover:shadow-xl transition flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="relative overflow-hidden rounded-2xl">
                    <LazyImage
                      src={img}
                      alt={product.title}
                      aspectRatio="aspect-square"
                      className="group-hover:scale-105 transition duration-300"
                    />
                    <button
                      onClick={() => removeFromWishlist(product._id)}
                      className="absolute top-3 right-3 bg-white/90 text-rose-500 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow hover:bg-rose-500 hover:text-white transition z-10"
                      title="Remove from wishlist"
                    >
                      &times;
                    </button>
                  </div>

                  <span className="text-[10px] font-extrabold uppercase text-indigo-600 tracking-wider">
                    {product.brand}
                  </span>

                  <h3 className="font-extrabold text-sm text-gray-900 truncate">
                    <Link to={`/product/${product._id}`} className="hover:text-indigo-600">
                      {product.title}
                    </Link>
                  </h3>

                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-gray-900">
                      ₹{hasDiscount ? product.discountPrice : product.price}
                    </span>
                    {hasDiscount && (
                      <span className="text-xs text-gray-400 line-through">₹{product.price}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-4 mt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleMoveToCart(product)}
                    className="w-full bg-gray-900 hover:bg-indigo-600 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-md active:scale-95 transition"
                  >
                    🛒 Move to Cart
                  </button>

                  <button
                    onClick={() => handleSaveForLater(product)}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded-xl text-[11px] transition"
                  >
                    📌 Save for Later
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Saved For Later Section */}
      {savedForLater.length > 0 && (
        <div className="pt-8 border-t border-gray-100 space-y-6">
          <h2 className="text-2xl font-black text-gray-900">Saved For Later ({savedForLater.length})</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {savedForLater.map((p) => (
              <div key={p._id} className="bg-gray-50 rounded-2xl p-4 border border-gray-200/60 flex items-center gap-3">
                <div className="w-14 h-16 flex-shrink-0">
                  <LazyImage
                    src={p.thumbnail || p.image}
                    alt={p.title}
                    aspectRatio="aspect-square"
                    containerClassName="rounded-xl overflow-hidden"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs truncate">{p.title}</h4>
                  <span className="text-xs font-extrabold text-indigo-600 block">₹{p.discountPrice || p.price}</span>
                  <button
                    onClick={() => handleMoveSavedToWishlist(p)}
                    className="text-[10px] text-indigo-600 font-bold hover:underline"
                  >
                    Restore to Wishlist
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Wishlist;
