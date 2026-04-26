"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import StarRating from "@/components/StarRating";

export default function ProductReviews({ productId }) {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ average: 0, count: 0, review_count: 0 });
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .get(`/products/${productId}/reviews`)
      .then((r) => {
        setReviews(r.data.data || []);
        setStats(r.data.stats || { average: 0, count: 0, review_count: 0 });
      })
      .catch(() => toast.error("Failed to load reviews"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!productId) return;

    api
      .get(`/products/${productId}/reviews`)
      .then((r) => {
        setReviews(r.data.data || []);
        setStats(r.data.stats || { average: 0, count: 0, review_count: 0 });
      })
      .catch(() => toast.error("Failed to load reviews"))
      .finally(() => setLoading(false));
  }, [productId]);

  const alreadyReviewed = user && reviews.some((r) => r.user_id === user.id);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedComment = comment.trim();
    if (!rating && !trimmedComment) {
      return toast.error("Add a rating or write a review");
    }

    const payload = {};
    if (rating) payload.rating = rating;
    if (trimmedComment) payload.comment = trimmedComment;

    setSubmitting(true);
    try {
      if (editingReviewId) {
        await api.put(`/reviews/${editingReviewId}`, payload);
        toast.success("Review updated");
      } else {
        await api.post(`/products/${productId}/reviews`, payload);
        toast.success("Review added");
      }
      setRating(0);
      setComment("");
      setEditingReviewId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this review?")) return;
    try {
      await api.delete(`/reviews/${id}`);
      toast.success("Review deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete review");
    }
  };

  const startEdit = (review) => {
    setEditingReviewId(review.id);
    setRating(review.rating || 0);
    setComment(review.comment || "");
  };

  return (
    <div className="bg-white rounded-lg p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Reviews</h2>
        <div className="flex items-center gap-2">
          <StarRating value={stats.average} size={18} showValue />
          <span className="text-sm text-gray-500">
            {(stats.review_count ?? reviews.length)} review{(stats.review_count ?? reviews.length) === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {token && (!alreadyReviewed || editingReviewId) && (
        <form onSubmit={handleSubmit} className="border rounded p-4 mb-6 bg-gray-50">
          <p className="text-sm font-medium text-gray-700 mb-2">
            {editingReviewId ? "Edit your review" : "Write a review"}
          </p>
          <div className="mb-3">
            <StarRating value={rating} onChange={setRating} size={24} readOnly={false} />
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product..."
            rows={3}
            className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="mt-3 flex justify-end">
            {editingReviewId && (
              <button
                type="button"
                onClick={() => {
                  setEditingReviewId(null);
                  setRating(0);
                  setComment("");
                }}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm font-medium mr-2 hover:bg-gray-100"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary text-white px-4 py-2 rounded text-sm font-medium hover:bg-primary-dark disabled:opacity-50"
            >
              {submitting ? "Submitting..." : editingReviewId ? "Update review" : "Post review"}
            </button>
          </div>
        </form>
      )}

      {token && alreadyReviewed && !editingReviewId && (
        <p className="text-sm text-gray-500 mb-4">
          You already submitted a review. Use the edit icon to update it.
        </p>
      )}

      {!token && (
        <p className="text-sm text-gray-500 mb-4">
          <a href="/login" className="text-primary underline">
            Log in
          </a>{" "}
          to write a review.
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">
          No reviews yet. Be the first to review this product.
        </p>
      ) : (
        <ul className="divide-y">
          {reviews.map((r) => {
            const canEdit = user && (user.id === r.user_id || user.role === "admin");
            const canDelete = user?.role === "admin";

            return (
              <li key={r.id} className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 text-sm">{r.user?.name || "Anonymous"}</span>
                      {r.rating ? (
                        <StarRating value={r.rating} size={14} />
                      ) : (
                        <span className="text-xs text-gray-400">No rating</span>
                      )}

                      <span className="text-xs text-gray-400">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {r.comment ? (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.comment}</p>
                    ) : null}
                  </div>

                  {(canEdit || canDelete) && (
                    <div className="flex items-center gap-1">
                      {canEdit && (
                        <button
                          onClick={() => startEdit(r)}
                          className="text-gray-400 hover:text-blue-600"
                          title="Edit review"
                        >
                          <Pencil size={16} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="text-gray-400 hover:text-red-600"
                          title="Delete review"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
