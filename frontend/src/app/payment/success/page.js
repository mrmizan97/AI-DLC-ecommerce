"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";

function SuccessContent() {
  const sp = useSearchParams();
  const orderId = sp.get("order_id");

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg p-10 text-center shadow-sm">
        <CheckCircle size={80} className="mx-auto text-green-500 mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful</h1>
        <p className="text-gray-600 mb-6">
          Thank you! Your order has been confirmed and is being prepared.
        </p>
        <div className="flex gap-3 justify-center">
          {orderId ? (
            <Link
              href={`/orders/${orderId}`}
              className="bg-primary text-white font-semibold px-6 py-2 rounded hover:bg-primary-dark"
            >
              View Order
            </Link>
          ) : null}
          <Link href="/products" className="border px-6 py-2 rounded hover:bg-gray-50">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
      <SuccessContent />
    </Suspense>
  );
}
