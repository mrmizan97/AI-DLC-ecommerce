"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { XCircle } from "lucide-react";

function FailContent() {
  const sp = useSearchParams();
  const orderId = sp.get("order_id");
  const error = sp.get("error");

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg p-10 text-center shadow-sm">
        <XCircle size={80} className="mx-auto text-red-500 mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Failed</h1>
        <p className="text-gray-600 mb-6">
          {error ? decodeURIComponent(error) : "Your payment could not be completed. Please try again."}
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
          <Link href="/cart" className="bg-primary text-white font-semibold px-6 py-2 rounded hover:bg-primary-dark">
            Back to Cart
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
      <FailContent />
    </Suspense>
  );
}
