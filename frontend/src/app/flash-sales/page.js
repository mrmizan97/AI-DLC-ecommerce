"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Zap, ShoppingCart, Clock, Eye } from "lucide-react";
import api from "@/lib/api";
import { useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";

function useCountdown(endTime) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!endTime) return;

    const calc = () => {
      const diff = new Date(endTime) - new Date();
      if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true };
      const totalSec = Math.floor(diff / 1000);
      return {
        hours: Math.floor(totalSec / 3600),
        minutes: Math.floor((totalSec % 3600) / 60),
        seconds: totalSec % 60,
        expired: false,
      };
    };

    setTimeLeft(calc());
    const id = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(id);
  }, [endTime]);

  return timeLeft;
}

function CountdownTimer({ endTime }) {
  const t = useCountdown(endTime);

  if (!t) return <span className="text-gray-400 text-sm">Loading timer…</span>;
  if (t.expired)
    return <span className="text-red-500 text-sm font-medium">Sale ended</span>;

  const pad = (n) => String(n).padStart(2, "0");

  return (
    <div className="flex items-center gap-1.5">
      <Clock size={14} className="text-red-500 flex-shrink-0" />
      <div className="flex items-center gap-1 font-mono">
        <span className="bg-gray-800 text-white text-xs font-bold px-1.5 py-0.5 rounded">
          {pad(t.hours)}
        </span>
        <span className="text-gray-600 font-bold text-xs">:</span>
        <span className="bg-gray-800 text-white text-xs font-bold px-1.5 py-0.5 rounded">
          {pad(t.minutes)}
        </span>
        <span className="text-gray-600 font-bold text-xs">:</span>
        <span className="bg-gray-800 text-white text-xs font-bold px-1.5 py-0.5 rounded">
          {pad(t.seconds)}
        </span>
      </div>
    </div>
  );
}

function StockBar({ sold, total }) {
  if (!total) return null;
  const pct = Math.min(100, Math.round((sold / total) * 100));
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Sold: {sold || 0}</span>
        <span>{pct}% claimed</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function FlashSaleCard({ sale, onAddToCart }) {
  const product = sale.product || {};
  const original = parseFloat(sale.original_price || product.price || 0);
  const salePrice = parseFloat(sale.sale_price || 0);
  const discountPct =
    sale.discount_percentage ||
    (original > 0 ? Math.round(((original - salePrice) / original) * 100) : 0);

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition border border-gray-100 flex flex-col">
      {/* Image */}
      <Link href={`/products/${product.id}`} className="block relative">
        <div className="aspect-square bg-gray-50 overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover hover:scale-105 transition"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl font-bold">
              {product.name?.[0] || "?"}
            </div>
          )}
        </div>
        {discountPct > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            -{discountPct}%
          </span>
        )}
      </Link>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <Link
          href={`/products/${product.id}`}
          className="text-sm font-medium text-gray-800 hover:text-primary line-clamp-2 mb-2"
        >
          {product.name}
        </Link>

        {/* Prices */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-primary font-bold text-xl">
            ${salePrice.toFixed(2)}
          </span>
          {original > salePrice && (
            <span className="text-gray-400 text-sm line-through">
              ${original.toFixed(2)}
            </span>
          )}
        </div>

        {/* Timer */}
        <div className="mb-2">
          <CountdownTimer endTime={sale.end_time || sale.ends_at} />
        </div>

        {/* Stock progress */}
        {sale.stock_limit && (
          <StockBar sold={sale.sold_count || 0} total={sale.stock_limit} />
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-3">
          <button
            onClick={() => onAddToCart(product, salePrice)}
            disabled={product.stock === 0}
            className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-white text-xs font-semibold py-2 rounded-lg hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            <ShoppingCart size={14} />
            Add to Cart
          </button>
          <Link
            href={`/products/${product.id}`}
            className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition"
            title="View product"
          >
            <Eye size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function FlashSalesPage() {
  const addItem = useCartStore((s) => s.addItem);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    api
      .get("/flash-sales?active_only=true")
      .then((r) => setSales(r.data.data || []))
      .catch(() => toast.error("Failed to load flash sales"))
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = useCallback(
    (product, salePrice) => {
      addItem({ ...product, price: salePrice });
      toast.success(`${product.name} added to cart`);
    },
    [addItem]
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-red-600 to-orange-500 rounded-2xl p-6 mb-8 text-white text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap size={28} className="animate-pulse" />
          <h1 className="text-3xl font-extrabold tracking-tight">Flash Sales</h1>
          <Zap size={28} className="animate-pulse" />
        </div>
        <p className="text-orange-100 text-sm">
          Limited-time deals — grab them before they&apos;re gone!
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-80 animate-pulse" />
          ))}
        </div>
      ) : sales.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center">
          <Zap size={64} className="mx-auto text-gray-200 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            No active flash sales right now
          </h2>
          <p className="text-gray-500 mb-6">Check back soon for lightning deals!</p>
          <Link
            href="/products"
            className="inline-block bg-primary text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-primary-dark transition"
          >
            Browse All Products
          </Link>
        </div>
      ) : (
        <>
          <p className="text-gray-600 mb-4 text-sm">
            {sales.length} active deal{sales.length !== 1 ? "s" : ""} available
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {sales.map((sale) => (
              <FlashSaleCard key={sale.id} sale={sale} onAddToCart={handleAddToCart} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
