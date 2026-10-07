const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Coupon = require("../models/Coupon");

const getDashboardAnalytics = async () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // 1. KPI Counts
  const totalUsers = await User.countDocuments({ role: "customer" });
  const totalProducts = await Product.countDocuments();
  const totalOrders = await Order.countDocuments();
  const pendingOrders = await Order.countDocuments({ status: { $in: ["Pending", "Confirmed", "Packed"] } });
  const lowStockProducts = await Product.countDocuments({
    $or: [{ "variants.stock": { $lte: 10 } }, { variants: { $size: 0 } }],
  });

  // 2. Revenue Aggregations (excluding Cancelled/Refunded)
  const totalRevenueAgg = await Order.aggregate([
    { $match: { status: { $nin: ["Cancelled", "Refunded"] } } },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);
  const totalRevenue = totalRevenueAgg[0]?.total || 0;

  const todaySalesAgg = await Order.aggregate([
    { $match: { createdAt: { $gte: startOfToday }, status: { $nin: ["Cancelled", "Refunded"] } } },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);
  const todaySales = todaySalesAgg[0]?.total || 0;

  const monthRevenueAgg = await Order.aggregate([
    { $match: { createdAt: { $gte: startOfMonth }, status: { $nin: ["Cancelled", "Refunded"] } } },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);
  const thisMonthRevenue = monthRevenueAgg[0]?.total || 0;

  // 3. Monthly Sales Chart (Last 12 months)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const monthlySales = await Order.aggregate([
    { $match: { createdAt: { $gte: twelveMonthsAgo }, status: { $nin: ["Cancelled", "Refunded"] } } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        revenue: { $sum: "$totalAmount" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  // 4. Weekly Orders Chart (Last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const weeklyOrders = await Order.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dayOfWeek: "$createdAt" },
        orders: { $sum: 1 },
        revenue: { $sum: "$totalAmount" },
      },
    },
    { $sort: { "_id": 1 } },
  ]);

  // 5. Revenue Trend (30 Days Daily)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const revenueTrend = await Order.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo }, status: { $nin: ["Cancelled", "Refunded"] } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$totalAmount" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // 6. Order Status Distribution
  const orderStatusDistribution = await Order.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  // 7. Category & Brand Wise Sales
  const categorySales = await Order.aggregate([
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { $ifNull: ["$productDetails.category", "Uncategorized"] },
        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        unitsSold: { $sum: "$items.quantity" },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  const brandSales = await Order.aggregate([
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { $ifNull: ["$productDetails.brand", "Other"] },
        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        unitsSold: { $sum: "$items.quantity" },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  // 8. Top Selling Products
  const topSellingProducts = await Order.aggregate([
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        title: { $first: "$items.title" },
        image: { $first: "$items.image" },
        totalSold: { $sum: "$items.quantity" },
        totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 5 },
  ]);

  // 9. Top Customers
  const topCustomers = await Order.aggregate([
    { $match: { status: { $nin: ["Cancelled", "Refunded"] } } },
    {
      $group: {
        _id: "$user",
        totalSpent: { $sum: "$totalAmount" },
        ordersCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "userInfo",
      },
    },
    { $unwind: "$userInfo" },
    {
      $project: {
        _id: 1,
        name: "$userInfo.name",
        email: "$userInfo.email",
        totalSpent: 1,
        ordersCount: 1,
      },
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 5 },
  ]);

  return {
    kpis: {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      todaySales,
      thisMonthRevenue,
      pendingOrders,
      lowStockProducts,
    },
    charts: {
      monthlySales,
      weeklyOrders,
      revenueTrend,
      orderStatusDistribution,
      categorySales,
      brandSales,
      topSellingProducts,
      topCustomers,
    },
  };
};

// Inventory Analytics
const getInventoryAnalytics = async () => {
  const products = await Product.find().lean({ virtuals: true });

  let totalValue = 0;
  const lowStock = [];
  const outOfStock = [];
  const fastSelling = [];
  const slowSelling = [];

  products.forEach((p) => {
    const stock = p.variants && p.variants.length > 0
      ? p.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
      : (p.stock || 0);

    totalValue += (p.price || 0) * stock;

    if (stock === 0) outOfStock.push({ ...p, calculatedStock: stock });
    else if (stock <= 10) lowStock.push({ ...p, calculatedStock: stock });

    if ((p.soldCount || 0) >= 50) fastSelling.push(p);
    else slowSelling.push(p);
  });

  return {
    totalValue,
    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock.length,
    lowStock,
    outOfStock,
    fastSelling: fastSelling.slice(0, 10),
    slowSelling: slowSelling.slice(0, 10),
  };
};

// Global Admin Search
const globalAdminSearch = async (queryStr) => {
  if (!queryStr || queryStr.trim() === "") return { products: [], users: [], orders: [], coupons: [] };

  const regex = new RegExp(queryStr.trim(), "i");

  const [products, users, orders, coupons] = await Promise.all([
    Product.find({ $or: [{ title: regex }, { brand: regex }, { category: regex }] }).limit(5).lean(),
    User.find({ $or: [{ name: regex }, { email: regex }, { phone: regex }] }).limit(5).select("-password").lean(),
    Order.find({ $or: [{ orderId: regex }, { invoiceNumber: regex }, { trackingId: regex }, { "shippingAddress.name": regex }] }).limit(5).lean(),
    Coupon.find({ code: regex }).limit(5).lean(),
  ]);

  return { products, users, orders, coupons };
};

module.exports = {
  getDashboardAnalytics,
  getInventoryAnalytics,
  globalAdminSearch,
};
