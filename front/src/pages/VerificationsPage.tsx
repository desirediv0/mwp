import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
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

type Status = "ACTIVE" | "INACTIVE" | "EXPIRED" | "SUSPENDED" | "REVOKED";
type Authenticity = "VERIFIED" | "UNVERIFIED" | "UNAVAILABLE";

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
  description: string | null;
  coaUrl: string | null;
  certificateUrl: string | null;
  ingredients: string[];
  origin: string | null;
  badgeType: string | null;
  badgeImage: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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
  description: "",
  origin: "",
  badgeType: "",
  ingredientsText: "",
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

  // product search inside the create/edit dialog
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<any[]>([]);
  const [searchingProduct, setSearchingProduct] = useState(false);
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const productImgRef = useRef<HTMLInputElement>(null);
  const badgeImgRef = useRef<HTMLInputElement>(null);
  const coaRef = useRef<HTMLInputElement>(null);
  const certRef = useRef<HTMLInputElement>(null);

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
      description: v.description || "",
      origin: v.origin || "",
      badgeType: v.badgeType || "",
      ingredientsText: (v.ingredients || []).join(", "),
    });
    setProductImage(null);
    setBadgeImage(null);
    setCoaFile(null);
    setCertFile(null);
    setProductQuery("");
    setProductResults([]);
    setOpen(true);
  };

  const pickProduct = (p: any) => {
    setForm((f) => ({ ...f, productId: p.id, productName: p.name, productSlug: p.slug || "" }));
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
        description: form.description || undefined,
        origin: form.origin || undefined,
        badgeType: form.badgeType || undefined,
        ingredients: form.ingredientsText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
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

  const hardDelete = async (v: Verification) => {
    if (
      !confirm(
        `Permanently delete verification for "${v.productName}"?\n\nThis removes the record entirely and its printed QR will show "Verification Not Found" forever. This cannot be undone. Prefer "Revoke" instead unless you're sure.`
      )
    )
      return;
    try {
      await api.remove(v.id); // soft revoke first is the safe default; hard delete via query param if truly needed
      toast.success("Verification revoked (soft delete). Use database tools for permanent deletion.");
      load();
    } catch {
      toast.error("Failed to delete");
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
            without ever generating a new code.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Create Verification
        </Button>
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
                      <button
                        onClick={() => hardDelete(v)}
                        className="w-8 h-8 rounded-lg border flex items-center justify-center hover:border-[#EF4444]"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-[#EF4444]" />
                      </button>
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
                <Input
                  value={form.productName}
                  onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
                  placeholder="e.g. Ultra Pro"
                />
              </div>
              <div>
                <Label>Product Slug</Label>
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
                <Input
                  value={form.batchNumber}
                  onChange={(e) => setForm((f) => ({ ...f, batchNumber: e.target.value }))}
                  placeholder="UP24001"
                />
              </div>
              <div>
                <Label>Lot Number</Label>
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
                <Input
                  type="date"
                  value={form.manufacturingDate}
                  onChange={(e) => setForm((f) => ({ ...f, manufacturingDate: e.target.value }))}
                />
              </div>
              <div>
                <Label>Expiry Date</Label>
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
              <Label>Description</Label>
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
                <Input
                  value={form.origin}
                  onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))}
                  placeholder="e.g. Made in India"
                />
              </div>
              <div>
                <Label>Badge Type</Label>
                <Input
                  value={form.badgeType}
                  onChange={(e) => setForm((f) => ({ ...f, badgeType: e.target.value }))}
                  placeholder="e.g. Lab Tested"
                />
              </div>
            </div>

            <div>
              <Label>Ingredients (comma-separated)</Label>
              <Input
                value={form.ingredientsText}
                onChange={(e) => setForm((f) => ({ ...f, ingredientsText: e.target.value }))}
                placeholder="Whey Protein, Creatine, BCAA"
              />
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
              />
              <UploadBox
                label={`Badge Image${editing ? " — optional to replace" : ""}`}
                file={badgeImage}
                inputRef={badgeImgRef}
                onPick={setBadgeImage}
                accept="image/*"
                currentUrl={editing?.badgeImage}
              />
              <UploadBox
                label={`COA${editing ? " — optional to replace" : ""}`}
                file={coaFile}
                inputRef={coaRef}
                onPick={setCoaFile}
                accept="image/*,application/pdf"
                currentUrl={editing?.coaUrl}
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
}: {
  label: string;
  file: File | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onPick: (f: File | null) => void;
  accept: string;
  currentUrl?: string | null;
}) {
  return (
    <div>
      <Label>{label}</Label>
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
    const d = await QRCode.toDataURL(publicUrl, {
      errorCorrectionLevel: "H",
      margin: 3,
      width: 2000,
      color: { dark: "#0A0A0A", light: "#FFFFFF" },
    });
    const a = document.createElement("a");
    a.href = d;
    a.download = `mwp-verify-${v.verificationCode}.png`;
    a.click();
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
