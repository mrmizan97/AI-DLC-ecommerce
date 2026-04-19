"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import ProductCard from "@/components/ProductCard";

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/categories").then((r) => r.data),
      api.get("/products?limit=12").then((r) => r.data),
    ])
      .then(([cats, prods]) => {
        setCategories(cats.data || []);
        setProducts(prods.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <section className="bg-gradient-to-r from-primary to-orange-400 rounded-lg p-8 md:p-12 text-white mb-8">
        <h1 className="text-3xl md:text-5xl font-bold mb-2">Mega Sale is Live!</h1>
        <p className="text-lg md:text-xl mb-4 opacity-90">Up to 70% off on top brands</p>
        <Link
          href="/products"
          className="inline-block bg-white text-primary font-semibold px-6 py-2 rounded hover:bg-gray-100"
        >
          Shop Now
        </Link>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Shop by Category</h2>
        {loading ? (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-28 bg-white rounded animate-pulse" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-gray-500">No categories yet.</p>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category_id=${cat.id}`}
                className="bg-white rounded-lg p-4 text-center hover:shadow-md transition"
              >
                <div className="w-16 h-16 mx-auto mb-2 bg-orange-100 rounded-full flex items-center justify-center text-2xl">
                  {cat.name[0]}
                </div>
                <p className="text-sm font-medium text-gray-700">{cat.name}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Flash Deals</h2>
          <Link href="/products" className="text-primary hover:underline text-sm">
            View All →
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-white h-72 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-gray-500">No products yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
