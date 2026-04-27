"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Edit2, Trash2, X, Zap, Search } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

const EMPTY_FORM = {
  product_id: "",
  sale_price: "",
  original_price: "",
  discount_percentage: "",
  start_time: "",
  end_time: "",
  stock_limit: "",
  is_active: true,
};

export default function AdminFlashSalesPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Product search for dropdown
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState([]);
  const [productSearchLoading, setProductSearchLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const searchTimeout = useRef(null);

  useEffect(() => {
    if (user && user.role !== "admin") router.push("/");
  }, [user, router]);

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchItems() {
    setLoading(true);
    try {
      const r = await api.get("/flash-sales");
      setItems(r.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load flash sales");
    } finally {
      setLoading(false);
    }
  }

  function calcDiscount(salePrice, originalPrice) {
    const sale = parseFloat(salePrice);
    const orig = parseFloat(originalPrice);
    if (!sale || !orig || orig <= 0) return "";
    const pct = ((orig - sale) / orig) * 100;
    return pct > 0 ? pct.toFixed(1) : "";
  }

  function handleFormChange(field, value) {
    const next = { ...form, [field]: value };
    if (field === "sale_price" || field === "original_price") {
      next.discount_percentage = calcDiscount(
        field === "sale_price" ? value : form.sale_price,
        field === "original_price" ? value : form.original_price
      );
    }
    setForm(next);
  }

  async function searchProducts(q) {
    if (!q.trim()) { setProductResults([]); return; }
    setProductSearchLoading(true);
    try {
      const r = await api.get(`/products?search=${encodeURIComponent(q)}&limit=10`);
      setProductResults(r.data.data || []);
    } catch {
      setProductResults([]);
    } finally {
      setProductSearchLoading(false);
    }
  }

  function handleProductSearchChange(e) {
    const q = e.target.value;
    setProductSearch(q);
    setShowProductDropdown(true);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchProducts(q), 350);
  }

  function selectProduct(p) {
    setSelectedProduct(p);
    setForm({ ...form, product_id: p.id, original_price: parseFloat(p.price).toFixed(2) });
    setProductSearch(p.name);
    setShowProductDropdown(false);
  }

  function openCreate() {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setSelectedProduct(null);
    setProductSearch("");
    setProductResults([]);
    setShowModal(true);
  }

  function openEdit(item) {
    setEditItem(item);
    setForm({
      product_id: item.product_id || item.product?.id || "",
      sale_price: item.sale_price ?? "",
      original_price: item.original_price ?? "",
      discount_percentage: item.discount_percentage ?? calcDiscount(item.sale_price, item.original_price),
      start_time: item.start_time ? item.start_time.slice(0, 16) : "",
      end_time: item.end_time ? item.end_time.slice(0, 16) : "",
      stock_limit: item.stock_limit ?? "",
      is_active: item.is_active ?? true,
    });
    setSelectedProduct(item.product || null);
    setProductSearch(item.product?.name || "");
    setProductResults([]);
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.product_id) { toast.error("Please select a product"); return; }
    setSubmitting(true);
    try {
      const payload = {
        product_id: parseInt(form.product_id),
        sale_price: parseFloat(form.sale_price),
        original_price: parseFloat(form.original_price),
        discount_percentage: form.discount_percentage !== "" ? parseFloat(form.discount_percentage) : null,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        stock_limit: form.stock_limit !== "" ? parseInt(form.stock_limit) : null,
        is_active: form.is_active,
      };
      if (editItem) {
        await api.put(`/flash-sales/${editItem.id}`, payload);
        toast.success("Flash sale updated");
      } else {
        await api.post("/flash-sales", payload);
        toast.success("Flash sale created");
      }
      setShowModal(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this flash sale?")) return;
    try {
      await api.delete(`/flash-sales/${id}`);
      toast.success("Deleted");
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  }

  function statusBadge(item) {
    const now = new Date();
    const start = item.start_time ? new Date(item.start_time) : null;
    const end = item.end_time ? new Date(item.end_time) : null;
    if (!item.is_active) return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">Inactive</span>;
    if (end && now > end) return <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-600">Ended</span>;
    if (start && now < start) return <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700">Upcoming</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">Live</span>;
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Zap size={24} className="text-orange-500" /> Flash Sales
        </h1>
        <button
          onClick={openCreate}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center gap-2 text-sm font-medium"
        >
          <Plus size={18} /> Add Flash Sale
        </button>
      </div>

      <div className="bg-white rounded-lg border shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">Sale Price</th>
                <th className="p-3">Original Price</th>
                <th className="p-3">Discount</th>
                <th className="p-3">Start Time</th>
                <th className="p-3">End Time</th>
                <th className="p-3">Stock Limit</th>
                <th className="p-3">Sold</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="p-8 text-center text-gray-400">Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-400">
                    <Zap size={36} className="mx-auto mb-2 opacity-30" />
                    <p>No flash sales yet.</p>
                  </td>
                </tr>
              ) : items.map((item, idx) => (
                <tr key={item.id} className={`border-t ${idx % 2 === 1 ? "bg-gray-50" : ""}`}>
                  <td className="p-3 font-medium max-w-[180px] truncate" title={item.product?.name}>
                    {item.product?.name || `Product #${item.product_id}`}
                  </td>
                  <td className="p-3 font-semibold text-orange-600">${parseFloat(item.sale_price).toFixed(2)}</td>
                  <td className="p-3 text-gray-400 line-through">${parseFloat(item.original_price).toFixed(2)}</td>
                  <td className="p-3">
                    {item.discount_percentage != null ? (
                      <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-bold">
                        -{parseFloat(item.discount_percentage).toFixed(0)}%
                      </span>
                    ) : "—"}
                  </td>
                  <td className="p-3 text-gray-500 whitespace-nowrap">
                    {item.start_time ? new Date(item.start_time).toLocaleString() : "—"}
                  </td>
                  <td className="p-3 text-gray-500 whitespace-nowrap">
                    {item.end_time ? new Date(item.end_time).toLocaleString() : "—"}
                  </td>
                  <td className="p-3">{item.stock_limit ?? "∞"}</td>
                  <td className="p-3">{item.sold_count ?? 0}</td>
                  <td className="p-3">{statusBadge(item)}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="font-bold text-lg">{editItem ? "Edit Flash Sale" : "New Flash Sale"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Product searchable dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
                <div className="relative">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products…"
                      value={productSearch}
                      onChange={handleProductSearchChange}
                      onFocus={() => setShowProductDropdown(true)}
                      className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm"
                    />
                  </div>
                  {showProductDropdown && (productResults.length > 0 || productSearchLoading) && (
                    <div className="absolute z-20 top-full left-0 right-0 bg-white border rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                      {productSearchLoading ? (
                        <div className="p-3 text-center text-gray-400 text-sm">Searching…</div>
                      ) : productResults.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => selectProduct(p)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 flex justify-between items-center"
                        >
                          <span>{p.name}</span>
                          <span className="text-gray-400">${parseFloat(p.price).toFixed(2)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedProduct && (
                  <p className="text-xs text-green-600 mt-1">Selected: {selectedProduct.name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price ($) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.sale_price}
                    onChange={(e) => handleFormChange("sale_price", e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Original Price ($) *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.original_price}
                    onChange={(e) => handleFormChange("original_price", e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Auto-calculated discount display */}
              {form.discount_percentage !== "" && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-sm text-orange-700 font-medium">
                  Discount: {form.discount_percentage}% off
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    value={form.start_time}
                    onChange={(e) => handleFormChange("start_time", e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    value={form.end_time}
                    onChange={(e) => handleFormChange("end_time", e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stock Limit</label>
                <input
                  type="number"
                  min="1"
                  value={form.stock_limit}
                  onChange={(e) => handleFormChange("stock_limit", e.target.value)}
                  placeholder="Leave empty for unlimited"
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
                {submitting ? "Saving…" : editItem ? "Update Flash Sale" : "Create Flash Sale"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
