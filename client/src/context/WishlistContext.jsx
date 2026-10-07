import { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "../api/axios";
import { toast } from "react-toastify";

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  // Fetch Wishlist
  const fetchWishlist = useCallback(async () => {
    if (!token) {
      setWishlist([]);
      return;
    }

    try {
      setLoading(true);

      const res = await axios.get("/wishlist", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setWishlist(res.data.wishlist || []);
    } catch (error) {
      console.error(error);
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // Add Product
  const addToWishlist = async (product) => {
    try {
      if (!token) {
        toast.error("Please login first");
        return;
      }

      await axios.post(
        "/wishlist",
        {
          productId: product._id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success("Added to Wishlist ❤️");

      fetchWishlist();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add to wishlist");
    }
  };

  // Remove Product
  const removeFromWishlist = async (productId) => {
    try {
      await axios.delete(`/wishlist/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Removed from Wishlist");

      fetchWishlist();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove product");
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        fetchWishlist,
        addToWishlist,
        removeFromWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
