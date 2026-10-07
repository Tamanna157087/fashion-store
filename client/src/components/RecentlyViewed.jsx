import { useState, useEffect, memo } from "react";
import ProductCard from "./ProductCard";
import { getRecentlyViewed } from "../utils/recentlyViewed";

const RecentlyViewed = memo(({ currentProductId }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const list = getRecentlyViewed();
    // Exclude current product if provided, limit to 10
    const filtered = currentProductId
      ? list.filter((p) => p && p._id !== currentProductId).slice(0, 10)
      : list.slice(0, 10);
    setItems(filtered);
  }, [currentProductId]);

  if (!items || items.length === 0) return null;

  return (
    <section className="border-t border-gray-100 pt-12 space-y-6">
      <div className="flex justify-between items-end border-b border-gray-100 pb-3">
        <div>
          <span className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">
            YOUR HISTORY
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Recently Viewed Products
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
});

RecentlyViewed.displayName = "RecentlyViewed";

export default RecentlyViewed;
