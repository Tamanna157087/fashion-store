const User = require("../models/User");
const Order = require("../models/Order");

// Get Logged-in User Profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Logged-in User Profile
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;

    if (req.body.password && req.body.password.trim() !== "") {
      user.password = req.body.password;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin - Get All Users (with Search, Filter, Pagination & Aggregated Stats)
const getAllUsersAdmin = async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (role && role !== "All") {
      query.role = role;
    }

    if (status === "active") {
      query.isDeactivated = false;
    } else if (status === "deactivated") {
      query.isDeactivated = true;
    }

    if (search && search.trim() !== "") {
      const s = search.trim();
      query.$or = [
        { name: { $regex: s, $options: "i" } },
        { email: { $regex: s, $options: "i" } },
        { phone: { $regex: s, $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const skip = (pageNum - 1) * limitNum;

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Attach Customer Stats (Total Spent, Total Orders, Last Order)
    const formattedUsers = await Promise.all(
      users.map(async (u) => {
        const userOrders = await Order.find({ user: u._id, status: { $nin: ["Cancelled", "Refunded"] } }).select("totalAmount createdAt").lean();
        const totalSpent = userOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const totalOrdersCount = userOrders.length;
        const lastOrder = userOrders.length > 0 ? userOrders[userOrders.length - 1].createdAt : null;

        return {
          ...u,
          stats: {
            totalSpent,
            totalOrders: totalOrdersCount,
            lastOrder,
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      users: formattedUsers,
      totalUsers,
      currentPage: pageNum,
      totalPages: Math.ceil(totalUsers / limitNum) || 1,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin - Toggle Deactivate/Activate User
const toggleDeactivateUserAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.isDeactivated = !user.isDeactivated;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User account ${user.isDeactivated ? "deactivated" : "activated"} successfully`,
      isDeactivated: user.isDeactivated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin - Change User Role
const changeUserRoleAdmin = async (req, res) => {
  try {
    const { role } = req.body; // customer or admin
    if (!["customer", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin - Delete User
const deleteUserAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getAllUsersAdmin,
  toggleDeactivateUserAdmin,
  changeUserRoleAdmin,
  deleteUserAdmin,
};
