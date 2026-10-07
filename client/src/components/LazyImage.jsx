import { useState, memo } from "react";

const SVG_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Crect width='400' height='500' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' font-weight='600' fill='%239ca3af'%3EImage Unavailable%3C/text%3E%3C/svg%3E";

const NO_IMAGE_PATH = "/assets/no-image.png";

const LazyImage = memo(({
  src,
  alt = "",
  className = "",
  containerClassName = "",
  aspectRatio = "aspect-square",
  onClick,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [errorCount, setErrorCount] = useState(0);

  const handleImageError = (e) => {
    if (errorCount === 0) {
      setErrorCount(1);
      e.target.src = NO_IMAGE_PATH;
    } else if (errorCount === 1) {
      setErrorCount(2);
      e.target.src = SVG_FALLBACK;
    }
  };

  const initialSrc = !src || src.trim() === "" || src.includes("via.placeholder.com")
    ? NO_IMAGE_PATH
    : src;

  return (
    <div
      className={`relative overflow-hidden bg-gray-100 ${aspectRatio} ${containerClassName}`}
      onClick={onClick}
    >
      {/* Skeleton Pulse Placeholder while image is loading */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse z-0" />
      )}

      <img
        src={initialSrc}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={handleImageError}
        className={`w-full h-full object-cover object-center transition-all duration-500 ease-out ${
          isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
        } ${className}`}
        {...props}
      />
    </div>
  );
});

LazyImage.displayName = "LazyImage";

export default LazyImage;
