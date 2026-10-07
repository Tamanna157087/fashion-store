import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { toast } from "react-toastify";
import ProductCard from "../components/ProductCard";
import { DEFAULT_PRODUCT_IMAGE } from "../utils/imageFallback";

const PRESET_COLORS = ["Black", "White", "Navy Blue", "Red", "Emerald Green", "Beige", "Grey"];
const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "UK 7", "UK 8", "UK 9"];

const AddProduct = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    brand: "",
    category: "Men",
    gender: "Unisex",
    price: "",
    discountPrice: "",
    description: "",
    occasion: "Casual",
    material: "Cotton Blend",
    careInstructions: "Machine wash cold",
    deliveryDays: 5,
    isFeatured: false,
    isTrending: false,
  });

  // Dynamic tags, colors, sizes, variants
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState(["Casual", "Trending"]);

  const [customColorInput, setCustomColorInput] = useState("");
  const [selectedColors, setSelectedColors] = useState(["Black", "White"]);

  const [customSizeInput, setCustomSizeInput] = useState("");
  const [selectedSizes, setSelectedSizes] = useState(["S", "M", "L"]);

  // Variant list [{ color, size, stock, sku }]
  const [variants, setVariants] = useState([
    { color: "Black", size: "S", stock: 10, sku: "BLK-S" },
    { color: "Black", size: "M", stock: 15, sku: "BLK-M" },
    { color: "White", size: "S", stock: 8, sku: "WHT-S" },
    { color: "White", size: "M", stock: 12, sku: "WHT-M" },
  ]);

  // Multiple image upload files & previews
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("form"); // "form" or "preview"

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Multiple image handling
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const removeImage = (index) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
    if (thumbnailIndex >= newPreviews.length) {
      setThumbnailIndex(Math.max(0, newPreviews.length - 1));
    }
  };

  // Color selection & matrix sync
  const toggleColor = (color) => {
    const updated = selectedColors.includes(color)
      ? selectedColors.filter((c) => c !== color)
      : [...selectedColors, color];
    setSelectedColors(updated);
    generateVariantsMatrix(updated, selectedSizes);
  };

  const addCustomColor = () => {
    if (!customColorInput.trim()) return;
    const c = customColorInput.trim();
    if (!selectedColors.includes(c)) {
      const updated = [...selectedColors, c];
      setSelectedColors(updated);
      generateVariantsMatrix(updated, selectedSizes);
    }
    setCustomColorInput("");
  };

  // Size selection & matrix sync
  const toggleSize = (size) => {
    const updated = selectedSizes.includes(size)
      ? selectedSizes.filter((s) => s !== size)
      : [...selectedSizes, size];
    setSelectedSizes(updated);
    generateVariantsMatrix(selectedColors, updated);
  };

  const addCustomSize = () => {
    if (!customSizeInput.trim()) return;
    const s = customSizeInput.trim();
    if (!selectedSizes.includes(s)) {
      const updated = [...selectedSizes, s];
      setSelectedSizes(updated);
      generateVariantsMatrix(selectedColors, updated);
    }
    setCustomSizeInput("");
  };

  // Auto generate variants matrix from colors x sizes
  const generateVariantsMatrix = (colorsList, sizesList) => {
    const newVariants = [];
    const prefix = formData.title ? formData.title.slice(0, 3).toUpperCase() : "SKU";

    colorsList.forEach((c) => {
      sizesList.forEach((s) => {
        // preserve existing stock/sku if available
        const existing = variants.find(
          (v) => v.color.toLowerCase() === c.toLowerCase() && v.size.toLowerCase() === s.toLowerCase()
        );
        newVariants.push({
          color: c,
          size: s,
          stock: existing ? existing.stock : 10,
          sku: existing ? existing.sku : `${prefix}-${c.slice(0, 3).toUpperCase()}-${s.toUpperCase()}`,
        });
      });
    });

    setVariants(newVariants);
  };

  // Variant field change
  const handleVariantStockChange = (index, val) => {
    const updated = [...variants];
    updated[index].stock = Math.max(0, Number(val));
    setVariants(updated);
  };

  const handleVariantSkuChange = (index, val) => {
    const updated = [...variants];
    updated[index].sku = val;
    setVariants(updated);
  };

  // Tags management
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (t) => {
    setTags(tags.filter((item) => item !== t));
  };

  // Total stock calculated from variants
  const totalCalculatedStock = useMemo(() => {
    return variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  }, [variants]);

  // Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (imageFiles.length === 0) {
      toast.error("Please upload at least one product image");
      return;
    }

    if (variants.length === 0) {
      toast.error("Please add at least one product variant (color and size)");
      return;
    }

    const priceNum = Number(formData.price);
    const discountNum = Number(formData.discountPrice || 0);

    if (priceNum <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }

    if (discountNum > priceNum) {
      toast.error("Discount price cannot be greater than original price");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const data = new FormData();
      data.append("title", formData.title);
      data.append("brand", formData.brand);
      data.append("category", formData.category);
      data.append("gender", formData.gender);
      data.append("price", formData.price);
      data.append("discountPrice", formData.discountPrice || 0);
      data.append("description", formData.description);
      data.append("occasion", formData.occasion);
      data.append("material", formData.material);
      data.append("careInstructions", formData.careInstructions);
      data.append("deliveryDays", formData.deliveryDays);
      data.append("isFeatured", formData.isFeatured);
      data.append("isTrending", formData.isTrending);

      data.append("variants", JSON.stringify(variants));
      data.append("tags", JSON.stringify(tags));

      // Append image files
      imageFiles.forEach((file) => {
        data.append("images", file);
      });

      await axios.post("/products", data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Product created successfully!");
      navigate("/admin/products");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  // Preview Object
  const previewProduct = {
    _id: "preview_id",
    title: formData.title || "Sample Product Title",
    brand: formData.brand || "Fashion Brand",
    category: formData.category,
    price: Number(formData.price || 2999),
    discountPrice: Number(formData.discountPrice || 0),
    thumbnail: imagePreviews[thumbnailIndex] || DEFAULT_PRODUCT_IMAGE,
    images: imagePreviews.map((url) => ({ url })),
    rating: 4.8,
    reviewCount: 12,
    stock: totalCalculatedStock,
    variants: variants,
    description: formData.description || "Product description preview...",
    isFeatured: formData.isFeatured,
    isTrending: formData.isTrending,
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      {/* Header & Mode Switcher */}
      <div className="flex justify-between items-center mb-8 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Add New Product</h1>
          <p className="text-gray-500 text-sm">Create a multi-variant ecommerce product with Cloudinary images</p>
        </div>

        <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab("form")}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition ${
              activeTab === "form" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            Form Editor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition ${
              activeTab === "preview" ? "bg-indigo-600 text-white shadow-md" : "text-gray-500"
            }`}
          >
            👁 Live Preview
          </button>
        </div>
      </div>

      {activeTab === "preview" ? (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-gray-100 shadow-xl space-y-8">
          <h2 className="text-2xl font-bold text-gray-900">Product Card Preview</h2>
          <div className="max-w-xs mx-auto">
            <ProductCard product={previewProduct} />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8 bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-gray-100 shadow-xl">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">1. Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Product Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Classic Denim Oversized Jacket"
                  required
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Brand *</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="e.g. Zara, Nike, Adidas"
                  required
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                >
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Shoes">Shoes</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                >
                  <option value="Unisex">Unisex</option>
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Kids">Kids</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Occasion</label>
                <input
                  type="text"
                  name="occasion"
                  value={formData.occasion}
                  onChange={handleChange}
                  placeholder="e.g. Casual, Party, Formal"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Description *</label>
              <textarea
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                placeholder="Write detailed product description..."
                required
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
              />
            </div>
          </div>

          {/* Pricing & Logistics */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">2. Pricing & Delivery</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Price (₹) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="2999"
                  required
                  min="1"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Discount Price (₹)</label>
                <input
                  type="number"
                  name="discountPrice"
                  value={formData.discountPrice}
                  onChange={handleChange}
                  placeholder="2499"
                  min="0"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Delivery Estimate (Days)</label>
                <input
                  type="number"
                  name="deliveryDays"
                  value={formData.deliveryDays}
                  onChange={handleChange}
                  min="1"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Material</label>
                <input
                  type="text"
                  name="material"
                  value={formData.material}
                  onChange={handleChange}
                  placeholder="e.g. 100% Organic Cotton"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Care Instructions</label>
                <input
                  type="text"
                  name="careInstructions"
                  value={formData.careInstructions}
                  onChange={handleChange}
                  placeholder="e.g. Machine wash cold"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>
            </div>

            {/* Badges Toggle */}
            <div className="flex gap-6 pt-2">
              <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                Mark as Featured Product
              </label>

              <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  name="isTrending"
                  checked={formData.isTrending}
                  onChange={handleChange}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                Mark as Trending Product
              </label>
            </div>
          </div>

          {/* Product Gallery & Upload */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">3. Product Images Gallery</h2>

            <div className="border-2 border-dashed border-gray-200 hover:border-indigo-400 rounded-2xl p-6 text-center transition">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center space-y-2">
                <span className="text-3xl">📷</span>
                <span className="text-sm font-bold text-indigo-600">Click to upload multiple images</span>
                <span className="text-xs text-gray-400">PNG, JPG, WEBP up to 5MB each</span>
              </label>
            </div>

            {/* Image Previews Grid */}
            {imagePreviews.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700 uppercase">
                  Uploaded Images ({imagePreviews.length}) &mdash; Select Thumbnail
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {imagePreviews.map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() => setThumbnailIndex(idx)}
                      className={`relative group rounded-2xl overflow-hidden border-2 cursor-pointer transition ${
                        thumbnailIndex === idx ? "border-indigo-600 shadow-md ring-2 ring-indigo-300" : "border-gray-200"
                      }`}
                    >
                      <img src={url} alt="Preview" className="w-full h-32 object-cover" />
                      {thumbnailIndex === idx && (
                        <span className="absolute top-2 left-2 bg-indigo-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow">
                          THUMBNAIL
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                        className="absolute top-2 right-2 bg-rose-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Colors & Sizes & Variants Matrix */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
              4. Colors, Sizes & Stock Variants (Total Stock: {totalCalculatedStock})
            </h2>

            {/* Colors Picker */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase">Available Colors</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((clr) => (
                  <button
                    key={clr}
                    type="button"
                    onClick={() => toggleColor(clr)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                      selectedColors.includes(clr)
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-gray-50 text-gray-700 border-gray-200"
                    }`}
                  >
                    {clr}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 max-w-xs pt-1">
                <input
                  type="text"
                  placeholder="Custom Color"
                  value={customColorInput}
                  onChange={(e) => setCustomColorInput(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs outline-none flex-1"
                />
                <button
                  type="button"
                  onClick={addCustomColor}
                  className="bg-gray-200 hover:bg-gray-300 px-3 py-1.5 rounded-xl text-xs font-bold"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Sizes Picker */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase">Available Sizes</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_SIZES.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => toggleSize(sz)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                      selectedSizes.includes(sz)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-gray-50 text-gray-700 border-gray-200"
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 max-w-xs pt-1">
                <input
                  type="text"
                  placeholder="Custom Size"
                  value={customSizeInput}
                  onChange={(e) => setCustomSizeInput(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs outline-none flex-1"
                />
                <button
                  type="button"
                  onClick={addCustomSize}
                  className="bg-gray-200 hover:bg-gray-300 px-3 py-1.5 rounded-xl text-xs font-bold"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Variants Stock & SKU Matrix Table */}
            {variants.length > 0 && (
              <div className="overflow-x-auto border border-gray-100 rounded-2xl shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-gray-900 text-white font-bold uppercase">
                    <tr>
                      <th className="p-3">Color</th>
                      <th className="p-3">Size</th>
                      <th className="p-3">Stock Quantity</th>
                      <th className="p-3">SKU</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {variants.map((v, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-3 font-bold">{v.color}</td>
                        <td className="p-3 font-bold text-indigo-600">{v.size}</td>
                        <td className="p-3">
                          <input
                            type="number"
                            min="0"
                            value={v.stock}
                            onChange={(e) => handleVariantStockChange(idx, e.target.value)}
                            className="w-24 border border-gray-200 rounded-lg p-1.5 font-bold text-center outline-none focus:ring-2 focus:ring-indigo-600"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={v.sku}
                            onChange={(e) => handleVariantSkuChange(idx, e.target.value)}
                            className="w-36 border border-gray-200 rounded-lg p-1.5 font-mono text-xs outline-none focus:ring-2 focus:ring-indigo-600"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Tags Section */}
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">5. Tags</h2>
            <div className="flex gap-2 max-w-sm">
              <input
                type="text"
                placeholder="e.g. Summer, Streetwear"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="border border-gray-200 rounded-xl p-2.5 text-sm outline-none flex-1"
              />
              <button
                type="button"
                onClick={addTag}
                className="bg-gray-900 text-white font-bold px-4 py-2.5 rounded-xl text-xs"
              >
                Add Tag
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {tags.map((t) => (
                <span key={t} className="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                  #{t}
                  <button type="button" onClick={() => removeTag(t)} className="text-gray-400 hover:text-rose-500 font-bold ml-1">
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-indigo-600 text-white font-extrabold py-4 rounded-2xl shadow-xl transition-all duration-300"
          >
            {loading ? "Uploading to Cloudinary & Saving Product..." : "🚀 Publish Product"}
          </button>
        </form>
      )}
    </div>
  );
};

export default AddProduct;
