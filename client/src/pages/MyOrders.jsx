import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "../api/axios";
import { toast } from "react-toastify";
import OrderTimeline from "../components/OrderTimeline";
import { generateInvoice } from "../utils/generateInvoice";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Filter Tab
  const [filterTab, setFilterTab] = useState("All");

  // Selected Order for Tracking Modal
  const [trackingOrder, setTrackingOrder] = useState(null);

  const fetchMyOrders = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("/orders/my-orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data.orders || []);
    } catch {
      toast.error("Failed to load your orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyOrders();
  }, [fetchMyOrders]);

  // Cancel Order Handler
  const handleCancelOrder = async (orderId) => {
    const reason = window.prompt("Please state the reason for cancelling this order:");
    if (reason === null) return; // user cancelled prompt

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `/orders/${orderId}/cancel`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Order cancelled successfully and stock restored.");
      fetchMyOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel order");
    }
  };

  // Return Order Request Handler
  const handleReturnOrder = async (orderId) => {
    const reason = window.prompt("Please state the reason for returning this item:");
    if (reason === null) return;

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `/orders/${orderId}/return`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Return request submitted successfully!");
      fetchMyOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit return request");
    }
  };

  // Filter Logic
  const filteredOrders = orders.filter((order) => {
    if (filterTab === "Active") return ["Pending", "Confirmed", "Packed", "Shipped", "Out For Delivery"].includes(order.status);
    if (filterTab === "Delivered") return order.status === "Delivered";
    if (filterTab === "Cancelled") return order.status === "Cancelled";
    if (filterTab === "Returned") return order.status === "Returned" || order.status === "Refunded";
    return true;
  });

  const now = useMemo(() => Date.now(), []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-8 text-center">
        <h2 className="text-xl font-bold text-gray-700 animate-pulse">Loading Your Order History...</h2>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">My Orders</h1>
          <p className="text-gray-500 text-sm">Track shipments, manage returns, and download invoices</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-1 bg-gray-100 p-1.5 rounded-2xl text-xs font-bold">
          {["All", "Active", "Delivered", "Cancelled", "Returned"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-4 py-2 rounded-xl transition ${
                filterTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-12 text-center border border-gray-100 shadow-sm space-y-3">
          <span className="text-4xl">📦</span>
          <h3 className="text-xl font-bold text-gray-800">No Orders Found</h3>
          <p className="text-gray-500 text-sm">You have no orders matching the selected filter.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const isCancellable = ["Pending", "Confirmed", "Packed"].includes(order.status);

            const isReturnable =
              order.status === "Delivered" &&
              (!order.refundStatus || order.refundStatus === "None") &&
              (now - new Date(order.deliveredAt || order.updatedAt).getTime()) / (1000 * 60 * 60 * 24) <= 7;

            return (
              <div
                key={order._id}
                className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-gray-100 shadow-xl space-y-6"
              >
                {/* Order Top Summary Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4 text-xs">
                  <div>
                    <span className="text-gray-400 block">ORDER ID</span>
                    <span className="font-mono font-bold text-gray-900 text-sm">{order.orderId}</span>
                  </div>

                  <div>
                    <span className="text-gray-400 block">DATE PLACED</span>
                    <span className="font-semibold text-gray-800">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 block">TOTAL AMOUNT</span>
                    <span className="font-extrabold text-indigo-600 text-sm">₹{order.totalAmount}</span>
                  </div>

                  <div>
                    <span className="text-gray-400 block mb-1">STATUS</span>
                    <span
                      className={`px-3 py-1 rounded-full font-extrabold text-[11px] uppercase ${
                        order.status === "Delivered"
                          ? "bg-emerald-100 text-emerald-800"
                          : order.status === "Cancelled"
                          ? "bg-rose-100 text-rose-800"
                          : order.status === "Returned" || order.status === "Refunded"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-indigo-100 text-indigo-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 text-xs">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-16 h-20 object-cover rounded-xl bg-gray-50 border border-gray-100"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm truncate">{item.title}</h4>
                        <p className="text-gray-500 mt-0.5">
                          Quantity: {item.quantity} {item.color ? `| Color: ${item.color}` : ""}{" "}
                          {item.size ? `| Size: ${item.size}` : ""}
                        </p>
                        <span className="font-bold text-gray-900 mt-1 block">₹{item.price}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100 text-xs">
                  <div className="text-gray-500">
                    Payment Method: <span className="font-bold text-gray-800">{order.paymentMethod}</span> (
                    <span className="font-bold text-indigo-600">{order.paymentStatus}</span>)
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setTrackingOrder(order)}
                      className="bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white font-bold px-4 py-2 rounded-xl transition"
                    >
                      📍 Track Order
                    </button>

                    <button
                      onClick={() => generateInvoice(order)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-4 py-2 rounded-xl transition"
                    >
                      📄 Download Invoice
                    </button>

                    {isCancellable && (
                      <button
                        onClick={() => handleCancelOrder(order._id)}
                        className="bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white font-bold px-4 py-2 rounded-xl transition"
                      >
                        Cancel Order
                      </button>
                    )}

                    {isReturnable && (
                      <button
                        onClick={() => handleReturnOrder(order._id)}
                        className="bg-purple-50 hover:bg-purple-600 text-purple-600 hover:text-white font-bold px-4 py-2 rounded-xl transition"
                      >
                        Request Return
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tracking Modal */}
      {trackingOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">
                Tracking Order #{trackingOrder.orderId}
              </h3>
              <button
                onClick={() => setTrackingOrder(null)}
                className="text-gray-400 hover:text-gray-700 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            <OrderTimeline
              status={trackingOrder.status}
              statusHistory={trackingOrder.statusHistory}
              trackingId={trackingOrder.trackingId}
              estimatedDelivery={trackingOrder.estimatedDelivery}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
