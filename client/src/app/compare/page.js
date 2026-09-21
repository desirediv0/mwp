"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  GitCompareArrows,
  X,
  ShoppingBag,
  Loader2,
  Check,
  Minus,
  ArrowRight,
  Star,
} from "lucide-react";
import { fetchApi, formatCurrency, cn } from "@/lib/utils";
import { useCompare } from "@/lib/compare-context";
import { useCart } from "@/lib/cart-context";

const stripHtml = (html) =>
  typeof html === "string"
    ? html.replace(/<[^>]*>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim()
    : "";

const img = (raw) => {
  if (!raw) return "/placeholder.jpg";
  if (raw.startsWith("http") || raw.startsWith("/")) return raw;
  return `https://desirediv-storage.blr1.digitaloceanspaces.com/${raw}`;
};

const num = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return isNaN(n) ? null : n;
};

// Admin form label -> product field
const DETAIL_SECTIONS = [
  { key: "fragranceNotes", label: "Formula & Key Actives" },
  { key: "feelings", label: "Benefits & Results" },
  { key: "occasions", label: "How & When To Use" },
  { key: "behindThePerfume", label: "Clinical Science & Formulation" },
  { key: "shippingReturn", label: "Shipping & Return" },
  { key: "legalInfo", label: "Legal Information" },
];

/** Flatten a full product into a comparable shape */
function normalize(p) {
  const variants = (p.variants || []).filter((v) => v?.isActive !== false);

  const prices = variants.map((v) => num(v.salePrice) ?? num(v.price)).filter((n) => n !== null);
  const regs = variants.map((v) => num(v.price)).filter((n) => n !== null);
  const minPrice = prices.length
    ? Math.min(...prices)
    : num(p.basePrice) ?? num(p.salePrice) ?? num(p.price);
  const maxReg = regs.length ? Math.max(...regs) : num(p.regularPrice) ?? num(p.price);
  const onSale = maxReg && minPrice && maxReg > minPrice;
  const discount = onSale ? Math.round(((maxReg - minPrice) / maxReg) * 100) : 0;

  const stock = variants.length
    ? variants.reduce((s, v) => s + (v.stock ?? v.quantity ?? 0), 0)
    : p.stock ?? p.quantity ?? 0;

  const primaryCat =
    (p.categories || []).find((c) => c.isPrimary)?.category?.name ||
    p.category?.name ||
    "—";
  const otherCats = (p.categories || [])
    .map((c) => c.category?.name)
    .filter((n) => n && n !== primaryCat);
  const subCats = (p.subCategories || [])
    .map((s) => s.subCategory?.name || s.name)
    .filter(Boolean);

  // attribute options: name -> all possible values (from admin)
  const attributeOptions = (p.attributeOptions || []).map((a) => ({
    name: a.name,
    values: (a.values || []).map((v) => v.value),
  }));

  const sections = {};
  DETAIL_SECTIONS.forEach(({ key }) => {
    sections[key] = stripHtml(p[key] || "");
  });

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    image: p.images?.[0]?.url || p.image || null,
    primaryCat,
    otherCats,
    subCats,
    brand: p.brand?.name || null,
    gender: p.gender && p.gender !== "UNISEX" ? p.gender : "General wellness",
    ourProduct: !!p.ourProduct,
    hasVariants: !!p.hasVariants,
    attributeOptions,
    // Simple comparison fields (admin-entered)
    bestFor: stripHtml(p.bestFor || ""),
    mainBenefits: stripHtml(p.mainBenefits || ""),
    dosageForm: p.dosageForm || "",
    servingSize: p.servingSize || "",
    whenToTake: stripHtml(p.whenToTake || p.occasions || ""),
    minPrice,
    maxReg,
    onSale,
    discount,
    inStock: stock > 0,
    stock,
    rating: num(p.avgRating ?? p.averageRating ?? p.rating) || 0,
    reviews: p.reviewCount ?? p._count?.reviews ?? 0,
    tags: p.tags || [],
    keywords: p.keywords || "",
    notes: (p.notes || []).map((n) => n.title).filter(Boolean),
    variants: variants.map((v) => ({
      id: v.id,
      label:
        (v.attributes || []).map((a) => a.value).filter(Boolean).join(" / ") ||
        v.sku,
      price: num(v.price),
      salePrice: num(v.salePrice),
      stock: v.stock ?? v.quantity ?? 0,
      sku: v.sku,
    })),
    description: stripHtml(p.description || p.metaDescription || "").slice(0, 320),
    sections,
    firstVariantId: variants[0]?.id,
  };
}

