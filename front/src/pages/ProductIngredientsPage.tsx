import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { products as productsApi, productIngredients as api } from "@/api/adminService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Search,
  Loader2,
  FlaskConical,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  QrCode,
  Download,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";

const SITE_BASE = "https://mwpsupplements.com";

interface SearchProduct {
  id: string;
  name: string;
  description?: string;
  images?: { url: string; isPrimary?: boolean }[];
}

interface IngredientItem {
  id: string;
  name: string;
  scientificName: string | null;
  type: string | null;
  keyBenefit: string | null;
  source: string | null;
  description: string;
  image: string | null;
  displayOrder: number;
}

const emptyForm = {
  name: "",
  scientificName: "",
  type: "",
  keyBenefit: "",
  source: "",
  description: "",
  displayOrder: 0,
};

export default function ProductIngredientsPage() {
  /* ---------- search / select screen ---------- */
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selected, setSelected] = useState<SearchProduct | null>(null);

  useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debRef.current = setTimeout(async () => {
      try {
        const res = await productsApi.getProducts({ search: term, limit: 8 } as any);
        setResults(res.data?.data?.products || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      if (debRef.current) clearTimeout(debRef.current);
    };
  }, [query]);

  if (!selected) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-semibold text-[#1F2937] flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-[#4CAF50]" /> Ingredients
          </h1>
          <p className="text-sm text-[#9CA3AF] mt-1">
            Search for a product, then manage its ingredient list. Each product gets its own
            permanent page and QR code, so packaging QR codes never break — even as you add,
            edit, or remove ingredients later.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products by name…"
            className="pl-10 h-11"
            autoFocus
          />
        </div>

        {searching ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#4CAF50]" />
          </div>
        ) : query.trim().length >= 2 && results.length === 0 ? (
          <p className="text-sm text-[#9CA3AF] text-center py-8">No products match &ldquo;{query}&rdquo;.</p>
        ) : (
          <div className="space-y-2">
            {results.map((p) => {
              const img = p.images?.find((i) => i.isPrimary)?.url || p.images?.[0]?.url;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className="w-full flex items-center gap-4 p-3 rounded-xl border bg-white hover:border-[#4CAF50] hover:bg-[#F3F7F6] transition-colors text-left"
                >
                  <div className="w-14 h-14 rounded-lg bg-[#F3F4F6] overflow-hidden shrink-0 flex items-center justify-center">
                    {img ? (
                      <img src={img} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <FlaskConical className="h-5 w-5 text-[#9CA3AF]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#1F2937] truncate">{p.name}</p>
                    {p.description && (
                      <p
                        className="text-xs text-[#9CA3AF] truncate mt-0.5"
                        dangerouslySetInnerHTML={{ __html: p.description.replace(/<[^>]+>/g, " ").slice(0, 80) }}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return <ManageIngredients product={selected} onBack={() => setSelected(null)} />;
}

/* ==================================================================== */

function ManageIngredients({ product, onBack }: { product: SearchProduct; onBack: () => void }) {
  const [items, setItems] = useState<IngredientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<IngredientItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const productImg = product.images?.find((i) => i.isPrimary)?.url || product.images?.[0]?.url;
  const publicUrl = `${SITE_BASE}/ingredients/product/${product.id}`;

  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getForProduct(product.id);
      setItems(res.data?.data?.ingredients || []);
    } catch {
      toast.error("Failed to load ingredients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    QRCode.toDataURL(publicUrl, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 512,
      color: { dark: "#0A0A0A", light: "#FFFFFF" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const downloadQrPng = async () => {
    const d = await QRCode.toDataURL(publicUrl, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 2000,
      color: { dark: "#0A0A0A", light: "#FFFFFF" },
    });
    const a = document.createElement("a");
    a.href = d;
    a.download = `mwp-qr-ingredients-${product.id}.png`;
    a.click();
  };

  const downloadQrSvg = async () => {
    const svg = await QRCode.toString(publicUrl, {
      type: "svg",
      errorCorrectionLevel: "H",
      margin: 2,
      width: 1024,
      color: { dark: "#0A0A0A", light: "#FFFFFF" },
    });
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `mwp-qr-ingredients-${product.id}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success("URL copied");
    setTimeout(() => setCopied(false), 1500);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, displayOrder: items.length });
    setFile(null);
    setOpen(true);
  };

  const openEdit = (item: IngredientItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      scientificName: item.scientificName || "",
      type: item.type || "",
      keyBenefit: item.keyBenefit || "",
      source: item.source || "",
      description: item.description,
      displayOrder: item.displayOrder,
    });
    setFile(null);
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      toast.error("Name and description are required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.update(editing.id, { ...form, image: file });
        toast.success("Ingredient updated");
      } else {
        await api.create(product.id, { ...form, image: file });
        toast.success("Ingredient added");
      }
      setOpen(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: IngredientItem) => {
    if (!confirm(`Remove "${item.name}"?`)) return;
    try {
      await api.remove(item.id);
      toast.success("Removed");
      load();
    } catch {
      toast.error("Remove failed");
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1F2937] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to search
      </button>

      {/* Product header */}
      <div className="rounded-xl border bg-white p-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-lg bg-[#F3F4F6] overflow-hidden shrink-0 flex items-center justify-center">
          {productImg ? (
            <img src={productImg} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <FlaskConical className="h-6 w-6 text-[#9CA3AF]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-[#1F2937] truncate">{product.name}</h2>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            {items.length} ingredient{items.length === 1 ? "" : "s"} added
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Add Ingredient
        </Button>
      </div>

      {/* QR card */}
      <div className="rounded-xl border bg-white p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-20 h-20 rounded-lg border bg-white p-1 shrink-0">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Ingredients page QR" className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-[#9CA3AF]" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-1.5">
            <QrCode className="h-4 w-4 text-[#4CAF50]" /> Product Ingredients QR
          </h3>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 text-[11px] text-[#4B5563] hover:text-[#2E7D32] truncate inline-flex items-center gap-1"
            title={publicUrl}
          >
            {publicUrl.replace(/^https?:\/\//, "")}
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
          <button
            onClick={copyUrl}
            className="mt-1.5 flex items-center gap-1 text-[10px] uppercase tracking-wide font-bold text-[#9CA3AF] hover:text-[#4B5563]"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            Copy URL
          </button>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={downloadQrPng}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> PNG
          </Button>
          <Button size="sm" variant="outline" onClick={downloadQrSvg}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> SVG
          </Button>
        </div>
      </div>

      {/* Ingredients list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-[#4CAF50]" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 border rounded-xl bg-white">
          <FlaskConical className="h-9 w-9 text-[#9CA3AF] mx-auto mb-3" />
          <p className="text-[#1F2937] font-semibold">No ingredients yet</p>
          <p className="text-sm text-[#9CA3AF] mt-1">Add the first ingredient for this product.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl border bg-white">
              <div className="w-14 h-14 rounded-lg bg-[#F3F4F6] overflow-hidden shrink-0 flex items-center justify-center">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <FlaskConical className="h-5 w-5 text-[#9CA3AF]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-[#1F2937] truncate">{item.name}</p>
                  {item.type && (
                    <span className="text-[10px] uppercase tracking-wide font-bold text-[#2E7D32] bg-[#E8F5E9] px-1.5 py-0.5 rounded shrink-0">
                      {item.type}
                    </span>
                  )}
                  {item.keyBenefit && (
                    <span className="text-[10px] uppercase tracking-wide font-bold text-[#B45309] bg-[#FEF3C7] px-1.5 py-0.5 rounded shrink-0">
                      {item.keyBenefit}
                    </span>
                  )}
                </div>
                {item.scientificName && (
                  <p className="text-[11px] italic text-[#6B7280] mt-0.5">{item.scientificName}</p>
                )}
                <p className="text-xs text-[#9CA3AF] truncate mt-0.5">{item.description}</p>
                {item.source && (
                  <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                    <span className="font-semibold text-[#6B7280]">Source:</span> {item.source}
                  </p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-[#EF4444] text-[#EF4444] hover:bg-[#FEF2F2]"
                  onClick={() => remove(item)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Ingredient" : "Add Ingredient"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Ashwagandha"
                />
              </div>
              <div>
                <Label>Scientific Name</Label>
                <Input
                  value={form.scientificName}
                  onChange={(e) => setForm((f) => ({ ...f, scientificName: e.target.value }))}
                  placeholder="e.g. Withania Somnifera"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Input
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  placeholder="e.g. Extract, Powder"
                />
              </div>
              <div>
                <Label>Key Benefit (short tag)</Label>
                <Input
                  value={form.keyBenefit}
                  onChange={(e) => setForm((f) => ({ ...f, keyBenefit: e.target.value }))}
                  placeholder="e.g. Boosts Energy"
                />
              </div>
            </div>
            <div>
              <Label>Source / Origin</Label>
              <Input
                value={form.source}
                onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                placeholder="e.g. India — root extract"
              />
            </div>
            <div>
              <Label>Description *</Label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What does this ingredient do?"
                rows={3}
                className="w-full mt-1 rounded-md border border-[#E5E7EB] px-3 py-2 text-sm focus:outline-none focus:border-[#4CAF50]"
              />
            </div>
            <div>
              <Label>Display Order</Label>
              <Input
                type="number"
                value={form.displayOrder}
                onChange={(e) => setForm((f) => ({ ...f, displayOrder: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label>Image {editing ? "— optional to replace" : "(optional)"}</Label>
              <div
                onClick={() => fileRef.current?.click()}
                className="mt-1 border-2 border-dashed border-[#E5E7EB] rounded-lg p-4 text-center cursor-pointer hover:border-[#4CAF50]"
              >
                {file ? (
                  <p className="text-sm text-[#1F2937] font-medium">{file.name}</p>
                ) : editing ? (
                  <p className="text-sm text-[#9CA3AF]">Click to replace the current image</p>
                ) : (
                  <p className="text-sm text-[#9CA3AF]">Click to upload an image</p>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Save Changes" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
