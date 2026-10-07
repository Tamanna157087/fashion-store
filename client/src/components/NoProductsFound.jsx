import { memo } from "react";
import { Link } from "react-router-dom";

const NoProductsFound = memo(({
  title = "No Products Found",
  subtitle = "Try changing your filters or search keywords.",
  onClearFilters,
  showClearButton = true,
  showContinueShopping = true,
}) => {
  return (
    <div className="w-full bg-white/80 backdrop-blur-md rounded-3xl p-8 sm:p-14 text-center border border-gray-100 shadow-md space-y-6 animate-fade-in max-w-2xl mx-auto my-6">
      {/* Modern Fashion Illustration / Icon */}
      <div className="relative w-28 h-28 mx-auto flex items-center justify-center bg-indigo-50 rounded-full border border-indigo-100/80 shadow-inner">
        <span className="text-5xl animate-bounce">🛍️</span>
        <div className="absolute -bottom-1 -right-1 bg-amber-400 text-gray-950 p-2 rounded-full text-xs shadow-md">
          🔍
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          {title}
        </h3>
        <p className="text-gray-500 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
          {subtitle}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {showClearButton && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="bg-gray-900 hover:bg-indigo-600 text-white font-extrabold px-6 py-3 rounded-2xl text-xs shadow-lg hover:scale-105 active:scale-95 transition"
          >
            Clear Filters
          </button>
        )}

        {showContinueShopping && (
          <Link
            to="/products"
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold px-6 py-3 rounded-2xl text-xs hover:scale-105 active:scale-95 transition"
          >
            Continue Shopping &rarr;
          </Link>
        )}
      </div>
    </div>
  );
});

NoProductsFound.displayName = "NoProductsFound";

export default NoProductsFound;
