import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AdminNotificationCenter from "./AdminNotificationCenter";
import AdminGlobalSearch from "./AdminGlobalSearch";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  const logoutHandler = () => {
    logout();
    localStorage.removeItem("cart");
    navigate("/login");
  };

  return (
    <>
      <nav className="bg-white/95 text-gray-900 px-6 md:px-8 py-3.5 flex justify-between items-center shadow-sm sticky top-0 z-40 border-b border-gray-200/80 backdrop-blur-md">
        {/* Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 sm:gap-3 transition-opacity duration-200 hover:opacity-80"
        >
          <img
            src="/logo/logo.svg"
            alt="Fashion Store Logo"
            className="h-9 md:h-10 w-auto object-contain"
          />
          <span className="text-xl md:text-2xl font-bold tracking-tight text-[#1F2937] hover:text-[#111827] transition-colors">
            Fashion Store
          </span>
          {user?.role === "admin" && (
            <span className="bg-gray-100 text-gray-700 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border border-gray-300">
              Admin Portal
            </span>
          )}
        </Link>

        <div className="flex items-center gap-4 md:gap-6 text-xs md:text-sm font-semibold text-gray-700">
          {/* Customer Navigation */}
          {user?.role !== "admin" && (
            <>
              <Link to="/" className="hover:text-black transition-colors">
                Home
              </Link>
              <Link to="/products" className="hover:text-black transition-colors">
                Products
              </Link>
              <Link to="/wishlist" className="hover:text-black transition-colors">
                Wishlist
              </Link>
              <Link to="/cart" className="hover:text-black transition-colors">
                Cart
              </Link>
              {user && (
                <>
                  <Link to="/my-orders" className="hover:text-black transition-colors">
                    My Orders
                  </Link>
                  <Link to="/chatbot" className="hover:text-indigo-600 transition-colors flex items-center gap-1 text-indigo-600 font-semibold">
                    ✨ AI Assistant
                  </Link>
                </>
              )}
            </>
          )}

          {/* Admin Navigation Menu */}
          {user?.role === "admin" && (
            <div className="hidden lg:flex items-center gap-5 text-xs font-bold text-gray-600">
              <Link to="/admin" className="hover:text-black transition-colors">
                Analytics
              </Link>
              <Link to="/admin/ai" className="hover:text-indigo-600 transition-colors text-indigo-600 flex items-center gap-1">
                ✨ AI Assistant
              </Link>
              <Link to="/admin/products" className="hover:text-black transition-colors">
                Products
              </Link>
              <Link to="/admin/orders" className="hover:text-black transition-colors">
                Orders
              </Link>
              <Link to="/admin/inventory" className="hover:text-black transition-colors">
                Inventory
              </Link>
              <Link to="/admin/users" className="hover:text-black transition-colors">
                Users
              </Link>
              <Link to="/admin/coupons" className="hover:text-black transition-colors">
                Coupons
              </Link>
              <Link to="/admin/settings" className="hover:text-black transition-colors">
                Settings
              </Link>
            </div>
          )}

          {/* Admin Quick Search & Notifications */}
          {user?.role === "admin" && (
            <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
              <button
                onClick={() => setShowGlobalSearch(true)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-xl border border-gray-300 flex items-center gap-1.5 transition-colors"
                title="Global Admin Search (Ctrl+K)"
              >
                <span>🔍</span>
                <span className="hidden sm:inline">Search</span>
                <kbd className="hidden sm:inline bg-white px-1.5 py-0.5 rounded text-[9px] text-gray-500 font-mono border border-gray-200">
                  ⌘K
                </kbd>
              </button>

              <AdminNotificationCenter />
            </div>
          )}

          {/* Auth Controls */}
          {!user ? (
            <div className="flex items-center gap-3">
              <Link to="/login" className="hover:text-black transition-colors">
                Login
              </Link>
              <Link
                to="/register"
                className="bg-[#1F2937] hover:bg-black text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                Register
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="font-semibold text-xs bg-gray-100 text-gray-800 px-3 py-1.5 rounded-full border border-gray-200 hidden sm:inline">
                {user.role === "admin" ? `Admin (${user.name})` : `Hi, ${user.name}`}
              </span>

              <button
                onClick={logoutHandler}
                className="bg-rose-600 px-3.5 py-1.5 rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors text-white shadow-sm"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Global Search Modal */}
      {user?.role === "admin" && (
        <AdminGlobalSearch isOpen={showGlobalSearch} onClose={() => setShowGlobalSearch(false)} />
      )}
    </>
  );
};

export default Navbar;
