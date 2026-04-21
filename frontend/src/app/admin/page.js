"use client";

import { useEffect, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import {
  Package,
  Folder,
  Tag,
  ShoppingBag,
  Users,
  DollarSign,
} from "lucide-react";
import api from "@/lib/api";

const STATUS_COLORS = {
  pending: "#eab308",
  confirmed: "#3b82f6",
  shipped: "#a855f7",
  delivered: "#22c55e",
  cancelled: "#ef4444",
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    api
      .get("/stats/dashboard")
      .then((r) => setStats(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-80 bg-white rounded-lg animate-pulse" />
      </div>
    );
  }

  const { totals, ordersByDay, statusDistribution, topProducts, usersByRole, recentOrders } = stats;

  const ordersByDayChart = ordersByDay.map((r) => ({
    date: new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    orders: r.count,
  }));

  const statusData = statusDistribution.map((s) => ({ name: s.status, value: s.count }));
  const roleData = usersByRole.map((r) => ({ name: r.role, value: r.count }));
  const topStockData = topProducts.map((p) => ({ name: p.name.slice(0, 15), stock: p.stock }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={<DollarSign size={20} />} label="Revenue" value={`$${totals.revenue.toFixed(2)}`} color="bg-green-500" />
        <StatCard icon={<ShoppingBag size={20} />} label="Orders" value={totals.orders} color="bg-blue-500" />
        <StatCard icon={<Users size={20} />} label="Users" value={totals.users} color="bg-purple-500" />
        <StatCard icon={<Package size={20} />} label="Products" value={totals.products} color="bg-primary" />
        <StatCard icon={<Folder size={20} />} label="Categories" value={totals.categories} color="bg-pink-500" />
        <StatCard icon={<Tag size={20} />} label="Tags" value={totals.tags} color="bg-teal-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-4">
          <h2 className="font-bold text-gray-900 mb-4">Orders — Last 7 Days</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={ordersByDayChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="orders" stroke="#f85606" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg p-4">
          <h2 className="font-bold text-gray-900 mb-4">Order Status Distribution</h2>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] || "#9ca3af"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-20">No order data</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-4">
          <h2 className="font-bold text-gray-900 mb-4">Top 5 Products by Stock</h2>
          {topStockData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topStockData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="stock" fill="#2abbe8" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-20">No product data</p>
          )}
        </div>

        <div className="bg-white rounded-lg p-4">
          <h2 className="font-bold text-gray-900 mb-4">Users by Role</h2>
          {roleData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  <Cell fill="#f85606" />
                  <Cell fill="#2abbe8" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-20">No user data</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg p-4">
        <h2 className="font-bold text-gray-900 mb-4">Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p className="text-gray-400">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500 border-b">
                <tr>
                  <th className="py-2">Order #</th>
                  <th className="py-2">Customer</th>
                  <th className="py-2">Total</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} className="border-b">
                    <td className="py-2 font-medium">#{o.order_number || o.id}</td>
                    <td className="py-2">{o.user?.name || "—"}</td>
                    <td className="py-2">${parseFloat(o.total_amount).toFixed(2)}</td>
                    <td className="py-2">
                      <span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: (STATUS_COLORS[o.status] || "#9ca3af") + "20", color: STATUS_COLORS[o.status] || "#6b7280" }}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-2 text-gray-500">{new Date(o.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white rounded-lg p-4">
      <div className={`${color} text-white w-9 h-9 rounded-full flex items-center justify-center mb-2`}>
        {icon}
      </div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-900 truncate">{value}</p>
    </div>
  );
}
