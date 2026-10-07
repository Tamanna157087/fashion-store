import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "../api/axios";

const CompleteTheLook = ({ productId, onAddToCart }) => {
  const [outfitItems, setOutfitItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOutfit = async () => {
      if (!productId) return;
      try {
        setLoading(true);
        const res = await axios.get(`/ai/complete-the-look/${productId}`);
        setOutfitItems(res.data.outfitItems || []);
      } catch (error) {
        console.error("Failed to load outfit recommendations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOutfit();
  }, [productId]);

  if (loading) {
    return (
      <div className="py-6 text-center text-xs text-gray-400 animate-pulse font-bold">
        Matching complementary style pieces...
      </div>
    );
  }

  if (outfitItems.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-gray-900 text-white rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl border border-white/10 my-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <span className="bg-pink-500/20 text-pink-300 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full border border-pink-500/30">
            ✨ AI Stylist Recommends
          </span>
          <h3 className="text-2xl font-black tracking-tight text-white mt-1">Complete The Look</h3>
          <p className="text-gray-300 text-xs">Curated footwear and accessories to pair perfectly with this outfit</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {outfitItems.map((item) => {
          const img = item.thumbnail || (item.images && item.images[0]?.url) || item.image;

          return (
            <div
              key={item._id}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-between hover:bg-white/15 transition group"
            >
              <Link to={`/product/${item._id}`} className="space-y-2">
                <img
                  src={img}
                  alt={item.title}
                  className="w-full h-36 object-cover rounded-xl border border-white/10 group-hover:scale-105 transition"
                />
                <span className="text-[10px] uppercase font-bold text-amber-300">{item.category}</span>
                <h4 className="font-extrabold text-xs text-white truncate">{item.title}</h4>
              </Link>

              <div className="flex justify-between items-center pt-3 border-t border-white/10 mt-2">
                <span className="font-extrabold text-sm text-pink-300">
                  ₹{item.discountPrice || item.price}
                </span>

                <button
                  onClick={() => onAddToCart && onAddToCart(item)}
                  className="bg-white hover:bg-gray-100 text-gray-900 font-extrabold text-[11px] px-3 py-1.5 rounded-xl shadow transition"
                >
                  + Add Item
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CompleteTheLook;
