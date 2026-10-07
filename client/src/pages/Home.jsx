import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../api/axios";
import ProductCard from "../components/ProductCard";
import RecentlyViewed from "../components/RecentlyViewed";
import { ProductCardSkeleton, CategorySkeleton } from "../components/ProductSkeleton";
import SEO from "../components/SEO";
import { toast } from "react-toastify";

const Home = () => {
  const navigate = useNavigate();
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [aiPicks, setAiPicks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Natural Language Search State
  const [nlQuery, setNlQuery] = useState("");
  const [isSearchingNL, setIsSearchingNL] = useState(false);

  // Newsletter Email
  const [newsletterEmail, setNewsletterEmail] = useState("");

  // Hero Slider Index
  const [heroIndex, setHeroIndex] = useState(0);

  const heroBanners = useMemo(
    () => [
      {
        title: "NEXT-GEN FASHION & AI STYLING",
        subtitle: "Discover curated outfits powered by artificial intelligence",
        cta: "Explore Catalog",
        tag: "NEW SEASON 2026",
        img: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop&q=80",
      },
      {
        title: "EXCLUSIVE LUXURY STREETWEAR",
        subtitle: "Up to 50% OFF on premium urban & minimalist fits",
        cta: "Shop Sale",
        tag: "LIMITED EDITION",
        img: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&auto=format&fit=crop&q=80",
      },
      {
        title: "THE FORMAL & WEDDING EDIT",
        subtitle: "Sophisticated ethnic wear, tuxedos & evening dresses",
        cta: "View Collection",
        tag: "FESTIVE COLLECTION",
        img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&auto=format&fit=crop&q=80",
      },
    ],
    []
  );

  // Flash Sale Countdown Timer
  const [timeLeft, setTimeLeft] = useState({ hours: 12, minutes: 45, seconds: 30 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 24, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Hero Auto Play
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroBanners.length);
    }, 5000);
    return () => clearInterval(slideTimer);
  }, [heroBanners.length]);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);

        const [allRes, trendingRes, aiRes] = await Promise.all([
          axios.get("/products?limit=12"),
          axios.get("/products?sort=rating&limit=8"),
          axios.get("/ai/recommendations").catch(() => ({ data: { recommendations: [] } })),
        ]);

        const all = allRes.data.products || [];
        setTrendingProducts(trendingRes.data.products || all.slice(0, 4));
        setAiPicks(aiRes.data.recommendations || all.slice(0, 4));
      } catch (error) {
        console.error("Home load error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  // Handle Natural Language Search
  const handleNLSearchSubmit = async (e) => {
    e.preventDefault();
    if (!nlQuery.trim()) return;
    try {
      setIsSearchingNL(true);
      const res = await axios.get(`/ai/search?q=${encodeURIComponent(nlQuery)}`);
      if (res.data.products && res.data.products.length > 0) {
        toast.success(`AI found ${res.data.products.length} products matching "${nlQuery}"`);
        setTrendingProducts(res.data.products);
      } else {
        toast.info("No exact AI matches found. Showing general catalog.");
      }
    } catch {
      toast.error("AI search failed");
    } finally {
      setIsSearchingNL(false);
    }
  };

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    toast.success("Thank you for subscribing! Check your inbox for your 15% discount code 🎉");
    setNewsletterEmail("");
  };

  return (
    <div className="space-y-12 pb-16 font-sans">
      <SEO
        title="Fashion Store | Online Fashion Shopping"
        description="Shop trendy fashion, footwear, accessories and beauty products."
      />

      {/* 1. Hero Banner Carousel */}
      <section className="relative overflow-hidden bg-gray-900 text-white min-h-[460px] md:min-h-[540px] flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35 transition-all duration-700 scale-105"
          style={{ backgroundImage: `url(${heroBanners[heroIndex].img})` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/80 to-transparent"></div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-12">
          <div className="space-y-6">
            <span className="bg-gradient-to-r from-amber-400 to-rose-500 text-gray-950 font-black text-xs uppercase px-4 py-1.5 rounded-full tracking-widest inline-block shadow-lg">
              {heroBanners[heroIndex].tag}
            </span>

            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none uppercase">
              {heroBanners[heroIndex].title}
            </h1>

            <p className="text-gray-300 text-base md:text-lg max-w-lg font-medium leading-relaxed">
              {heroBanners[heroIndex].subtitle}
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/products"
                className="bg-white hover:bg-gray-100 text-gray-950 font-extrabold px-8 py-4 rounded-2xl shadow-xl hover:scale-105 transition text-sm flex items-center gap-2"
              >
                {heroBanners[heroIndex].cta} &rarr;
              </Link>
              <button
                onClick={() => {
                  const el = document.getElementById("ai-search-sec");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-white/10 hover:bg-white/20 text-white font-extrabold px-6 py-4 rounded-2xl border border-white/20 backdrop-blur-md transition text-sm"
              >
                🤖 AI Smart Search
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Indicators */}
        <div className="absolute bottom-6 right-8 z-20 flex gap-2">
          {heroBanners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setHeroIndex(idx)}
              className={`h-2.5 rounded-full transition-all ${
                heroIndex === idx ? "w-8 bg-amber-400" : "w-2.5 bg-white/40"
              }`}
            />
          ))}
        </div>
      </section>

      {/* 2. AI Natural Language Search Bar Section */}
      <section id="ai-search-sec" className="max-w-5xl mx-auto px-4">
        <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-gray-900 text-white p-6 md:p-8 rounded-3xl shadow-2xl border border-white/10 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-pulse">🤖</span>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">AI Natural Language Search</h2>
              <p className="text-xs text-gray-300">
                Type what you need in plain English (e.g. "Black dress under 2000" or "Gym wear")
              </p>
            </div>
          </div>

          <form onSubmit={handleNLSearchSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. 'I need a black dress under 2000' or 'Blue oversized hoodie'..."
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              className="flex-1 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-2xl px-5 py-3.5 text-xs md:text-sm focus:ring-2 focus:ring-amber-400 outline-none backdrop-blur-md"
            />
            <button
              type="submit"
              disabled={isSearchingNL}
              className="bg-amber-400 hover:bg-amber-500 text-gray-950 font-extrabold px-6 py-3.5 rounded-2xl text-xs md:text-sm shadow-lg transition"
            >
              {isSearchingNL ? "Analyzing..." : "Ask AI"}
            </button>
          </form>

          {/* Quick Query Suggestion Chips */}
          <div className="flex flex-wrap gap-2 text-[11px] font-bold text-gray-300 pt-1">
            <span className="text-gray-400">Popular Queries:</span>
            {[
              "Black dress under 2000",
              "Shoes for office",
              "Wedding outfit for women",
              "Gym wear",
              "Blue oversized hoodie",
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setNlQuery(chip);
                  handleNLSearchSubmit({ preventDefault: () => {} });
                }}
                className="bg-white/10 hover:bg-amber-400 hover:text-gray-950 px-3 py-1 rounded-full border border-white/10 transition"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Shop By Category & Gender Grid with Skeletons */}
      <section className="max-w-7xl mx-auto px-4 space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              CATEGORIES
            </span>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">
              Shop By Category & Gender
            </h2>
          </div>
          <Link to="/products" className="text-xs font-extrabold text-indigo-600 hover:underline">
            View All Categories &rarr;
          </Link>
        </div>

        {loading ? (
          <CategorySkeleton />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
            {[
              { title: "Men", icon: "👨", color: "from-blue-500 to-indigo-600", gender: "Men" },
              { title: "Women", icon: "👩", color: "from-pink-500 to-rose-600", gender: "Women" },
              { title: "Kids", icon: "🧒", color: "from-amber-400 to-yellow-500", gender: "Kids" },
              { title: "Footwear", icon: "👟", color: "from-amber-500 to-orange-600", cat: "Footwear" },
              { title: "Beauty", icon: "💄", color: "from-fuchsia-500 to-pink-600", cat: "Beauty" },
              { title: "Sports", icon: "⚽", color: "from-cyan-500 to-blue-600", cat: "Sports" },
              { title: "Dresses", icon: "👗", color: "from-emerald-500 to-teal-600", cat: "Dresses" },
              { title: "Accessories", icon: "⌚", color: "from-slate-700 to-gray-900", cat: "Accessories" },
            ].map((item, i) => (
              <div
                key={i}
                onClick={() => {
                  if (item.gender) navigate(`/products?gender=${item.gender}`);
                  else if (item.cat) navigate(`/products?category=${item.cat}`);
                }}
                className={`cursor-pointer bg-gradient-to-br ${item.color} text-white p-5 rounded-3xl shadow-lg hover:scale-105 transition flex flex-col items-center justify-center gap-2 group text-center`}
              >
                <span className="text-3xl group-hover:scale-125 transition duration-300">
                  {item.icon}
                </span>
                <span className="font-extrabold text-xs tracking-tight">{item.title}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Flash Sale & Today's Deals with Live Timer */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 text-white rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="bg-white/20 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full border border-white/30">
              ⚡ FLASH SALE ENDS IN
            </span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">Today's Exclusive Fashion Deals</h2>
            <p className="text-white/80 text-xs md:text-sm">Save up to 60% OFF on trending sneakers, jackets & designer dresses</p>
          </div>

          <div className="flex items-center gap-3 bg-black/30 backdrop-blur-md p-4 rounded-2xl border border-white/20">
            <div className="text-center px-3">
              <div className="text-2xl font-black font-mono">{String(timeLeft.hours).padStart(2, "0")}</div>
              <div className="text-[9px] uppercase font-bold text-gray-300">Hours</div>
            </div>
            <span className="text-2xl font-bold text-amber-300">:</span>
            <div className="text-center px-3">
              <div className="text-2xl font-black font-mono">{String(timeLeft.minutes).padStart(2, "0")}</div>
              <div className="text-[9px] uppercase font-bold text-gray-300">Mins</div>
            </div>
            <span className="text-2xl font-bold text-amber-300">:</span>
            <div className="text-center px-3">
              <div className="text-2xl font-black font-mono">{String(timeLeft.seconds).padStart(2, "0")}</div>
              <div className="text-[9px] uppercase font-bold text-gray-300">Secs</div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. AI Recommended Picks */}
      {aiPicks.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">
                CURATED FOR YOU
              </span>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                ✨ AI Stylist Recommendations
              </h2>
            </div>
            <Link to="/products" className="text-xs font-extrabold text-indigo-600 hover:underline">
              Explore All &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {aiPicks.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 6. Trending Collections with Skeletons */}
      <section className="max-w-7xl mx-auto px-4 space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">
              HOT RIGHT NOW
            </span>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">
              Trending Collections
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {trendingProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* 7. Featured Brands Showcase */}
      <section className="max-w-7xl mx-auto px-4 space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            BRANDS WE LOVE
          </span>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Top Designer Brands</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {["Puma", "Nike", "Adidas", "Zara", "H&M", "Levi's"].map((b, idx) => (
            <div
              key={idx}
              onClick={() => navigate(`/products?brand=${b}`)}
              className="bg-white hover:bg-gray-900 hover:text-white border border-gray-100 p-6 rounded-2xl text-center shadow-sm hover:shadow-xl transition cursor-pointer font-black text-xl tracking-wider uppercase text-gray-800 flex items-center justify-center min-h-[100px]"
            >
              {b}
            </div>
          ))}
        </div>
      </section>

      {/* 8. Recently Viewed Products Section */}
      <div className="max-w-7xl mx-auto px-4">
        <RecentlyViewed />
      </div>

      {/* 9. Customer Reviews & Verified Testimonials */}
      <section className="bg-gray-50/80 border-y border-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 space-y-8">
          <div className="text-center max-w-md mx-auto">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              TESTIMONIALS
            </span>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Loved By Fashion Enthusiasts</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Aanya Sharma",
                role: "Verified Buyer",
                comment: "The AI recommendation matched my exact aesthetic for my college fest outfit! Super quick delivery and great fabric quality.",
                rating: "★★★★★",
              },
              {
                name: "Rohan Verma",
                role: "Verified Buyer",
                comment: "Natural language search is a game changer! I typed 'black running shoes under 2000' and bought the Nike sneakers in 2 minutes.",
                rating: "★★★★★",
              },
              {
                name: "Priya Patel",
                role: "Verified Buyer",
                comment: "Complete the look feature helped me pair my floral dress with perfect heels and a clutch. Best fashion app experience!",
                rating: "★★★★★",
              },
            ].map((rev, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-3">
                <div className="text-amber-500 text-sm font-bold">{rev.rating}</div>
                <p className="text-gray-600 text-xs italic leading-relaxed">"{rev.comment}"</p>
                <div className="pt-3 border-t flex items-center justify-between">
                  <span className="font-extrabold text-xs text-gray-900">{rev.name}</span>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {rev.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Newsletter Signup */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="bg-gray-950 text-white rounded-3xl p-8 md:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="max-w-xl mx-auto space-y-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">JOIN THE CLUB</span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">Get 15% Off Your First Order</h2>
            <p className="text-gray-400 text-xs md:text-sm">Subscribe to receive AI fashion recommendations, flash sale alerts & weekly lookbooks.</p>
          </div>

          <form onSubmit={handleNewsletter} className="max-w-md mx-auto flex gap-2">
            <input
              type="email"
              placeholder="Enter your email address..."
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              required
              className="flex-1 bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-2xl px-5 py-3.5 text-xs focus:ring-2 focus:ring-amber-400 outline-none"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-amber-400 to-orange-500 hover:opacity-90 text-gray-950 font-extrabold px-6 py-3.5 rounded-2xl text-xs shadow-lg transition"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* 11. Premium Footer */}
      <footer className="bg-gray-900 text-gray-400 pt-16 pb-8 border-t border-gray-800 text-xs">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-3">
            <div className="text-xl font-black text-white">Fashion Store</div>
            <p className="text-gray-400 leading-relaxed text-[11px]">
              Next-generation fashion ecommerce platform powered by smart recommendations, instant search, and instant checkout.
            </p>
          </div>

          <div>
            <h4 className="font-extrabold text-white uppercase tracking-wider mb-3 text-xs">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/products" className="hover:text-white transition">Catalog</Link></li>
              <li><Link to="/wishlist" className="hover:text-white transition">Wishlist</Link></li>
              <li><Link to="/cart" className="hover:text-white transition">Cart</Link></li>
              <li><Link to="/my-orders" className="hover:text-white transition">My Orders</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-extrabold text-white uppercase tracking-wider mb-3 text-xs">Customer Support</h4>
            <ul className="space-y-2">
              <li><span>Helpline: +91 1800-123-4567</span></li>
              <li><span>Email: support@aifashionstore.com</span></li>
              <li><span>7-Day Return Policy</span></li>
              <li><span>100% Secure Checkout</span></li>
            </ul>
          </div>

          <div>
            <h4 className="font-extrabold text-white uppercase tracking-wider mb-3 text-xs">Payment & Security</h4>
            <div className="flex flex-wrap gap-2 text-[10px] font-bold text-gray-300">
              <span className="bg-gray-800 px-3 py-1.5 rounded-lg">Razorpay</span>
              <span className="bg-gray-800 px-3 py-1.5 rounded-lg">Stripe</span>
              <span className="bg-gray-800 px-3 py-1.5 rounded-lg">COD</span>
              <span className="bg-gray-800 px-3 py-1.5 rounded-lg">UPI</span>
              <span className="bg-gray-800 px-3 py-1.5 rounded-lg">Cards</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 text-center border-t border-gray-800 pt-6 text-[10px] text-gray-500">
          © {new Date().getFullYear()} Fashion Store. All rights reserved. Built with MERN Stack & AI Intelligence.
        </div>
      </footer>
    </div>
  );
};

export default Home;
