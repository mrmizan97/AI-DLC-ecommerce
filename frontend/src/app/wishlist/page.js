"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingCart, Trash2, PackageOpen } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";

export default function WishlistPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const addItem = useCartStore((s) => s.addItem);

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const fetched = useRef(false);

  const fetchWishlist = () => {
    setLoading(true);
    api
      .get("/wishlist")
      .then((r) => setWishlist(r.data.data || []))
      .catch(() => toast.error("Failed to load wishlist"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (fetched.current) return;
    fetched.current = true;
    fetchWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user) return null;

  const handleAddToCart = (product) => {
    addItem(product);
    toast.success(`${product.name} added to cart`);
  };

  const handleRemove = async (productId, productName) => {
    setRemoving(productId);
    try {
      await api.delete(`/wishlist/${productId}`);
      toast.success(`${productName} removed from wishlist`);
      setWishlist((prev) => prev.filter((item) => item.product?.id !== productId));
    } catch {
      toast.error("Failed to remove from wishlist");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Heart size={26} style={{ color: "var(--primary)" }} />
        <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
        {!loading && wishlist.length > 0 && (
          <span className="bg-orange-100 text-orange-700 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {wishlist.length} item{wishlist.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-72 animate-pulse" />
          ))}
        </div>
      ) : wishlist.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center">
          <PackageOpen size={72} className="mx-auto text-gray-200 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-6">
            Save items you love by clicking the heart icon on any product.
          </p>
          <Link
            href="/products"
            className="inline-block bg-primary text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-primary-dark transition"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {wishlist.map((item) => {
            const product = item.product || {};
            const productId = product.id;
            const isRemoving = removing === productId;

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition border border-gray-100 flex flex-col"
              >
                {/* Image */}
                <Link href={`/products/${productId}`} className="block">
                  <div className="aspect-square bg-gray-50 overflow-hidden relative">
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
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-red-600 text-white px-3 py-1 rounded text-sm font-medium">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="p-3 flex flex-col flex-1">
                  {product.category && (
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                      {product.category?.name || product.category}
                    </p>
                  )}
                  <Link
                    href={`/products/${productId}`}
                    className="text-sm font-medium text-gray-800 hover:text-primary line-clamp-2 mb-2 flex-1"
                  >
                    {product.name}
                  </Link>
                  <p className="text-primary font-bold text-lg mb-3">
                    ${parseFloat(product.price || 0).toFixed(2)}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-white text-xs font-semibold py-2 rounded-lg hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                    >
                      <ShoppingCart size={14} />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => handleRemove(productId, product.name)}
                      disabled={isRemoving}
                      className="p-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 transition"
                      title="Remove from wishlist"
                    >
                      {isRemoving ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
