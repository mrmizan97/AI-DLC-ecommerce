"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";

function CancelContent() {
  const sp = useSearchParams();
  const orderId = sp.get("order_id");

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg p-10 text-center shadow-sm">
        <AlertCircle size={80} className="mx-auto text-yellow-500 mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
        <p className="text-gray-600 mb-6">
          You cancelled the payment. Your order has been cancelled and stock restored.
        </p>
        <div className="flex gap-3 justify-center">
          {orderId ? (
            <Link
              href={`/orders/${orderId}`}
              className="border px-6 py-2 rounded hover:bg-gray-50"
            >
              View Order
            </Link>
          ) : null}
          <Link href="/products" className="bg-primary text-white font-semibold px-6 py-2 rounded hover:bg-primary-dark">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
      <CancelContent />
    </Suspense>
  );
}
