"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShoppingCart, Minus, Plus, Tag as TagIcon } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useCartStore } from "@/store/cartStore";
import ProductGallery from "@/components/ProductGallery";
import ProductReviews from "@/components/ProductReviews";
import StarRating from "@/components/StarRating";
import { getGallery } from "@/lib/media";

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then((r) => setProduct(r.data.data))
      .catch(() => toast.error("Product not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast.success(`Added ${quantity} × ${product.name} to cart`);
  };

  const handleBuyNow = () => {
    addItem(product, quantity);
    router.push("/cart");
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white rounded-lg h-96 animate-pulse" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center">
        <p className="text-gray-500">Product not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="bg-white rounded-lg overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        <ProductGallery images={getGallery(product)} alt={product.name} />

        <div>
          {product.category && (
            <p className="text-sm text-gray-500 mb-1">{product.category.name}</p>
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
          <div className="mb-2">
            <StarRating
              value={product.rating_average || 0}
              count={product.rating_count || 0}
              size={16}
              showValue
            />
          </div>
          {product.brand && <p className="text-gray-600 mb-3">Brand: <span className="font-medium">{product.brand}</span></p>}

          <div className="bg-orange-50 p-4 rounded mb-4">
            <p className="text-3xl font-bold text-primary">
              ${parseFloat(product.price).toFixed(2)}
            </p>
            <p className="text-sm text-gray-600 mt-1">SKU: {product.sku}</p>
          </div>

          <p className="text-gray-700 mb-4">{product.description || "No description available."}</p>

          {product.tags?.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {product.tags.map((t) => (
                <span key={t.id} className="inline-flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
                  <TagIcon size={12} /> {t.name}
                </span>
              ))}
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Stock: <span className={product.stock > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                {product.stock > 0 ? `${product.stock} available` : "Out of stock"}
              </span>
            </p>

            {product.stock > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700">Quantity:</span>
                <div className="flex items-center border rounded">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-gray-100">
                    <Minus size={16} />
                  </button>
                  <span className="px-4 py-2 min-w-[3rem] text-center">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="p-2 hover:bg-gray-100">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex-1 bg-white border-2 border-primary text-primary font-semibold px-6 py-3 rounded hover:bg-orange-50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart size={18} /> Add to Cart
            </button>
            <button
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="flex-1 bg-primary text-white font-semibold px-6 py-3 rounded hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>

      <ProductReviews productId={id} />
    </div>
  );
}
