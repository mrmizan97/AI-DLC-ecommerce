"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Plus, X, FileText, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-purple-100 text-purple-800",
  cancelled: "bg-gray-100 text-gray-600",
};

const EMPTY_FORM = { order_id: "", reason: "" };

export default function ReturnsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s._hydrated);

  const [returns, setReturns] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const fetched = useRef(false);

  const fetchReturns = () =>
    api
      .get("/returns/mine")
      .then((r) => setReturns(r.data.data || []))
      .catch(() => toast.error("Failed to load return requests"));

  const fetchOrders = () =>
    api
      .get("/orders?status=delivered")
      .then((r) => {
        const data = r.data.data || [];
        // Filter delivered orders (in case API doesn't honour status param)
        setOrders(data.filter((o) => o.status === "delivered"));
      })
      .catch(() => {});

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (fetched.current) return;
    fetched.current = true;

    Promise.all([
      api.get("/returns/mine").then((r) => setReturns(r.data.data || [])),
      api.get("/orders").then((r) => {
        const data = r.data.data || [];
        setOrders(data.filter((o) => o.status === "delivered"));
      }),
    ])
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user) return null;

  const openModal = () => {
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(EMPTY_FORM);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.order_id) {
      toast.error("Please select an order");
      return;
    }
    if (!form.reason.trim() || form.reason.trim().length < 10) {
      toast.error("Please provide a reason (at least 10 characters)");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/returns", {
        order_id: parseInt(form.order_id),
        reason: form.reason.trim(),
      });
      toast.success("Return request submitted successfully");
      closeModal();
      fetchReturns();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit return request");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <RotateCcw size={26} style={{ color: "var(--primary)" }} />
          <h1 className="text-2xl font-bold text-gray-900">Return Requests</h1>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 bg-primary text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-primary-dark transition"
        >
          <Plus size={18} />
          New Return Request
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-32 animate-pulse" />
          ))}
        </div>
      ) : returns.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center">
          <FileText size={64} className="mx-auto text-gray-200 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No return requests</h2>
          <p className="text-gray-500 mb-6">
            If you need to return a delivered order, click the button above.
          </p>
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-primary-dark transition"
          >
            <Plus size={18} />
            New Return Request
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {returns.map((ret) => (
            <div key={ret.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-semibold text-gray-900">
                      Order #{ret.order?.order_number || ret.order_id}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        STATUS_STYLES[ret.status] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {ret.status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 mb-1">
                    <span className="font-medium text-gray-500">Reason: </span>
                    {ret.reason}
                  </p>

                  {ret.refund_amount != null && (
                    <p className="text-sm text-gray-700 mb-1">
                      <span className="font-medium text-gray-500">Refund Amount: </span>
                      <span className="text-green-700 font-semibold">
                        ${parseFloat(ret.refund_amount).toFixed(2)}
                      </span>
                    </p>
                  )}

                  {ret.admin_note && (
                    <div className="flex items-start gap-1.5 mt-2 bg-blue-50 rounded-lg p-2.5">
                      <AlertCircle size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-800">
                        <span className="font-semibold">Admin note: </span>
                        {ret.admin_note}
                      </p>
                    </div>
                  )}
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-400">
                    Submitted {formatDate(ret.created_at || ret.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-bold text-gray-900">New Return Request</h2>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Order select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Select Order <span className="text-red-500">*</span>
                </label>
                {orders.length === 0 ? (
                  <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center text-sm text-gray-500">
                    No delivered orders found.{" "}
                    <span className="text-gray-400 text-xs">
                      (Only delivered orders are eligible for returns)
                    </span>
                  </div>
                ) : (
                  <select
                    name="order_id"
                    value={form.order_id}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                    required
                  >
                    <option value="">-- Select a delivered order --</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        Order #{o.order_number || o.id} — $
                        {parseFloat(o.total_amount || 0).toFixed(2)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Reason for Return <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  placeholder="Describe why you want to return this order…"
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                  required
                  minLength={10}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {form.reason.length} characters (min 10)
                </p>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || orders.length === 0}
                  className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark disabled:opacity-60 transition flex items-center justify-center gap-2"
                >
                  {submitting && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
