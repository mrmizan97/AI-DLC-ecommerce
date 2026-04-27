"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Edit2, Trash2, Search, X, Filter, Tag } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Pagination from "@/components/Pagination";

const EMPTY_FORM = {
  code: "",
  type: "percentage",
  value: "",
  min_order_amount: "",
  max_uses: "",
  is_active: true,
  expires_at: "",
};

export default function AdminCouponsPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterActive, setFilterActive] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  useEffect(() => {
    if (user && user.role !== "admin") router.push("/");
  }, [user, router]);

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, filterActive, page, limit]);

  async function fetchItems() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (filterType) params.append("type", filterType);
      if (filterActive !== "") params.append("is_active", filterActive);
      params.append("page", page);
      params.append("limit", limit);
      const r = await api.get(`/coupons?${params.toString()}`);
      setItems(r.data.data || []);
      setPagination(r.data.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(item) {
    setEditItem(item);
    setForm({
      code: item.code || "",
      type: item.type || "percentage",
      value: item.value ?? "",
      min_order_amount: item.min_order_amount ?? "",
      max_uses: item.max_uses ?? "",
      is_active: item.is_active ?? true,
      expires_at: item.expires_at ? item.expires_at.slice(0, 16) : "",
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: parseFloat(form.value),
        min_order_amount: form.min_order_amount !== "" ? parseFloat(form.min_order_amount) : null,
        max_uses: form.max_uses !== "" ? parseInt(form.max_uses) : null,
        is_active: form.is_active,
        expires_at: form.expires_at || null,
      };
      if (editItem) {
        await api.put(`/coupons/${editItem.id}`, payload);
        toast.success("Coupon updated");
      } else {
        await api.post("/coupons", payload);
        toast.success("Coupon created");
      }
      setShowModal(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save coupon");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this coupon?")) return;
    try {
      await api.delete(`/coupons/${id}`);
      toast.success("Coupon deleted");
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    fetchItems();
  }

  const activeFilterCount = [search, filterType, filterActive !== "" ? filterActive : ""].filter(Boolean).length;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
        <button
          onClick={openCreate}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-2 text-sm font-medium"
        >
          <Plus size={18} /> Add Coupon
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-lg border shadow p-3 mb-4 flex flex-wrap gap-2 items-center">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm"
            />
          </div>
          <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600">
            Search
          </button>
        </form>
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Types</option>
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed</option>
        </select>
        <select
          value={filterActive}
          onChange={(e) => { setFilterActive(e.target.value); setPage(1); }}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        {activeFilterCount > 0 && (
          <button
            onClick={() => { setSearch(""); setFilterType(""); setFilterActive(""); setPage(1); }}
            className="border rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 flex items-center gap-1"
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="p-3">Code</th>
                <th className="p-3">Type</th>
                <th className="p-3">Value</th>
                <th className="p-3">Min Order</th>
                <th className="p-3">Used / Max</th>
                <th className="p-3">Active</th>
                <th className="p-3">Expires At</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="p-8 text-center text-gray-400">Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    <Tag size={36} className="mx-auto mb-2 opacity-30" />
                    <p>No coupons found.</p>
                  </td>
                </tr>
              ) : items.map((item, idx) => (
                <tr key={item.id} className={`border-t ${idx % 2 === 1 ? "even:bg-gray-50" : ""}`}>
                  <td className="p-3">
                    <span className="font-mono font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                      {item.code}
                    </span>
                  </td>
                  <td className="p-3 capitalize">{item.type}</td>
                  <td className="p-3 font-medium">
                    {item.type === "percentage" ? `${item.value}%` : `$${parseFloat(item.value).toFixed(2)}`}
                  </td>
                  <td className="p-3">
                    {item.min_order_amount != null ? `$${parseFloat(item.min_order_amount).toFixed(2)}` : "—"}
                  </td>
                  <td className="p-3">
                    {item.used_count ?? 0} / {item.max_uses ?? "∞"}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {item.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500 whitespace-nowrap">
                    {item.expires_at ? new Date(item.expires_at).toLocaleString() : "—"}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="font-bold text-lg">{editItem ? "Edit Coupon" : "New Coupon"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                <input
                  required
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. SAVE20"
                  className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select
                  required
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value * {form.type === "percentage" ? "(%)" : "($)"}
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  step={form.type === "percentage" ? "1" : "0.01"}
                  max={form.type === "percentage" ? "100" : undefined}
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Amount ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.min_order_amount}
                  onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
                  placeholder="Optional"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses</label>
                <input
                  type="number"
                  min="1"
                  value={form.max_uses}
                  onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                  placeholder="Leave empty for unlimited"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
                <input
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
                <span className="text-sm font-medium text-gray-700">Active</span>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-orange-500 text-white font-semibold py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                {submitting ? "Saving…" : editItem ? "Update Coupon" : "Create Coupon"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
