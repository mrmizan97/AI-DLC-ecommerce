"use client";

import { useEffect, useRef, useState } from "react";
import { Edit, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import Pagination from "@/components/Pagination";

export default function AdminUsersPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", role: "customer", is_active: true });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.append("role", roleFilter);
      if (search) params.append("search", search);
      params.append("page", page);
      params.append("limit", limit);
      const r = await api.get(`/users?${params.toString()}`);
      setUsers(r.data.data || []);
      setPagination(r.data.pagination || { total: 0, page: 1, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  };

  const lastKey = useRef(null);
  useEffect(() => {
    const key = `${roleFilter}|${page}|${limit}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, page, limit]);

  const openEdit = (u) => {
    setEditing(u);
    setForm({
      name: u.name,
      phone: u.phone || "",
      role: u.role,
      is_active: u.is_active,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${editing.id}`, form);
      toast.success("User updated");
      setEditing(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const handleDelete = async (id) => {
    if (id === currentUser.id) {
      toast.error("You cannot delete your own account");
      return;
    }
    if (!confirm("Delete this user?")) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success("Deleted");
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search name/email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchAll()}
            className="border rounded px-3 py-2 text-sm"
          />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="border rounded px-3 py-2 text-sm">
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="customer">Customer</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Joined</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="p-6 text-center text-gray-400">Loading…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={8} className="p-6 text-center text-gray-400">No users.</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="p-3">{u.id}</td>
                  <td className="p-3 font-medium">{u.name}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3 text-gray-500">{u.phone || "—"}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${u.role === "admin" ? "bg-primary/20 text-primary" : "bg-gray-100 text-gray-700"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500 whitespace-nowrap">{new Date(u.createdAt).toLocaleString()}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(u)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(u.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
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

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-bold text-lg">Edit User</h2>
              <button onClick={() => setEditing(null)} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <p className="text-sm text-gray-500">{editing.email}</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full border rounded px-3 py-2">
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                <span className="text-sm">Active</span>
              </label>
              <button type="submit" className="w-full bg-primary text-white font-semibold py-2 rounded hover:bg-primary-dark">
                Update
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
