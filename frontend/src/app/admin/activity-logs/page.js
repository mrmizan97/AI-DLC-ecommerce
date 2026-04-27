"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Activity, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Pagination from "@/components/Pagination";

const ENTITY_TYPES = [
  "Product", "Category", "Tag", "Order", "User",
  "Review", "Coupon", "FlashSale", "Return", "Bulk",
];

export default function AdminActivityLogsPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  const [filters, setFilters] = useState({
    user_search: "",
    action: "",
    entity_type: "",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    if (user && user.role !== "admin") router.push("/");
  }, [user, router]);

  const lastKey = useRef(null);
  useEffect(() => {
    const key = `${filters.action}|${filters.entity_type}|${filters.start_date}|${filters.end_date}|${page}|${limit}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.action, filters.entity_type, filters.start_date, filters.end_date, page, limit]);

  async function fetchLogs() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.user_search.trim()) params.append("user_id", filters.user_search.trim());
      if (filters.action.trim()) params.append("action", filters.action.trim());
      if (filters.entity_type) params.append("entity_type", filters.entity_type);
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);
      params.append("page", page);
      params.append("limit", limit);
      const r = await api.get(`/activity-logs?${params.toString()}`);
      setLogs(r.data.data || []);
      setPagination(r.data.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load logs");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    lastKey.current = null;
    fetchLogs();
  }

  function clearFilters() {
    setFilters({ user_search: "", action: "", entity_type: "", start_date: "", end_date: "" });
    setPage(1);
    lastKey.current = null;
  }

  function actionBadgeColor(action) {
    if (!action) return "bg-gray-100 text-gray-600";
    const a = action.toLowerCase();
    if (a.includes("create") || a.includes("add")) return "bg-green-100 text-green-700";
    if (a.includes("update") || a.includes("edit") || a.includes("patch")) return "bg-blue-100 text-blue-700";
    if (a.includes("delete") || a.includes("remove")) return "bg-red-100 text-red-700";
    if (a.includes("login") || a.includes("auth")) return "bg-purple-100 text-purple-700";
    return "bg-gray-100 text-gray-700";
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Activity size={22} className="text-orange-500" /> Activity Logs
        </h1>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Read-only</span>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="bg-white rounded-lg border shadow p-3 mb-4 flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs text-gray-500 mb-1">User (email/ID)</label>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search user…"
              value={filters.user_search}
              onChange={(e) => setFilters({ ...filters, user_search: e.target.value })}
              className="w-full border rounded-lg pl-8 pr-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="min-w-[140px]">
          <label className="block text-xs text-gray-500 mb-1">Action keyword</label>
          <input
            type="text"
            placeholder="e.g. create, delete…"
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="min-w-[140px]">
          <label className="block text-xs text-gray-500 mb-1">Entity Type</label>
          <select
            value={filters.entity_type}
            onChange={(e) => { setFilters({ ...filters, entity_type: e.target.value }); setPage(1); }}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Types</option>
            {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input
            type="datetime-local"
            value={filters.start_date}
            onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            className="border rounded-lg px-2 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input
            type="datetime-local"
            value={filters.end_date}
            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            className="border rounded-lg px-2 py-2 text-sm"
          />
        </div>
        <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600 self-end">
          Search
        </button>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="border px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 flex items-center gap-1 self-end"
          >
            <X size={14} /> Clear ({activeFilterCount})
          </button>
        )}
      </form>

      {/* Table */}
      <div className="bg-white rounded-lg border shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="p-3 whitespace-nowrap">Timestamp</th>
                <th className="p-3">User</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entity Type</th>
                <th className="p-3">Entity ID</th>
                <th className="p-3">Description</th>
                <th className="p-3">IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-400">Loading…</td></tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    <Activity size={36} className="mx-auto mb-2 opacity-30" />
                    <p>No activity logs found.</p>
                  </td>
                </tr>
              ) : logs.map((log, idx) => (
                <tr key={log.id} className={`border-t ${idx % 2 === 1 ? "bg-gray-50" : ""}`}>
                  <td className="p-3 text-gray-500 whitespace-nowrap text-xs">
                    {new Date(log.createdAt || log.created_at || log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3">
                    {log.user ? (
                      <div>
                        <div className="font-medium text-xs">{log.user.name || "—"}</div>
                        <div className="text-xs text-gray-500">{log.user.email}</div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">{log.user_id || "—"}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${actionBadgeColor(log.action)}`}>
                      {log.action || "—"}
                    </span>
                  </td>
                  <td className="p-3">
                    {log.entity_type ? (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{log.entity_type}</span>
                    ) : "—"}
                  </td>
                  <td className="p-3 text-gray-500 text-xs">{log.entity_id ?? "—"}</td>
                  <td className="p-3 max-w-[240px]">
                    <p className="truncate text-xs text-gray-700" title={log.description}>
                      {log.description || "—"}
                    </p>
                  </td>
                  <td className="p-3 text-gray-500 text-xs font-mono">{log.ip_address || log.ip || "—"}</td>
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
