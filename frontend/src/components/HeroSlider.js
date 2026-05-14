"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

export default function HeroSlider() {
  const [slides, setSlides] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/sliders/active")
      .then((r) => setSlides(r.data?.data || []))
      .catch(() => setSlides([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [slides.length]);

  if (loading) {
    return <div className="h-56 md:h-72 bg-white rounded-lg mb-8 animate-pulse" />;
  }

  if (slides.length === 0) {
    return (
      <section className="bg-gradient-to-r from-primary to-orange-400 rounded-lg p-8 md:p-12 text-white mb-8">
        <h1 className="text-3xl md:text-5xl font-bold mb-2">Welcome to AI-DLC Shop</h1>
        <p className="text-lg md:text-xl mb-4 opacity-90">Browse the latest deals</p>
        <Link href="/products" className="inline-block bg-white text-primary font-semibold px-6 py-2 rounded hover:bg-gray-100">
          Shop Now
        </Link>
      </section>
    );
  }

  const slide = slides[index];

  return (
    <section className="relative rounded-lg overflow-hidden mb-8 h-56 md:h-72">
      <img
        src={slide.image_url}
        alt={slide.title}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 h-full flex flex-col justify-center p-6 md:p-12 text-white">
        <h1 className="text-2xl md:text-4xl font-bold mb-2">{slide.title}</h1>
        {slide.subtitle && (
          <p className="text-base md:text-lg mb-4 opacity-90">{slide.subtitle}</p>
        )}
        {slide.cta_text && slide.cta_link && (
          <Link
            href={slide.cta_link}
            className="inline-block w-fit bg-white text-primary font-semibold px-6 py-2 rounded hover:bg-gray-100"
          >
            {slide.cta_text}
          </Link>
        )}
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`w-2.5 h-2.5 rounded-full transition ${
                i === index ? "bg-white" : "bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
