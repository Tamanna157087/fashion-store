import { useEffect, useState, useCallback } from "react";
import axios from "../api/axios";
import { toast } from "react-toastify";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Selected User Modal
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", 10);
      if (search) params.append("search", search);
      if (roleFilter !== "All") params.append("role", roleFilter);
      if (statusFilter !== "All") params.append("status", statusFilter);

      const res = await axios.get(`/users/admin/all?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers(res.data.users || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load users list");
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, statusFilter, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  // Toggle Deactivate / Activate Account
  const handleToggleDeactivate = async (userId, currentStatus) => {
    const actionStr = currentStatus ? "activate" : "deactivate";
    if (!window.confirm(`Are you sure you want to ${actionStr} this user account?`)) return;

    try {
      const token = localStorage.getItem("token");
      await axios.patch(`/users/admin/${userId}/deactivate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`Account ${actionStr}d successfully`);
      fetchUsers();
    } catch {
      toast.error("Failed to update user account status");
    }
  };

  // Change User Role
  const handleChangeRole = async (userId, newRole) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `/users/admin/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`User role updated to ${newRole}`);
      fetchUsers();
    } catch {
      toast.error("Failed to update user role");
    }
  };

  // Delete User
  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Permanently delete user "${name}"? This action cannot be undone.`)) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/users/admin/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.info("User deleted successfully");
      fetchUsers();
    } catch {
      toast.error("Failed to delete user");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">User Management</h1>
          <p className="text-gray-500 text-sm">Manage customer accounts, roles, activity status and order history</p>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 min-w-[250px]">
          <input
            type="text"
            placeholder="Search users by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-600 outline-none"
          />
          <button type="submit" className="bg-gray-900 hover:bg-indigo-600 text-white font-bold text-xs px-5 rounded-xl transition">
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-gray-500">Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-xl p-2.5 bg-gray-50 font-semibold outline-none"
          >
            <option value="All">All Roles</option>
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-gray-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-xl p-2.5 bg-gray-50 font-semibold outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="active">Active</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 font-bold animate-pulse">Loading Users Data...</div>
      ) : users.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-12 text-center border border-gray-100 shadow-sm space-y-2">
          <span className="text-4xl">👥</span>
          <h3 className="text-lg font-bold text-gray-800">No Users Found</h3>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-900 text-white font-extrabold uppercase">
                <tr>
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Email / Phone</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4">Orders / Total Spent</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50/80 transition">
                    <td className="p-4 font-bold text-gray-900 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-800 font-extrabold flex items-center justify-center">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div>{u.name}</div>
                        <span className="text-[10px] text-gray-400 font-normal">
                          Joined: {new Date(u.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-semibold text-gray-800">{u.email}</div>
                      <div className="text-gray-400 text-[10px]">{u.phone || "No phone added"}</div>
                    </td>

                    <td className="p-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeRole(u._id, e.target.value)}
                        className="border border-gray-200 rounded-xl p-1.5 text-xs font-bold bg-gray-50 outline-none"
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => handleToggleDeactivate(u._id, u.isDeactivated)}
                        className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase transition ${
                          u.isDeactivated ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {u.isDeactivated ? "Deactivated" : "Active"}
                      </button>
                    </td>

                    <td className="p-4 font-bold text-gray-900">
                      <div>₹{u.stats?.totalSpent || 0}</div>
                      <span className="text-[10px] text-gray-500 font-normal">
                        {u.stats?.totalOrders || 0} orders
                      </span>
                    </td>

                    <td className="p-4 text-center space-x-2">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 font-bold px-3 py-1.5 rounded-xl transition"
                      >
                        Profile
                      </button>

                      <button
                        onClick={() => handleDeleteUser(u._id, u.name)}
                        className="bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 font-bold px-3 py-1.5 rounded-xl transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 p-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-1.5 rounded-xl font-bold text-xs bg-white border hover:bg-gray-100 disabled:opacity-50"
              >
                &larr; Prev
              </button>
              <span className="text-xs font-bold">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-1.5 rounded-xl font-bold text-xs bg-white border hover:bg-gray-100 disabled:opacity-50"
              >
                Next &rarr;
              </button>
            </div>
          )}
        </div>
      )}

      {/* User Profile Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-xl font-bold text-gray-900">User Profile Stats</h3>
              <button onClick={() => setSelectedUser(null)} className="text-2xl font-bold text-gray-400 hover:text-gray-700">
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                <div className="w-14 h-14 rounded-full bg-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-base text-gray-900">{selectedUser.name}</h4>
                  <p className="text-gray-500">{selectedUser.email}</p>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase">{selectedUser.role} Account</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-100">
                  <span className="text-gray-500 block text-[10px]">TOTAL SPENT</span>
                  <span className="text-lg font-extrabold text-indigo-700">₹{selectedUser.stats?.totalSpent || 0}</span>
                </div>
                <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100">
                  <span className="text-gray-500 block text-[10px]">TOTAL ORDERS</span>
                  <span className="text-lg font-extrabold text-emerald-700">{selectedUser.stats?.totalOrders || 0}</span>
                </div>
              </div>

              <div className="space-y-2 bg-gray-50 p-4 rounded-2xl">
                <div className="flex justify-between">
                  <span className="text-gray-500">Registration Date:</span>
                  <span className="font-semibold">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Order Date:</span>
                  <span className="font-semibold">
                    {selectedUser.stats?.lastOrder ? new Date(selectedUser.stats.lastOrder).toLocaleDateString() : "No orders yet"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Saved Addresses:</span>
                  <span className="font-semibold">{selectedUser.addresses?.length || 0} saved</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
