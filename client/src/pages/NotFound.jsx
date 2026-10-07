import { Link } from "react-router-dom";
import SEO from "../components/SEO";

const NotFound = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 py-16 font-sans">
      <SEO
        title="404 - Page Not Found | Fashion Store"
        description="The page you are looking for doesn't exist or has stepped off the runway."
      />

      <div className="max-w-md mx-auto space-y-6 animate-fade-in">
        {/* Modern Illustration */}
        <div className="relative w-40 h-40 mx-auto flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full border border-indigo-100 shadow-xl">
          <span className="text-7xl font-black text-indigo-600/90 select-none">404</span>
          <div className="absolute -bottom-2 -right-2 bg-rose-500 text-white p-3 rounded-2xl text-xl shadow-lg animate-bounce">
            🛍️
          </div>
        </div>

        {/* Title & Message */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            404 - Page Not Found
          </h1>
          <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
            Oops! Looks like this page or item has stepped off the runway. The URL you requested might have been moved or removed.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            to="/"
            className="w-full sm:w-auto bg-gray-900 hover:bg-indigo-600 text-white font-extrabold px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition text-xs tracking-wider uppercase"
          >
            Go Home
          </Link>
          <Link
            to="/products"
            className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-900 font-extrabold px-8 py-3.5 rounded-2xl hover:scale-105 active:scale-95 transition text-xs tracking-wider uppercase"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
