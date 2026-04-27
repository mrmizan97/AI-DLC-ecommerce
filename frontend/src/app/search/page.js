"use client";

import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Sparkles,
  X,
  ShoppingCart,
  Tag,
  DollarSign,
  Grid2x2,
  Loader2,
} from "lucide-react";
import api from "@/lib/api";
import { useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";

// ── Mini product card ──────────────────────────────────────────────
function ProductCard({ product }) {
  const addItem = useCartStore((s) => s.addItem);

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    toast.success(`${product.name} added to cart`);
  };

  const thumb = product.image_url || null;

  return (
    <Link href={`/products/${product.id}`} className="group">
      <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition border border-gray-100 flex flex-col h-full">
        <div className="aspect-square bg-gray-50 overflow-hidden relative">
          {thumb ? (
            <img
              src={thumb}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl font-bold">
              {product.name?.[0] || "?"}
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-red-600 text-white px-3 py-1 rounded text-sm font-medium">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        <div className="p-3 flex flex-col flex-1">
          {product.category && (
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              {product.category?.name || product.category}
            </p>
          )}
          <h3 className="text-sm text-gray-800 line-clamp-2 mb-1 flex-1">
            {product.name}
          </h3>
          {product.brand && (
            <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
          )}
          <div className="flex items-center justify-between mt-2">
            <span className="text-primary font-bold text-lg">
              ${parseFloat(product.price).toFixed(2)}
            </span>
            <button
              onClick={handleAdd}
              disabled={product.stock === 0}
              className="bg-primary hover:bg-primary-dark text-white p-2 rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              title="Add to cart"
            >
              <ShoppingCart size={15} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Detected AI filter pill ───────────────────────────────────────
function FilterPill({ icon, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
      {icon}
      {label}
    </span>
  );
}

// ── Main search content ───────────────────────────────────────────
function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [aiMode, setAiMode] = useState(false);
  const [aiParams, setAiParams] = useState(null); // parsed AI filters
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  // Run search with product params
  const runProductSearch = useCallback(async (params) => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setHasSearched(true);
    try {
      const qs = new URLSearchParams();
      if (params.search) qs.set("search", params.search);
      if (params.min_price) qs.set("min_price", params.min_price);
      if (params.max_price) qs.set("max_price", params.max_price);
      if (params.category_ids) qs.set("category_ids", params.category_ids);
      qs.set("limit", "24");

      const r = await api.get(`/products?${qs.toString()}`, {
        signal: ctrl.signal,
      });
      setProducts(r.data.data || []);
    } catch (err) {
      if (err.name !== "AbortError" && err.name !== "CanceledError") {
        toast.error("Search failed. Please try again.");
        setProducts([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Normal search (no AI)
  const doNormalSearch = useCallback(
    (q) => {
      if (!q.trim()) return;
      setAiParams(null);
      runProductSearch({ search: q.trim() });
    },
    [runProductSearch]
  );

  // AI search
  const doAiSearch = useCallback(
    async (q) => {
      if (!q.trim()) return;
      setAiProcessing(true);
      setAiParams(null);
      setProducts([]);
      setHasSearched(false);
      try {
        const r = await api.post("/ai/search", { query: q.trim() });
        const parsed = r.data.data || r.data || {};
        setAiParams(parsed);
        // Build product search params from AI result
        const productParams = {};
        if (parsed.search_terms) productParams.search = parsed.search_terms;
        if (parsed.min_price) productParams.min_price = parsed.min_price;
        if (parsed.max_price) productParams.max_price = parsed.max_price;
        // category_keywords → search fallback if no search_terms
        if (!productParams.search && parsed.category_keywords) {
          productParams.search = Array.isArray(parsed.category_keywords)
            ? parsed.category_keywords.join(" ")
            : parsed.category_keywords;
        }
        await runProductSearch(productParams);
      } catch (err) {
        toast.error(err.response?.data?.message || "AI search failed. Falling back to normal search.");
        setAiParams(null);
        doNormalSearch(q);
      } finally {
        setAiProcessing(false);
      }
    },
    [runProductSearch, doNormalSearch]
  );

  // On mount — if ?q= present, trigger search
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      doNormalSearch(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    // Update URL
    router.replace(`/search?q=${encodeURIComponent(query.trim())}`);
    if (aiMode) {
      doAiSearch(query);
    } else {
      doNormalSearch(query);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setProducts([]);
    setAiParams(null);
    setHasSearched(false);
    router.replace("/search");
    if (inputRef.current) inputRef.current.focus();
  };

  const isProcessing = loading || aiProcessing;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Search size={24} style={{ color: "var(--primary)" }} />
          Product Search
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Find what you&apos;re looking for — or let AI understand your intent.
        </p>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-orange-300 focus-within:border-transparent">
              <span className="pl-4 text-gray-400">
                {aiProcessing ? (
                  <Loader2 size={18} className="animate-spin" style={{ color: "var(--secondary)" }} />
                ) : (
                  <Search size={18} />
                )}
              </span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  aiMode
                    ? 'Try "wireless headphones under $100" or "red sneakers for running"'
                    : "Search products…"
                }
                className="flex-1 px-3 py-3 text-sm outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="pr-4 text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* AI toggle */}
          <button
            type="button"
            onClick={() => setAiMode((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border transition flex-shrink-0 ${
              aiMode
                ? "border-blue-400 text-white"
                : "border-gray-300 text-gray-600 hover:border-gray-400"
            }`}
            style={aiMode ? { backgroundColor: "var(--secondary)" } : {}}
            title={aiMode ? "AI Search ON — click to disable" : "Enable AI Search"}
          >
            <Sparkles size={16} />
            AI Search
          </button>

          <button
            type="submit"
            disabled={isProcessing || !query.trim()}
            className="bg-primary text-white font-semibold px-6 py-2 rounded-xl hover:bg-primary-dark disabled:opacity-50 transition flex-shrink-0 flex items-center gap-2"
          >
            {isProcessing && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Search
          </button>
        </form>

        {/* AI mode banner */}
        {aiMode && (
          <div
            className="mt-3 flex items-center gap-2 text-xs rounded-lg px-3 py-2"
            style={{ backgroundColor: "#e8f7fd", color: "#1a7a9e" }}
          >
            <Sparkles size={13} />
            <span>
              <strong>AI Search is ON.</strong> Describe what you want in natural language — AI will
              understand your intent and find matching products.
            </span>
          </div>
        )}
      </div>

      {/* AI detected filters */}
      {aiParams && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 mr-1">AI detected:</span>
          {aiParams.search_terms && (
            <FilterPill
              icon={<Tag size={11} />}
              label={`Keywords: ${aiParams.search_terms}`}
            />
          )}
          {(aiParams.min_price || aiParams.max_price) && (
            <FilterPill
              icon={<DollarSign size={11} />}
              label={`Price: ${aiParams.min_price || "0"} – ${aiParams.max_price || "any"}`}
            />
          )}
          {aiParams.category_keywords && (
            <FilterPill
              icon={<Grid2x2 size={11} />}
              label={`Category: ${
                Array.isArray(aiParams.category_keywords)
                  ? aiParams.category_keywords.join(", ")
                  : aiParams.category_keywords
              }`}
            />
          )}
        </div>
      )}

      {/* AI processing spinner */}
      {aiProcessing && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="relative">
            <div
              className="w-14 h-14 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: "var(--secondary)", borderTopColor: "transparent" }}
            />
            <Sparkles
              size={20}
              className="absolute inset-0 m-auto"
              style={{ color: "var(--secondary)" }}
            />
          </div>
          <p className="text-gray-500 text-sm">AI is analysing your query…</p>
        </div>
      )}

      {/* Normal loading */}
      {loading && !aiProcessing && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-72 animate-pulse" />
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && !aiProcessing && hasSearched && (
        <>
          <p className="text-sm text-gray-500 mb-4">
            {products.length === 0
              ? "No products found."
              : `${products.length} product${products.length !== 1 ? "s" : ""} found`}
            {query && (
              <>
                {" "}for{" "}
                <span className="font-semibold text-gray-700">&quot;{query}&quot;</span>
              </>
            )}
          </p>

          {products.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center">
              <Search size={56} className="mx-auto text-gray-200 mb-4" />
              <h2 className="text-lg font-semibold text-gray-700 mb-2">No results found</h2>
              <p className="text-gray-500 text-sm mb-4">
                Try different keywords{aiMode ? " or switch to normal search" : ""}.
              </p>
              {aiMode && (
                <button
                  onClick={() => { setAiMode(false); doNormalSearch(query); }}
                  className="text-sm text-primary hover:underline"
                >
                  Try normal search instead
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Initial / idle state */}
      {!hasSearched && !isProcessing && (
        <div className="text-center py-16 text-gray-400">
          <Search size={56} className="mx-auto mb-4 text-gray-200" />
          <p className="text-base font-medium text-gray-500">
            Enter a search term above to find products
          </p>
          <p className="text-sm mt-1">
            {aiMode
              ? 'Try describing what you want, e.g. "gaming mouse under $50"'
              : "You can also enable AI Search for smarter results"}
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-4 py-16 text-center text-gray-400">
          Loading search…
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
