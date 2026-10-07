import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "../api/axios";
import ProductCard from "../components/ProductCard";
import { ProductCardSkeleton } from "../components/ProductSkeleton";
import NoProductsFound from "../components/NoProductsFound";
import SEO from "../components/SEO";

const CATEGORIES = ["All", "Men", "Women", "Kids", "Accessories", "Sports", "Beauty", "Footwear"];
const SUBCATEGORIES = [
  "All", "T-Shirts", "Shirts", "Jeans", "Trousers", "Hoodies", "Jackets", "Blazers", "Sweatshirts", "Shorts", "Ethnic Wear",
  "Dresses", "Tops", "Kurtis", "Sarees", "Lehengas", "Skirts", "Co-ords", "Lingerie", "Handbags", "Clutches", "Heels", "Flats",
  "Sneakers", "Sandals", "Jewellery", "Watches", "Makeup", "Perfumes", "Sunglasses", "Hair Accessories", "Boys Clothing",
  "Girls Clothing", "Baby Clothing", "Shoes", "Toys", "School Bags", "Caps", "Hats", "Earrings", "Necklaces", "Bracelets",
  "Rings", "Bags", "Backpacks", "Laptop Bags", "Travel Bags", "Duffel Bags", "Scarves", "Running Shoes", "Gym Wear",
  "Sports Accessories", "Skincare", "Haircare", "Casual Shoes", "Formal Shoes", "Boots", "Slippers"
];
const BRANDS = ["All", "Roadster", "Highlander", "Campus Sutra", "Tokyo Talkies", "DressBerry", "Moda Rapido", "H&M", "Zara", "ONLY", "AND", "Nike", "Puma", "Adidas", "Levi's", "US Polo", "Jack & Jones", "Allen Solly", "Biba", "Libas"];
const GENDERS = ["All", "Men", "Women", "Unisex", "Kids"];
const COLORS = ["All", "Black", "White", "Blue", "Green", "Red", "Beige", "Brown", "Grey", "Navy Blue", "Pink", "Gold", "Silver", "Tan", "Maroon", "Yellow"];
const SIZES = ["All", "XS", "S", "M", "L", "XL", "XXL", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "Free Size"];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract initial filters from URL params
  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [subcategory, setSubcategory] = useState(searchParams.get("subcategory") || "All");
  const [brand, setBrand] = useState(searchParams.get("brand") || "All");
  const [gender, setGender] = useState(searchParams.get("gender") || "All");
  const [color, setColor] = useState(searchParams.get("color") || "All");
  const [size, setSize] = useState(searchParams.get("size") || "All");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [viewMode, setViewMode] = useState(searchParams.get("view") || "grid");

  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Dynamic SEO title
  const seoTitle = useMemo(() => {
    if (category !== "All") return `${category} Fashion | Fashion Store`;
    if (keyword) return `Search results for "${keyword}" | Fashion Store`;
    return "Products | Fashion Store";
  }, [category, keyword]);

  // Sync state to URL Query Parameters
  const updateUrlParams = useCallback(
    (newParams) => {
      const current = Object.fromEntries(searchParams.entries());
      const updated = { ...current, ...newParams };

      // Clean default / empty values
      Object.keys(updated).forEach((key) => {
        if (!updated[key] || updated[key] === "All" || updated[key] === "" || (key === "page" && updated[key] === 1)) {
          delete updated[key];
        }
      });

      setSearchParams(updated);
    },
    [searchParams, setSearchParams]
  );

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      params.append("page", page);
      params.append("limit", 8);

      if (keyword) params.append("keyword", keyword);
      if (category !== "All") params.append("category", category);
      if (subcategory !== "All") params.append("subcategory", subcategory);
      if (brand !== "All") params.append("brand", brand);
      if (gender !== "All") params.append("gender", gender);
      if (color !== "All") params.append("color", color);
      if (size !== "All") params.append("size", size);
      if (minPrice) params.append("minPrice", minPrice);
      if (maxPrice) params.append("maxPrice", maxPrice);
      if (sort) params.append("sort", sort);

      const res = await axios.get(`/products?${params.toString()}`);

      setProducts(res.data.products || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalProducts(res.data.totalProducts || 0);
    } catch {
      // ignore product fetch error
    } finally {
      setLoading(false);
    }
  }, [page, keyword, category, subcategory, brand, gender, color, size, minPrice, maxPrice, sort]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle Search Input Change
  const handleKeywordChange = (e) => {
    const val = e.target.value;
    setKeyword(val);
    setPage(1);
    updateUrlParams({ keyword: val, page: 1 });
  };

  // Handle Filter Change
  const handleFilterChange = (setter, key, value) => {
    setter(value);
    setPage(1);
    updateUrlParams({ [key]: value, page: 1 });
  };

  // Clear All Filters
  const clearFilters = () => {
    setKeyword("");
    setCategory("All");
    setSubcategory("All");
    setBrand("All");
    setGender("All");
    setColor("All");
    setSize("All");
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
    setPage(1);
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 font-sans">
      <SEO
        title={seoTitle}
        description="Shop trendy fashion, footwear, accessories and beauty products on Fashion Store."
      />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-gray-900 via-indigo-950 to-gray-900 text-white p-8 rounded-3xl shadow-xl">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Product Catalog</h1>
          <p className="text-gray-300 text-sm mt-1">
            Discover {totalProducts} premium fashion products curated for you
          </p>
        </div>

        {/* Search Input inside banner */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search catalog..."
            value={keyword}
            onChange={handleKeywordChange}
            className="w-full bg-white/10 backdrop-blur-md text-white placeholder-gray-400 pl-10 pr-4 py-3 rounded-2xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition text-sm"
          />
          <svg className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar Filters (Desktop & Mobile drawer) */}
        <div className={`lg:block ${showMobileFilters ? "block" : "hidden"} space-y-6 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-gray-100 shadow-lg h-fit`}>
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <h2 className="text-lg font-extrabold text-gray-900">Filters</h2>
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-rose-500 hover:text-rose-700 transition"
            >
              Clear All
            </button>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Category</label>
            <select
              value={category}
              onChange={(e) => handleFilterChange(setCategory, "category", e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-2.5 text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-600 outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Subcategory Filter */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Subcategory</label>
            <select
              value={subcategory}
              onChange={(e) => handleFilterChange(setSubcategory, "subcategory", e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-2.5 text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-600 outline-none"
            >
              {SUBCATEGORIES.map((sc) => (
                <option key={sc} value={sc}>{sc}</option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Brand</label>
            <select
              value={brand}
              onChange={(e) => handleFilterChange(setBrand, "brand", e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-2.5 text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-600 outline-none"
            >
              {BRANDS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Gender</label>
            <select
              value={gender}
              onChange={(e) => handleFilterChange(setGender, "gender", e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-2.5 text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-600 outline-none"
            >
              {GENDERS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Color Filter */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Color</label>
            <select
              value={color}
              onChange={(e) => handleFilterChange(setColor, "color", e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-2.5 text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-600 outline-none"
            >
              {COLORS.map((clr) => (
                <option key={clr} value={clr}>{clr}</option>
              ))}
            </select>
          </div>

          {/* Size Filter */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Size</label>
            <select
              value={size}
              onChange={(e) => handleFilterChange(setSize, "size", e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-2.5 text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-600 outline-none"
            >
              {SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Price Range (₹)</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => handleFilterChange(setMinPrice, "minPrice", e.target.value)}
                className="w-1/2 border border-gray-200 rounded-xl p-2 text-sm bg-gray-50 outline-none"
              />
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => handleFilterChange(setMaxPrice, "maxPrice", e.target.value)}
                className="w-1/2 border border-gray-200 rounded-xl p-2 text-sm bg-gray-50 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Controls Bar: Sort, View Toggle & Mobile Filter Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-gray-100 shadow-sm">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="lg:hidden flex items-center gap-2 text-xs font-bold text-gray-700 bg-gray-100 px-4 py-2.5 rounded-xl"
            >
              🔍 {showMobileFilters ? "Hide Filters" : "Show Filters"}
            </button>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-500">Sort By:</span>
              <select
                value={sort}
                onChange={(e) => handleFilterChange(setSort, "sort", e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold bg-gray-50 focus:ring-2 focus:ring-indigo-600 outline-none"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="priceLow">Price: Low to High</option>
                <option value="priceHigh">Price: High to Low</option>
                <option value="rating">Highest Rating</option>
                <option value="sold">Best Selling</option>
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => { setViewMode("grid"); updateUrlParams({ view: "grid" }); }}
                className={`p-2 rounded-lg text-sm transition ${
                  viewMode === "grid" ? "bg-white shadow-sm text-gray-900 font-bold" : "text-gray-500"
                }`}
                title="Grid View"
              >
                🔲 Grid
              </button>
              <button
                onClick={() => { setViewMode("list"); updateUrlParams({ view: "list" }); }}
                className={`p-2 rounded-lg text-sm transition ${
                  viewMode === "list" ? "bg-white shadow-sm text-gray-900 font-bold" : "text-gray-500"
                }`}
                title="List View"
              >
                ☰ List
              </button>
            </div>
          </div>

          {/* Product Grid / List or Empty State */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <ProductCardSkeleton key={n} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <NoProductsFound onClearFilters={clearFilters} />
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product._id} className="w-full">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}

          {/* Server-side Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 pt-8">
              <button
                onClick={() => { const p = Math.max(1, page - 1); setPage(p); updateUrlParams({ page: p }); }}
                disabled={page === 1}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition ${
                  page === 1
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gray-900 text-white hover:bg-indigo-600 shadow-md"
                }`}
              >
                &larr; Previous
              </button>

              <span className="text-sm font-extrabold text-gray-800 bg-gray-100 px-4 py-2 rounded-xl">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); updateUrlParams({ page: p }); }}
                disabled={page === totalPages}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition ${
                  page === totalPages
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gray-900 text-white hover:bg-indigo-600 shadow-md"
                }`}
              >
                Next &rarr;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
