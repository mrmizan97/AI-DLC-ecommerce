"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function OrdersPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (fetched.current) return;
    fetched.current = true;
    api
      .get("/orders")
      .then((r) => setOrders(r.data.data || []))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white h-32 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center">
          <Package size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">You don&apos;t have any orders yet.</p>
          <Link href="/products" className="inline-block bg-primary text-white font-semibold px-6 py-2 rounded hover:bg-primary-dark">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block bg-white rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">Order #{order.order_number || order.id}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(order.createdAt).toLocaleString()} · {order.items?.length || 0} items
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                  {order.status}
                </span>
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t">
                <span className="text-sm text-gray-600">Total</span>
                <span className="font-bold text-primary">${parseFloat(order.total_amount).toFixed(2)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
