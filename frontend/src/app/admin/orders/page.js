"use client";

import { useEffect, useState } from "react";
import { Eye, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

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
  const [viewing, setViewing] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const params = filter ? `?status=${filter}` : "";
      const r = await api.get(`/orders${params}`);
      setOrders(r.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [filter]);

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      toast.success("Status updated");
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border rounded px-3 py-2">
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="p-3">Order ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Items</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-6 text-center text-gray-400">Loading…</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="p-6 text-center text-gray-400">No orders.</td></tr>
              ) : orders.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="p-3 font-medium">#{o.id}</td>
                  <td className="p-3">{o.user?.name}<br /><span className="text-xs text-gray-500">{o.user?.email}</span></td>
                  <td className="p-3">{o.items?.length || 0}</td>
                  <td className="p-3 font-medium">${parseFloat(o.total_amount).toFixed(2)}</td>
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
                  <td className="p-3 text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
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
              <h2 className="font-bold text-lg">Order #{viewing.id}</h2>
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
