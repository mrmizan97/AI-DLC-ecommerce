"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ProductGallery({ images = [], alt = "Product" }) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded flex items-center justify-center text-gray-400 text-8xl">
        {alt[0]}
      </div>
    );
  }

  const next = () => setIndex((i) => (i + 1) % images.length);
  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);

  return (
    <div>
      <div className="relative aspect-square bg-gray-100 rounded overflow-hidden">
        <img src={images[index]} alt={alt} className="w-full h-full object-cover" />
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute top-1/2 -translate-y-1/2 left-2 bg-white/80 hover:bg-white rounded-full p-2 shadow"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              className="absolute top-1/2 -translate-y-1/2 right-2 bg-white/80 hover:bg-white rounded-full p-2 shadow"
            >
              <ChevronRight size={18} />
            </button>
            <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
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
