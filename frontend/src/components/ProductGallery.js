"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ProductGallery({ images = [], alt = "Product" }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState({ active: false, x: 50, y: 50 });
  const imgRef = useRef(null);

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded flex items-center justify-center text-gray-400 text-8xl">
        {alt[0]}
      </div>
    );
  }

  const next = () => setIndex((i) => (i + 1) % images.length);
  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);

  const handleMouseMove = (e) => {
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoom({ active: true, x, y });
  };

  return (
    <div>
      <div
        ref={imgRef}
        onMouseEnter={() => setZoom((z) => ({ ...z, active: true }))}
        onMouseLeave={() => setZoom((z) => ({ ...z, active: false }))}
        onMouseMove={handleMouseMove}
        className="relative aspect-square bg-gray-100 rounded overflow-hidden cursor-zoom-in"
      >
        <img
          src={images[index]}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-100 ease-out"
          style={{
            transform: zoom.active ? "scale(2)" : "scale(1)",
            transformOrigin: `${zoom.x}% ${zoom.y}%`,
          }}
        />
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute top-1/2 -translate-y-1/2 left-2 bg-white/80 hover:bg-white rounded-full p-2 shadow z-10"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              className="absolute top-1/2 -translate-y-1/2 right-2 bg-white/80 hover:bg-white rounded-full p-2 shadow z-10"
            >
              <ChevronRight size={18} />
            </button>
            <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded z-10">
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2 mt-3">
          {images.slice(0, 5).map((src, i) => (
            <button
              key={src + i}
              onClick={() => setIndex(i)}
              className={`aspect-square rounded overflow-hidden border-2 ${
                i === index ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
