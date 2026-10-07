import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "../api/axios";
import { generateInvoice } from "../utils/generateInvoice";

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrder(res.data.order);
      } catch {
        // failed to fetch order
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <h2 className="text-xl font-bold text-gray-700 animate-pulse">Loading Order Details...</h2>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8 text-center">
      {/* Celebration Icon */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-10 border border-gray-100 shadow-2xl space-y-6">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner animate-bounce">
          ✓
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Order Placed Successfully!</h1>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Thank you for your purchase. We have received your order and are getting it ready for shipment.
        </p>

        {order && (
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-left space-y-3 max-w-lg mx-auto text-xs">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Order ID:</span>
              <span className="font-mono font-bold text-gray-900">{order.orderId}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Invoice Number:</span>
              <span className="font-mono font-bold text-gray-900">{order.invoiceNumber || "INV-2026-001"}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Payment Method:</span>
              <span className="font-bold text-indigo-600">{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Payment Status:</span>
              <span className="font-bold text-emerald-600">{order.paymentStatus}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Grand Total:</span>
              <span className="font-extrabold text-sm text-gray-900">₹{order.totalAmount}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-gray-500">Estimated Delivery:</span>
              <span className="font-bold text-indigo-600">
                {order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString() : "3-5 Business Days"}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          {order && (
            <button
              onClick={() => generateInvoice(order)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-3.5 rounded-2xl shadow-lg transition"
            >
              📄 Download PDF Invoice
            </button>
          )}

          <Link
            to="/my-orders"
            className="bg-gray-900 hover:bg-indigo-600 text-white font-bold text-xs px-6 py-3.5 rounded-2xl shadow-lg transition"
          >
            🚚 Track My Orders
          </Link>

          <Link
            to="/products"
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs px-6 py-3.5 rounded-2xl transition"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
