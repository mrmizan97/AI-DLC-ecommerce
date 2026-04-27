"use client";

import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart2,
  Search,
  X,
  ShoppingCart,
  Trash2,
  Plus,
} from "lucide-react";
import api from "@/lib/api";
import { useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";

const MAX_COMPARE = 4;

const COMPARE_ROWS = [
  { key: "price", label: "Price", render: (v) => v != null ? `$${parseFloat(v).toFixed(2)}` : "—" },
  { key: "stock", label: "Stock", render: (v) => v != null ? (v === 0 ? "Out of Stock" : `${v} in stock`) : "—" },
  { key: "brand", label: "Brand", render: (v) => v || "—" },
  { key: "category", label: "Category", render: (v) => (v && (v.name || v)) || "—" },
  { key: "rating_average", label: "Rating", render: (v) => v != null ? `${parseFloat(v).toFixed(1)} / 5` : "—" },
  { key: "rating_count", label: "Reviews", render: (v) => v != null ? v : "—" },
  {
    key: "description",
    label: "Description",
    render: (v) => v ? <span className="text-xs text-gray-600 line-clamp-4">{v}</span> : "—",
  },
];

const LS_KEY = "compare_product_ids";

function readLS() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeLS(ids) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(ids));
  } catch {}
}

function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addItem = useCartStore((s) => s.addItem);

  const [products, setProducts] = useState([]);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimer = useRef(null);
  const suggestRef = useRef(null);
  const initialized = useRef(false);

  // Merge IDs from URL params and localStorage
  const getInitialIds = useCallback(() => {
    const urlIds = (searchParams.get("ids") || "")
      .split(",")
      .filter(Boolean)
      .map(Number)
      .filter((n) => !isNaN(n));
    const lsIds = readLS().map(Number).filter((n) => !isNaN(n));
    const merged = [...new Set([...urlIds, ...lsIds])].slice(0, MAX_COMPARE);
    return merged;
  }, [searchParams]);

  const fetchProducts = useCallback(async (ids) => {
    if (!ids.length) {
      setProducts([]);
      return;
    }
    setLoadingCompare(true);
    try {
      const r = await api.post("/compare", { product_ids: ids });
      const fetched = r.data.data || [];
      // Preserve order matching ids
      const ordered = ids
        .map((id) => fetched.find((p) => p.id === id))
        .filter(Boolean);
      setProducts(ordered);
    } catch {
      toast.error("Failed to load comparison data");
    } finally {
      setLoadingCompare(false);
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const ids = getInitialIds();
    writeLS(ids);
    fetchProducts(ids);
  }, [getInitialIds, fetchProducts]);

  // Autocomplete search
  useEffect(() => {
    if (!searchQ.trim()) {
      setSuggestions([]);
      return;
    }
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await api.get(`/search/autocomplete?q=${encodeURIComponent(searchQ)}`);
        setSuggestions(r.data.data || []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [searchQ]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addProduct = (product) => {
    if (products.length >= MAX_COMPARE) {
      toast.error(`You can compare up to ${MAX_COMPARE} products`);
      return;
    }
    if (products.find((p) => p.id === product.id)) {
      toast.error("Product already in comparison");
      return;
    }
    const newList = [...products, product];
    setProducts(newList);
    const ids = newList.map((p) => p.id);
    writeLS(ids);
    setSearchQ("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const removeProduct = (productId) => {
    const newList = products.filter((p) => p.id !== productId);
    setProducts(newList);
    writeLS(newList.map((p) => p.id));
  };

  const clearAll = () => {
    setProducts([]);
    writeLS([]);
    router.replace("/compare");
  };

  const handleAddToCart = (product) => {
    addItem(product);
    toast.success(`${product.name} added to cart`);
  };

  const canAddMore = products.length < MAX_COMPARE;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <BarChart2 size={26} style={{ color: "var(--primary)" }} />
          <h1 className="text-2xl font-bold text-gray-900">Compare Products</h1>
          {products.length > 0 && (
            <span className="bg-orange-100 text-orange-700 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {products.length}/{MAX_COMPARE}
            </span>
          )}
        </div>
        {products.length > 0 && (
          <button
            onClick={clearAll}
            className="flex items-center gap-2 text-sm text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition"
          >
            <Trash2 size={15} />
            Clear All
          </button>
        )}
      </div>

      {/* Search */}
      {canAddMore && (
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm" ref={suggestRef}>
          <p className="text-sm text-gray-600 mb-2 font-medium">
            Add a product to compare ({MAX_COMPARE - products.length} slot{MAX_COMPARE - products.length !== 1 ? "s" : ""} left)
          </p>
          <div className="relative">
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-300 focus-within:border-transparent">
              <span className="pl-3 text-gray-400">
                {searching ? (
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search size={18} />
                )}
              </span>
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Search products to add…"
                className="flex-1 px-3 py-2.5 text-sm outline-none"
              />
              {searchQ && (
                <button
                  onClick={() => { setSearchQ(""); setSuggestions([]); }}
                  className="pr-3 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-30 mt-1 max-h-60 overflow-y-auto">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => addProduct(s)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-orange-50 text-left border-b last:border-0 transition"
                  >
                    {s.image_url ? (
                      <img src={s.image_url} alt={s.name} className="w-9 h-9 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-sm flex-shrink-0">
                        {s.name?.[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                      <p className="text-xs text-primary font-semibold">
                        ${parseFloat(s.price || 0).toFixed(2)}
                      </p>
                    </div>
                    <Plus size={16} className="text-gray-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {showSuggestions && searchQ && !searching && suggestions.length === 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-30 mt-1 p-4 text-center text-sm text-gray-500">
                No products found for &quot;{searchQ}&quot;
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading */}
      {loadingCompare && (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <div className="w-8 h-8 border-4 border-orange-300 border-t-primary rounded-full animate-spin mr-3" />
          Loading comparison…
        </div>
      )}

      {/* Empty state */}
      {!loadingCompare && products.length === 0 && (
        <div className="bg-white rounded-xl p-16 text-center">
          <BarChart2 size={64} className="mx-auto text-gray-200 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            No products selected
          </h2>
          <p className="text-gray-500 mb-6">
            Search and add up to {MAX_COMPARE} products to compare them side by side.
          </p>
          <Link
            href="/products"
            className="inline-block bg-primary text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-primary-dark transition"
          >
            Browse Products
          </Link>
        </div>
      )}

      {/* Comparison table */}
      {!loadingCompare && products.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white rounded-xl shadow-sm overflow-hidden">
            <thead>
              <tr>
                {/* Row label column */}
                <th className="w-32 bg-gray-50 border-b border-r border-gray-100" />
                {products.map((product) => (
                  <th key={product.id} className="border-b border-gray-100 p-4 text-center min-w-[200px]">
                    <div className="flex flex-col items-center gap-2">
                      {/* Remove button */}
                      <button
                        onClick={() => removeProduct(product.id)}
                        className="self-end text-gray-400 hover:text-red-500 transition"
                        title="Remove from comparison"
                      >
                        <X size={18} />
                      </button>

                      {/* Image */}
                      <Link href={`/products/${product.id}`}>
                        <div className="w-28 h-28 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 mx-auto">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover hover:scale-105 transition"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl font-bold">
                              {product.name?.[0]}
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Name */}
                      <Link
                        href={`/products/${product.id}`}
                        className="text-sm font-semibold text-gray-800 hover:text-primary line-clamp-2 text-center"
                      >
                        {product.name}
                      </Link>

                      {/* Add to cart */}
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock === 0}
                        className="w-full flex items-center justify-center gap-1.5 bg-primary text-white text-xs font-semibold py-2 rounded-lg hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                      >
                        <ShoppingCart size={14} />
                        {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {COMPARE_ROWS.map((row, idx) => (
                <tr
                  key={row.key}
                  className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/60"}
                >
                  <td className="px-4 py-3 text-sm font-semibold text-gray-600 border-r border-gray-100 bg-gray-50 w-32">
                    {row.label}
                  </td>
                  {products.map((product) => {
                    const val = product[row.key];
                    const rendered = row.render ? row.render(val) : (val ?? "—");
                    const isPrice = row.key === "price";
                    return (
                      <td
                        key={product.id}
                        className={`px-4 py-3 text-sm text-center ${
                          isPrice ? "text-primary font-bold text-base" : "text-gray-700"
                        }`}
                      >
                        {rendered}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-400">Loading…</div>}>
      <CompareContent />
    </Suspense>
  );
}
