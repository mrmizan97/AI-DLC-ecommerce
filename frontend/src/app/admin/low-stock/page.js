"use client";

import { useState, useEffect, useRef } from "react";
import { AlertTriangle, CheckCircle, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Pagination from "@/components/Pagination";

export default function AdminLowStockPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);
  const [resolvingId, setResolvingId] = useState(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  useEffect(() => {
    if (user && user.role !== "admin") router.push("/");
  }, [user, router]);

  const lastKey = useRef(null);
  useEffect(() => {
    const key = `${showResolved}|${page}|${limit}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResolved, page, limit]);

  async function fetchItems() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("show_resolved", showResolved ? "true" : "false");
      params.append("page", page);
      params.append("limit", limit);
      const r = await api.get(`/low-stock?${params.toString()}`);
      setItems(r.data.data || []);
      setPagination(r.data.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load low stock alerts");
    } finally {
      setLoading(false);
    }
  }

  async function handleResolve(id) {
    if (!confirm("Mark this alert as resolved?")) return;
    setResolvingId(id);
    try {
      await api.patch(`/low-stock/${id}/resolve`);
      toast.success("Alert resolved");
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resolve");
    } finally {
      setResolvingId(null);
    }
  }

  function rowClass(item) {
    if (item.resolved) return "opacity-50";
    const stock = item.current_stock ?? item.product?.stock ?? null;
    if (stock === 0) return "bg-red-50";
    if (stock !== null && stock <= 5) return "bg-yellow-50";
    return "";
  }

  function stockBadge(item) {
    const stock = item.current_stock ?? item.product?.stock ?? null;
    if (stock === null) return <span className="text-gray-400">—</span>;
    if (stock === 0) return <span className="font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full text-xs">Out of stock</span>;
    if (stock <= 5) return <span className="font-bold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full text-xs">{stock} left</span>;
    return <span className="text-gray-700">{stock}</span>;
  }

  const unresolvedCount = items.filter((i) => !i.resolved).length;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle size={22} className="text-orange-500" /> Low Stock Alerts
          </h1>
          {!showResolved && unresolvedCount > 0 && (
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
              {unresolvedCount} unresolved
            </span>
          )}
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => { setShowResolved(e.target.checked); setPage(1); }}
            className="w-4 h-4 accent-orange-500"
          />
          Show resolved
        </label>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-100 border border-red-300 inline-block"></span> Out of stock
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300 inline-block"></span> Stock ≤ 5
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-white border inline-block"></span> Normal
        </span>
      </div>

      <div className="bg-white rounded-lg border shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="p-3">Product Name</th>
                <th className="p-3">Current Stock</th>
                <th className="p-3">Threshold</th>
                <th className="p-3">Alert Sent</th>
                <th className="p-3">Resolved</th>
                <th className="p-3">Created At</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-400">Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    <CheckCircle size={36} className="mx-auto mb-2 text-green-300" />
                    <p>{showResolved ? "No alerts found." : "No unresolved low stock alerts."}</p>
                  </td>
                </tr>
              ) : items.map((item, idx) => (
                <tr key={item.id} className={`border-t transition-colors ${rowClass(item)} ${!item.resolved && idx % 2 === 1 && !(item.current_stock === 0 || item.current_stock <= 5) ? "bg-gray-50" : ""}`}>
                  <td className="p-3 font-medium">
                    {item.product?.name || item.product_name || `Product #${item.product_id}`}
                  </td>
                  <td className="p-3">{stockBadge(item)}</td>
                  <td className="p-3 text-gray-500">{item.threshold ?? item.stock_threshold ?? "—"}</td>
                  <td className="p-3">
                    {item.alert_sent ? (
                      <span className="text-green-600 text-xs font-medium">Yes</span>
                    ) : (
                      <span className="text-gray-400 text-xs">No</span>
                    )}
                  </td>
                  <td className="p-3">
                    {item.resolved ? (
                      <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                        <CheckCircle size={14} /> Resolved
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">Pending</span>
                    )}
                  </td>
                  <td className="p-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(item.createdAt || item.created_at).toLocaleString()}
                  </td>
                  <td className="p-3">
                    {!item.resolved ? (
                      <button
                        onClick={() => handleResolve(item.id)}
                        disabled={resolvingId === item.id}
                        className="flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-600 disabled:opacity-50"
                      >
                        <CheckCircle size={13} />
                        {resolvingId === item.id ? "Resolving…" : "Resolve"}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Resolved</span>
                    )}
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
    </div>
  );
}
