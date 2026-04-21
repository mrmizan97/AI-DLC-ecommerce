"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Truck } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalAmount, clear } = useCartStore();
  const user = useAuthStore((s) => s.user);

  const [form, setForm] = useState({ shipping_address: "", phone: "", note: "", payment_method: "cash" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      toast.error("Please login first");
      router.push("/login");
    } else if (items.length === 0) {
      router.push("/cart");
    } else {
      setForm((f) => ({ ...f, phone: user.phone || "" }));
    }
  }, [user, items.length, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      };
      const res = await api.post("/orders", payload);
      const orderData = res.data.data;
      clear();

      if (orderData.gateway_url) {
        toast.success("Redirecting to payment gateway…");
        window.location.href = orderData.gateway_url;
      } else {
        toast.success("Order placed successfully!");
        router.push(`/orders/${orderData.id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  if (!user || items.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white rounded-lg p-6 space-y-4">
          <h2 className="font-bold text-lg mb-4">Shipping Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Address *</label>
            <textarea
              required
              rows={3}
              value={form.shipping_address}
              onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
              placeholder="Street, City, Postal Code"
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Note (optional)</label>
            <textarea
              rows={2}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Any special instructions..."
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`cursor-pointer border-2 rounded-lg p-4 flex items-start gap-3 transition ${
                  form.payment_method === "cash" ? "border-primary bg-orange-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="cash"
                  checked={form.payment_method === "cash"}
                  onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Truck size={18} />
                    <span className="font-medium">Cash on Delivery</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Pay when you receive your order</p>
                </div>
              </label>

              <label
                className={`cursor-pointer border-2 rounded-lg p-4 flex items-start gap-3 transition ${
                  form.payment_method === "online" ? "border-primary bg-orange-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="online"
                  checked={form.payment_method === "online"}
                  onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CreditCard size={18} />
                    <span className="font-medium">Online Payment</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Card, Mobile banking, bKash, Nagad</p>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-semibold py-3 rounded hover:bg-primary-dark disabled:opacity-50"
          >
            {loading ? "Processing…" : form.payment_method === "online" ? "Proceed to Payment" : "Place Order"}
          </button>
        </form>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg p-6 sticky top-24">
            <h2 className="font-bold text-lg text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4 pb-4 border-b text-sm">
              {items.map((i) => (
                <div key={i.product_id} className="flex justify-between">
                  <span className="truncate mr-2">{i.name} × {i.quantity}</span>
                  <span className="whitespace-nowrap">${(i.price * i.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">${totalAmount().toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
