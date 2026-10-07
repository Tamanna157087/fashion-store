import { useState, useMemo } from "react";
import { DEFAULT_PRODUCT_IMAGE, getValidImageUrl } from "../utils/imageFallback";

const ImageGallery = ({ images = [], thumbnail = "", title = "Product" }) => {
  // Normalize images array into objects [{ url, public_id }] or string URLs
  const normalizedImages = useMemo(() => {
    let list = [];
    if (Array.isArray(images) && images.length > 0) {
      list = images.map((img) => getValidImageUrl(typeof img === "object" ? img.url : img));
    }
    if (thumbnail && !list.includes(thumbnail)) {
      list.unshift(getValidImageUrl(thumbnail));
    }
    if (list.length === 0) {
      list = [DEFAULT_PRODUCT_IMAGE];
    }
    return list;
  }, [images, thumbnail]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const activeImage = normalizedImages[selectedIndex] || normalizedImages[0];

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const handlePrev = (e) => {
    e?.stopPropagation();
    setSelectedIndex((prev) => (prev === 0 ? normalizedImages.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    setSelectedIndex((prev) => (prev === normalizedImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Main Image Container */}
      <div
        className="relative overflow-hidden rounded-3xl bg-gray-100 shadow-lg group cursor-zoom-in aspect-square max-h-[550px] flex items-center justify-center border border-gray-100"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
        onClick={() => setIsFullscreen(true)}
      >
        <img
          src={activeImage}
          alt={`${title} view ${selectedIndex + 1}`}
          className={`w-full h-full object-cover object-center transition-transform duration-300 ${
            isZoomed ? "opacity-0" : "opacity-100"
          }`}
        />

        {/* Hover Zoom Magnifier Box */}
        {isZoomed && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-200"
            style={{
              backgroundImage: `url(${activeImage})`,
              backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
              backgroundSize: "220%",
              backgroundRepeat: "no-repeat",
            }}
          />
        )}

        {/* Floating Zoom Icon hint */}
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition duration-300">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
          </svg>
        </div>

        {/* Quick Prev / Next overlay arrows if multiple images */}
        {normalizedImages.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white backdrop-blur-md text-black p-2.5 rounded-full shadow-md transition transform -translate-x-2 group-hover:translate-x-0 opacity-0 group-hover:opacity-100"
              aria-label="Previous image"
            >
              &#10094;
            </button>
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white backdrop-blur-md text-black p-2.5 rounded-full shadow-md transition transform translate-x-2 group-hover:translate-x-0 opacity-0 group-hover:opacity-100"
              aria-label="Next image"
            >
              &#10095;
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Slider / List */}
      {normalizedImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
          {normalizedImages.map((imgUrl, idx) => (
            <button
              key={idx}
              onMouseEnter={() => setSelectedIndex(idx)}
              onClick={() => setSelectedIndex(idx)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
                selectedIndex === idx
                  ? "border-black shadow-md scale-105"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={imgUrl}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4">
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 text-white text-3xl font-bold bg-white/20 hover:bg-white/40 w-12 h-12 rounded-full flex items-center justify-center transition"
          >
            &times;
          </button>

          {normalizedImages.length > 1 && (
            <button
              onClick={handlePrev}
              className="absolute left-6 top-1/2 -translate-y-1/2 text-white text-3xl bg-white/20 hover:bg-white/40 w-14 h-14 rounded-full flex items-center justify-center transition"
            >
              &#10094;
            </button>
          )}

          <img
            src={activeImage}
            alt="Fullscreen view"
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
          />

          {normalizedImages.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-white text-3xl bg-white/20 hover:bg-white/40 w-14 h-14 rounded-full flex items-center justify-center transition"
            >
              &#10095;
            </button>
          )}

          <div className="absolute bottom-6 text-white text-sm bg-black/60 px-4 py-2 rounded-full">
            {selectedIndex + 1} / {normalizedImages.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
