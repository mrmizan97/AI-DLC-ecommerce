"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, X, Images, ArrowUp, ArrowDown } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

const EMPTY_FORM = {
  title: "",
  subtitle: "",
  image_url: "",
  cta_text: "",
  cta_link: "",
  sort_order: 0,
  is_active: true,
};

export default function AdminSlidersPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    try {
      const r = await api.get("/sliders");
      setItems(r.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load sliders");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditItem(null);
    const nextOrder = items.length
      ? Math.max(...items.map((i) => i.sort_order ?? 0)) + 1
      : 1;
    setForm({ ...EMPTY_FORM, sort_order: nextOrder });
    setShowModal(true);
  }

  function openEdit(item) {
    setEditItem(item);
    setForm({
      title: item.title || "",
      subtitle: item.subtitle || "",
      image_url: item.image_url || "",
      cta_text: item.cta_text || "",
      cta_link: item.cta_link || "",
      sort_order: item.sort_order ?? 0,
      is_active: item.is_active ?? true,
    });
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        image_url: form.image_url.trim(),
        cta_text: form.cta_text.trim() || null,
        cta_link: form.cta_link.trim() || null,
        sort_order: parseInt(form.sort_order, 10) || 0,
        is_active: !!form.is_active,
      };
      if (editItem) {
        await api.put(`/sliders/${editItem.id}`, payload);
        toast.success("Slider updated");
      } else {
        await api.post("/sliders", payload);
        toast.success("Slider created");
      }
      setShowModal(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save slider");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this slider?")) return;
    try {
      await api.delete(`/sliders/${id}`);
      toast.success("Slider deleted");
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  }

  async function toggleActive(item) {
    try {
      await api.put(`/sliders/${item.id}`, { is_active: !item.is_active });
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update");
    }
  }

  async function moveOrder(item, dir) {
    try {
      await api.put(`/sliders/${item.id}`, {
        sort_order: (item.sort_order ?? 0) + (dir === "up" ? -1 : 1),
      });
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reorder");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Homepage Sliders</h1>
        <button
          onClick={openCreate}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-2 text-sm font-medium"
        >
          <Plus size={18} /> Add Slider
        </button>
      </div>

      <div className="bg-white rounded-lg border shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="p-3">Order</th>
                <th className="p-3">Preview</th>
                <th className="p-3">Title</th>
                <th className="p-3">CTA</th>
                <th className="p-3">Active</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    <Images size={36} className="mx-auto mb-2 opacity-30" />
                    <p>No sliders yet. Add one to populate the homepage hero.</p>
                  </td>
                </tr>
              ) : items.map((item, idx) => (
                <tr key={item.id} className={`border-t ${idx % 2 === 1 ? "bg-gray-50" : ""}`}>
                  <td className="p-3 align-top">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{item.sort_order}</span>
                      <div className="flex flex-col">
                        <button
                          onClick={() => moveOrder(item, "up")}
                          className="text-gray-400 hover:text-gray-700"
                          aria-label="Move up"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          onClick={() => moveOrder(item, "down")}
                          className="text-gray-400 hover:text-gray-700"
                          aria-label="Move down"
                        >
                          <ArrowDown size={12} />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 align-top">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-24 h-12 object-cover rounded border"
                      />
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="p-3 align-top">
                    <div className="font-medium text-gray-900">{item.title}</div>
                    {item.subtitle && (
                      <div className="text-xs text-gray-500 mt-0.5">{item.subtitle}</div>
                    )}
                  </td>
                  <td className="p-3 align-top">
                    {item.cta_text ? (
                      <div>
                        <span className="inline-block bg-orange-50 text-orange-700 px-2 py-0.5 rounded text-xs font-medium">
                          {item.cta_text}
                        </span>
                        <div className="text-xs text-gray-400 mt-0.5">{item.cta_link}</div>
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="p-3 align-top">
                    <button
                      onClick={() => toggleActive(item)}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer ${
                        item.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {item.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="p-3 align-top">
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="font-bold text-lg">{editItem ? "Edit Slider" : "New Slider"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  required
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL *</label>
                <input
                  required
                  type="url"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://…"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                {form.image_url && (
                  <img
                    src={form.image_url}
                    alt="preview"
                    className="mt-2 w-full h-32 object-cover rounded border"
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CTA Text</label>
                  <input
                    type="text"
                    value={form.cta_text}
                    onChange={(e) => setForm({ ...form, cta_text: e.target.value })}
                    placeholder="Shop Now"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CTA Link</label>
                  <input
                    type="text"
                    value={form.cta_link}
                    onChange={(e) => setForm({ ...form, cta_link: e.target.value })}
                    placeholder="/products"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-orange-500 text-white font-semibold py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                {submitting ? "Saving…" : editItem ? "Update Slider" : "Create Slider"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
