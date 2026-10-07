const {
  getDashboardAnalytics,
  getInventoryAnalytics,
  globalAdminSearch,
} = require("../services/dashboardService");

const getDashboardStatsController = async (req, res) => {
  try {
    const data = await getDashboardAnalytics();
    res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getInventoryStatsController = async (req, res) => {
  try {
    const data = await getInventoryAnalytics();
    res.status(200).json({
      success: true,
      inventory: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const globalSearchController = async (req, res) => {
  try {
    const { q } = req.query;
    const results = await globalAdminSearch(q);
    res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getDashboardStats: getDashboardStatsController,
  getInventoryStats: getInventoryStatsController,
  globalSearch: globalSearchController,
};
