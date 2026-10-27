import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import JSZip from "jszip";
import JoditEditor from "jodit-react";
import { verifications as api, products as productsApi } from "@/api/adminService";
import { joditEditorConfig } from "@/config/joditEditorConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ShieldCheck,
  QrCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  Search,
  RotateCcw,
  Printer,
  X,
} from "lucide-react";

const SITE_BASE = "https://mwpsupplements.com";
const verifyUrl = (code: string) => `${SITE_BASE}/verify/${code}`;

// File name for the graphic designer: MWP-ULTRA-PRO-QR
const qrBaseName = (productName: string) =>
  `MWP-${String(productName).toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "")}-QR`;

const QR_STYLE = { errorCorrectionLevel: "H" as const, margin: 3, color: { dark: "#0A0A0A", light: "#FFFFFF" } };

const saveBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

type Status = "ACTIVE" | "INACTIVE" | "EXPIRED" | "SUSPENDED" | "REVOKED";
type Authenticity = "VERIFIED" | "UNVERIFIED" | "UNAVAILABLE";

interface IngredientRow {
  name: string;
  amount: string;
  description: string;
  origin: string;
}

interface Verification {
  id: string;
  verificationCode: string;
  productId: string | null;
  productName: string;
  productSlug: string | null;
  productImage: string | null;
  batchNumber: string | null;
  lotNumber: string | null;
  manufacturingDate: string | null;
  expiryDate: string | null;
  authenticityStatus: Authenticity;
  status: Status;
  tagline: string | null;
  shortDescription: string | null;
  description: string | null;
  features: string[];
  coaUrl: string | null;
  certificateUrl: string | null;
  ingredients: IngredientRow[];
  origin: string | null;
  badgeType: string | null;
  badgeImage: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const emptyIngredient: IngredientRow = { name: "", amount: "", description: "", origin: "" };

const STATUS_STYLES: Record<Status, string> = {
  ACTIVE: "bg-[#E8F5E9] text-[#2E7D32]",
  INACTIVE: "bg-[#F3F4F6] text-[#6B7280]",
  EXPIRED: "bg-[#FEF3C7] text-[#B45309]",
  SUSPENDED: "bg-[#FEF3C7] text-[#B45309]",
  REVOKED: "bg-[#FEF2F2] text-[#DC2626]",
};

const emptyForm = {
  productId: "",
  productName: "",
  productSlug: "",
  batchNumber: "",
  lotNumber: "",
  manufacturingDate: "",
  expiryDate: "",
  authenticityStatus: "VERIFIED" as Authenticity,
  status: "ACTIVE" as Status,
  tagline: "",
  shortDescription: "",
  description: "",
  featuresText: "",
  origin: "",
  badgeType: "",
  ingredients: [] as IngredientRow[],
};

const descriptionConfig = {
  ...joditEditorConfig,
  height: 220,
  placeholder: "Short product description shown on the verification page",
};

export default function VerificationsPage() {
  const [list, setList] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Verification | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [productImage, setProductImage] = useState<File | null>(null);
  const [badgeImage, setBadgeImage] = useState<File | null>(null);
  const [coaFile, setCoaFile] = useState<File | null>(null);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const [qrTarget, setQrTarget] = useState<Verification | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [zipping, setZipping] = useState(false);

  // product search inside the create/edit dialog
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<any[]>([]);
  const [searchingProduct, setSearchingProduct] = useState(false);
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const productImgRef = useRef<HTMLInputElement>(null);
  const badgeImgRef = useRef<HTMLInputElement>(null);
  const coaRef = useRef<HTMLInputElement>(null);
  const certRef = useRef<HTMLInputElement>(null);

  // One ZIP for the graphic designer: a vector SVG and a 2000px PNG for every product, named by product.
  const downloadAllQr = async () => {
    setZipping(true);
    try {
      const res = await api.list({ limit: 100 });
      const rows: Verification[] = res.data?.data?.verifications || [];
      if (!rows.length) {
        toast.error("There are no QR codes yet");
        return;
      }
      const zip = new JSZip();
      const folder = zip.folder("MWP-Product-QR-Codes")!;
      const lines = ["MWP SUPPLEMENTS - permanent QR links (they never change)", ""];
      for (const v of rows) {
        const url = verifyUrl(v.verificationCode);
        const base = qrBaseName(v.productName);
        folder.file(`${base}.svg`, await QRCode.toString(url, { ...QR_STYLE, type: "svg", width: 1024 }));
        const png = await QRCode.toDataURL(url, { ...QR_STYLE, width: 2000 });
        folder.file(`${base}.png`, png.split(",")[1], { base64: true });
        lines.push(`${v.productName.padEnd(18)} ${url}`);
      }
      lines.push("", "Use the SVG for print (sharp at any size). Keep a white border around the QR when placing it on the label.");
      folder.file("README.txt", lines.join("\n"));
      saveBlob(await zip.generateAsync({ type: "blob" }), "MWP-Product-QR-Codes.zip");
      toast.success(`Downloaded ${rows.length} QR codes`);
    } catch {
      toast.error("Could not build the ZIP. Try again.");
    } finally {
      setZipping(false);
    }
  };

  // Every real product that has no verification yet gets one, using only data the product already has.
  const syncProducts = async () => {
    setSyncing(true);
    try {
      const res = await api.syncProducts();
      const n = res.data?.data?.count ?? 0;
      toast.success(n ? `Created ${n} verification${n === 1 ? "" : "s"} from your products. Add batch, ingredients and COA next.` : "Every product already has a verification");
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not add the missing products");
    } finally {
      setSyncing(false);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.list({
        search: search || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        limit: 100,
      });
      setList(res.data?.data?.verifications || []);
      setStatusCounts(res.data?.data?.statusCounts || {});
    } catch {
      toast.error("Failed to load verifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);
    const term = productQuery.trim();
    if (term.length < 2) {
      setProductResults([]);
      return;
    }
    setSearchingProduct(true);
    debRef.current = setTimeout(async () => {
      try {
        const res = await productsApi.getProducts({ search: term, limit: 8 } as any);
        setProductResults(res.data?.data?.products || []);
      } catch {
        setProductResults([]);
      } finally {
        setSearchingProduct(false);
      }
    }, 350);
    return () => {
      if (debRef.current) clearTimeout(debRef.current);
    };
  }, [productQuery]);

  const resetDialog = () => {
    setEditing(null);
    setForm(emptyForm);
    setProductImage(null);
    setBadgeImage(null);
    setCoaFile(null);
    setCertFile(null);
    setProductQuery("");
    setProductResults([]);
  };

  const openCreate = () => {
    resetDialog();
    setOpen(true);
  };

  const openEdit = (v: Verification) => {
    setEditing(v);
    setForm({
      productId: v.productId || "",
      productName: v.productName,
      productSlug: v.productSlug || "",
      batchNumber: v.batchNumber || "",
      lotNumber: v.lotNumber || "",
      manufacturingDate: v.manufacturingDate ? v.manufacturingDate.slice(0, 10) : "",
      expiryDate: v.expiryDate ? v.expiryDate.slice(0, 10) : "",
      authenticityStatus: v.authenticityStatus,
      status: v.status,
      tagline: v.tagline || "",
      shortDescription: v.shortDescription || "",
      description: v.description || "",
      featuresText: (v.features || []).join(", "),
      origin: v.origin || "",
      badgeType: v.badgeType || "",
      ingredients: (v.ingredients || []).length > 0 ? v.ingredients : [],
    });
    setProductImage(null);
    setBadgeImage(null);
    setCoaFile(null);
    setCertFile(null);
    setProductQuery("");
    setProductResults([]);
    setOpen(true);
  };

  // "<p>Power For Your Everyday.</p><p>Titan Force is ...</p>" -> a short tagline plus the rest as the summary
  const splitDescription = (html: string) => {
    const decode = (t: string) => t.replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&#39;|&rsquo;/g, "'").replace(/\s+/g, " ").trim();
    const blocks = (String(html || "").match(/<(p|h[1-6]|li)[^>]*>[\s\S]*?<\/\1>/gi) || []).map((b) => decode(b.replace(/<[^>]+>/g, " "))).filter(Boolean);
    const plain = blocks.length ? blocks : [decode(String(html || "").replace(/<[^>]+>/g, " "))].filter(Boolean);
    if (plain.length > 1 && plain[0].length <= 90) return { tagline: plain[0], shortDescription: plain.slice(1).join(" ") };
    return { tagline: "", shortDescription: plain.join(" ") };
  };

  const pickProduct = (p: any) => {
    const { tagline, shortDescription } = splitDescription(p.description || "");
    const packs: string[] = Array.from(
      new Set(
        (p.variants || [])
          .flatMap((v: any) => (v.attributes || []).map((a: any) => a?.attributeValue?.value || a?.value))
          .filter(Boolean)
          .map((x: string) => x.replace(/\b([a-z])/g, (m) => m.toUpperCase()))
      )
    );
    setForm((f) => ({
      ...f,
      productId: p.id,
      productName: String(p.name || "").replace(/[™®]/g, "").trim(),
      productSlug: p.slug || "",
      // only fill what is still empty, never overwrite what you typed
      tagline: f.tagline || tagline,
      shortDescription: f.shortDescription || shortDescription,
      featuresText: f.featuresText || packs.join(", "),
    }));
    setProductQuery("");
    setProductResults([]);
  };

  const save = async () => {
    if (!form.productName.trim()) {
      toast.error("Product name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        productId: form.productId || undefined,
        productName: form.productName,
        productSlug: form.productSlug || undefined,
        batchNumber: form.batchNumber || undefined,
        lotNumber: form.lotNumber || undefined,
        manufacturingDate: form.manufacturingDate || undefined,
        expiryDate: form.expiryDate || undefined,
        authenticityStatus: form.authenticityStatus,
        status: form.status,
        tagline: form.tagline || undefined,
        shortDescription: form.shortDescription || undefined,
        description: form.description || undefined,
        features: form.featuresText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        origin: form.origin || undefined,
        badgeType: form.badgeType || undefined,
        ingredients: form.ingredients.filter((i) => i.name.trim()),
        productImage,
        badgeImage,
        coa: coaFile,
        certificate: certFile,
      };
      if (editing) {
        await api.update(editing.id, payload);
        toast.success("Verification updated");
      } else {
        const res = await api.create(payload);
        toast.success("Verification created");
        const created = res.data?.data?.verification as Verification;
        if (created) {
          setOpen(false);
          load();
          setQrTarget(created);
          return;
        }
      }
      setOpen(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (v: Verification) => {
    if (
      !confirm(
        `Revoke verification for "${v.productName}"?\n\nThe existing QR code will show as REVOKED and its permanent URL will still resolve, but will no longer show as verified. This cannot be quickly undone by reprinting — reactivate from here if needed.`
      )
    )
      return;
    try {
      await api.remove(v.id);
      toast.success("Verification revoked");
      load();
    } catch {
      toast.error("Failed to revoke");
    }
  };

  const reactivate = async (v: Verification) => {
    try {
      await api.reactivate(v.id);
      toast.success("Verification reactivated");
      load();
    } catch {
      toast.error("Failed to reactivate");
    }
  };

  const filtered = list;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#1F2937] flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-[#4CAF50]" /> QR Verifications
          </h1>
          <p className="text-sm text-[#9CA3AF] mt-1 max-w-2xl">
            Each verification gets a permanent QR code and URL that never changes. Editing
            product, batch, COA, badge, or status here updates what the same printed QR shows —
            without ever generating a new code. A QR cannot be deleted from here: use Revoke to switch it off,
            and you can reactivate it any time.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={downloadAllQr} disabled={zipping}>
            {zipping ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} Download all QR (ZIP)
          </Button>
          <Button variant="outline" onClick={syncProducts} disabled={syncing}>
            {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />} Add missing products
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> Create Verification
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {(["ACTIVE", "SUSPENDED", "EXPIRED", "REVOKED", "INACTIVE"] as Status[]).map((s) => (
          <div key={s} className="rounded-xl border bg-white p-3.5">
            <p className="text-[10px] uppercase tracking-wide font-bold text-[#9CA3AF]">{s}</p>
            <p className="text-xl font-bold text-[#1F2937] mt-1">{statusCounts[s] || 0}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product, code, batch, or lot…"
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
            <SelectItem value="REVOKED">Revoked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-[#4CAF50]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border rounded-xl bg-white">
          <ShieldCheck className="h-9 w-9 text-[#9CA3AF] mx-auto mb-3" />
          <p className="text-[#1F2937] font-semibold">No verifications yet</p>
          <p className="text-sm text-[#9CA3AF] mt-1">Create one to generate a permanent QR code.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-[#F9FAFB] text-left text-[10px] uppercase tracking-wide text-[#9CA3AF]">
                <th className="px-4 py-3 font-bold">Product</th>
                <th className="px-4 py-3 font-bold">Verification ID</th>
                <th className="px-4 py-3 font-bold">Batch / Lot</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Updated</th>
                <th className="px-4 py-3 font-bold">QR</th>
                <th className="px-4 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className="border-b last:border-0 hover:bg-[#F9FAFB]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] overflow-hidden shrink-0 flex items-center justify-center">
                        {v.productImage ? (
                          <img src={v.productImage} alt={v.productName} className="w-full h-full object-cover" />
                        ) : (
                          <ShieldCheck className="h-4 w-4 text-[#9CA3AF]" />
                        )}
                      </div>
                      <span className="font-semibold text-[#1F2937] truncate max-w-[160px]">{v.productName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#4B5563]">{v.verificationCode}</td>
                  <td className="px-4 py-3 text-xs text-[#6B7280]">
                    {v.batchNumber || "—"} {v.lotNumber ? `/ ${v.lotNumber}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`${STATUS_STYLES[v.status]} border-0 font-bold text-[10px]`}>
                      {v.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#9CA3AF]">
                    {new Date(v.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setQrTarget(v)}
                      className="w-8 h-8 rounded-lg border flex items-center justify-center hover:border-[#4CAF50]"
                      title="View QR"
                    >
                      <QrCode className="h-4 w-4 text-[#4CAF50]" />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        onClick={() => openEdit(v)}
                        className="w-8 h-8 rounded-lg border flex items-center justify-center hover:border-[#4CAF50]"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5 text-[#4B5563]" />
                      </button>
                      {v.status === "REVOKED" || !v.isActive ? (
                        <button
                          onClick={() => reactivate(v)}
                          className="w-8 h-8 rounded-lg border flex items-center justify-center hover:border-[#4CAF50]"
                          title="Reactivate"
                        >
                          <RotateCcw className="h-3.5 w-3.5 text-[#2E7D32]" />
                        </button>
                      ) : (
                        <button
                          onClick={() => deactivate(v)}
                          className="w-8 h-8 rounded-lg border flex items-center justify-center hover:border-[#EF4444]"
                          title="Revoke"
                        >
                          <X className="h-3.5 w-3.5 text-[#EF4444]" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[640px] max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Verification" : "Create Verification"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {editing && (
              <div className="rounded-lg border bg-[#F9FAFB] p-3">
                <Label className="text-[10px] uppercase tracking-wide text-[#9CA3AF]">
                  Permanent Verification ID
                </Label>
                <p className="font-mono text-sm font-bold text-[#1F2937] mt-0.5">
                  {editing.verificationCode}
                </p>
                <p className="text-[11px] text-[#9CA3AF] mt-1">
                  This ID is permanent and cannot be changed because it is linked to the printed
                  QR code.
                </p>
              </div>
            )}

            {/* product link + search */}
            <div>
              <Label>Link to Product (optional)</Label>
              <p className="text-[11px] leading-snug text-[#6B7280] mt-0.5 mb-1.5">Pick the real product from your store. Its name, web address, photo and description fill in for you, so nothing is retyped. The link is saved, so renaming the product later will not break this QR.</p>
              <div className="relative mt-1">
                <Input
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="Search products to auto-fill name/slug…"
                />
                {searchingProduct && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[#9CA3AF]" />
                )}
                {productResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border bg-white shadow-lg max-h-56 overflow-y-auto">
                    {productResults.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => pickProduct(p)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-[#F3F7F6] flex items-center gap-2"
                      >
                        <span className="truncate">{p.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Product Name *</Label>
              <p className="text-[11px] leading-snug text-[#6B7280] mt-0.5 mb-1.5">The big title customers see when they scan the QR.</p>
                <Input
                  value={form.productName}
                  onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
                  placeholder="e.g. Ultra Pro"
                />
              </div>
              <div>
                <Label>Product Slug</Label>
              <p className="text-[11px] leading-snug text-[#6B7280] mt-0.5 mb-1.5">The last part of the product's web address, for example ultra-pro. The &quot;Order Now&quot; button on the page uses it. It fills in when you pick a product.</p>
                <Input
                  value={form.productSlug}
                  onChange={(e) => setForm((f) => ({ ...f, productSlug: e.target.value }))}
                  placeholder="ultra-pro"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Batch Number</Label>
              <p className="text-[11px] leading-snug text-[#6B7280] mt-0.5 mb-1.5">The batch code printed on the bottle, for example UP24001. Customers can compare it with their label.</p>
                <Input
                  value={form.batchNumber}
                  onChange={(e) => setForm((f) => ({ ...f, batchNumber: e.target.value }))}
                  placeholder="UP24001"
                />
              </div>
              <div>
                <Label>Lot Number</Label>
              <p className="text-[11px] leading-snug text-[#6B7280] mt-0.5 mb-1.5">The lot code printed on the bottle. When a new lot is made, change it here: the same printed QR then shows the new lot.</p>
                <Input
                  value={form.lotNumber}
                  onChange={(e) => setForm((f) => ({ ...f, lotNumber: e.target.value }))}
                  placeholder="LOT24001"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Manufacturing Date</Label>
              <p className="text-[11px] leading-snug text-[#6B7280] mt-0.5 mb-1.5">The day this lot was made. Shown on the page.</p>
                <Input
                  type="date"
                  value={form.manufacturingDate}
                  onChange={(e) => setForm((f) => ({ ...f, manufacturingDate: e.target.value }))}
                />
              </div>
              <div>
                <Label>Expiry Date</Label>
              <p className="text-[11px] leading-snug text-[#6B7280] mt-0.5 mb-1.5">The best-before date of this lot. Shown on the page.</p>
                <Input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Authenticity Status</Label>
              <p className="text-[11px] leading-snug text-[#6B7280] mt-0.5 mb-1.5">Verified means this is a genuine MWP product. Choose Unverified or Unavailable only if you cannot confirm it.</p>
                <Select
                  value={form.authenticityStatus}
                  onValueChange={(v) => setForm((f) => ({ ...f, authenticityStatus: v as Authenticity }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VERIFIED">Verified</SelectItem>
                    <SelectItem value="UNVERIFIED">Unverified</SelectItem>
                    <SelectItem value="UNAVAILABLE">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Verification Status</Label>
              <p className="text-[11px] leading-snug text-[#6B7280] mt-0.5 mb-1.5">Active shows a green &quot;Verified&quot; banner. Suspended or Revoked shows a warning. Expired and Inactive tell customers the record is not current. The QR address itself never changes.</p>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v as Status }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    <SelectItem value="REVOKED">Revoked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Tagline</Label>
              <p className="text-[11px] leading-snug text-[#6B7280] mt-0.5 mb-1.5">One short line under the product name, for example: Built for the man who expects more from every day.</p>
              <Input
                value={form.tagline}
                onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                placeholder="e.g. Built for the man who expects more from every day."
              />
            </div>

            <div>
              <Label>Short Description</Label>
              <p className="text-[11px] leading-snug text-[#6B7280] mt-0.5 mb-1.5">One or two sentences about the product, shown under the tagline.</p>
              <Input
                value={form.shortDescription}
                onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
                placeholder="One or two line summary shown right under the tagline"
              />
            </div>

            <div>
              <Label>Feature Badges (comma-separated)</Label>
              <p className="text-[11px] leading-snug text-[#6B7280] mt-0.5 mb-1.5">Small tags shown as chips. Separate them with commas, for example: 60 Capsules, 2 Capsules Daily.</p>
              <Input
                value={form.featuresText}
                onChange={(e) => setForm((f) => ({ ...f, featuresText: e.target.value }))}
                placeholder="2 Capsules Daily, 60 Count, Globally Selected Ingredients"
              />
            </div>

            <div>
              <Label>Description</Label>
              <p className="text-[11px] leading-snug text-[#6B7280] mt-0.5 mb-1.5">Longer product information shown near the bottom of the page. Plain text is fine.</p>
              <div className="mt-1 border rounded-md overflow-hidden">
                <JoditEditor
                  value={form.description}
                  config={descriptionConfig}
                  onBlur={(content) => setForm((f) => ({ ...f, description: content }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Origin / Source</Label>
              <p className="text-[11px] leading-snug text-[#6B7280] mt-0.5 mb-1.5">Where the product is made or the ingredients come from. Only write what is true.</p>
                <Input
                  value={form.origin}
                  onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))}
                  placeholder="e.g. Made in India"
                />
              </div>
              <div>
                <Label>Badge Type</Label>
              <p className="text-[11px] leading-snug text-[#6B7280] mt-0.5 mb-1.5">Short text shown under the badge image, for example: Lab Tested.</p>
                <Input
                  value={form.badgeType}
                  onChange={(e) => setForm((f) => ({ ...f, badgeType: e.target.value }))}
                  placeholder="e.g. Lab Tested"
                />
              </div>
            </div>

            {/* Structured ingredient list */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <Label>Ingredients (What&apos;s Inside)</Label>
                  <p className="text-[11px] leading-snug text-[#6B7280] mt-0.5 max-w-md">List each ingredient with its amount per serving and where it comes from. Add only what your manufacturer has confirmed.</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setForm((f) => ({ ...f, ingredients: [...f.ingredients, { ...emptyIngredient }] }))
                  }
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Ingredient
                </Button>
              </div>
              {form.ingredients.length === 0 ? (
                <p className="text-xs text-[#9CA3AF] border border-dashed rounded-lg p-3 text-center">
                  No ingredients added yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {form.ingredients.map((ing, idx) => (
                    <div key={idx} className="rounded-lg border p-3 space-y-2 bg-[#F9FAFB]">
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={ing.name}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              ingredients: f.ingredients.map((it, i) =>
                                i === idx ? { ...it, name: e.target.value } : it
                              ),
                            }))
                          }
                          placeholder="Name, e.g. KSM-66 Ashwagandha"
                          className="bg-white"
                        />
                        <Input
                          value={ing.amount}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              ingredients: f.ingredients.map((it, i) =>
                                i === idx ? { ...it, amount: e.target.value } : it
                              ),
                            }))
                          }
                          placeholder="Amount, e.g. 600 mg"
                          className="bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={ing.description}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              ingredients: f.ingredients.map((it, i) =>
                                i === idx ? { ...it, description: e.target.value } : it
                              ),
                            }))
                          }
                          placeholder="Short benefit, e.g. Supports stress resilience"
                          className="bg-white"
                        />
                        <Input
                          value={ing.origin}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              ingredients: f.ingredients.map((it, i) =>
                                i === idx ? { ...it, origin: e.target.value } : it
                              ),
                            }))
                          }
                          placeholder="Origin, e.g. India"
                          className="bg-white"
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="border-[#EF4444] text-[#EF4444] hover:bg-[#FEF2F2]"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              ingredients: f.ingredients.filter((_, i) => i !== idx),
                            }))
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* file uploads */}
            <div className="grid grid-cols-2 gap-3">
              <UploadBox
                label={`Product Image${editing ? " — optional to replace" : ""}`}
                file={productImage}
                inputRef={productImgRef}
                onPick={setProductImage}
                accept="image/*"
                currentUrl={editing?.productImage}
                hint="Optional. Leave empty and the product's own photo from your store is used automatically."
              />
              <UploadBox
                label={`Badge Image${editing ? " — optional to replace" : ""}`}
                file={badgeImage}
                inputRef={badgeImgRef}
                onPick={setBadgeImage}
                accept="image/*"
                currentUrl={editing?.badgeImage}
                hint="Optional small round badge, for example a lab-tested seal."
              />
              <UploadBox
                label={`COA${editing ? " — optional to replace" : ""}`}
                file={coaFile}
                inputRef={coaRef}
                onPick={setCoaFile}
                accept="image/*,application/pdf"
                currentUrl={editing?.coaUrl}
                hint="Certificate of Analysis from an independent lab (PDF). Customers can open it from the page."
              />
              <UploadBox
                label={`Certificate${editing ? " — optional to replace" : ""}`}
                file={certFile}
                inputRef={certRef}
                onPick={setCertFile}
                accept="image/*,application/pdf"
                currentUrl={editing?.certificateUrl}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Save Changes" : "Create Verification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR preview dialog */}
      <Dialog open={!!qrTarget} onOpenChange={(o) => !o && setQrTarget(null)}>
        <DialogContent className="sm:max-w-[420px]">
          {qrTarget && <QrPreview v={qrTarget} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UploadBox({
  label,
  file,
  inputRef,
  onPick,
  accept,
  currentUrl,
  hint,
}: {
  label: string;
  file: File | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onPick: (f: File | null) => void;
  accept: string;
  currentUrl?: string | null;
  hint?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {hint && <p className="text-[11px] leading-snug text-[#6B7280] mt-0.5">{hint}</p>}
      <div
        onClick={() => inputRef.current?.click()}
        className="mt-1 border-2 border-dashed border-[#E5E7EB] rounded-lg p-3 text-center cursor-pointer hover:border-[#4CAF50]"
      >
        {file ? (
          <p className="text-xs text-[#1F2937] font-medium truncate">{file.name}</p>
        ) : currentUrl ? (
          <p className="text-xs text-[#9CA3AF]">Click to replace current file</p>
        ) : (
          <p className="text-xs text-[#9CA3AF]">Click to upload</p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0] || null)}
        />
      </div>
    </div>
  );
}

function QrPreview({ v }: { v: Verification }) {
  const publicUrl = verifyUrl(v.verificationCode);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(publicUrl, {
      errorCorrectionLevel: "H",
      margin: 3,
      width: 640,
      color: { dark: "#0A0A0A", light: "#FFFFFF" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicUrl]);

  const downloadPng = async () => {
    const d = await QRCode.toDataURL(publicUrl, { ...QR_STYLE, width: 2000 });
    const a = document.createElement("a");
    a.href = d;
    a.download = `${qrBaseName(v.productName)}.png`;
    a.click();
  };

  const downloadSvg = async () => {
    const svg = await QRCode.toString(publicUrl, { ...QR_STYLE, type: "svg", width: 1024 });
    saveBlob(new Blob([svg], { type: "image/svg+xml" }), `${qrBaseName(v.productName)}.svg`);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success("URL copied");
    setTimeout(() => setCopied(false), 1500);
  };

  const printQr = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>${v.verificationCode}</title></head>
      <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
        <img src="${qrDataUrl}" style="width:320px;height:320px;" />
        <p style="margin-top:12px;font-weight:bold;">${v.verificationCode}</p>
        <p style="color:#666;font-size:12px;">${publicUrl}</p>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="text-center py-2">
      <DialogHeader>
        <DialogTitle>{v.productName}</DialogTitle>
      </DialogHeader>
      <div className="mt-3 mx-auto w-56 h-56 rounded-xl border p-3 bg-white">
        {qrDataUrl ? (
          <img src={qrDataUrl} alt="Verification QR" className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[#9CA3AF]" />
          </div>
        )}
      </div>
      <p className="mt-3 font-mono text-sm font-bold text-[#1F2937]">{v.verificationCode}</p>
      <p className="text-[11px] text-[#6B7280]">File name: {qrBaseName(v.productName)}</p>
      <a
        href={publicUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 text-xs text-[#4B5563] hover:text-[#2E7D32] inline-flex items-center gap-1"
      >
        {publicUrl.replace(/^https?:\/\//, "")} <ExternalLink className="h-3 w-3" />
      </a>
      <Badge className={`${STATUS_STYLES[v.status]} border-0 font-bold text-[10px] mt-2`}>{v.status}</Badge>

      <div className="flex flex-wrap justify-center gap-2 mt-5">
        <Button size="sm" variant="outline" onClick={downloadPng}>
          <Download className="h-3.5 w-3.5 mr-1.5" /> PNG
        </Button>
        <Button size="sm" variant="outline" onClick={downloadSvg}>
          <Download className="h-3.5 w-3.5 mr-1.5" /> SVG (print)
        </Button>
        <Button size="sm" variant="outline" onClick={printQr}>
          <Printer className="h-3.5 w-3.5 mr-1.5" /> Print
        </Button>
        <Button size="sm" variant="outline" onClick={copyUrl}>
          {copied ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
          Copy URL
        </Button>
        <Button size="sm" variant="outline" onClick={() => window.open(publicUrl, "_blank")}>
          <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open
        </Button>
      </div>
    </div>
  );
}
