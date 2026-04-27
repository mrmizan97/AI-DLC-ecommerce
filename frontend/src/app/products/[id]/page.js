"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShoppingCart, Minus, Plus, Tag as TagIcon, Heart, GitCompare, Zap } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import ProductGallery from "@/components/ProductGallery";
import ProductReviews from "@/components/ProductReviews";
import StarRating from "@/components/StarRating";
import { getGallery } from "@/lib/media";

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const user = useAuthStore((s) => s.user);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  // Wishlist state
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Flash sale state
  const [flashSale, setFlashSale] = useState(null);

  // Variants state
  const [variants, setVariants] = useState([]);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [activeVariant, setActiveVariant] = useState(null);

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then((r) => setProduct(r.data.data))
      .catch(() => toast.error("Product not found"))
      .finally(() => setLoading(false));
  }, [id]);

  // Check wishlist status
  useEffect(() => {
    if (!user || !id) return;
    api
      .get(`/wishlist/${id}/check`)
      .then((r) => setWishlisted(r.data.wishlisted || false))
      .catch(() => {});
  }, [user, id]);

  // Check flash sales
  useEffect(() => {
    api
      .get("/flash-sales")
      .then((r) => {
        const sales = r.data.data || [];
        const now = new Date();
        const activeSale = sales.find((sale) => {
          const start = new Date(sale.start_time);
          const end = new Date(sale.end_time);
          return (
            now >= start &&
            now <= end &&
            sale.product_id === parseInt(id)
          );
        });
        setFlashSale(activeSale || null);
      })
      .catch(() => {});
  }, [id]);

  // Load product variants
  useEffect(() => {
    api
      .get(`/product-variants?product_id=${id}`)
      .then((r) => {
        const variantData = r.data.data || [];
        setVariants(variantData);
      })
      .catch(() => {});
  }, [id]);

  // Group variants by type
  const variantGroups = variants.reduce((acc, v) => {
    if (!acc[v.variant_type]) acc[v.variant_type] = [];
    acc[v.variant_type].push(v);
    return acc;
  }, {});

  const handleVariantSelect = (type, variant) => {
    const newSelected = { ...selectedVariants, [type]: variant };
    setSelectedVariants(newSelected);

    // Find if all types are selected and get matching variant
    const allTypes = Object.keys(variantGroups);
    const allSelected = allTypes.every((t) => newSelected[t]);
    if (allSelected) {
      setActiveVariant(variant);
    } else {
      setActiveVariant(variant);
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      toast.error("Please login to use wishlist");
      return;
    }
    setWishlistLoading(true);
    try {
      if (wishlisted) {
        await api.delete(`/wishlist/${id}`);
        setWishlisted(false);
        toast.success("Removed from wishlist");
      } else {
        await api.post("/wishlist", { product_id: parseInt(id) });
        setWishlisted(true);
        toast.success("Added to wishlist");
      }
    } catch {
      toast.error("Failed to update wishlist");
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleCompare = () => {
    const existing = JSON.parse(localStorage.getItem("compare_ids") || "[]");
    if (existing.includes(parseInt(id))) {
      toast("Already in compare list");
      return;
    }
    if (existing.length >= 4) {
      toast.error("Compare list is full (max 4 products)");
      return;
    }
    const updated = [...existing, parseInt(id)];
    localStorage.setItem("compare_ids", JSON.stringify(updated));
    toast.success(
      <span>
        Added to compare.{" "}
        <a href="/compare" className="underline font-medium">
          View comparison →
        </a>
      </span>
    );
  };

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast.success(`Added ${quantity} × ${product.name} to cart`);
  };

  const handleBuyNow = () => {
    addItem(product, quantity);
    router.push("/cart");
  };

  // Determine displayed price and stock
  const displayPrice = activeVariant?.price
    ? parseFloat(activeVariant.price)
    : product
    ? parseFloat(product.price)
    : 0;

  const displayStock = activeVariant?.stock !== undefined
    ? activeVariant.stock
    : product?.stock ?? 0;

  const salePrice = flashSale ? parseFloat(flashSale.sale_price) : null;
  const discountPercent = flashSale
    ? Math.round(((displayPrice - salePrice) / displayPrice) * 100)
    : null;

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
          {product.brand && (
            <p className="text-gray-600 mb-3">
              Brand: <span className="font-medium">{product.brand}</span>
            </p>
          )}

          {/* Price section — flash sale or regular */}
          <div className="bg-orange-50 p-4 rounded mb-4 relative">
            {flashSale ? (
              <>
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-3xl font-bold text-red-600">
                    ${salePrice.toFixed(2)}
                  </p>
                  <p className="text-xl text-gray-400 line-through">
                    ${displayPrice.toFixed(2)}
                  </p>
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <Zap size={12} /> {discountPercent}% OFF
                  </span>
                </div>
                <p className="text-xs text-red-500 mt-1 font-medium">
                  Flash Sale ends {new Date(flashSale.end_time).toLocaleString()}
                </p>
              </>
            ) : (
              <p className="text-3xl font-bold text-primary">
                ${displayPrice.toFixed(2)}
              </p>
            )}
            <p className="text-sm text-gray-600 mt-1">SKU: {product.sku}</p>
          </div>

          <p className="text-gray-700 mb-4">
            {product.description || "No description available."}
          </p>

          {product.tags?.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {product.tags.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700"
                >
                  <TagIcon size={12} /> {t.name}
                </span>
              ))}
            </div>
          )}

          {/* Variants selector */}
          {Object.keys(variantGroups).length > 0 && (
            <div className="mb-4 space-y-3">
              {Object.entries(variantGroups).map(([type, typeVariants]) => (
                <div key={type}>
                  <p className="text-sm font-medium text-gray-700 mb-1 capitalize">{type}:</p>
                  <div className="flex flex-wrap gap-2">
                    {typeVariants.map((v) => {
                      const isSelected = selectedVariants[type]?.id === v.id;
                      return (
                        <button
                          key={v.id}
                          onClick={() => handleVariantSelect(type, v)}
                          className={`px-3 py-1 rounded-full text-sm border-2 transition-colors ${
                            isSelected
                              ? "border-orange-500 bg-orange-500 text-white"
                              : "border-gray-300 text-gray-700 hover:border-orange-400"
                          } ${v.stock === 0 ? "opacity-40 cursor-not-allowed line-through" : ""}`}
                          disabled={v.stock === 0}
                        >
                          {v.value}
                          {v.price && v.price !== product.price ? (
                            <span className="ml-1 text-xs opacity-80">
                              (+${(parseFloat(v.price) - parseFloat(product.price)).toFixed(2)})
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Stock:{" "}
              <span
                className={
                  displayStock > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"
                }
              >
                {displayStock > 0 ? `${displayStock} available` : "Out of stock"}
              </span>
            </p>

            {displayStock > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700">Quantity:</span>
                <div className="flex items-center border rounded">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-gray-100"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="px-4 py-2 min-w-[3rem] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(displayStock, quantity + 1))}
                    className="p-2 hover:bg-gray-100"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleAddToCart}
              disabled={displayStock === 0}
              className="flex-1 bg-white border-2 border-primary text-primary font-semibold px-6 py-3 rounded hover:bg-orange-50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart size={18} /> Add to Cart
            </button>
            <button
              onClick={handleBuyNow}
              disabled={displayStock === 0}
              className="flex-1 bg-primary text-white font-semibold px-6 py-3 rounded hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Buy Now
            </button>

            {user && (
              <button
                onClick={handleToggleWishlist}
                disabled={wishlistLoading}
                title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                className={`p-3 rounded border-2 transition-colors disabled:opacity-50 ${
                  wishlisted
                    ? "border-red-400 bg-red-50 text-red-500 hover:bg-red-100"
                    : "border-gray-300 text-gray-500 hover:border-red-400 hover:text-red-500"
                }`}
              >
                <Heart size={20} fill={wishlisted ? "currentColor" : "none"} />
              </button>
            )}

            <button
              onClick={handleCompare}
              title="Add to compare"
              className="p-3 rounded border-2 border-gray-300 text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors"
            >
              <GitCompare size={20} />
            </button>
          </div>
        </div>
      </div>

      <ProductReviews productId={id} />
    </div>
  );
}
