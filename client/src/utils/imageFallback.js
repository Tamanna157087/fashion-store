export const DEFAULT_PRODUCT_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Crect width='400' height='500' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' font-weight='bold' fill='%239ca3af'%3EFashion Item%3C/text%3E%3C/svg%3E";

export const getValidImageUrl = (url) => {
  if (!url || typeof url !== "string" || url.trim() === "" || url.includes("via.placeholder.com")) {
    return DEFAULT_PRODUCT_IMAGE;
  }
  return url;
};
