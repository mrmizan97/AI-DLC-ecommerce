"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    fetchOrder();
  }, [id, user]);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data.data);
    } catch {
      toast.error("Order not found");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    try {
      await api.patch(`/orders/${id}/cancel`);
      toast.success("Order cancelled");
      fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel");
    }
  };

  if (!user) return null;
  if (loading) return <div className="max-w-4xl mx-auto p-8"><div className="bg-white h-64 rounded-lg animate-pulse" /></div>;
  if (!order) return <div className="max-w-4xl mx-auto p-8 text-center text-gray-500">Order not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="bg-white rounded-lg p-6">
        <div className="flex justify-between items-start mb-6 pb-6 border-b">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Placed on {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[order.status]}`}>
            {order.status}
          </span>
        </div>

        <div className="mb-6">
          <h2 className="font-bold text-gray-900 mb-3">Items</h2>
          <div className="space-y-3">
            {order.items?.map((item) => (
              <div key={item.id} className="flex gap-3 pb-3 border-b last:border-0">
                <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  {item.product?.image_url ? (
                    <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      {item.product?.name?.[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.product?.name}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity} × ${parseFloat(item.price).toFixed(2)}</p>
                </div>
                <p className="font-medium">${(item.quantity * parseFloat(item.price)).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Shipping Address</h3>
            <p className="text-sm text-gray-700">{order.shipping_address}</p>
            <p className="text-sm text-gray-700 mt-1">Phone: {order.phone}</p>
          </div>
          {order.note && (
            <div className="bg-gray-50 rounded p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Note</h3>
              <p className="text-sm text-gray-700">{order.note}</p>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <span className="font-bold text-lg">Total</span>
          <span className="font-bold text-2xl text-primary">
            ${parseFloat(order.total_amount).toFixed(2)}
          </span>
        </div>

        {order.status === "pending" && (
          <button
            onClick={handleCancel}
            className="mt-4 w-full bg-red-600 text-white font-semibold py-2 rounded hover:bg-red-700"
          >
            Cancel Order
          </button>
        )}
      </div>
    </div>
  );
}
