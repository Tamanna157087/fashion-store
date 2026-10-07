// Recently Viewed Products Storage Helper

const STORAGE_KEY = "ai_fashion_recently_viewed";

export const addRecentlyViewed = (product) => {
  if (!product || !product._id) return;
  try {
    const existing = getRecentlyViewed();
    const filtered = existing.filter((p) => p._id !== product._id);
    const updated = [product, ...filtered].slice(0, 10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to update recently viewed products:", error);
  }
};

export const getRecentlyViewed = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to read recently viewed products:", error);
    return [];
  }
};

export const clearRecentlyViewed = () => {
  localStorage.removeItem(STORAGE_KEY);
};
