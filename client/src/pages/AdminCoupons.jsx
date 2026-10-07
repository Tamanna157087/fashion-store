import { useEffect, useState, useCallback } from "react";
import axios from "../api/axios";
import { toast } from "react-toastify";

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);

  const [form, setForm] = useState(() => ({
    code: "",
    description: "",
    discountType: "Percentage",
    discountValue: 10,
    minOrderAmount: 499,
    maxDiscountAmount: 200,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    usageLimit: 500,
    isActive: true,
  }));

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("/coupons", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCoupons(res.data.coupons || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch coupons");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      if (editingCoupon) {
        await axios.put(`/coupons/${editingCoupon._id}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Coupon updated successfully");
      } else {
        await axios.post("/coupons", form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Coupon created successfully");
      }

      setShowModal(false);
      setEditingCoupon(null);
      fetchCoupons();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save coupon");
    }
  };

  const handleDeleteCoupon = async (id, code) => {
    if (!window.confirm(`Delete coupon "${code}"?`)) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/coupons/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.info("Coupon deleted");
      fetchCoupons();
    } catch {
      toast.error("Failed to delete coupon");
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`/coupons/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Coupon status updated");
      fetchCoupons();
    } catch {
      toast.error("Failed to toggle coupon status");
    }
  };

  // Analytics Metrics
  const activeCount = coupons.filter((c) => c.isActive && new Date(c.expiryDate) > new Date()).length;
  const totalUsedCount = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);
  const expiredCount = coupons.filter((c) => new Date(c.expiryDate) <= new Date()).length;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Coupon Management & Analytics</h1>
          <p className="text-gray-500 text-sm">Monitor promo usage, revenue impact, expiry alerts, and auto-disabling</p>
        </div>

        <button
          onClick={() => {
            setEditingCoupon(null);
            setForm({
              code: "",
              description: "",
              discountType: "Percentage",
              discountValue: 10,
              minOrderAmount: 499,
              maxDiscountAmount: 200,
              expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
              usageLimit: 500,
              isActive: true,
            });
            setShowModal(true);
          }}
          className="bg-gray-900 hover:bg-indigo-600 text-white font-extrabold text-xs px-6 py-3 rounded-2xl shadow-md transition"
        >
          + Create Coupon
        </button>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Promo Codes</span>
          <div className="text-3xl font-extrabold text-emerald-600 mt-2">{activeCount}</div>
          <span className="text-[11px] text-gray-500 mt-1 block">Ready for customer checkout</span>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Redemptions</span>
          <div className="text-3xl font-extrabold text-indigo-600 mt-2">{totalUsedCount}</div>
          <span className="text-[11px] text-gray-500 mt-1 block">Successful order applications</span>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Expired / Disabled</span>
          <div className="text-3xl font-extrabold text-rose-600 mt-2">{expiredCount}</div>
          <span className="text-[11px] text-gray-500 mt-1 block">Requires renewal or deletion</span>
        </div>
      </div>

      {/* Coupons Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 animate-pulse font-bold">Loading Coupons...</div>
      ) : (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-900 text-white font-extrabold uppercase">
                <tr>
                  <th className="p-4">Code</th>
                  <th className="p-4">Discount</th>
                  <th className="p-4">Min Order</th>
                  <th className="p-4">Usage Progress</th>
                  <th className="p-4">Expiry Status</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {coupons.map((c) => {
                  const isExpired = new Date(c.expiryDate) <= new Date();
                  const usagePercent = Math.min(100, Math.round(((c.usedCount || 0) / (c.usageLimit || 1)) * 100));

                  return (
                    <tr key={c._id} className="hover:bg-gray-50/80 transition">
                      <td className="p-4 font-mono font-extrabold text-indigo-600 text-sm">
                        {c.code}
                        {c.description && <span className="block text-[10px] text-gray-400 font-normal">{c.description}</span>}
                      </td>

                      <td className="p-4 font-bold text-gray-900">
                        {c.discountType === "Percentage" ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT`}
                        <span className="text-[10px] text-gray-400 block font-normal">
                          {c.maxDiscountAmount ? `Cap: ₹${c.maxDiscountAmount}` : "Uncapped"}
                        </span>
                      </td>

                      <td className="p-4 text-gray-600 font-semibold">₹{c.minOrderAmount}</td>

                      <td className="p-4 w-44">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-gray-600">
                            <span>{c.usedCount || 0} used</span>
                            <span>Limit: {c.usageLimit}</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                usagePercent > 90 ? "bg-rose-500" : usagePercent > 50 ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span
                          className={`font-bold px-2.5 py-1 rounded-md text-[10px] ${
                            isExpired ? "bg-rose-100 text-rose-800" : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {isExpired ? "⚠️ Expired" : `Valid till ${new Date(c.expiryDate).toLocaleDateString()}`}
                        </span>
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() => handleToggleStatus(c._id)}
                          className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase transition ${
                            c.isActive && !isExpired
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {c.isActive && !isExpired ? "Active" : isExpired ? "Auto Disabled" : "Disabled"}
                        </button>
                      </td>

                      <td className="p-4 text-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingCoupon(c);
                            setForm({
                              code: c.code,
                              description: c.description || "",
                              discountType: c.discountType,
                              discountValue: c.discountValue,
                              minOrderAmount: c.minOrderAmount,
                              maxDiscountAmount: c.maxDiscountAmount,
                              expiryDate: new Date(c.expiryDate).toISOString().slice(0, 10),
                              usageLimit: c.usageLimit,
                              isActive: c.isActive,
                            });
                            setShowModal(true);
                          }}
                          className="bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 font-bold px-3 py-1.5 rounded-xl transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(c._id, c.code)}
                          className="bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 font-bold px-3 py-1.5 rounded-xl transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {coupons.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-500 font-medium">
                      No active coupons found. Click "+ Create Coupon" to create your first promo code.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 border-b pb-3">
              {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
            </h3>

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase mb-1">Coupon Code *</label>
                <input
                  type="text"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="e.g. FASHION20"
                  required
                  className="w-full border p-2.5 rounded-xl font-mono uppercase font-bold outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold uppercase mb-1">Description / Tagline</label>
                <input
                  type="text"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="e.g. Flat 20% OFF on Summer Wear"
                  className="w-full border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase mb-1">Discount Type *</label>
                  <select
                    name="discountType"
                    value={form.discountType}
                    onChange={handleChange}
                    className="w-full border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Flat">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase mb-1">Discount Value *</label>
                  <input
                    type="number"
                    name="discountValue"
                    value={form.discountValue}
                    onChange={handleChange}
                    required
                    min="1"
                    className="w-full border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase mb-1">Min Order Amount (₹)</label>
                  <input
                    type="number"
                    name="minOrderAmount"
                    value={form.minOrderAmount}
                    onChange={handleChange}
                    min="0"
                    className="w-full border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase mb-1">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    name="maxDiscountAmount"
                    value={form.maxDiscountAmount}
                    onChange={handleChange}
                    min="0"
                    placeholder="0 for uncapped"
                    className="w-full border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={form.expiryDate}
                    onChange={handleChange}
                    required
                    className="w-full border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase mb-1">Usage Limit</label>
                  <input
                    type="number"
                    name="usageLimit"
                    value={form.usageLimit}
                    onChange={handleChange}
                    min="1"
                    className="w-full border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 font-semibold pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                />
                Active Coupon
              </label>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-xs"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
