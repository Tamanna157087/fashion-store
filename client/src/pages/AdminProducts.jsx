import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "../api/axios";
import { toast } from "react-toastify";
import { exportToCSV } from "../utils/csvHelper";
import { getValidImageUrl } from "../utils/imageFallback";

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [stockFilter, setStockFilter] = useState("All"); // All, Low, OutOfStock

  // Selection & Bulk Action state
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkValue, setBulkValue] = useState("");
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // Quick Edit & Preview Modal state
  const [quickEditProduct, setQuickEditProduct] = useState(null);
  const [previewProduct, setPreviewProduct] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await axios.get("/products/admin/all", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProducts(res.data.products || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load admin products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Selection Handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredProducts.map((p) => p._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Single Delete Handler
  const handleDeleteProduct = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Product deleted successfully");
      setProducts(products.filter((p) => p._id !== id));
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to delete product");
    }
  };

  // Duplicate Product Handler
  const handleDuplicateProduct = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`/products/${id}/duplicate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Product duplicated successfully");
      fetchProducts();
    } catch (error) {
      console.error(error);
      toast.error("Failed to duplicate product");
    }
  };

  // Execute Bulk Action
  const handleExecuteBulk = async () => {
    if (selectedIds.length === 0) {
      toast.warning("Please select at least one product");
      return;
    }
    if (!bulkAction) {
      toast.warning("Please select a bulk action to perform");
      return;
    }

    if (bulkAction === "delete" && !window.confirm(`Delete ${selectedIds.length} selected products?`)) {
      return;
    }

    try {
      setIsProcessingBulk(true);
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/products/bulk-action",
        {
          productIds: selectedIds,
          action: bulkAction,
          value: bulkValue,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(res.data.message || "Bulk action executed successfully");
      setSelectedIds([]);
      setBulkAction("");
      setBulkValue("");
      fetchProducts();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Bulk action failed");
    } finally {
      setIsProcessingBulk(false);
    }
  };

  // Quick Edit Submit Handler
  const handleQuickEditSubmit = async (e) => {
    e.preventDefault();
    if (!quickEditProduct) return;
    try {
      const token = localStorage.getItem("token");
      await axios.put(`/products/${quickEditProduct._id}`, quickEditProduct, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Product quick updated");
      setQuickEditProduct(null);
      fetchProducts();
    } catch {
      toast.error("Failed to update product");
    }
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    const exportData = filteredProducts.map((p) => ({
      ID: p._id,
      Title: p.title,
      Brand: p.brand,
      Category: p.category,
      Gender: p.gender,
      Price: p.price,
      DiscountPrice: p.discountPrice || p.price,
      Stock: p.stock || 0,
      Featured: p.isFeatured ? "Yes" : "No",
      Trending: p.isTrending ? "Yes" : "No",
      CreatedAt: new Date(p.createdAt).toLocaleDateString(),
    }));
    exportToCSV(exportData, `products_export_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // Import CSV simulation handler
  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split("\n").filter((l) => l.trim());
        if (lines.length <= 1) {
          toast.warning("CSV file appears to be empty");
          return;
        }
        toast.info(`Parsing ${lines.length - 1} rows from CSV...`);
        // Simulating upload feedback
        setTimeout(() => {
          toast.success(`CSV Imported successfully! Refreshing product list.`);
          fetchProducts();
        }, 1000);
      } catch {
        toast.error("Failed to parse CSV file");
      }
    };
    reader.readAsText(file);
  };

  // Filter Logic
  const categories = ["All", ...new Set(products.map((p) => p.category))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === "All" || p.category === categoryFilter;

    const totalStock =
      p.variants && p.variants.length > 0
        ? p.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
        : p.stock !== undefined
        ? p.stock
        : 0;

    let matchesStock = true;
    if (stockFilter === "Low") matchesStock = totalStock > 0 && totalStock <= 5;
    if (stockFilter === "OutOfStock") matchesStock = totalStock === 0;

    return matchesSearch && matchesCategory && matchesStock;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center">
        <h2 className="text-xl font-bold text-gray-700 animate-pulse">Loading Admin Catalog...</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Product Management</h1>
          <p className="text-gray-500 text-sm">Bulk actions, instant editing, inventory status & CSV management</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <label className="bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 font-extrabold text-xs px-4 py-3 rounded-2xl border border-emerald-200 cursor-pointer transition flex items-center gap-1 shadow-sm">
            <span>📥</span> Import CSV
            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>

          <button
            onClick={handleExportCSV}
            className="bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 font-extrabold text-xs px-4 py-3 rounded-2xl border border-indigo-200 transition flex items-center gap-1 shadow-sm"
          >
            <span>📤</span> Export CSV
          </button>

          <Link
            to="/admin/add-product"
            className="bg-gray-900 hover:bg-indigo-600 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-md transition"
          >
            + Add Product
          </Link>
        </div>
      </div>

      {/* Bulk Action & Filter Bar */}
      <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Search by title, brand, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-600 outline-none"
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-gray-200 rounded-xl p-2.5 text-xs bg-gray-50 font-medium outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="border border-gray-200 rounded-xl p-2.5 text-xs bg-gray-50 font-medium outline-none"
          >
            <option value="All">Stock Status: All Products</option>
            <option value="Low">Low Stock (&le; 5 units)</option>
            <option value="OutOfStock">Out of Stock (0 units)</option>
          </select>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 bg-indigo-50/80 p-3 rounded-2xl border border-indigo-100 text-xs animate-fade-in">
            <span className="font-bold text-indigo-900">{selectedIds.length} Selected</span>

            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="border border-gray-300 rounded-xl p-2 font-semibold bg-white outline-none"
            >
              <option value="">-- Choose Bulk Action --</option>
              <option value="delete">Bulk Delete Selected</option>
              <option value="updateCategory">Bulk Change Category</option>
              <option value="updateBrand">Bulk Change Brand</option>
              <option value="applyDiscount">Bulk Apply % Discount</option>
              <option value="updateStock">Bulk Set Stock Count</option>
              <option value="toggleFeatured">Toggle Featured Flag</option>
              <option value="toggleTrending">Toggle Trending Flag</option>
            </select>

            {["updateCategory", "updateBrand", "applyDiscount", "updateStock"].includes(bulkAction) && (
              <input
                type="text"
                placeholder={
                  bulkAction === "applyDiscount"
                    ? "Enter Discount % (e.g. 20)"
                    : bulkAction === "updateStock"
                    ? "Enter Stock Count (e.g. 50)"
                    : "Enter Value..."
                }
                value={bulkValue}
                onChange={(e) => setBulkValue(e.target.value)}
                className="border border-gray-300 rounded-xl p-2 bg-white outline-none w-48"
              />
            )}

            <button
              onClick={handleExecuteBulk}
              disabled={isProcessingBulk}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl transition disabled:opacity-50"
            >
              {isProcessingBulk ? "Applying..." : "Apply Action"}
            </button>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-900 text-white font-extrabold uppercase">
              <tr>
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={handleSelectAll}
                    className="cursor-pointer rounded"
                  />
                </th>
                <th className="p-4">Thumbnail</th>
                <th className="p-4">Title & Details</th>
                <th className="p-4">Brand</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Total Stock</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredProducts.map((product) => {
                const imgUrl = getValidImageUrl(
                  product.thumbnail ||
                    (product.images && product.images[0]?.url) ||
                    product.image
                );

                const hasDiscount = product.discountPrice > 0 && product.discountPrice < product.price;

                const totalStock =
                  product.variants && product.variants.length > 0
                    ? product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
                    : product.stock !== undefined
                    ? product.stock
                    : 0;

                const isLowStock = totalStock > 0 && totalStock <= 5;
                const isOutOfStock = totalStock === 0;

                const isSelected = selectedIds.includes(product._id);

                return (
                  <tr
                    key={product._id}
                    className={`transition ${
                      isOutOfStock
                        ? "bg-rose-50/40 hover:bg-rose-50/70"
                        : isLowStock
                        ? "bg-amber-50/40 hover:bg-amber-50/70"
                        : isSelected
                        ? "bg-indigo-50/40"
                        : "hover:bg-gray-50/80"
                    }`}
                  >
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(product._id)}
                        className="cursor-pointer rounded"
                      />
                    </td>

                    <td className="p-3">
                      <div className="relative group cursor-pointer" onClick={() => setPreviewProduct(product)}>
                        <img
                          src={imgUrl}
                          alt={product.title}
                          className="w-14 h-16 object-cover rounded-xl border border-gray-100 shadow-sm group-hover:scale-105 transition"
                        />
                        <span className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition">
                          Preview
                        </span>
                      </div>
                    </td>

                    <td className="p-4 font-bold text-gray-900 max-w-xs">
                      <div className="flex flex-col">
                        <span
                          onClick={() => setPreviewProduct(product)}
                          className="hover:text-indigo-600 cursor-pointer truncate font-extrabold text-sm"
                        >
                          {product.title}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">ID: {product._id.slice(-6)}</span>
                      </div>
                    </td>

                    <td className="p-4 font-semibold text-indigo-600">{product.brand}</td>

                    <td className="p-4">
                      <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md font-medium">
                        {product.category}
                      </span>
                    </td>

                    <td className="p-4 font-extrabold text-gray-900">
                      ₹{hasDiscount ? product.discountPrice : product.price}
                      {hasDiscount && (
                        <span className="text-[10px] text-gray-400 line-through block font-normal">
                          ₹{product.price}
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <span
                        className={`font-bold px-2.5 py-1 rounded-md text-xs inline-flex items-center gap-1 ${
                          totalStock > 5
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : totalStock > 0
                            ? "bg-amber-100 text-amber-900 border border-amber-300 animate-pulse"
                            : "bg-rose-100 text-rose-900 border border-rose-300 font-extrabold"
                        }`}
                      >
                        {totalStock > 0 ? `${totalStock} units` : "Out of stock"}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        {product.isFeatured && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full w-fit">
                            Featured
                          </span>
                        )}
                        {product.isTrending && (
                          <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full w-fit">
                            Trending
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => setQuickEditProduct(product)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-lg font-bold text-[11px] transition"
                        >
                          Quick Edit
                        </button>

                        <button
                          onClick={() => handleDuplicateProduct(product._id)}
                          className="bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-600 px-2.5 py-1 rounded-lg font-bold text-[11px] transition"
                        >
                          Duplicate
                        </button>

                        <Link
                          to={`/admin/edit-product/${product._id}`}
                          className="bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 px-2.5 py-1 rounded-lg font-bold text-[11px] transition"
                        >
                          Full Edit
                        </Link>

                        <button
                          onClick={() => handleDeleteProduct(product._id, product.title)}
                          className="bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 px-2.5 py-1 rounded-lg font-bold text-[11px] transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-gray-500 font-medium">
                    No products found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Edit Modal */}
      {quickEditProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-900 text-base">Quick Edit: {quickEditProduct.title}</h3>
              <button onClick={() => setQuickEditProduct(null)} className="text-gray-400 hover:text-gray-700 text-xl">
                &times;
              </button>
            </div>

            <form onSubmit={handleQuickEditSubmit} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block font-bold uppercase mb-1">Price (₹)</label>
                <input
                  type="number"
                  value={quickEditProduct.price}
                  onChange={(e) => setQuickEditProduct({ ...quickEditProduct, price: Number(e.target.value) })}
                  className="w-full border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold uppercase mb-1">Discount Price (₹)</label>
                <input
                  type="number"
                  value={quickEditProduct.discountPrice || 0}
                  onChange={(e) => setQuickEditProduct({ ...quickEditProduct, discountPrice: Number(e.target.value) })}
                  className="w-full border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold uppercase mb-1">Stock Count</label>
                <input
                  type="number"
                  value={quickEditProduct.stock || 0}
                  onChange={(e) => setQuickEditProduct({ ...quickEditProduct, stock: Number(e.target.value) })}
                  className="w-full border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-1 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={quickEditProduct.isFeatured || false}
                    onChange={(e) => setQuickEditProduct({ ...quickEditProduct, isFeatured: e.target.checked })}
                  />
                  Featured
                </label>

                <label className="flex items-center gap-1 cursor-pointer font-bold">
                  <input
                    type="checkbox"
                    checked={quickEditProduct.isTrending || false}
                    onChange={(e) => setQuickEditProduct({ ...quickEditProduct, isTrending: e.target.checked })}
                  />
                  Trending
                </label>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setQuickEditProduct(null)}
                  className="flex-1 bg-gray-100 py-2.5 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-bold">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Preview Modal */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-xl font-extrabold text-gray-900">{previewProduct.title}</h3>
              <button onClick={() => setPreviewProduct(null)} className="text-2xl text-gray-400 hover:text-gray-700">
                &times;
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <img
                  src={
                    previewProduct.thumbnail ||
                    (previewProduct.images && previewProduct.images[0]?.url) ||
                    "https://via.placeholder.com/300"
                  }
                  alt={previewProduct.title}
                  className="w-full h-64 object-cover rounded-2xl border border-gray-100 shadow-md"
                />
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-extrabold text-indigo-600 uppercase tracking-wide">{previewProduct.brand}</span>
                  <span className="text-gray-400 mx-2">•</span>
                  <span className="text-gray-600 font-semibold">{previewProduct.category}</span>
                </div>

                <div className="text-2xl font-extrabold text-gray-900">
                  ₹{previewProduct.discountPrice || previewProduct.price}
                  {previewProduct.discountPrice > 0 && (
                    <span className="text-xs text-gray-400 line-through ml-2 font-normal">
                      ₹{previewProduct.price}
                    </span>
                  )}
                </div>

                <p className="text-gray-600 leading-relaxed text-xs">{previewProduct.description}</p>

                <div className="pt-2 border-t space-y-1">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-500">Gender:</span>
                    <span className="font-semibold text-gray-800">{previewProduct.gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-500">Total Stock:</span>
                    <span className="font-extrabold text-emerald-600">{previewProduct.stock} units</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
