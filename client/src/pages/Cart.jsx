import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import axios from "../api/axios";
import ProductCard from "../components/ProductCard";
import LazyImage from "../components/LazyImage";
import SEO from "../components/SEO";
import { toast } from "react-toastify";
import { getValidImageUrl } from "../utils/imageFallback";

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const [frequentlyBought, setFrequentlyBought] = useState([]);

  const FREE_SHIPPING_THRESHOLD = 999;

  const getEffectivePrice = (product) => {
    if (!product) return 0;
    return product.discountPrice > 0 && product.discountPrice < product.price
      ? product.discountPrice
      : product.price;
  };

  const subtotal = cart.reduce(
    (total, item) => total + (item.product ? getEffectivePrice(item.product) * item.quantity : 0),
    0
  );

  const amountNeededForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

  useEffect(() => {
    const fetchFrequentlyBought = async () => {
      try {
        const res = await axios.get("/products?limit=4&sort=rating");
        setFrequentlyBought(res.data.products || []);
      } catch (err) {
        console.error("Failed to load recommendations", err);
      }
    };
    fetchFrequentlyBought();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-10 font-sans">
      <SEO
        title="Shopping Cart | Fashion Store"
        description="Review your cart items, select promo codes, and proceed to checkout."
      />

      <h1 className="text-3xl font-black flex items-center gap-3 text-gray-900 tracking-tight">
        Shopping Cart <span className="text-indigo-600 text-2xl font-bold">({cart.length} items)</span>
      </h1>

      {cart.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-12 text-center border border-gray-100 shadow-xl max-w-md mx-auto space-y-4">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-3xl">
            🛒
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Your cart is empty</h2>
          <p className="text-gray-500 text-xs">Explore our collection to add items to your cart.</p>

          <Link
            to="/products"
            className="inline-block bg-gray-900 hover:bg-indigo-600 text-white font-extrabold px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition text-xs"
          >
            Explore Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Cart Items & Free Shipping Bar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Free Shipping Progress Indicator */}
            <div className="bg-indigo-50/80 p-4 rounded-2xl border border-indigo-100 space-y-2 text-xs">
              <div className="flex justify-between font-extrabold text-indigo-950">
                <span>
                  {amountNeededForFreeShipping === 0
                    ? "🎉 You have unlocked FREE Express Shipping!"
                    : `Add ₹${amountNeededForFreeShipping} more to get FREE Express Shipping!`}
                </span>
                <span>{freeShippingProgress}%</span>
              </div>
              <div className="w-full bg-indigo-200/60 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>

            {/* Cart Items */}
            <div className="space-y-4">
              {cart.map((item) => {
                if (!item.product) return null;
                const itemPrice = getEffectivePrice(item.product);
                const imgUrl = getValidImageUrl(
                  item.product.thumbnail ||
                    (item.product.images && item.product.images[0]?.url) ||
                    item.product.image
                );

                const itemId = item._id || item.product._id;

                return (
                  <div
                    key={itemId}
                    className="bg-white/80 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row items-center gap-5"
                  >
                    <div className="w-24 h-28 flex-shrink-0">
                      <LazyImage
                        src={imgUrl}
                        alt={item.product.title}
                        aspectRatio="aspect-[4/5]"
                        containerClassName="rounded-xl overflow-hidden border border-gray-100"
                      />
                    </div>

                    <div className="flex-1 text-center sm:text-left space-y-1">
                      <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">
                        {item.product.brand}
                      </span>
                      <h3 className="font-extrabold text-gray-900 text-base">
                        <Link to={`/product/${item.product._id}`} className="hover:text-indigo-600">
                          {item.product.title}
                        </Link>
                      </h3>

                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-gray-600 pt-1">
                        {item.color && (
                          <span className="bg-gray-100 px-2.5 py-1 rounded-md font-medium">
                            Color: {item.color}
                          </span>
                        )}
                        {item.size && (
                          <span className="bg-gray-100 px-2.5 py-1 rounded-md font-medium">
                            Size: {item.size}
                          </span>
                        )}
                      </div>

                      <div className="text-lg font-black text-gray-900 pt-2">
                        ₹{itemPrice}{" "}
                        {item.product.discountPrice > 0 && item.product.discountPrice < item.product.price && (
                          <span className="text-xs text-gray-400 line-through ml-1">
                            ₹{item.product.price}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Controls & Remove */}
                    <div className="flex sm:flex-col items-center justify-between gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
                      <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 p-1">
                        <button
                          onClick={() => updateQuantity(itemId, Math.max(1, item.quantity - 1))}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-gray-700 font-bold transition"
                        >
                          -
                        </button>
                        <span className="w-10 text-center font-bold text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(itemId, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-gray-700 font-bold transition"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(itemId)}
                        className="text-xs font-semibold text-rose-500 hover:text-rose-700 hover:underline transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Order Summary & Coupon Promo Suggestions */}
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-gray-100 shadow-xl space-y-6">
              <h2 className="text-xl font-extrabold text-gray-900 border-b border-gray-100 pb-4">Order Summary</h2>

              <div className="space-y-3 text-xs text-gray-600 font-medium">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-gray-900">₹{subtotal}</span>
                </div>

                <div className="flex justify-between">
                  <span>Shipping Charge</span>
                  <span className={`font-bold ${subtotal >= FREE_SHIPPING_THRESHOLD ? "text-emerald-600" : "text-gray-900"}`}>
                    {subtotal >= FREE_SHIPPING_THRESHOLD ? "FREE" : "₹99"}
                  </span>
                </div>

                <div className="flex justify-between border-t border-gray-100 pt-3 text-base">
                  <span className="font-extrabold text-gray-900">Estimated Total</span>
                  <span className="font-black text-2xl text-gray-900">
                    ₹{subtotal >= FREE_SHIPPING_THRESHOLD ? subtotal : subtotal + 99}
                  </span>
                </div>
              </div>

              {/* Coupon Suggestions */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2 text-xs">
                <span className="font-extrabold text-gray-800 uppercase block">Available Promo Codes</span>
                <div className="flex flex-wrap gap-2">
                  {["FASHION20", "WELCOME10", "FESTIVE50"].map((code) => (
                    <button
                      key={code}
                      onClick={() => {
                        navigator.clipboard.writeText(code);
                        toast.success(`Coupon "${code}" copied! Paste at checkout.`);
                      }}
                      className="bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-600 font-mono font-bold px-2.5 py-1 rounded-lg transition"
                    >
                      {code} 📋
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Link
                  to="/checkout"
                  className="block w-full text-center bg-gray-900 hover:bg-indigo-600 text-white font-extrabold py-4 rounded-2xl shadow-lg hover:shadow-xl transition text-xs"
                >
                  Proceed to Checkout &rarr;
                </Link>

                <button
                  onClick={clearCart}
                  className="w-full text-center text-xs font-semibold text-gray-400 hover:text-rose-600 py-2 transition"
                >
                  Clear Entire Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Frequently Bought Together Recommendation Section */}
      {frequentlyBought.length > 0 && (
        <div className="pt-10 border-t border-gray-100 space-y-6">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Frequently Bought Together</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {frequentlyBought.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
