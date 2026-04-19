"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/cartStore";

export default function ProductCard({ product }) {
  const addItem = useCartStore((s) => s.addItem);

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <Link href={`/products/${product.id}`} className="group">
      <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition border border-gray-100">
        <div className="aspect-square bg-gray-100 relative overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-5xl">
              {product.name?.[0] || "?"}
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-red-600 text-white px-3 py-1 rounded text-sm">Out of Stock</span>
            </div>
          )}
        </div>

        <div className="p-3">
          <h3 className="text-sm text-gray-800 line-clamp-2 mb-1 min-h-[2.5rem]">
            {product.name}
          </h3>
          {product.brand && (
            <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-primary font-bold text-lg">
              ${parseFloat(product.price).toFixed(2)}
            </span>
            <button
              onClick={handleAdd}
              disabled={product.stock === 0}
              className="bg-primary hover:bg-primary-dark text-white p-2 rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed"
              title="Add to cart"
            >
              <ShoppingCart size={16} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
