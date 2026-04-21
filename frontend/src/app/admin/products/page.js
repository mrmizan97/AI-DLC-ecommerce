"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Edit, Trash2, X, Download, Filter } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { exportToCsv } from "@/lib/exportCsv";

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  stock: "",
  category_id: "",
  brand: "",
  sku: "",
  image_url: "",
  status: "active",
  tag_ids: [],
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    category_id: "",
    status: "",
    tag_id: "",
    start_date: "",
    end_date: "",
  });

  const activeFilterCount = Object.values(filters).filter((v) => v !== "").length;

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.category_id) params.append("category_id", filters.category_id);
      if (filters.status) params.append("status", filters.status);
      if (filters.tag_id) params.append("tag_id", filters.tag_id);
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);
      params.append("limit", "100");
      const r = await api.get(`/products?${params.toString()}`);
      setProducts(r.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaticData = async () => {
    try {
      const [c, t] = await Promise.all([api.get("/categories"), api.get("/tags")]);
      setCategories(c.data.data || []);
      setTags(t.data.data || []);
    } catch {}
  };

  const staticFetched = useRef(false);
  useEffect(() => {
    if (staticFetched.current) return;
    staticFetched.current = true;
    fetchStaticData();
  }, []);

  const lastFilterKey = useRef(null);
  useEffect(() => {
    const key = `${filters.category_id}|${filters.status}|${filters.tag_id}`;
    if (lastFilterKey.current === key) return;
    lastFilterKey.current = key;
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category_id, filters.status, filters.tag_id]);

  const fetchAll = () => {
    fetchProducts();
    fetchStaticData();
  };

  const handleExport = () => {
    if (products.length === 0) {
      toast.error("No products to export");
      return;
    }
    exportToCsv(
      `products-${new Date().toISOString().split("T")[0]}.csv`,
      [
        { label: "ID", value: "id" },
        { label: "Name", value: "name" },
        { label: "SKU", value: "sku" },
        { label: "Category", value: (r) => r.category?.name || "" },
        { label: "Brand", value: "brand" },
        { label: "Price", value: "price" },
        { label: "Stock", value: "stock" },
        { label: "Status", value: "status" },
        { label: "Tags", value: (r) => (r.tags || []).map((t) => t.name).join("; ") },
        { label: "Created", value: (r) => new Date(r.createdAt).toLocaleString() },
      ],
      products
    );
    toast.success(`Exported ${products.length} products`);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || "",
      price: p.price,
      stock: p.stock,
      category_id: p.category_id,
      brand: p.brand || "",
      sku: p.sku,
      image_url: p.image_url || "",
      status: p.status,
      tag_ids: (p.tags || []).map((t) => t.id),
    });
    setShowModal(true);
  };

  const toggleTag = (tagId) => {
    const ids = form.tag_ids.includes(tagId)
      ? form.tag_ids.filter((id) => id !== tagId)
      : [...form.tag_ids, tagId];
    setForm({ ...form, tag_ids: ids });
  };

  const syncTags = async (productId, existingTagIds, selectedTagIds) => {
    const toAdd = selectedTagIds.filter((id) => !existingTagIds.includes(id));
    const toRemove = existingTagIds.filter((id) => !selectedTagIds.includes(id));

    if (toAdd.length > 0) {
      await api.post(`/products/${productId}/tags`, { tag_ids: toAdd });
    }
    if (toRemove.length > 0) {
      await api.delete(`/products/${productId}/tags`, { data: { tag_ids: toRemove } });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { tag_ids, ...rest } = form;
      const payload = {
        ...rest,
        price: parseFloat(rest.price),
        stock: parseInt(rest.stock),
        category_id: parseInt(rest.category_id),
      };

      if (editing) {
        await api.put(`/products/${editing.id}`, payload);
        const existingTagIds = (editing.tags || []).map((t) => t.id);
        await syncTags(editing.id, existingTagIds, tag_ids);
        toast.success("Product updated");
      } else {
        const res = await api.post("/products", payload);
        const newId = res.data.data.id;
        if (tag_ids.length > 0) {
          await api.post(`/products/${newId}/tags`, { tag_ids });
        }
        toast.success("Product created");
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success("Deleted");
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
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
          <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2 text-sm">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={openCreate} className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark flex items-center gap-2">
            <Plus size={18} /> Add Product
          </button>
        </div>
      </div>

      {showFilters && (
      <div className="bg-white rounded-lg p-3 mb-4 flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="Search name, description…"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && fetchProducts()}
          className="border rounded px-3 py-2 text-sm flex-1 min-w-[200px]"
        />
        <select
          value={filters.category_id}
          onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          value={filters.tag_id}
          onChange={(e) => setFilters({ ...filters, tag_id: e.target.value })}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">All Tags</option>
          {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="discontinued">Discontinued</option>
        </select>
        <div className="flex items-center gap-1">
          <label className="text-xs text-gray-500">From</label>
          <input
            type="datetime-local"
            value={filters.start_date}
            onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            className="border rounded px-2 py-2 text-sm"
          />
          <label className="text-xs text-gray-500 ml-1">To</label>
          <input
            type="datetime-local"
            value={filters.end_date}
            onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            className="border rounded px-2 py-2 text-sm"
          />
        </div>
        <button onClick={fetchProducts} className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark text-sm">
          Search
        </button>
        <button
          onClick={() => { setFilters({ search: "", category_id: "", status: "", tag_id: "", start_date: "", end_date: "" }); }}
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
                <th className="p-3">Image</th>
                <th className="p-3">Name</th>
                <th className="p-3">SKU</th>
                <th className="p-3">Category</th>
                <th className="p-3">Tags</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="p-6 text-center text-gray-400">Loading…</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={9} className="p-6 text-center text-gray-400">No products yet.</td></tr>
              ) : products.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3">
                    <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                      {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">{p.name[0]}</div>}
                    </div>
                  </td>
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 text-gray-500">{p.sku}</td>
                  <td className="p-3">{p.category?.name || "—"}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {(p.tags || []).map((t) => (
                        <span key={t.id} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                          {t.name}
                        </span>
                      ))}
                      {(!p.tags || p.tags.length === 0) && <span className="text-gray-400">—</span>}
                    </div>
                  </td>
                  <td className="p-3">${parseFloat(p.price).toFixed(2)}</td>
                  <td className="p-3">{p.stock}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{p.status}</span></td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal onClose={() => setShowModal(false)} title={editing ? "Edit Product" : "New Product"}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <FormField label="Name" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <FormField label="SKU" required value={form.sku} onChange={(v) => setForm({ ...form, sku: v })} />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Price" type="number" step="0.01" required value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
              <FormField label="Stock" type="number" required value={form.stock} onChange={(v) => setForm({ ...form, stock: v })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select required value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full border rounded px-3 py-2">
                <option value="">Select…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <FormField label="Brand" value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} />
            <FormField label="Image URL" value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags {form.tag_ids.length > 0 && <span className="text-gray-400 font-normal">({form.tag_ids.length} selected)</span>}
              </label>
              {tags.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No tags available. Create tags first.</p>
              ) : (
                <div className="border rounded px-3 py-2 max-h-32 overflow-y-auto flex flex-wrap gap-2">
                  {tags.map((t) => {
                    const selected = form.tag_ids.includes(t.id);
                    return (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => toggleTag(t.id)}
                        className={`px-3 py-1 rounded-full text-xs transition ${
                          selected
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full border rounded px-3 py-2">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-primary text-white font-semibold py-2 rounded hover:bg-primary-dark">
              {editing ? "Update" : "Create"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function FormField({ label, value, onChange, type = "text", required, step }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && " *"}</label>
      <input type={type} step={step} required={required} value={value} onChange={(e) => onChange(e.target.value)} className="w-full border rounded px-3 py-2" />
    </div>
  );
}

function Modal({ onClose, title, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
          <h2 className="font-bold text-lg">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
