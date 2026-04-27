"use client";

import { useState, useEffect, useRef } from "react";
import { Eye, X, RefreshCw, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Pagination from "@/components/Pagination";

const STATUS_OPTIONS = ["pending", "approved", "rejected", "refunded"];

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  refunded: "bg-green-100 text-green-800",
};

export default function AdminReturnsPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [reviewing, setReviewing] = useState(null);
  const [reviewForm, setReviewForm] = useState({ status: "", admin_note: "", refund_amount: "" });
  const [submitting, setSubmitting] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  useEffect(() => {
    if (user && user.role !== "admin") router.push("/");
  }, [user, router]);

  const lastKey = useRef(null);
  useEffect(() => {
    const key = `${statusFilter}|${page}|${limit}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page, limit]);

  async function fetchItems() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      params.append("page", page);
      params.append("limit", limit);
      const r = await api.get(`/returns?${params.toString()}`);
      setItems(r.data.data || []);
      setPagination(r.data.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load returns");
    } finally {
      setLoading(false);
    }
  }

  function openReview(item) {
    setReviewing(item);
    setReviewForm({
      status: item.status || "pending",
      admin_note: item.admin_note || "",
      refund_amount: item.refund_amount ?? "",
    });
  }

  async function handleReviewSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        status: reviewForm.status,
        admin_note: reviewForm.admin_note.trim() || null,
        refund_amount: reviewForm.refund_amount !== "" ? parseFloat(reviewForm.refund_amount) : null,
      };
      await api.put(`/returns/${reviewing.id}`, payload);
      toast.success("Return request updated");
      setReviewing(null);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <RotateCcw size={22} className="text-orange-500" /> Return Requests
        </h1>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg border shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="p-3">Order #</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Status</th>
                <th className="p-3">Refund Amount</th>
                <th className="p-3">Date</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-400">Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    <RotateCcw size={36} className="mx-auto mb-2 opacity-30" />
                    <p>No return requests found.</p>
                  </td>
                </tr>
              ) : items.map((item, idx) => (
                <tr
                  key={item.id}
                  className={`border-t cursor-pointer hover:bg-orange-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50" : ""}`}
                  onClick={() => openReview(item)}
                >
                  <td className="p-3 font-medium text-orange-600">
                    #{item.order?.order_number || item.order_id}
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{item.user?.name || "—"}</div>
                    <div className="text-xs text-gray-500">{item.user?.email}</div>
                  </td>
                  <td className="p-3 max-w-[200px]">
                    <p className="truncate text-gray-700" title={item.reason}>
                      {item.reason || "—"}
                    </p>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[item.status] || "bg-gray-100 text-gray-600"}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3">
                    {item.refund_amount != null ? `$${parseFloat(item.refund_amount).toFixed(2)}` : "—"}
                  </td>
                  <td className="p-3 text-gray-500 whitespace-nowrap">
                    {new Date(item.createdAt || item.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openReview(item)}
                      className="flex items-center gap-1 text-blue-600 hover:bg-blue-50 px-2 py-1 rounded text-xs font-medium"
                    >
                      <Eye size={14} /> Review
                    </button>
                  </td>
                </tr>
              ))}
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
        onLimitChange={(n) => { setLimit(n); setPage(1); }}
      />

      {/* Review Modal */}
      {reviewing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="font-bold text-lg">
                Return Request — Order #{reviewing.order?.order_number || reviewing.order_id}
              </h2>
              <button onClick={() => setReviewing(null)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-5">
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Customer</h3>
                <p className="text-sm"><span className="text-gray-500">Name:</span> {reviewing.user?.name || "—"}</p>
                <p className="text-sm"><span className="text-gray-500">Email:</span> {reviewing.user?.email || "—"}</p>
              </div>

              {/* Order Details */}
              {reviewing.order && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Order Details</h3>
                  <p className="text-sm"><span className="text-gray-500">Order #:</span> {reviewing.order.order_number || reviewing.order.id}</p>
                  <p className="text-sm"><span className="text-gray-500">Total:</span> ${parseFloat(reviewing.order.total_amount || 0).toFixed(2)}</p>
                  <p className="text-sm"><span className="text-gray-500">Status:</span> {reviewing.order.status}</p>
                  {reviewing.order.items?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Items:</p>
                      {reviewing.order.items.map((item) => (
                        <p key={item.id} className="text-sm">{item.product?.name || "Product"} × {item.quantity}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Full Reason */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Return Reason</h3>
                <p className="text-sm text-gray-700 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
                  {reviewing.reason || "No reason provided"}
                </p>
              </div>

              {/* Status Update Form */}
              <form onSubmit={handleReviewSubmit} className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700">Update Return Status</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                  <select
                    required
                    value={reviewForm.status}
                    onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Refund Amount ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={reviewForm.refund_amount}
                    onChange={(e) => setReviewForm({ ...reviewForm, refund_amount: e.target.value })}
                    placeholder="Optional"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Note</label>
                  <textarea
                    rows={3}
                    value={reviewForm.admin_note}
                    onChange={(e) => setReviewForm({ ...reviewForm, admin_note: e.target.value })}
                    placeholder="Internal note for this decision…"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-orange-500 text-white font-semibold py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
                  >
                    {submitting ? "Saving…" : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewing(null)}
                    className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
