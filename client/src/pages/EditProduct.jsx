import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../api/axios";
import { toast } from "react-toastify";
import ProductCard from "../components/ProductCard";

const PRESET_COLORS = ["Black", "White", "Navy Blue", "Red", "Emerald Green", "Beige", "Grey"];
const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "UK 7", "UK 8", "UK 9"];

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("form");

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

  // Images state
  const [existingImages, setExistingImages] = useState([]);
  const [deletedPublicIds, setDeletedPublicIds] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [selectedThumbnailUrl, setSelectedThumbnailUrl] = useState("");

  // Variants & Tags
  const [variants, setVariants] = useState([]);
  const [tags, setTags] = useState([]);

  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/products/${id}`);
        const product = res.data.product;

        setFormData({
          title: product.title || "",
          brand: product.brand || "",
          category: product.category || "Men",
          gender: product.gender || "Unisex",
          price: product.price || "",
          discountPrice: product.discountPrice || "",
          description: product.description || "",
          occasion: product.occasion || "Casual",
          material: product.material || "Cotton Blend",
          careInstructions: product.careInstructions || "Machine wash cold",
          deliveryDays: product.deliveryDays || 5,
          isFeatured: Boolean(product.isFeatured),
          isTrending: Boolean(product.isTrending),
        });

        // Parse images
        const imgs = product.images || [];
        setExistingImages(imgs);
        setSelectedThumbnailUrl(product.thumbnail || (imgs[0] ? imgs[0].url : ""));

        // Parse variants
        const vars = product.variants || [];
        setVariants(vars);

        const colors = Array.from(new Set(vars.map((v) => v.color)));
        const sizes = Array.from(new Set(vars.map((v) => v.size)));
        setSelectedColors(colors);
        setSelectedSizes(sizes);

        // Parse tags
        setTags(product.tags || []);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load product details");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Image Upload & Delete Handling
  const handleNewImages = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setNewImageFiles([...newImageFiles, ...files]);
    const previews = files.map((file) => URL.createObjectURL(file));
    setNewImagePreviews([...newImagePreviews, ...previews]);
  };

  const removeExistingImage = (index) => {
    const imgToRemove = existingImages[index];
    if (imgToRemove && imgToRemove.public_id) {
      setDeletedPublicIds([...deletedPublicIds, imgToRemove.public_id]);
    }
    const updated = existingImages.filter((_, i) => i !== index);
    setExistingImages(updated);
    if (imgToRemove?.url === selectedThumbnailUrl) {
      setSelectedThumbnailUrl(updated[0]?.url || newImagePreviews[0] || "");
    }
  };

  const removeNewImage = (index) => {
    const files = newImageFiles.filter((_, i) => i !== index);
    const previews = newImagePreviews.filter((_, i) => i !== index);
    setNewImageFiles(files);
    setNewImagePreviews(previews);
  };

  // Variants Matrix
  const toggleColor = (color) => {
    const updated = selectedColors.includes(color)
      ? selectedColors.filter((c) => c !== color)
      : [...selectedColors, color];
    setSelectedColors(updated);
    generateVariantsMatrix(updated, selectedSizes);
  };

  const toggleSize = (size) => {
    const updated = selectedSizes.includes(size)
      ? selectedSizes.filter((s) => s !== size)
      : [...selectedSizes, size];
    setSelectedSizes(updated);
    generateVariantsMatrix(selectedColors, updated);
  };

  const generateVariantsMatrix = (colorsList, sizesList) => {
    const newVariants = [];
    const prefix = formData.title ? formData.title.slice(0, 3).toUpperCase() : "SKU";

    colorsList.forEach((c) => {
      sizesList.forEach((s) => {
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



  // Total Stock
  const totalCalculatedStock = useMemo(() => {
    return variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  }, [variants]);

  // Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (existingImages.length === 0 && newImageFiles.length === 0) {
      toast.error("Product must have at least one image");
      return;
    }

    if (variants.length === 0) {
      toast.error("Product must have at least one variant");
      return;
    }

    try {
      setSaving(true);
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

      data.append("thumbnail", selectedThumbnailUrl);
      data.append("images", JSON.stringify(existingImages));
      data.append("deletedImagePublicIds", JSON.stringify(deletedPublicIds));
      data.append("variants", JSON.stringify(variants));
      data.append("tags", JSON.stringify(tags));

      newImageFiles.forEach((file) => {
        data.append("images", file);
      });

      await axios.put(`/products/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Product updated successfully!");
      navigate("/admin/products");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <h2 className="text-center py-20 text-xl font-bold">Loading product details...</h2>;
  }

  // Preview Object
  const previewProduct = {
    _id: id,
    title: formData.title,
    brand: formData.brand,
    category: formData.category,
    price: Number(formData.price),
    discountPrice: Number(formData.discountPrice || 0),
    thumbnail: selectedThumbnailUrl || (existingImages[0]?.url || newImagePreviews[0] || ""),
    images: [...existingImages, ...newImagePreviews.map((url) => ({ url }))],
    rating: 4.8,
    reviewCount: 15,
    stock: totalCalculatedStock,
    variants: variants,
    description: formData.description,
    isFeatured: formData.isFeatured,
    isTrending: formData.isTrending,
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      {/* Header & Tabs */}
      <div className="flex justify-between items-center mb-8 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Edit Product</h1>
          <p className="text-gray-500 text-sm">Update product metadata, variants, pricing and images</p>
        </div>

        <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab("form")}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition ${
              activeTab === "form" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            Edit Form
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
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
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
                required
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
              />
            </div>
          </div>

          {/* Pricing & Logistics */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Pricing & Logistics</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Price (₹) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
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

            <div className="flex gap-6 pt-2">
              <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                Featured Product
              </label>

              <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  name="isTrending"
                  checked={formData.isTrending}
                  onChange={handleChange}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                Trending Product
              </label>
            </div>
          </div>

          {/* Manage Images & Cloudinary Cleanup */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Image Gallery & Thumbnail</h2>

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700 uppercase">
                  Existing Cloudinary Images (Click image to set Thumbnail)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {existingImages.map((imgObj, idx) => {
                    const url = typeof imgObj === "object" ? imgObj.url : imgObj;
                    const isThumb = selectedThumbnailUrl === url;

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedThumbnailUrl(url)}
                        className={`relative group rounded-2xl overflow-hidden border-2 cursor-pointer transition ${
                          isThumb ? "border-indigo-600 ring-2 ring-indigo-300 shadow-md" : "border-gray-200"
                        }`}
                      >
                        <img src={url} alt="Product" className="w-full h-32 object-cover" />
                        {isThumb && (
                          <span className="absolute top-2 left-2 bg-indigo-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow">
                            THUMBNAIL
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeExistingImage(idx); }}
                          className="absolute top-2 right-2 bg-rose-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                          title="Delete from Cloudinary"
                        >
                          &times;
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upload New Files */}
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleNewImages}
                className="hidden"
                id="edit-file-upload"
              />
              <label htmlFor="edit-file-upload" className="cursor-pointer flex flex-col items-center justify-center space-y-1">
                <span className="text-2xl">➕</span>
                <span className="text-sm font-bold text-indigo-600">Upload Additional Images</span>
              </label>
            </div>

            {newImagePreviews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {newImagePreviews.map((url, idx) => (
                  <div key={idx} className="relative group rounded-2xl overflow-hidden border border-gray-200">
                    <img src={url} alt="New Preview" className="w-full h-32 object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNewImage(idx)}
                      className="absolute top-2 right-2 bg-rose-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Variants Stock Matrix */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">
              Variants & Stock Management (Total Stock: {totalCalculatedStock})
            </h2>

            <div className="flex flex-wrap gap-2 mb-2">
              <span className="text-xs font-bold text-gray-500 self-center">Toggle Colors:</span>
              {PRESET_COLORS.map((clr) => (
                <button
                  key={clr}
                  type="button"
                  onClick={() => toggleColor(clr)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                    selectedColors.includes(clr)
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-gray-50 text-gray-700 border-gray-200"
                  }`}
                >
                  {clr}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs font-bold text-gray-500 self-center">Toggle Sizes:</span>
              {PRESET_SIZES.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => toggleSize(sz)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                    selectedSizes.includes(sz)
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-gray-50 text-gray-700 border-gray-200"
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto border border-gray-100 rounded-2xl">
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
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gray-900 hover:bg-indigo-600 text-white font-extrabold py-4 rounded-2xl shadow-xl transition duration-300"
          >
            {saving ? "Saving Changes & Syncing Cloudinary..." : "Update Product"}
          </button>
        </form>
      )}
    </div>
  );
};

export default EditProduct;
