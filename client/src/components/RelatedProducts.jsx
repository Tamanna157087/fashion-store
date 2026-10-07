import { memo, useMemo } from "react";
import ProductCard from "./ProductCard";

const RelatedProducts = memo(({ currentProduct, relatedList = [] }) => {
  const sortedRelated = useMemo(() => {
    if (!currentProduct || !relatedList.length) return [];

    const currentId = currentProduct._id;
    const currentSubcat = (currentProduct.subcategory || "").toLowerCase();
    const currentCat = (currentProduct.category || "").toLowerCase();
    const currentBrand = (currentProduct.brand || "").toLowerCase();
    const currentGender = (currentProduct.gender || "").toLowerCase();

    // Exclude current product
    const filtered = relatedList.filter((p) => p._id !== currentId);

    // Calculate priority score for sorting
    const scored = filtered.map((p) => {
      let score = 0;
      const subcat = (p.subcategory || "").toLowerCase();
      const cat = (p.category || "").toLowerCase();
      const brand = (p.brand || "").toLowerCase();
      const gender = (p.gender || "").toLowerCase();

      if (currentSubcat && subcat === currentSubcat) score += 40;
      if (currentCat && cat === currentCat) score += 30;
      if (currentBrand && brand === currentBrand) score += 20;
      if (currentGender && gender === currentGender) score += 10;

      return { product: p, score };
    });

    // Sort by highest score, then rating
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.product.rating || 0) - (a.product.rating || 0);
    });

    return scored.map((item) => item.product).slice(0, 8);
  }, [currentProduct, relatedList]);

  if (!sortedRelated || sortedRelated.length === 0) return null;

  return (
    <section className="border-t border-gray-100 pt-12 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-widest">
            YOU MIGHT ALSO LIKE
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Related Products
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {sortedRelated.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
});

RelatedProducts.displayName = "RelatedProducts";

export default RelatedProducts;
