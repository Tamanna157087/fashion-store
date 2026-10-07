import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "../api/axios";

const AdminGlobalSearch = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ products: [], users: [], orders: [], coupons: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(`/dashboard/search?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setResults(res.data.results || { products: [], users: [], orders: [], coupons: [] });
      } catch (error) {
        console.error("Global search error", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xl">🔍</span>
            <input
              type="text"
              placeholder="Global Search (Products, Orders, Users, Coupons)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full text-base font-semibold outline-none bg-transparent"
            />
          </div>
          <button onClick={onClose} className="text-2xl font-bold text-gray-400 hover:text-gray-700">
            &times;
          </button>
        </div>

        {loading && <div className="text-xs text-gray-400 py-4 text-center">Searching store database...</div>}

        {!loading && query && (
          <div className="space-y-4 text-xs">
            {/* Products */}
            {results.products?.length > 0 && (
              <div>
                <h4 className="font-extrabold uppercase text-indigo-600 mb-2">Products ({results.products.length})</h4>
                <div className="space-y-1">
                  {results.products.map((p) => (
                    <Link
                      key={p._id}
                      to={`/admin/edit-product/${p._id}`}
                      onClick={onClose}
                      className="block p-2 hover:bg-indigo-50 rounded-xl font-medium text-gray-800"
                    >
                      🛍️ {p.title} &mdash; ₹{p.price} ({p.brand})
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Orders */}
            {results.orders?.length > 0 && (
              <div>
                <h4 className="font-extrabold uppercase text-indigo-600 mb-2">Orders ({results.orders.length})</h4>
                <div className="space-y-1">
                  {results.orders.map((o) => (
                    <Link
                      key={o._id}
                      to="/admin/orders"
                      onClick={onClose}
                      className="block p-2 hover:bg-indigo-50 rounded-xl font-medium text-gray-800"
                    >
                      📦 Order #{o.orderId} &mdash; ₹{o.totalAmount} ({o.status})
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Users */}
            {results.users?.length > 0 && (
              <div>
                <h4 className="font-extrabold uppercase text-indigo-600 mb-2">Users ({results.users.length})</h4>
                <div className="space-y-1">
                  {results.users.map((u) => (
                    <Link
                      key={u._id}
                      to="/admin/users"
                      onClick={onClose}
                      className="block p-2 hover:bg-indigo-50 rounded-xl font-medium text-gray-800"
                    >
                      👤 {u.name} ({u.email}) &mdash; {u.role}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Coupons */}
            {results.coupons?.length > 0 && (
              <div>
                <h4 className="font-extrabold uppercase text-indigo-600 mb-2">Coupons ({results.coupons.length})</h4>
                <div className="space-y-1">
                  {results.coupons.map((c) => (
                    <Link
                      key={c._id}
                      to="/admin/coupons"
                      onClick={onClose}
                      className="block p-2 hover:bg-indigo-50 rounded-xl font-mono font-bold text-gray-800"
                    >
                      🏷️ {c.code} &mdash; {c.discountValue}% OFF
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {results.products.length === 0 && results.orders.length === 0 && results.users.length === 0 && results.coupons.length === 0 && (
              <div className="text-center py-6 text-gray-400">No results found for "{query}"</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminGlobalSearch;
