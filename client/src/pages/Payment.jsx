import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Payment = () => {
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState(
    localStorage.getItem("paymentMethod") || "Cash on Delivery",
  );

  const submitHandler = (e) => {
    e.preventDefault();

    localStorage.setItem("paymentMethod", paymentMethod);

    navigate("/review-order");
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white shadow-lg rounded-xl p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Select Payment Method
      </h1>

      <form onSubmit={submitHandler} className="space-y-5">
        <label className="flex items-center gap-4 border rounded-lg p-4 cursor-pointer hover:border-black">
          <input
            type="radio"
            value="Cash on Delivery"
            checked={paymentMethod === "Cash on Delivery"}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          <span className="font-medium">💵 Cash on Delivery</span>
        </label>

        <label className="flex items-center gap-4 border rounded-lg p-4 cursor-pointer hover:border-black">
          <input
            type="radio"
            value="UPI"
            checked={paymentMethod === "UPI"}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          <span className="font-medium">📱 UPI</span>
        </label>

        <label className="flex items-center gap-4 border rounded-lg p-4 cursor-pointer hover:border-black">
          <input
            type="radio"
            value="Credit / Debit Card"
            checked={paymentMethod === "Credit / Debit Card"}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          <span className="font-medium">💳 Credit / Debit Card</span>
        </label>

        <button
          type="submit"
          className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition"
        >
          Continue to Review Order →
        </button>
      </form>
    </div>
  );
};

export default Payment;
