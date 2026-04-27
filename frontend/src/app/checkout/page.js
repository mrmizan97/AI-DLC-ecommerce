"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Truck, Tag, X, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalAmount, clear } = useCartStore();
  const user = useAuthStore((s) => s.user);

  const [form, setForm] = useState({
    shipping_address: "",
    phone: "",
    note: "",
    payment_method: "cash",
  });
  const [loading, setLoading] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Saved addresses state
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showManualForm, setShowManualForm] = useState(false);

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

  // Load saved addresses
  useEffect(() => {
    if (!user) return;
    api
      .get("/addresses")
      .then((r) => {
        const addrs = r.data.data || [];
        setSavedAddresses(addrs);
        if (addrs.length === 0) setShowManualForm(true);
      })
      .catch(() => setShowManualForm(true));
  }, [user]);

  const handleAddressSelect = (e) => {
    const addrId = e.target.value;
    setSelectedAddressId(addrId);
    if (!addrId) return;
    const addr = savedAddresses.find((a) => String(a.id) === String(addrId));
    if (!addr) return;
    // Pre-fill shipping_address and phone from saved address
    const parts = [addr.address_line1, addr.address_line2, addr.city, addr.state, addr.postal_code, addr.country]
      .filter(Boolean)
      .join(", ");
    setForm((f) => ({
      ...f,
      shipping_address: parts,
      phone: addr.phone || f.phone,
    }));
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const subtotal = totalAmount();
      const res = await api.post("/coupons/validate", {
        code: couponCode.trim(),
        order_amount: subtotal,
      });
      const data = res.data.data || res.data;
      setCoupon({ code: couponCode.trim(), discount: data.discount, label: data.label });
      toast.success(`Coupon applied! You save $${parseFloat(data.discount).toFixed(2)}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid coupon code");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCoupon(null);
    setCouponCode("");
    toast("Coupon removed");
  };

  const subtotal = totalAmount();
  const discount = coupon ? parseFloat(coupon.discount) : 0;
  const finalTotal = Math.max(0, subtotal - discount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        ...(coupon ? { coupon_code: coupon.code } : {}),
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

          {/* Saved address selector */}
          {savedAddresses.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <ChevronDown size={16} className="text-orange-500" />
                Use a saved address
              </label>
              <select
                value={selectedAddressId}
                onChange={handleAddressSelect}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              >
                <option value="">— Select a saved address —</option>
                {savedAddresses.map((addr) => (
                  <option key={addr.id} value={addr.id}>
                    {[addr.label, addr.address_line1, addr.city].filter(Boolean).join(" · ")}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setSelectedAddressId("");
                  setShowManualForm((v) => !v);
                }}
                className="mt-2 text-sm text-orange-600 hover:underline"
              >
                {showManualForm ? "Hide manual form" : "Or enter a new address"}
              </button>
            </div>
          )}

          {/* Manual address form — always shown if no saved addresses */}
          {(showManualForm || savedAddresses.length === 0) && (
            <>
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
            </>
          )}

          {/* If saved address selected, show summary of filled fields */}
          {!showManualForm && selectedAddressId && savedAddresses.length > 0 && (
            <div className="border rounded px-4 py-3 bg-gray-50 text-sm text-gray-700 space-y-1">
              <p className="font-medium">Shipping to:</p>
              <p>{form.shipping_address}</p>
              {form.phone && <p>Phone: {form.phone}</p>}
            </div>
          )}

          {/* Hidden inputs for required fields when using saved address */}
          {!showManualForm && selectedAddressId && (
            <>
              <input type="hidden" value={form.shipping_address} />
              <input type="hidden" value={form.phone} />
            </>
          )}

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
                  form.payment_method === "cash"
                    ? "border-primary bg-orange-50"
                    : "border-gray-200 hover:border-gray-300"
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
                  form.payment_method === "online"
                    ? "border-primary bg-orange-50"
                    : "border-gray-200 hover:border-gray-300"
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
            {loading
              ? "Processing…"
              : form.payment_method === "online"
              ? "Proceed to Payment"
              : "Place Order"}
          </button>
        </form>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg p-6 sticky top-24 space-y-4">
            <h2 className="font-bold text-lg text-gray-900">Order Summary</h2>

            <div className="space-y-2 pb-4 border-b text-sm">
              {items.map((i) => (
                <div key={i.product_id} className="flex justify-between">
                  <span className="truncate mr-2">
                    {i.name} × {i.quantity}
                  </span>
                  <span className="whitespace-nowrap">${(i.price * i.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Coupon code input */}
            <div>
              {!coupon ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Tag size={14} className="text-orange-500" /> Coupon Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="bg-orange-500 text-white px-3 py-2 rounded text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
                    >
                      {couponLoading ? "…" : "Apply"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded px-3 py-2 text-sm">
                  <div className="flex items-center gap-2 text-green-700">
                    <Tag size={14} />
                    <span className="font-medium">{coupon.code}</span>
                    <span>— Save ${parseFloat(coupon.discount).toFixed(2)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-gray-400 hover:text-red-500 ml-2"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-2 text-sm pt-2 border-t">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {coupon && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Discount ({coupon.code})</span>
                  <span>−${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span className="text-primary">${finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
