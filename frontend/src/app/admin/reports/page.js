"use client";

import { useState, useEffect } from "react";
import { Download, TrendingUp, ShoppingBag, Users, DollarSign, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function SummaryCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-lg border shadow p-5 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function AdminReportsPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [loading, setLoading] = useState(true);

  const [summary, setSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [chartData, setChartData] = useState([]);

  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingJson, setExportingJson] = useState(false);

  useEffect(() => {
    if (user && user.role !== "admin") router.push("/");
  }, [user, router]);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      const qs = params.toString();

      const [summaryRes, productsRes, customersRes] = await Promise.allSettled([
        api.get(`/reports/summary?${qs}`),
        api.get(`/reports/top-products?${qs}`),
        api.get(`/reports/top-customers?${qs}`),
      ]);

      if (summaryRes.status === "fulfilled") {
        const s = summaryRes.value.data.data || summaryRes.value.data;
        setSummary(s);
        // Build chart data from sales_by_period if present
        const periods = s.sales_by_period || s.byPeriod || s.chart || [];
        if (Array.isArray(periods) && periods.length > 0) {
          setChartData(periods.map((p) => ({
            period: p.period || p.date || p.label,
            revenue: parseFloat(p.revenue || p.total || 0),
            orders: parseInt(p.orders || p.count || 0),
          })));
        }
      } else {
        toast.error("Failed to load summary");
      }

      if (productsRes.status === "fulfilled") {
        setTopProducts(productsRes.value.data.data || productsRes.value.data || []);
      }

      if (customersRes.status === "fulfilled") {
        setTopCustomers(customersRes.value.data.data || customersRes.value.data || []);
      }
    } catch (err) {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  async function handleExportCSV() {
    setExportingCsv(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      const r = await api.get(`/reports/export/csv?${params.toString()}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${startDate}-${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("CSV exported");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to export CSV");
    } finally {
      setExportingCsv(false);
    }
  }

  async function handleExportJSON() {
    setExportingJson(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      const r = await api.get(`/reports/export/json?${params.toString()}`);
      const blob = new Blob([JSON.stringify(r.data, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${startDate}-${endDate}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("JSON exported");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to export JSON");
    } finally {
      setExportingJson(false);
    }
  }

  const fmt = (n) => {
    if (n == null) return "—";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp size={22} className="text-orange-500" /> Sales Reports
        </h1>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            disabled={exportingCsv}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
          >
            <Download size={16} /> {exportingCsv ? "Exporting…" : "Export CSV"}
          </button>
          <button
            onClick={handleExportJSON}
            disabled={exportingJson}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            <Download size={16} /> {exportingJson ? "Exporting…" : "Export JSON"}
          </button>
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="bg-white rounded-lg border shadow p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-2 bg-orange-500 text-white px-5 py-2 rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Apply
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw size={32} className="animate-spin text-orange-400" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              icon={DollarSign}
              label="Total Revenue"
              value={fmt(summary?.total_revenue ?? summary?.totalRevenue)}
              color="bg-orange-500"
            />
            <SummaryCard
              icon={ShoppingBag}
              label="Total Orders"
              value={(summary?.total_orders ?? summary?.totalOrders ?? 0).toLocaleString()}
              color="bg-blue-500"
            />
            <SummaryCard
              icon={TrendingUp}
              label="Avg Order Value"
              value={fmt(summary?.avg_order_value ?? summary?.avgOrderValue)}
              color="bg-green-500"
            />
            <SummaryCard
              icon={Users}
              label="Unique Customers"
              value={(summary?.unique_customers ?? summary?.uniqueCustomers ?? 0).toLocaleString()}
              color="bg-purple-500"
            />
          </div>

          {/* Bar Chart */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-lg border shadow p-5">
              <h2 className="font-semibold text-gray-800 mb-4">Revenue by Period</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "revenue" ? fmt(value) : value,
                      name === "revenue" ? "Revenue" : "Orders",
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Products */}
          <div className="bg-white rounded-lg border shadow overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-800">Top Products</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Units Sold</th>
                    <th className="p-3">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.length === 0 ? (
                    <tr><td colSpan={4} className="p-6 text-center text-gray-400">No data available</td></tr>
                  ) : topProducts.map((p, i) => (
                    <tr key={p.id || i} className={`border-t ${i % 2 === 1 ? "bg-gray-50" : ""}`}>
                      <td className="p-3 text-gray-400 font-medium">{i + 1}</td>
                      <td className="p-3 font-medium">{p.name || p.product_name}</td>
                      <td className="p-3">{(p.units_sold ?? p.quantity_sold ?? 0).toLocaleString()}</td>
                      <td className="p-3 font-semibold text-orange-600">{fmt(p.revenue || p.total_revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Customers */}
          <div className="bg-white rounded-lg border shadow overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-800">Top Customers</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Orders</th>
                    <th className="p-3">Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.length === 0 ? (
                    <tr><td colSpan={4} className="p-6 text-center text-gray-400">No data available</td></tr>
                  ) : topCustomers.map((c, i) => (
                    <tr key={c.id || i} className={`border-t ${i % 2 === 1 ? "bg-gray-50" : ""}`}>
                      <td className="p-3 text-gray-400 font-medium">{i + 1}</td>
                      <td className="p-3">
                        <div className="font-medium">{c.name || c.customer_name || "—"}</div>
                        <div className="text-xs text-gray-500">{c.email || "—"}</div>
                      </td>
                      <td className="p-3">{(c.orders || c.order_count ?? 0).toLocaleString()}</td>
                      <td className="p-3 font-semibold text-orange-600">{fmt(c.total_spent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
