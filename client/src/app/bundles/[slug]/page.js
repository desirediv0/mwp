"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { fetchApi } from "@/lib/utils";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { IconCheck, IconShoppingCart, IconX } from "@tabler/icons-react";

export default function BundleDetailPage({ params }) {
  const slug = params?.slug;
  const { addBundleToCart } = useCart();
  const { isAuthenticated, openAuthModal } = useAuth();
  const [bundle, setBundle] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [addingToCart, setAddingToCart] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    const fetchBundle = async () => {
      try {
        const res = await fetchApi(`/bundles/${slug}`);
        setBundle(res.data);
      } catch (err) {
        console.error("Failed to fetch bundle:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBundle();
  }, [slug]);

  useEffect(() => {
    if (!bundle) return;
    const fetchProducts = async () => {
      try {
        setProductsLoading(true);
        const res = await fetchApi(`/bundles/${slug}/products?limit=100`);
        const allProducts = res.data?.products || [];
        setProducts(allProducts.filter((p) => {
          const variant = p.variants?.[0];
          const stock = variant?.quantity ?? 0;
          return stock > 0;
        }));
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, [slug, bundle]);

  const toggleProduct = (productId) => {
    setSelectedProducts((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }

      const maxItems = bundle?.rule?.maxItems;
      if (maxItems && prev.length >= maxItems) {
        toast.error(`Maximum ${maxItems} products allowed for this bundle`);
        return prev;
      }

      return [...prev, productId];
    });
  };

  const getBundlePrice = () => {
    if (!bundle?.pricingSlabs) return 0;
    const slab = bundle.pricingSlabs.find(
      (s) => s.itemCount === selectedProducts.length
    );
    return slab ? slab.price : 0;
  };

  const getActualPrice = () => {
    return products
      .filter((p) => selectedProducts.includes(p.id))
      .reduce((sum, p) => {
        const price = p.variants?.[0]?.salePrice || p.variants?.[0]?.price || 0;
        return sum + parseFloat(price);
      }, 0);
  };

  const handleAddToCart = async () => {
    if (selectedProducts.length === 0) {
      toast.error("Please select at least one product");
      return;
    }

    const minItems = bundle?.rule?.minItems || 2;
    if (selectedProducts.length < minItems) {
      toast.error(`Minimum ${minItems} products required for this bundle`);
      return;
    }

    try {
      setAddingToCart(true);
      const bPrice = getBundlePrice();
      const aPrice = getActualPrice();
      await addBundleToCart(bundle.id, selectedProducts, {
        title: bundle.title || "Curated Bundle",
        price: bPrice || aPrice || 0,
        actualPrice: aPrice,
        banner: bundle.banner || products.find(p => selectedProducts.includes(p.id))?.images?.[0]?.url || "/logo.png",
        slug: bundle.slug,
        selectedProductDetails: products.filter(p => selectedProducts.includes(p.id)),
      });
      toast.success("Bundle added to cart!");
      setSelectedProducts([]);
    } catch (err) {
      toast.error(err.message || "Failed to add bundle to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-dark" />
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-light text-[#111111] mb-4">
          Bundle Not Found
        </h1>
        <a
          href="/bundles"
          className="px-6 py-3 bg-gold-dark text-white text-sm uppercase tracking-wider"
        >
          Browse Bundles
        </a>
      </div>
    );
  }

  const bundlePrice = getBundlePrice();
  const actualPrice = getActualPrice();
  const savings = actualPrice - bundlePrice;

  return (
    <div className="min-h-screen bg-ivory">
      {/* Hero Banner */}
      <div className="relative h-64 md:h-80">
        {bundle.banner ? (
          <Image
            src={bundle.banner}
            alt={bundle.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-noir via-stone/90 to-gold/20 flex items-center justify-center">
            <span className="text-white text-5xl font-light tracking-widest">
              {bundle.bundleType}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center text-center text-white px-4">
          <div>
            <span className="inline-block px-3 py-1 bg-white/20 text-white text-xs uppercase tracking-wider mb-4 rounded">
              {bundle.bundleType}
            </span>
            <h1 className="text-3xl md:text-4xl font-light tracking-widest uppercase mb-2">
              {bundle.title}
            </h1>
            {bundle.description && (
              <p className="text-sm text-gray-200 max-w-xl mx-auto">
                {bundle.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Products Grid */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-medium text-[#111111] mb-6 uppercase tracking-wider">
              Select Your Products
            </h2>

            {productsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-lg p-4 animate-pulse"
                  >
                    <div className="aspect-square bg-gray-100 rounded mb-3" />
                    <div className="h-3 bg-gray-100 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-500">
                  No products available for this bundle.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((product) => {
                  const isSelected = selectedProducts.includes(product.id);
                  const variant = product.variants?.[0];
                  const price = variant?.salePrice || variant?.price || 0;

                  return (
                    <button
                      key={product.id}
                      onClick={() => toggleProduct(product.id)}
                      className={`relative bg-white overflow-hidden text-left transition-all ${isSelected
                        ? "ring-2 ring-gold-dark shadow-md"
                        : "hover:shadow-md"
                        }`}
                      style={{
                        border: "1px solid #EAEAEA",
                        borderRadius: "8px",
                      }}
                    >
                      {/* Selection Indicator */}
                      <div
                        className={`absolute top-2 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isSelected
                          ? "bg-gold-dark text-white"
                          : "bg-white/80 text-gray-400"
                          }`}
                      >
                        {isSelected ? (
                          <IconCheck size={14} />
                        ) : (
                          <IconX size={14} className="opacity-0" />
                        )}
                      </div>

                      {/* Product Image */}
                      <div className="relative aspect-square overflow-hidden">
                        {product.images?.[0]?.url ? (
                          <Image
                            src={product.images[0].url}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-ivory-deep flex items-center justify-center">
                            <span className="text-gray-400 text-xs">
                              No Image
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-3">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                          {product.brand?.name || product.categories?.[0]?.name}
                        </p>
                        <h3 className="text-sm font-medium text-[#111111] line-clamp-2">
                          {product.name}
                        </h3>
                        {variant && variant.attributes && variant.attributes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {variant.attributes.map((attr, idx) => (
                              <span key={idx} className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">
                                {attr.attribute}: {attr.value}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-sm text-gold-dark font-medium mt-1">
                          ₹{parseFloat(price).toLocaleString()}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bundle Summary Sidebar */}
          <div className="lg:col-span-1">
            <div
              className="bg-white p-6 sticky top-24"
              style={{ border: "1px solid #EAEAEA", borderRadius: "8px" }}
            >
              <h3 className="text-lg font-medium text-[#111111] mb-4 uppercase tracking-wider">
                Bundle Summary
              </h3>

              {/* Selected Count */}
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                <span className="text-sm text-gray-500">Selected Items</span>
                <span className="text-sm font-medium">
                  {selectedProducts.length}
                  {bundle.rule?.maxItems
                    ? ` / ${bundle.rule.maxItems}`
                    : ""}
                </span>
              </div>

              {/* Pricing Slabs */}
              {bundle.pricingSlabs && bundle.pricingSlabs.length > 0 && (
                <div className="mb-4 pb-4 border-b border-gray-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                    Pricing Tiers
                  </p>
                  <div className="space-y-1">
                    {bundle.pricingSlabs.map((slab, idx) => (
                      <div
                        key={idx}
                        className={`flex justify-between text-xs p-2 rounded ${selectedProducts.length === slab.itemCount
                          ? "bg-green-50 text-green-700 font-medium"
                          : "text-gray-600"
                          }`}
                      >
                        <span>
                          {slab.label || `${slab.itemCount} Products`}
                        </span>
                        <span>₹{slab.price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Breakdown */}
              {selectedProducts.length > 0 && (
                <div className="mb-4 pb-4 border-b border-gray-100">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">Actual Price</span>
                    <span className="line-through text-gray-400">
                      ₹{actualPrice.toLocaleString()}
                    </span>
                  </div>
                  {bundlePrice > 0 && (
                    <>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Bundle Price</span>
                        <span className="font-medium text-[#111111]">
                          ₹{bundlePrice.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600 font-medium">
                          You Save
                        </span>
                        <span className="text-green-600 font-medium">
                          ₹{savings.toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={
                  addingToCart ||
                  selectedProducts.length === 0 ||
                  bundlePrice === 0
                }
                className="w-full py-3 bg-noir text-white text-sm uppercase tracking-wider font-medium hover:bg-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {addingToCart ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <>
                    <IconShoppingCart size={16} />
                    Add Bundle to Cart
                  </>
                )}
              </button>

              {selectedProducts.length > 0 && bundlePrice === 0 && (
                <p className="text-xs text-center text-orange-500 mt-2">
                  Select {bundle.rule?.minItems || 2} or more items to see
                  bundle price
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
