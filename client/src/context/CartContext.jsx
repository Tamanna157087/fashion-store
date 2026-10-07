import { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "../api/axios";
import { toast } from "react-toastify";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  // Load cart from database
  const fetchCart = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setCart([]);
      return;
    }

    try {
      const res = await axios.get("/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCart(res.data.cart?.items || []);
    } catch (error) {
      console.error("Failed to fetch cart", error);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Add to Cart with Variant (color, size, sku) and Quantity
  const addToCart = async (product, quantity = 1, color = "", size = "", sku = "") => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Please login to add items to your cart");
      return;
    }

    const productId = typeof product === "object" ? product._id : product;

    try {
      const res = await axios.post(
        "/cart",
        {
          productId,
          quantity,
          color,
          size,
          sku,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCart(res.data.cart?.items || []);
      toast.success("Product added to cart!");
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error(error.response?.data?.message || "Failed to add product to cart");
    }
  };

  // Update Quantity
  const updateQuantity = async (cartItemId, quantity) => {
    const token = localStorage.getItem("token");

    if (!token) return;

    try {
      const res = await axios.put(
        `/cart/${cartItemId}`,
        { quantity },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCart(res.data.cart?.items || []);
      toast.success("Cart updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update cart");
    }
  };

  // Remove Product
  const removeFromCart = async (cartItemId) => {
    const token = localStorage.getItem("token");

    if (!token) return;

    try {
      const res = await axios.delete(`/cart/${cartItemId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCart(res.data.cart?.items || []);
      toast.info("Item removed from cart");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove product");
    }
  };

  // Clear Cart
  const clearCart = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setCart([]);
      return;
    }

    try {
      await axios.delete("/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCart([]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to clear cart");
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
