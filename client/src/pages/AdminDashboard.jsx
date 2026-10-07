import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "../api/axios";
import { getValidImageUrl } from "../utils/imageFallback";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import AdminNotificationCenter from "../components/AdminNotificationCenter";
import AdminGlobalSearch from "../components/AdminGlobalSearch";

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6", "#06B6D4", "#EF4444"];

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center">
        <h2 className="text-xl font-bold text-gray-700 animate-pulse">Loading Analytics Dashboard...</h2>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};

  // Format monthly sales chart data
  const formattedMonthlySales = (charts.monthlySales || []).map((item) => ({
    name: `M${item._id.month}/${item._id.year.toString().slice(2)}`,
    Revenue: item.revenue,
    Orders: item.orders,
  }));

  // Format category sales chart data
  const formattedCategorySales = (charts.categorySales || []).map((item) => ({
    name: item._id,
    value: item.revenue,
  }));

  // Format brand sales chart data
  const formattedBrandSales = (charts.brandSales || []).map((item) => ({
    name: item._id,
    Revenue: item.revenue,
  }));

  // Format order status distribution
  const formattedOrderStatus = (charts.orderStatusDistribution || []).map((item) => ({
    name: item._id,
    value: item.count,
  }));

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Admin Analytics Dashboard</h1>
          <p className="text-gray-500 text-sm">Real-time performance metrics, sales charts and store overview</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowGlobalSearch(true)}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-4 py-2.5 rounded-2xl transition"
          >
            🔍 Search Store (Ctrl+K)
          </button>

          <AdminNotificationCenter />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Revenue", value: `₹${(kpis.totalRevenue || 0).toLocaleString()}`, icon: "💰", color: "from-indigo-500 to-purple-600" },
          { label: "Total Orders", value: kpis.totalOrders || 0, icon: "📦", color: "from-emerald-500 to-teal-600" },
          { label: "Total Products", value: kpis.totalProducts || 0, icon: "🛍️", color: "from-amber-500 to-orange-600" },
          { label: "Total Customers", value: kpis.totalUsers || 0, icon: "👥", color: "from-pink-500 to-rose-600" },
          { label: "Today's Sales", value: `₹${(kpis.todaySales || 0).toLocaleString()}`, icon: "⚡", color: "from-cyan-500 to-blue-600" },
          { label: "This Month Revenue", value: `₹${(kpis.thisMonthRevenue || 0).toLocaleString()}`, icon: "📈", color: "from-violet-500 to-indigo-600" },
          { label: "Pending Orders", value: kpis.pendingOrders || 0, icon: "⏳", color: "from-amber-400 to-yellow-600" },
          { label: "Low Stock Alert", value: kpis.lowStockProducts || 0, icon: "⚠️", color: "from-rose-500 to-red-700" },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-gray-100 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition duration-300 flex items-center justify-between"
          >
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">{kpi.label}</span>
              <span className="text-2xl font-extrabold text-gray-900 mt-1 block">{kpi.value}</span>
            </div>
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${kpi.color} text-white flex items-center justify-center text-2xl shadow-md`}>
              {kpi.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Access Action Bar */}
      <div className="flex flex-wrap gap-3">
        <Link to="/admin/products" className="bg-gray-900 hover:bg-indigo-600 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-md transition">
          🛍️ Product Catalog
        </Link>
        <Link to="/admin/orders" className="bg-gray-900 hover:bg-indigo-600 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-md transition">
          📦 Order Management
        </Link>
        <Link to="/admin/users" className="bg-gray-900 hover:bg-indigo-600 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-md transition">
          👥 User Management
        </Link>
        <Link to="/admin/inventory" className="bg-gray-900 hover:bg-indigo-600 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-md transition">
          📊 Inventory Page
        </Link>
        <Link to="/admin/coupons" className="bg-gray-900 hover:bg-indigo-600 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-md transition">
          🏷️ Coupons
        </Link>
        <Link to="/admin/settings" className="bg-gray-900 hover:bg-indigo-600 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-md transition">
          ⚙️ Store Settings
        </Link>
      </div>

      {/* Recharts Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Sales & Revenue Trend */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-gray-100 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Monthly Revenue & Orders Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedMonthlySales}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#888" fontSize={11} />
                <YAxis stroke="#888" fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="Revenue" stroke="#4F46E5" fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Brand Wise Sales Bar Chart */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-gray-100 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Brand Wise Revenue</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedBrandSales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#888" fontSize={11} />
                <YAxis stroke="#888" fontSize={11} />
                <Tooltip />
                <Bar dataKey="Revenue" fill="#10B981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Sales Pie Chart */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-gray-100 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Category Revenue Breakdown</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={formattedCategorySales} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {formattedCategorySales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-gray-100 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Order Status Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={formattedOrderStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} label>
                  {formattedOrderStatus.map((entry, index) => (
                    <Cell key={`cell-status-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Selling Products & Top Customers Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Selling Products */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-gray-100 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Top 5 Best Selling Products</h3>
          <div className="space-y-3">
            {(charts.topSellingProducts || []).map((p, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl text-xs">
                <span className="font-extrabold text-indigo-600 w-5 text-center">#{idx + 1}</span>
                <img src={getValidImageUrl(p.image)} alt={p.title} className="w-12 h-14 object-cover rounded-xl" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 truncate">{p.title}</h4>
                  <span className="text-gray-500">{p.totalSold} units sold</span>
                </div>
                <span className="font-extrabold text-gray-900 text-sm">₹{p.totalRevenue}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers Leaderboard */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-gray-100 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Top 5 VIP Customers</h3>
          <div className="space-y-3">
            {(charts.topCustomers || []).map((c, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3.5 bg-gray-50 rounded-2xl text-xs">
                <span className="font-extrabold text-emerald-600 w-5 text-center">#{idx + 1}</span>
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900">{c.name}</h4>
                  <span className="text-gray-500">{c.email} &mdash; {c.ordersCount} orders</span>
                </div>
                <span className="font-extrabold text-emerald-700 text-sm">₹{c.totalSpent}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Global Search Modal */}
      <AdminGlobalSearch isOpen={showGlobalSearch} onClose={() => setShowGlobalSearch(false)} />
    </div>
  );
};

export default AdminDashboard;
