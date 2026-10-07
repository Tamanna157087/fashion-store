import { memo } from "react";

export const ProductCardSkeleton = memo(() => {
  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-gray-100 p-4 shadow-sm animate-pulse flex flex-col justify-between h-[440px]">
      <div className="w-full aspect-[4/5] bg-gray-200 rounded-2xl mb-4"></div>
      <div className="space-y-3">
        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
        <div className="flex justify-between items-center pt-1">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="h-11 bg-gray-200 rounded-2xl w-full mt-3"></div>
      </div>
    </div>
  );
});

ProductCardSkeleton.displayName = "ProductCardSkeleton";

export const ProductDetailsSkeleton = memo(() => {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 animate-pulse space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
        {/* Large Image Skeleton */}
        <div className="space-y-4">
          <div className="w-full aspect-square max-h-[550px] bg-gray-200 rounded-3xl"></div>
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-20 h-20 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>

        {/* Content Details Skeleton */}
        <div className="space-y-6">
          <div className="flex gap-2">
            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
            <div className="h-6 bg-gray-200 rounded-full w-24"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded-xl w-4/5"></div>
          <div className="h-6 bg-gray-200 rounded-lg w-1/3"></div>
          <div className="h-10 bg-gray-200 rounded-xl w-1/2"></div>
          <div className="space-y-2 pt-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
          <div className="h-20 bg-gray-200 rounded-2xl w-full"></div>
          <div className="h-14 bg-gray-200 rounded-2xl w-full"></div>
        </div>
      </div>
    </div>
  );
});

ProductDetailsSkeleton.displayName = "ProductDetailsSkeleton";

export const CategorySkeleton = memo(() => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div
          key={i}
          className="bg-gray-200 animate-pulse h-28 rounded-3xl p-5 flex flex-col items-center justify-center gap-2"
        />
      ))}
    </div>
  );
});

CategorySkeleton.displayName = "CategorySkeleton";

export const HomeSkeleton = memo(() => {
  return (
    <div className="space-y-12 pb-16 max-w-7xl mx-auto px-4">
      <div className="w-full h-[460px] bg-gray-200 rounded-3xl animate-pulse" />
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
        <CategorySkeleton />
      </div>
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
});

HomeSkeleton.displayName = "HomeSkeleton";

export default ProductCardSkeleton;
