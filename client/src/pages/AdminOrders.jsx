import { useEffect, useState, useCallback } from "react";
import axios from "../api/axios";
import { toast } from "react-toastify";
import OrderTimeline from "../components/OrderTimeline";
import { generateInvoice } from "../utils/generateInvoice";
import { exportToCSV, generateShippingLabel } from "../utils/csvHelper";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination State
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Selected Order for Detail / Tracking Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Tracking Form Modal State
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingForm, setTrackingForm] = useState({
    trackingId: "",
    estimatedDelivery: "",
    courierName: "Delhivery Express",
  });

  const fetchAdminOrders = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", 10);
      if (statusFilter !== "All") params.append("status", statusFilter);
      if (paymentFilter !== "All") params.append("paymentStatus", paymentFilter);
      if (search) params.append("search", search);

      const res = await axios.get(`/orders/admin/all?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOrders(res.data.orders || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load admin orders");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, paymentFilter, search]);

  useEffect(() => {
    fetchAdminOrders();
  }, [fetchAdminOrders]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAdminOrders();
  };

  // Update Status Handler
  const handleUpdateStatus = async (orderId, newStatus) => {
    const comment = window.prompt(`Add a note for updating status to "${newStatus}":`);
    try {
      setUpdatingStatus(true);
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `/orders/admin/${orderId}/status`,
        { status: newStatus, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Order status updated successfully");
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(res.data.order);
      }
      fetchAdminOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Process Return / Refund Decision Handler
  const handleReturnDecision = async (orderId, decision) => {
    const comment = window.prompt(`Note for ${decision} return:`);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `/orders/admin/${orderId}/refund`,
        { decision, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Return request ${decision.toLowerCase()} successfully`);
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(res.data.order);
      }
      fetchAdminOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to process return request");
    }
  };

  // Update Tracking Number & Estimated Delivery
  const handleSaveTracking = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(`/orders/admin/${selectedOrder._id}/tracking`, trackingForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Tracking information updated successfully");
      setSelectedOrder(res.data.order);
      setShowTrackingModal(false);
      fetchAdminOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update tracking");
    }
  };

  // Export CSV Handler
  const handleExportOrdersCSV = () => {
    const data = filteredOrders.map((o) => ({
      "Order ID": o.orderId,
      "Invoice Number": o.invoiceNumber || "",
      "Customer Name": o.shippingAddress?.name || o.user?.name || "",
      Phone: o.shippingAddress?.phone || "",
      "Payment Method": o.paymentMethod,
      "Payment Status": o.paymentStatus,
      "Order Status": o.status,
      "Total Amount": o.totalAmount,
      "Tracking Number": o.trackingId || "",
      "Order Date": new Date(o.createdAt).toLocaleDateString(),
    }));
    exportToCSV(data, `orders_export_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // Date Range Filtering locally on loaded list
  const filteredOrders = orders.filter((o) => {
    if (!dateRange.startDate && !dateRange.endDate) return true;
    const orderDate = new Date(o.createdAt).getTime();
    const start = dateRange.startDate ? new Date(dateRange.startDate).getTime() : 0;
    const end = dateRange.endDate ? new Date(dateRange.endDate).getTime() + 86400000 : Infinity;
    return orderDate >= start && orderDate <= end;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Admin Order Management</h1>
          <p className="text-gray-500 text-sm">Fulfillment, tracking updates, shipping labels & invoice generation</p>
        </div>

        <button
          onClick={handleExportOrdersCSV}
          className="bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 font-extrabold text-xs px-5 py-3 rounded-2xl border border-indigo-200 transition shadow-sm flex items-center gap-1"
        >
          <span>📤</span> Export Orders CSV
        </button>
      </div>

      {/* Filter & Search Controls Bar */}
      <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 min-w-[280px]">
            <input
              type="text"
              placeholder="Search by Order ID, Invoice, Tracking ID, Customer Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-indigo-600 outline-none"
            />
            <button type="submit" className="bg-gray-900 hover:bg-indigo-600 text-white font-bold text-xs px-5 rounded-xl transition">
              Search
            </button>
          </form>

          {/* Status Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-gray-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-xl p-2.5 bg-gray-50 font-semibold outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Packed">Packed</option>
              <option value="Shipped">Shipped</option>
              <option value="Out For Delivery">Out For Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Returned">Returned</option>
            </select>
          </div>

          {/* Payment Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-gray-500">Payment:</span>
            <select
              value={paymentFilter}
              onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-xl p-2.5 bg-gray-50 font-semibold outline-none"
            >
              <option value="All">All Payment</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Failed">Failed</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>
        </div>

        {/* Date Range Picker */}
        <div className="flex flex-wrap items-center gap-4 text-xs pt-2 border-t border-gray-100">
          <span className="font-bold text-gray-500">📅 Date Range:</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="border border-gray-200 rounded-xl p-2 text-xs outline-none"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="border border-gray-200 rounded-xl p-2 text-xs outline-none"
            />
            {(dateRange.startDate || dateRange.endDate) && (
              <button
                onClick={() => setDateRange({ startDate: "", endDate: "" })}
                className="text-indigo-600 font-bold hover:underline"
              >
                Clear Dates
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 font-bold animate-pulse">Loading Admin Orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-12 text-center border border-gray-100 shadow-sm space-y-2">
          <span className="text-4xl">🧾</span>
          <h3 className="text-lg font-bold text-gray-800">No Orders Found</h3>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-900 text-white font-extrabold uppercase">
                <tr>
                  <th className="p-4">Order ID / Tracking</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Order Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50/80 transition">
                    <td className="p-4">
                      <div className="font-mono font-bold text-gray-900">{order.orderId}</div>
                      <div className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleString()}</div>
                      {order.trackingId && (
                        <div className="text-[10px] font-mono text-indigo-600 font-bold mt-0.5">
                          TRK: {order.trackingId}
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-gray-900">{order.shippingAddress?.name || order.user?.name || "Customer"}</div>
                      <div className="text-gray-500">{order.shippingAddress?.phone}</div>
                    </td>

                    <td className="p-4">
                      <div className="font-semibold">{order.paymentMethod}</div>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                          order.paymentStatus === "Paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : order.paymentStatus === "Refunded"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>

                    <td className="p-4 font-extrabold text-indigo-600 text-sm">₹{order.totalAmount}</td>

                    <td className="p-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                        disabled={updatingStatus}
                        className="border border-gray-200 rounded-xl p-1.5 text-xs font-bold bg-gray-50 outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Packed">Packed</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Out For Delivery">Out For Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Returned">Returned</option>
                      </select>
                    </td>

                    <td className="p-4 text-center space-x-1.5">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 font-bold px-3 py-1.5 rounded-xl transition text-[11px]"
                      >
                        Details
                      </button>

                      <button
                        onClick={() => generateInvoice(order)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-2.5 py-1.5 rounded-xl transition text-[11px]"
                      >
                        Invoice
                      </button>

                      <button
                        onClick={() => generateShippingLabel(order)}
                        className="bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 font-bold px-2.5 py-1.5 rounded-xl transition text-[11px]"
                      >
                        Label
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

      {/* Order Details & Refund Approval Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-3xl w-full space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Order #{selectedOrder.orderId}</h3>
                <span className="text-xs text-gray-500">Invoice: {selectedOrder.invoiceNumber}</span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-2xl font-bold text-gray-400 hover:text-gray-700">
                &times;
              </button>
            </div>

            {/* Tracking & Shipping Details */}
            <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
              <div>
                <span className="font-extrabold text-indigo-900 uppercase block mb-1">Fulfillment & Tracking</span>
                <p className="font-semibold text-gray-800">
                  Tracking Number: <span className="font-mono text-indigo-600 font-bold">{selectedOrder.trackingId || "Not assigned"}</span>
                </p>
                <p className="text-gray-600">
                  Est. Delivery: {selectedOrder.estimatedDelivery ? new Date(selectedOrder.estimatedDelivery).toLocaleDateString() : "Pending"}
                </p>
              </div>

              <button
                onClick={() => {
                  setTrackingForm({
                    trackingId: selectedOrder.trackingId || `TRK-${Date.now()}`,
                    estimatedDelivery: selectedOrder.estimatedDelivery ? new Date(selectedOrder.estimatedDelivery).toISOString().slice(0, 10) : "",
                    courierName: "Delhivery Express",
                  });
                  setShowTrackingModal(true);
                }}
                className="bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 transition"
              >
                ✏️ Update Tracking Info
              </button>
            </div>

            {/* Customer & Address Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl text-xs">
              <div>
                <span className="font-bold uppercase text-gray-400 block mb-1">Customer Info</span>
                <p className="font-bold text-gray-900">{selectedOrder.shippingAddress?.name}</p>
                <p className="text-gray-600">Phone: {selectedOrder.shippingAddress?.phone}</p>
                <p className="text-gray-600">User Email: {selectedOrder.user?.email}</p>
              </div>
              <div>
                <span className="font-bold uppercase text-gray-400 block mb-1">Shipping Address</span>
                <p className="text-gray-700">
                  {selectedOrder.shippingAddress?.houseNo}, {selectedOrder.shippingAddress?.street},{" "}
                  {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} -{" "}
                  {selectedOrder.shippingAddress?.pincode}
                </p>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 font-bold">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3">Variant</th>
                    <th className="p-3">Qty</th>
                    <th className="p-3 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedOrder.items?.map((item, i) => (
                    <tr key={i}>
                      <td className="p-3 font-bold">{item.title}</td>
                      <td className="p-3 text-gray-500">
                        {item.color} / {item.size}
                      </td>
                      <td className="p-3">{item.quantity}</td>
                      <td className="p-3 text-right font-bold">₹{item.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Return Request Decision Banner */}
            {selectedOrder.refundStatus === "Requested" && (
              <div className="bg-purple-50 border border-purple-200 p-4 rounded-2xl space-y-3">
                <h4 className="font-extrabold text-xs text-purple-900 uppercase">Return Request Pending Review</h4>
                <p className="text-xs text-purple-700">Reason: "{selectedOrder.returnReason}"</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleReturnDecision(selectedOrder._id, "Approved")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
                  >
                    Approve Return & Refund Stock
                  </button>
                  <button
                    onClick={() => handleReturnDecision(selectedOrder._id, "Rejected")}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
                  >
                    Reject Return Request
                  </button>
                </div>
              </div>
            )}

            {/* Order Timeline */}
            <OrderTimeline
              status={selectedOrder.status}
              statusHistory={selectedOrder.statusHistory}
              trackingId={selectedOrder.trackingId}
              estimatedDelivery={selectedOrder.estimatedDelivery}
            />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => generateShippingLabel(selectedOrder)}
                className="bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md hover:bg-emerald-700"
              >
                🏷️ Shipping Label
              </button>
              <button
                onClick={() => generateInvoice(selectedOrder)}
                className="bg-gray-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md hover:bg-gray-800"
              >
                📄 PDF Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tracking Form Modal */}
      {showTrackingModal && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-gray-900 text-lg border-b pb-3">Update Tracking Details</h3>

            <form onSubmit={handleSaveTracking} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block font-bold uppercase mb-1">Courier Service</label>
                <input
                  type="text"
                  value={trackingForm.courierName}
                  onChange={(e) => setTrackingForm({ ...trackingForm, courierName: e.target.value })}
                  placeholder="e.g. BlueDart, Delhivery, FedEx"
                  className="w-full border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold uppercase mb-1">Tracking ID / AWB Number</label>
                <input
                  type="text"
                  value={trackingForm.trackingId}
                  onChange={(e) => setTrackingForm({ ...trackingForm, trackingId: e.target.value })}
                  required
                  className="w-full border p-2.5 rounded-xl font-mono outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold uppercase mb-1">Estimated Delivery Date</label>
                <input
                  type="date"
                  value={trackingForm.estimatedDelivery}
                  onChange={(e) => setTrackingForm({ ...trackingForm, estimatedDelivery: e.target.value })}
                  required
                  className="w-full border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowTrackingModal(false)}
                  className="flex-1 bg-gray-100 py-2.5 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-bold">
                  Save Tracking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
