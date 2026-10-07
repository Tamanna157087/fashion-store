import { useEffect, useState, useCallback } from "react";
import axios from "../api/axios";
import { toast } from "react-toastify";

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    storeName: "Fashion Store",
    gstNumber: "",
    supportEmail: "",
    supportPhone: "",
    shippingCharge: 99,
    freeShippingThreshold: 999,
    platformFee: 20,
    taxPercentage: 18,
    logoUrl: "",
    currencySymbol: "₹",
  });

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("/settings");
      if (res.data.settings) {
        setSettings(res.data.settings);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load store settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      await axios.put("/settings", settings, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Store settings updated successfully");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center font-bold text-gray-500 animate-pulse">
        Loading Store Configuration...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Store Settings</h1>
          <p className="text-gray-500 text-sm">Manage tax rates, shipping rules, support contacts & business details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-md rounded-3xl border border-gray-100 shadow-xl p-6 md:p-8 space-y-6">
        <h2 className="text-lg font-bold text-gray-900 border-b pb-3 flex items-center gap-2">
          <span>⚙️</span> General Store Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-medium">
          <div>
            <label className="block font-bold text-gray-700 uppercase mb-1">Store Name *</label>
            <input
              type="text"
              name="storeName"
              value={settings.storeName}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 rounded-xl p-3 text-gray-900 font-bold focus:ring-2 focus:ring-indigo-600 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 uppercase mb-1">GST / Business Identification Number</label>
            <input
              type="text"
              name="gstNumber"
              value={settings.gstNumber || ""}
              onChange={handleChange}
              placeholder="e.g. 22AAAAA0000A1Z5"
              className="w-full border border-gray-200 rounded-xl p-3 text-gray-900 font-mono uppercase focus:ring-2 focus:ring-indigo-600 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 uppercase mb-1">Customer Support Email *</label>
            <input
              type="email"
              name="supportEmail"
              value={settings.supportEmail || ""}
              onChange={handleChange}
              required
              placeholder="support@fashionstore.com"
              className="w-full border border-gray-200 rounded-xl p-3 text-gray-900 focus:ring-2 focus:ring-indigo-600 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 uppercase mb-1">Support Phone Helpline</label>
            <input
              type="text"
              name="supportPhone"
              value={settings.supportPhone || ""}
              onChange={handleChange}
              placeholder="+91 1800-123-4567"
              className="w-full border border-gray-200 rounded-xl p-3 text-gray-900 focus:ring-2 focus:ring-indigo-600 outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-bold text-gray-700 uppercase mb-1">Store Logo Image URL</label>
            <input
              type="text"
              name="logoUrl"
              value={settings.logoUrl || ""}
              onChange={handleChange}
              placeholder="https://res.cloudinary.com/..."
              className="w-full border border-gray-200 rounded-xl p-3 text-gray-900 font-mono text-xs focus:ring-2 focus:ring-indigo-600 outline-none"
            />
          </div>
        </div>

        <h2 className="text-lg font-bold text-gray-900 border-b pt-4 pb-3 flex items-center gap-2">
          <span>💳</span> Taxation & Checkout Fees
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-medium">
          <div>
            <label className="block font-bold text-gray-700 uppercase mb-1">Standard Shipping Charge (₹)</label>
            <input
              type="number"
              name="shippingCharge"
              value={settings.shippingCharge}
              onChange={handleChange}
              min="0"
              className="w-full border border-gray-200 rounded-xl p-3 text-gray-900 font-bold focus:ring-2 focus:ring-indigo-600 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 uppercase mb-1">Free Shipping Threshold (₹)</label>
            <input
              type="number"
              name="freeShippingThreshold"
              value={settings.freeShippingThreshold}
              onChange={handleChange}
              min="0"
              className="w-full border border-gray-200 rounded-xl p-3 text-gray-900 font-bold focus:ring-2 focus:ring-indigo-600 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 uppercase mb-1">Platform Fee per Order (₹)</label>
            <input
              type="number"
              name="platformFee"
              value={settings.platformFee}
              onChange={handleChange}
              min="0"
              className="w-full border border-gray-200 rounded-xl p-3 text-gray-900 font-bold focus:ring-2 focus:ring-indigo-600 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 uppercase mb-1">GST Tax Percentage (%)</label>
            <input
              type="number"
              name="taxPercentage"
              value={settings.taxPercentage}
              onChange={handleChange}
              min="0"
              max="100"
              className="w-full border border-gray-200 rounded-xl p-3 text-gray-900 font-bold focus:ring-2 focus:ring-indigo-600 outline-none"
            />
          </div>
        </div>

        <div className="pt-6 border-t flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-gray-900 hover:bg-indigo-600 text-white font-extrabold px-8 py-3.5 rounded-2xl shadow-lg transition duration-200 disabled:opacity-50 text-xs"
          >
            {saving ? "Saving Changes..." : "Save Store Settings"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
