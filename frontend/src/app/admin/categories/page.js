"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Edit, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

export default function AdminCategoriesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const r = await api.get("/categories");
      setItems(r.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  const fetched = useRef(false);
  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchAll();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "" });
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description || "" });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/categories/${editing.id}`, form);
        toast.success("Updated");
      } else {
        await api.post("/categories", form);
        toast.success("Created");
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this category?")) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success("Deleted");
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <button onClick={openCreate} className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark flex items-center gap-2">
          <Plus size={18} /> Add Category
        </button>
      </div>

      <div className="bg-white rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Name</th>
              <th className="p-3">Description</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-6 text-center text-gray-400">Loading…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={4} className="p-6 text-center text-gray-400">No categories yet.</td></tr>
            ) : items.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3">{c.id}</td>
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 text-gray-500">{c.description || "—"}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(c)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16} /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-bold text-lg">{editing ? "Edit Category" : "New Category"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <button type="submit" className="w-full bg-primary text-white font-semibold py-2 rounded hover:bg-primary-dark">
                {editing ? "Update" : "Create"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
