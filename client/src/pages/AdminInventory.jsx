import { useEffect, useState, useCallback } from "react";
import axios from "../api/axios";
import { toast } from "react-toastify";

const AdminInventory = () => {
  const [data, setData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tabs & Search
  const [tab, setTab] = useState("All");
  const [search, setSearch] = useState("");

  // Quick Restock Modal
  const [restockProduct, setRestockProduct] = useState(null);
  const [newStockVal, setNewStockVal] = useState(20);

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const [invRes, prodRes] = await Promise.all([
        axios.get("/dashboard/inventory", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/products/admin/all", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setData(invRes.data.inventory);
      setProducts(prodRes.data.products || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleSaveStock = async () => {
    if (!restockProduct) return;
    try {
      const token = localStorage.getItem("token");

      // Update stock across variants or product
      const updatedVariants = restockProduct.variants?.map((v) => ({
        ...v,
        stock: Number(newStockVal),
      })) || [];

      const formData = new FormData();
      formData.append("variants", JSON.stringify(updatedVariants));

      await axios.put(`/products/${restockProduct._id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(`Stock updated to ${newStockVal} for "${restockProduct.title}"`);
      setRestockProduct(null);
      fetchInventory();
    } catch {
      toast.error("Failed to update stock");
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500 font-bold animate-pulse">Loading Inventory Audit...</div>;
  }

  const inv = data || {};

  // Filtered Products for Inventory Table
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase());

    const stock = p.stock || 0;

    if (tab === "LowStock") return matchesSearch && stock > 0 && stock <= 10;
    if (tab === "OutOfStock") return matchesSearch && stock === 0;
    if (tab === "FastSelling") return matchesSearch && (p.soldCount || 0) >= 50;
    if (tab === "SlowSelling") return matchesSearch && (p.soldCount || 0) < 50;

    return matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Inventory & Stock Audit</h1>
          <p className="text-gray-500 text-sm">Monitor stock levels, inventory valuation, fast/slow moving items, and restock alerts</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-gray-100 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Total Inventory Value</span>
            <span className="text-2xl font-extrabold text-gray-900 mt-1 block">₹{(inv.totalValue || 0).toLocaleString()}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl shadow-md">
            💎
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-gray-100 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Low Stock Items</span>
            <span className="text-2xl font-extrabold text-amber-600 mt-1 block">{inv.lowStockCount || 0}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-2xl shadow-md">
            ⚠️
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-gray-100 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Out of Stock Items</span>
            <span className="text-2xl font-extrabold text-rose-600 mt-1 block">{inv.outOfStockCount || 0}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center text-2xl shadow-md">
            🚫
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-gray-100 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Fast Selling Products</span>
            <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">{inv.fastSelling?.length || 0}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl shadow-md">
            🔥
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Filter inventory by title or brand..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-xl p-3 text-xs outline-none flex-1 min-w-[200px]"
        />

        <div className="flex flex-wrap gap-1 bg-gray-100 p-1.5 rounded-2xl text-xs font-bold">
          {[
            { id: "All", label: "All Items" },
            { id: "LowStock", label: "Low Stock (<=10)" },
            { id: "OutOfStock", label: "Out of Stock (0)" },
            { id: "FastSelling", label: "Fast Selling" },
            { id: "SlowSelling", label: "Slow Selling" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl transition ${
                tab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-900 text-white font-extrabold uppercase">
              <tr>
                <th className="p-4">Product Info</th>
                <th className="p-4">Brand / Category</th>
                <th className="p-4">Total Stock</th>
                <th className="p-4">Variant Stock Details</th>
                <th className="p-4">Units Sold</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredProducts.map((p) => {
                const stock = p.stock || 0;
                const isOut = stock === 0;
                const isLow = stock > 0 && stock <= 10;

                return (
                  <tr
                    key={p._id}
                    className={`transition ${
                      isOut
                        ? "bg-rose-50/50 hover:bg-rose-50"
                        : isLow
                        ? "bg-amber-50/50 hover:bg-amber-50"
                        : "hover:bg-gray-50/80"
                    }`}
                  >
                    <td className="p-4 font-bold text-gray-900 flex items-center gap-3">
                      <img
                        src={p.thumbnail || (p.images && p.images[0]?.url) || p.image}
                        alt={p.title}
                        className="w-12 h-14 object-cover rounded-xl border"
                      />
                      <div>
                        <div>{p.title}</div>
                        <span className="text-[10px] text-gray-400 font-normal">Price: ₹{p.price}</span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-semibold text-indigo-600">{p.brand}</div>
                      <span className="text-[10px] text-gray-500">{p.category}</span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`font-extrabold px-3 py-1 rounded-full text-xs ${
                          isOut
                            ? "bg-rose-600 text-white"
                            : isLow
                            ? "bg-amber-500 text-white"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {stock} units
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {p.variants && p.variants.length > 0 ? (
                          p.variants.map((v, i) => (
                            <span key={i} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px]">
                              {v.color}/{v.size}: <strong className="text-gray-900">{v.stock}</strong>
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-[10px]">Single Variant</span>
                        )}
                      </div>
                    </td>

                    <td className="p-4 font-bold text-gray-900">{p.soldCount || 0} sold</td>

                    <td className="p-4 text-center">
                      <button
                        onClick={() => {
                          setRestockProduct(p);
                          setNewStockVal(20);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl transition shadow-sm"
                      >
                        ⚡ Restock
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500 font-medium">
                    No products match the selected inventory filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restock Modal */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-3">
              Quick Restock &mdash; {restockProduct.title}
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase mb-1">Set Stock Quantity For Variants</label>
                <input
                  type="number"
                  min="1"
                  value={newStockVal}
                  onChange={(e) => setNewStockVal(e.target.value)}
                  className="w-full border p-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => setRestockProduct(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveStock}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-xs"
                >
                  Confirm Restock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;
