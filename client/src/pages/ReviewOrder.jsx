import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { useCart } from "../context/CartContext";
import { toast } from "react-toastify";

const ReviewOrder = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const [loading, setLoading] = useState(false);

  const shippingAddress = JSON.parse(localStorage.getItem("shippingAddress"));

  const paymentMethod = localStorage.getItem("paymentMethod");

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  const shippingCharge = totalAmount >= 999 ? 0 : 99;
  const finalTotal = totalAmount + shippingCharge;

  const placeOrderHandler = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const orderData = {
        items: cart.map((item) => ({
          product: item.product._id,
          title: item.product.title,
          image: item.product.image,
          price: item.product.price,
          quantity: item.quantity,
        })),
        shippingAddress,
        paymentMethod,
        totalAmount: finalTotal,
      };

      const res = await axios.post("/orders", orderData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await clearCart();

      localStorage.removeItem("shippingAddress");
      localStorage.removeItem("paymentMethod");

      toast.success("Order Placed Successfully!");

      navigate("/order-success", {
        state: {
          order: res.data.order,
        },
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-6 grid md:grid-cols-2 gap-8">
      {/* Left */}

      <div className="space-y-6">
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">Shipping Address</h2>

          <p>{shippingAddress?.fullName}</p>
          <p>{shippingAddress?.phone}</p>
          <p>{shippingAddress?.address}</p>
          <p>
            {shippingAddress?.city}, {shippingAddress?.state}
          </p>
          <p>{shippingAddress?.pincode}</p>
        </div>

        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">Payment Method</h2>

          <p>{paymentMethod}</p>
        </div>
      </div>

      {/* Right */}

      <div>
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-5">Order Summary</h2>

          {cart.map((item) => (
            <div
              key={item.product._id}
              className="flex justify-between border-b py-3"
            >
              <span>
                {item.product.title} × {item.quantity}
              </span>

              <span>₹{item.product.price * item.quantity}</span>
            </div>
          ))}

          <div className="flex justify-between mt-5">
            <span>Items Total</span>
            <span>₹{totalAmount}</span>
          </div>

          <div className="flex justify-between mt-2">
            <span>Shipping</span>

            <span>{shippingCharge === 0 ? "FREE" : `₹${shippingCharge}`}</span>
          </div>

          <div className="flex justify-between text-2xl font-bold mt-6">
            <span>Total</span>
            <span>₹{finalTotal}</span>
          </div>

          <button
            onClick={placeOrderHandler}
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg mt-8 hover:bg-gray-800"
          >
            {loading ? "Placing Order..." : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewOrder;
