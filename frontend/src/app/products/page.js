"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import ProductCard from "@/components/ProductCard";

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const initialCats = (searchParams.get("category_ids") || searchParams.get("category_id") || "")
    .split(",")
    .filter(Boolean)
    .map(String);
  const initialTags = (searchParams.get("tag_ids") || "").split(",").filter(Boolean).map(String);

  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    category_ids: initialCats,
    tag_ids: initialTags,
    min_price: searchParams.get("min_price") || "",
    max_price: searchParams.get("max_price") || "",
    sort_by: searchParams.get("sort_by") || "created_at",
    sort_order: searchParams.get("sort_order") || "DESC",
    page: parseInt(searchParams.get("page") || "1"),
  });

  useEffect(() => {
    Promise.all([api.get("/categories"), api.get("/tags")]).then(([c, t]) => {
      setCategories(c.data.data || []);
      setTags(t.data.data || []);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.category_ids.length > 0) params.append("category_ids", filters.category_ids.join(","));
    if (filters.tag_ids.length > 0) params.append("tag_ids", filters.tag_ids.join(","));
    if (filters.min_price) params.append("min_price", filters.min_price);
    if (filters.max_price) params.append("max_price", filters.max_price);
    params.append("sort_by", filters.sort_by);
    params.append("sort_order", filters.sort_order);
    params.append("page", filters.page);
    params.append("limit", "12");

    api
      .get(`/products?${params.toString()}`)
      .then((r) => {
        setProducts(r.data.data || []);
        setPagination(r.data.pagination || {});
      })
      .finally(() => setLoading(false));
  }, [filters]);

  const updateFilter = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const toggleArrayFilter = (key, id) => {
    const current = filters[key];
    const next = current.includes(id)
      ? current.filter((i) => i !== id)
      : [...current, id];
    setFilters({ ...filters, [key]: next, page: 1 });
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      category_ids: [],
      tag_ids: [],
      min_price: "",
      max_price: "",
      sort_by: "created_at",
      sort_order: "DESC",
      page: 1,
    });
    router.push("/products");
  };

  const activeCount =
    (filters.search ? 1 : 0) +
    filters.category_ids.length +
    filters.tag_ids.length +
    (filters.min_price ? 1 : 0) +
    (filters.max_price ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="bg-white rounded-lg p-4 h-fit lg:sticky lg:top-24">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">
              Filters {activeCount > 0 && <span className="text-primary text-sm font-normal">({activeCount})</span>}
            </h3>
            <button onClick={clearFilters} className="text-primary text-sm hover:underline">
              Clear All
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categories {filters.category_ids.length > 0 && <span className="text-gray-400 font-normal">({filters.category_ids.length})</span>}
            </label>
            {categories.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No categories</p>
            ) : (
              <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
                {categories.map((c) => {
                  const id = String(c.id);
                  const checked = filters.category_ids.includes(id);
                  return (
                    <label key={c.id} className="flex items-center gap-2 cursor-pointer text-sm hover:bg-gray-50 px-1 py-0.5 rounded">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleArrayFilter("category_ids", id)}
                        className="accent-primary"
                      />
                      <span className="text-gray-700">{c.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags {filters.tag_ids.length > 0 && <span className="text-gray-400 font-normal">({filters.tag_ids.length})</span>}
            </label>
            {tags.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No tags</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => {
                  const id = String(t.id);
                  const checked = filters.tag_ids.includes(id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleArrayFilter("tag_ids", id)}
                      className={`px-3 py-1 rounded-full text-xs transition ${
                        checked ? "bg-primary text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.min_price}
                onChange={(e) => updateFilter("min_price", e.target.value)}
                className="w-1/2 border rounded px-2 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.max_price}
                onChange={(e) => updateFilter("max_price", e.target.value)}
                className="w-1/2 border rounded px-2 py-2 text-sm"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={`${filters.sort_by}:${filters.sort_order}`}
              onChange={(e) => {
                const [sort_by, sort_order] = e.target.value.split(":");
                setFilters({ ...filters, sort_by, sort_order, page: 1 });
              }}
              className="w-full border rounded px-3 py-2 text-sm"
            >
              <option value="created_at:DESC">Newest</option>
              <option value="price:ASC">Price: Low to High</option>
              <option value="price:DESC">Price: High to Low</option>
              <option value="name:ASC">Name: A-Z</option>
            </select>
          </div>
        </aside>

        <div className="lg:col-span-3">
          {filters.search && (
            <p className="mb-4 text-gray-700">
              Results for &quot;<span className="font-semibold">{filters.search}</span>&quot;
            </p>
          )}

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white h-72 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center text-gray-500">
              No products found. Try adjusting your filters.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    disabled={pagination.page === 1}
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    className="px-4 py-2 bg-white rounded disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="px-4 py-2">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    className="px-4 py-2 bg-white rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