export default function ComparePage() {
  const { items, removeFromCompare, clearCompare, ready } = useCompare();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState({});
  const [onlyDiff, setOnlyDiff] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (items.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    Promise.all(
      items.map((it) =>
        fetchApi(`/public/products/${it.slug}`)
          .then((r) => r?.data?.product)
          .catch(() => null)
      )
    ).then((res) => {
      if (!alive) return;
      // keep the order of `items`
      const byId = {};
      res.filter(Boolean).forEach((p) => (byId[p.id] = normalize(p)));
      setProducts(items.map((it) => byId[it.id]).filter(Boolean));
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [items, ready]);

  const handleAdd = async (row) => {
    if (!row.firstVariantId) {
      toast.error("Open the product to pick a size");
      return;
    }
    setAdding((p) => ({ ...p, [row.id]: true }));
    try {
      await addToCart(row.firstVariantId, 1);
      toast.success("Added to cart!");
    } catch {
      toast.error("Could not add to cart");
    } finally {
      setAdding((p) => ({ ...p, [row.id]: false }));
    }
  };

  /* ---------- empty state ---------- */
  if (ready && items.length === 0) {
    return (
      <div className="min-h-[70vh] bg-white flex items-center justify-center px-5">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-5">
            <GitCompareArrows className="h-8 w-8 text-neutral-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Nothing to compare yet</h1>
          <p className="text-[14px] text-gray-500 mb-6">
            Add 2–5 products using the compare button on any product, then see them side by side here.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-neutral-900 text-white text-[12px] uppercase tracking-wider font-bold hover:bg-neutral-900 transition-colors"
          >
            Browse Products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  // rows where values differ across products (for "highlight differences")
  const differs = (values) => {
    const norm = values.map((v) => JSON.stringify(v ?? null));
    return new Set(norm).size > 1;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="h-px w-8 bg-neutral-800/50" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-800 font-bold">Side by Side</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Compare <span className="text-neutral-800">Products</span>
            </h1>
            <p className="text-[14px] text-gray-500 mt-2">
              {items.length} product{items.length > 1 ? "s" : ""} selected
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-[12px] font-semibold text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyDiff}
                onChange={(e) => setOnlyDiff(e.target.checked)}
                className="w-4 h-4 rounded accent-neutral-900"
              />
              Highlight differences
            </label>
            <button
              onClick={clearCompare}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-[12px] uppercase tracking-wider font-bold hover:border-neutral-300 hover:text-neutral-800 transition-colors"
            >
              <X className="h-4 w-4" /> Clear All
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-600" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full border-collapse min-w-[760px]">
              <tbody>
                {/* Product cards */}
                <tr>
                  <Th className="align-bottom">Product</Th>
                  {products.map((p) => (
                    <td key={p.id} className="p-4 align-top border-l border-gray-100 bg-gray-50/60" style={{ minWidth: 230 }}>
                      <div className="relative">
                        <button
                          onClick={() => removeFromCompare(p.id)}
                          className="absolute -top-2 -right-2 z-10 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-400 hover:text-neutral-800 hover:border-neutral-300 transition-colors"
                          aria-label="Remove"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <Link href={`/products/${p.slug}`} className="block">
                          <div className="relative aspect-square rounded-xl overflow-hidden bg-white border border-gray-200 mb-3">
                            <Image src={img(p.image)} alt={p.name} fill className="object-cover" sizes="230px" />
                            {p.discount > 0 && (
                              <span className="absolute top-2 left-2 bg-neutral-900 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                                −{p.discount}%
                              </span>
                            )}
                          </div>
                          <h3 className="text-[14px] font-bold text-gray-900 leading-snug line-clamp-2 hover:text-neutral-800 transition-colors">
                            {p.name}
                          </h3>
                        </Link>
                        <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
                          <span className="text-[16px] font-extrabold text-gray-900">
                            {p.minPrice != null ? formatCurrency(p.minPrice) : "—"}
                          </span>
                          {p.onSale && (
                            <span className="text-[12px] text-gray-400 line-through">{formatCurrency(p.maxReg)}</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleAdd(p)}
                          disabled={!p.inStock || adding[p.id]}
                          className="mt-3 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-neutral-900 text-white text-[11px] uppercase tracking-wider font-bold hover:bg-neutral-900 disabled:opacity-50 transition-colors"
                        >
                          {adding[p.id] ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : p.inStock ? (
                            <><ShoppingBag className="h-3.5 w-3.5" /> Add to Cart</>
                          ) : (
                            "Out of Stock"
                          )}
                        </button>
                      </div>
                    </td>
                  ))}
                </tr>

                <SectionHead>Pricing</SectionHead>
                <Row label="Best Price" products={products} onlyDiff={onlyDiff} differs={differs} pick={(p) => p.minPrice}
                  render={(p) => <span className="text-[15px] font-extrabold text-gray-900">{p.minPrice != null ? formatCurrency(p.minPrice) : "—"}</span>} />
                <Row label="MRP" products={products} onlyDiff={onlyDiff} differs={differs} pick={(p) => p.maxReg}
                  render={(p) => p.maxReg ? <span className="text-[13px] text-gray-500 line-through">{formatCurrency(p.maxReg)}</span> : <Dash />} />
                <Row label="Discount" products={products} onlyDiff={onlyDiff} differs={differs} pick={(p) => p.discount}
                  render={(p) => p.discount > 0
                    ? <span className="inline-block bg-neutral-900 text-white text-[11px] font-extrabold px-2 py-0.5 rounded">−{p.discount}%</span>
                    : <Dash />} />

                <SectionHead>Quick Compare</SectionHead>
                <Row label="Best For" products={products} onlyDiff={onlyDiff} differs={differs} pick={(p) => p.bestFor || p.primaryCat}
                  render={(p) => <span className="text-[13px] font-semibold text-gray-800">{p.bestFor || p.primaryCat || "—"}</span>} />
                <Row label="Main Benefits" products={products} onlyDiff={onlyDiff} differs={differs} pick={(p) => p.mainBenefits}
                  render={(p) => <p className="text-[12.5px] text-gray-600 leading-relaxed">{p.mainBenefits || p.description || "—"}</p>} />
                <Row label="For" products={products} onlyDiff={onlyDiff} differs={differs} pick={(p) => p.gender}
                  render={(p) => <span className="text-[13px] font-semibold text-gray-800">{p.gender}</span>} />
                <Row label="Form" products={products} onlyDiff={onlyDiff} differs={differs} pick={(p) => p.dosageForm}
                  render={(p) => <span className="text-[13px] font-semibold text-gray-800">{p.dosageForm || "—"}</span>} />
                <Row label="Serving Size" products={products} onlyDiff={onlyDiff} differs={differs} pick={(p) => p.servingSize}
                  render={(p) => <span className="text-[13px] font-semibold text-gray-800">{p.servingSize || "—"}</span>} />
                <Row label="When To Take" products={products} onlyDiff={onlyDiff} differs={differs} pick={(p) => p.whenToTake}
                  render={(p) => <p className="text-[12.5px] text-gray-600 leading-relaxed">{p.whenToTake || "—"}</p>} />
                <Row label="Pack Options" products={products} onlyDiff={onlyDiff} differs={differs}
                  pick={(p) => p.variants.map((v) => v.label)}
                  render={(p) => p.variants.length ? <ChipList items={p.variants.map((v) => v.label)} /> : <Dash />} />

                <SectionHead>Classification</SectionHead>
                <Row label="Primary Category" products={products} onlyDiff={onlyDiff} differs={differs} pick={(p) => p.primaryCat}
                  render={(p) => <span className="text-[13px] font-semibold text-gray-800">{p.primaryCat}</span>} />
                <Row label="Also In" products={products} onlyDiff={onlyDiff} differs={differs} pick={(p) => p.otherCats}
                  render={(p) => p.otherCats.length ? <ChipList items={p.otherCats} /> : <Dash />} />
                <Row label="Sub-Categories" products={products} onlyDiff={onlyDiff} differs={differs} pick={(p) => p.subCats}
                  render={(p) => p.subCats.length ? <ChipList items={p.subCats} /> : <span className="text-[12px] text-gray-400">None</span>} />
                <Row label="Brand" products={products} onlyDiff={onlyDiff} differs={differs} pick={(p) => p.brand}
                  render={(p) => p.brand ? <span className="text-[13px] font-semibold text-gray-800">{p.brand}</span> : <Dash />} />
                <Row label="MWP Original" products={products} onlyDiff={onlyDiff} differs={differs} pick={(p) => p.ourProduct}
                  render={(p) => p.ourProduct ? <YesTag /> : <NoTag />} />

                <SectionHead>Variants &amp; Options</SectionHead>
                <Row label="Has Variants" products={products} onlyDiff={onlyDiff} differs={differs} pick={(p) => p.hasVariants}
                  render={(p) => p.hasVariants ? <YesTag label={`Yes · ${p.variants.length}`} /> : <NoTag label="No · single" />} />
                <Row label="Options" products={products} onlyDiff={onlyDiff} differs={differs} pick={(p) => p.attributeOptions}
                  render={(p) => p.attributeOptions.length ? (
                    <ul className="space-y-1.5">
                      {p.attributeOptions.map((a) => (
                        <li key={a.name} className="text-[12px] text-gray-700">
                          <span className="font-bold">{a.name}:</span>{" "}
                          <span className="text-gray-600">{a.values.join(", ")}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <span className="text-[12px] text-gray-400">No options — single SKU</span>} />
                <Row label="Variant Pricing" products={products} onlyDiff={onlyDiff} differs={differs}
                  pick={(p) => p.variants.map((v) => [v.label, v.salePrice ?? v.price])}
                  render={(p) => p.variants.length ? (
                    <ul className="space-y-1.5">
                      {p.variants.map((v) => (
                        <li key={v.id} className="text-[12px] text-gray-700">
                          <span className="font-semibold">{v.label}</span>
                          <span className="text-gray-500">
                            {" "}— {formatCurrency(v.salePrice ?? v.price)}
                            {v.salePrice && v.price && v.salePrice < v.price && (
                              <span className="line-through text-gray-400 ml-1">{formatCurrency(v.price)}</span>
                            )}
                          </span>
                          <span className={cn("ml-1.5 text-[10px] font-bold uppercase", v.stock > 0 ? "text-emerald-600" : "text-neutral-800")}>
                            {v.stock > 0 ? "in stock" : "sold out"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : <Dash />} />

                <SectionHead>Availability</SectionHead>
                <Row label="Stock" products={products} onlyDiff={onlyDiff} differs={differs} pick={(p) => p.inStock}
                  render={(p) => p.inStock
                    ? <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-emerald-600"><Check className="h-4 w-4" /> In Stock ({p.stock})</span>
                    : <span className="text-[12px] font-bold text-neutral-800">Out of Stock</span>} />
                <Row label="Rating" products={products} onlyDiff={onlyDiff} differs={differs} pick={(p) => p.rating}
                  render={(p) => (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="inline-flex">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className={cn("h-3.5 w-3.5", i <= Math.round(p.rating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200")} />
                        ))}
                      </span>
                      <span className="text-[12px] text-gray-500">
                        {p.rating > 0 ? p.rating.toFixed(1) : "New"}{p.reviews > 0 ? ` (${p.reviews})` : ""}
                      </span>
                    </span>
                  )} />

                <SectionHead>Product Details</SectionHead>
                <Row label="Overview" products={products} onlyDiff={onlyDiff} differs={differs} pick={(p) => p.description}
                  render={(p) => <p className="text-[12.5px] text-gray-600 leading-relaxed">{p.description || "—"}</p>} />
                {DETAIL_SECTIONS.filter(({ key }) => products.some((p) => p.sections[key])).map(({ key, label }) => (
                  <Row key={key} label={label} products={products} onlyDiff={onlyDiff} differs={differs} pick={(p) => p.sections[key]}
                    render={(p) => <p className="text-[12.5px] text-gray-600 leading-relaxed line-clamp-6">{p.sections[key] || "—"}</p>} />
                ))}
                {products.some((p) => p.notes.length > 0) && (
                  <Row label="Key Notes" products={products} onlyDiff={onlyDiff} differs={differs} pick={(p) => p.notes}
                    render={(p) => p.notes.length ? <ChipList items={p.notes} /> : <Dash />} />
                )}
                <Row label="Tags" products={products} onlyDiff={onlyDiff} differs={differs} pick={(p) => p.tags}
                  render={(p) => p.tags.length ? <ChipList items={p.tags.slice(0, 10)} /> : <Dash />} />

                {/* footer links */}
                <tr className="border-t border-gray-100">
                  <th className="p-4 bg-gray-50 sticky left-0 z-10" />
                  {products.map((p) => (
                    <td key={p.id} className="p-4 border-l border-gray-100">
                      <Link
                        href={`/products/${p.slug}`}
                        className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-wider font-bold text-neutral-800 hover:text-neutral-900"
                      >
                        View Full Details <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- small pieces ---------- */
function Th({ children, className }) {
  return (
    <th className={cn("p-4 text-left text-[11px] uppercase tracking-[0.15em] font-extrabold text-gray-500 bg-gray-50 sticky left-0 z-10 w-44", className)}>
      {children}
    </th>
  );
}

function SectionHead({ children }) {
  return (
    <tr>
      <td colSpan={99} className="bg-gray-900 text-white px-4 py-2.5 text-[11px] uppercase tracking-[0.2em] font-extrabold sticky left-0">
        {children}
      </td>
    </tr>
  );
}

function Row({ label, products, render, pick, onlyDiff, differs }) {
  const values = products.map(pick);
  const isDiff = differs(values);
  if (onlyDiff && !isDiff) return null;
  return (
    <tr className={cn("border-t border-gray-100", onlyDiff && isDiff && "bg-amber-50/40")}>
      <th className="p-4 text-left text-[11px] uppercase tracking-[0.14em] font-extrabold text-gray-500 bg-gray-50 sticky left-0 z-10 align-top w-44">
        {label}
      </th>
      {products.map((p) => (
        <td key={p.id} className="p-4 align-top border-l border-gray-100" style={{ minWidth: 230 }}>
          {render(p)}
        </td>
      ))}
    </tr>
  );
}

const Dash = () => <span className="text-gray-300">—</span>;

function ChipList({ items }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <span key={t} className="text-[10px] uppercase tracking-wide font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
          {t}
        </span>
      ))}
    </div>
  );
}

const YesTag = ({ label = "Yes" }) => (
  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase text-emerald-600">
    <Check className="h-3.5 w-3.5" /> {label}
  </span>
);
const NoTag = ({ label = "No" }) => (
  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase text-gray-400">
    <Minus className="h-3.5 w-3.5" /> {label}
  </span>
);
