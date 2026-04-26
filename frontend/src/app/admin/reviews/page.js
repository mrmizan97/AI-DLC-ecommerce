"use client";

import { useEffect, useRef, useState } from "react";
import { Edit, Trash2, X, Filter, Download } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import StarRating from "@/components/StarRating";
import Pagination from "@/components/Pagination";
import { exportToCsv } from "@/lib/exportCsv";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    product_id: "",
    min_rating: "",
    max_rating: "",
    search: "",
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ rating: 0, comment: "" });
  const [savingRating, setSavingRating] = useState(false);
  const [savingComment, setSavingComment] = useState(false);

  const activeFilterCount = Object.values(filters).filter((v) => v !== "").length;

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.product_id) params.append("product_id", filters.product_id);
      if (filters.min_rating) params.append("min_rating", filters.min_rating);
      if (filters.max_rating) params.append("max_rating", filters.max_rating);
      if (filters.search) params.append("search", filters.search);
      params.append("page", page);
      params.append("limit", limit);
      const r = await api.get(`/reviews?${params.toString()}`);
      setReviews(r.data.data || []);
      setPagination(r.data.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const fetchedProducts = useRef(false);
  useEffect(() => {
    if (fetchedProducts.current) return;
    fetchedProducts.current = true;
    api
      .get("/products?limit=500")
      .then((r) => setProducts(r.data.data || []))
      .catch(() => {});
  }, []);

  const lastKey = useRef(null);
  useEffect(() => {
    const key = `${filters.product_id}|${filters.min_rating}|${filters.max_rating}|${filters.search}|${page}|${limit}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.product_id, filters.min_rating, filters.max_rating, filters.search, page, limit]);

  const openEdit = (review) => {
    setEditing(review);
    setForm({ rating: review.rating || 0, comment: review.comment || "" });
  };

  const closeEdit = () => {
    setEditing(null);
    fetchReviews();
  };

  const updateLocalReview = (id, patch) => {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setEditing((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
  };

  const handleUpdateRating = async () => {
    if (!editing) return;
    if (!form.rating) return toast.error("Select a rating");

    setSavingRating(true);
    try {
      const nextRating = parseInt(form.rating, 10);
      await api.put(`/reviews/${editing.id}`, { rating: nextRating });
      updateLocalReview(editing.id, { rating: nextRating });
      toast.success("Rating updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update rating");
    } finally {
      setSavingRating(false);
    }
  };

  const handleClearRating = async () => {
    if (!editing) return;

    setSavingRating(true);
    try {
      await api.put(`/reviews/${editing.id}`, { rating: null });
      setForm((prev) => ({ ...prev, rating: 0 }));
      updateLocalReview(editing.id, { rating: null });
      toast.success("Rating cleared");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to clear rating");
    } finally {
      setSavingRating(false);
    }
  };

  const handleUpdateComment = async () => {
    if (!editing) return;

    setSavingComment(true);
    try {
      const nextComment = form.comment.trim() || null;
      await api.put(`/reviews/${editing.id}`, { comment: nextComment });
      updateLocalReview(editing.id, { comment: nextComment });
      toast.success("Review text updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update review text");
    } finally {
      setSavingComment(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this review?")) return;
    try {
      await api.delete(`/reviews/${id}`);
      toast.success("Review deleted");
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  const clearFilters = () => {
    setFilters({ product_id: "", min_rating: "", max_rating: "", search: "" });
    setPage(1);
  };

  const handleExport = () => {
    if (reviews.length === 0) return toast.error("No reviews to export");
    exportToCsv(
      `reviews-${new Date().toISOString().split("T")[0]}.csv`,
      [
        { label: "ID", value: "id" },
        { label: "Product", value: (r) => r.product?.name || "" },
        { label: "User", value: (r) => r.user?.name || "" },
        { label: "Email", value: (r) => r.user?.email || "" },
        { label: "Rating", value: (r) => r.rating ?? "" },
        { label: "Comment", value: "comment" },
        { label: "Date", value: (r) => new Date(r.created_at).toLocaleString() },
      ],
      reviews
    );
    toast.success(`Exported ${reviews.length} reviews`);
  };

  const renderRatingCell = (rating) => {
    if (!rating) return <span className="text-gray-400 italic">No rating</span>;
    return <StarRating value={rating} size={14} showValue />;
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`border px-4 py-2 rounded text-sm flex items-center gap-2 ${
              showFilters || activeFilterCount > 0
                ? "bg-primary text-white border-primary"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            <Filter size={16} /> Filters
            {activeFilterCount > 0 && (
              <span className="bg-white text-primary rounded-full text-xs w-5 h-5 flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2 text-sm"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-lg p-3 mb-4 flex flex-wrap gap-2 items-center">
          <select
            value={filters.product_id}
            onChange={(e) => setFilters({ ...filters, product_id: e.target.value })}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={filters.min_rating}
            onChange={(e) => setFilters({ ...filters, min_rating: e.target.value })}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">Min rating</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}+
              </option>
            ))}
          </select>
          <select
            value={filters.max_rating}
            onChange={(e) => setFilters({ ...filters, max_rating: e.target.value })}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">Max rating</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search in comments..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && fetchReviews()}
            className="border rounded px-3 py-2 text-sm flex-1 min-w-[200px]"
          />
          <button
            onClick={fetchReviews}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark text-sm"
          >
            Search
          </button>
          <button
            onClick={clearFilters}
            className="border px-4 py-2 rounded hover:bg-gray-50 text-sm"
          >
            Clear
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">User</th>
                <th className="p-3">Rating</th>
                <th className="p-3">Comment</th>
                <th className="p-3">Date</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-400">
                    No reviews found.
                  </td>
                </tr>
              ) : (
                reviews.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-3 font-medium">{r.product?.name || "-"}</td>
                    <td className="p-3">
                      <div>{r.user?.name || "-"}</div>
                      <div className="text-xs text-gray-500">{r.user?.email}</div>
                    </td>
                    <td className="p-3">{renderRatingCell(r.rating)}</td>
                    <td className="p-3 max-w-md">
                      <p className="line-clamp-2 text-gray-700">
                        {r.comment || <span className="text-gray-400 italic">No comment</span>}
                      </p>
                    </td>
                    <td className="p-3 text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(r)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(n) => {
          setLimit(n);
          setPage(1);
        }}
      />

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-bold text-lg">Edit Review</h2>
              <button onClick={closeEdit} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-5">
              <div>
                <p className="text-sm text-gray-500 mb-1">
                  {editing.product?.name} - by {editing.user?.name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Edit rating only</label>
                <StarRating
                  value={form.rating}
                  onChange={(n) => setForm({ ...form, rating: n })}
                  size={24}
                  readOnly={false}
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={handleUpdateRating}
                    disabled={savingRating}
                    className="bg-primary text-white px-4 py-2 rounded text-sm font-semibold hover:bg-primary-dark disabled:opacity-50"
                  >
                    Save rating
                  </button>
                  <button
                    type="button"
                    onClick={handleClearRating}
                    disabled={savingRating}
                    className="border px-4 py-2 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    Clear rating
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Edit review text only</label>
                <textarea
                  rows={4}
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
                <button
                  type="button"
                  onClick={handleUpdateComment}
                  disabled={savingComment}
                  className="mt-2 bg-primary text-white px-4 py-2 rounded text-sm font-semibold hover:bg-primary-dark disabled:opacity-50"
                >
                  Save review text
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
