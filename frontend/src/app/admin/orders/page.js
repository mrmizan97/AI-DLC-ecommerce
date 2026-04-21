"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, X, Download, Filter } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { exportToCsv } from "@/lib/exportCsv";

const STATUS_OPTIONS = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [search, setSearch] = useState("");
  const [phone, setPhone] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewing, setViewing] = useState(null);

  const activeFilterCount = [filter, paymentMethod, search, phone, startDate, endDate].filter(Boolean).length;

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.append("status", filter);
      if (paymentMethod) params.append("payment_method", paymentMethod);
      if (search.trim()) params.append("search", search.trim());
      if (phone.trim()) params.append("phone", phone.trim());
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      params.append("limit", "100");
      const r = await api.get(`/orders?${params.toString()}`);
      setOrders(r.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  const lastKey = useRef(null);
  useEffect(() => {
    const key = `${filter}|${paymentMethod}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, paymentMethod]);

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      toast.success("Status updated");
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const handleExport = () => {
    if (orders.length === 0) {
      toast.error("No orders to export");
      return;
    }
    exportToCsv(
      `orders-${new Date().toISOString().split("T")[0]}.csv`,
      [
        { label: "Order #", value: (r) => r.order_number || r.id },
        { label: "Customer", value: (r) => r.user?.name || "" },
        { label: "Email", value: (r) => r.user?.email || "" },
        { label: "Phone", value: "phone" },
        { label: "Items", value: (r) => r.items?.length || 0 },
        { label: "Total", value: (r) => parseFloat(r.total_amount).toFixed(2) },
        { label: "Payment Method", value: (r) => r.payment_method === "online" ? "Online" : "Cash on Delivery" },
        { label: "Payment Status", value: "payment_status" },
        { label: "Status", value: "status" },
        { label: "Shipping Address", value: "shipping_address" },
        { label: "Date", value: (r) => new Date(r.createdAt).toLocaleString() },
      ],
      orders
    );
    toast.success(`Exported ${orders.length} orders`);
  };

  const clearFilters = () => {
    setSearch("");
    setPhone("");
    setStartDate("");
    setEndDate("");
    setFilter("");
    setPaymentMethod("");
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
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
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border rounded px-3 py-2 text-sm">
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="border rounded px-3 py-2 text-sm">
            <option value="">All Methods</option>
            <option value="cash">Cash on Delivery</option>
            <option value="online">Online</option>
          </select>
        </div>
      </div>

      {showFilters && (
      <div className="bg-white rounded-lg p-3 mb-4 flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Order number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchAll()}
          className="border rounded px-3 py-2 text-sm w-40"
        />
        <input
          type="text"
          placeholder="Customer phone…"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchAll()}
          className="border rounded px-3 py-2 text-sm w-40"
        />
        <div className="flex items-center gap-1">
          <label className="text-xs text-gray-500">From</label>
          <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border rounded px-2 py-2 text-sm" />
          <label className="text-xs text-gray-500 ml-1">To</label>
          <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border rounded px-2 py-2 text-sm" />
        </div>
        <button onClick={fetchAll} className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark text-sm">
          Search
        </button>
        <button onClick={clearFilters} className="border px-4 py-2 rounded hover:bg-gray-50 text-sm">
          Clear
        </button>
      </div>
      )}

      <div className="bg-white rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="p-3">Order ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Items</th>
                <th className="p-3">Total</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="p-6 text-center text-gray-400">Loading…</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={9} className="p-6 text-center text-gray-400">No orders.</td></tr>
              ) : orders.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="p-3 font-medium">#{o.order_number || o.id}</td>
                  <td className="p-3">{o.user?.name}<br /><span className="text-xs text-gray-500">{o.user?.email}</span></td>
                  <td className="p-3 text-gray-700 whitespace-nowrap">{o.phone}</td>
                  <td className="p-3">{o.items?.length || 0}</td>
                  <td className="p-3 font-medium">${parseFloat(o.total_amount).toFixed(2)}</td>
                  <td className="p-3">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs text-center ${o.payment_method === "online" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                        {o.payment_method === "online" ? "Online" : "COD"}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs text-center ${
                        o.payment_status === "paid" ? "bg-green-100 text-green-700"
                        : o.payment_status === "failed" ? "bg-red-100 text-red-700"
                        : o.payment_status === "cancelled" ? "bg-gray-100 text-gray-600"
                        : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {o.payment_status}
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <select
                      value={o.status}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      disabled={o.status === "delivered" || o.status === "cancelled"}
                      className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${STATUS_COLORS[o.status]}`}
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="p-3 text-gray-500 whitespace-nowrap">{new Date(o.createdAt).toLocaleString()}</td>
                  <td className="p-3">
                    <button onClick={() => setViewing(o)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Eye size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold text-lg">Order #{viewing.order_number || viewing.id}</h2>
              <button onClick={() => setViewing(null)} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">{viewing.user?.name} · {viewing.user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Shipping Address</p>
                <p>{viewing.shipping_address}</p>
                <p className="text-sm text-gray-500 mt-1">Phone: {viewing.phone}</p>
              </div>
              {viewing.note && (
                <div>
                  <p className="text-sm text-gray-500">Note</p>
                  <p>{viewing.note}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 mb-2">Items</p>
                <div className="space-y-2">
                  {viewing.items?.map((item) => (
                    <div key={item.id} className="flex justify-between border-b pb-2 last:border-0">
                      <span>{item.product?.name} × {item.quantity}</span>
                      <span className="font-medium">${(item.quantity * parseFloat(item.price)).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between pt-2 border-t font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">${parseFloat(viewing.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
