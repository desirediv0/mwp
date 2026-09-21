import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { certificates as api } from "@/api/adminService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  FileText,
  BadgeCheck,
  ExternalLink,
  QrCode,
  Download,
  Copy,
  Check,
  Printer,
} from "lucide-react";

// Permanent public URL — never changes, so the QR printed on packaging
// keeps working no matter how many certificates are added/edited/removed.
const CERTIFICATES_URL = "https://mwpsupplements.com/certificates";

interface Certificate {
  id: string;
  title: string;
  fileUrl: string;
  fileType: "image" | "pdf";
  displayOrder: number;
  isActive: boolean;
}

const empty = { title: "", displayOrder: 0, isActive: true };

export default function CertificatesPage() {
  const [list, setList] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Certificate | null>(null);
  const [form, setForm] = useState<typeof empty>(empty);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(CERTIFICATES_URL, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 640,
      color: { dark: "#0A0A0A", light: "#FFFFFF" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, []);

  const downloadQrPng = async () => {
    const d = await QRCode.toDataURL(CERTIFICATES_URL, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 2000,
      color: { dark: "#0A0A0A", light: "#FFFFFF" },
    });
    const a = document.createElement("a");
    a.href = d;
    a.download = "mwp-qr-certificates.png";
    a.click();
  };

  const downloadQrSvg = async () => {
    const svg = await QRCode.toString(CERTIFICATES_URL, {
      type: "svg",
      errorCorrectionLevel: "H",
      margin: 2,
      width: 1024,
      color: { dark: "#0A0A0A", light: "#FFFFFF" },
    });
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "mwp-qr-certificates.svg";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(CERTIFICATES_URL);
    setCopied(true);
    toast.success("URL copied");
    setTimeout(() => setCopied(false), 1500);
  };

  const printQr = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Certificates QR</title></head>
      <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
        <img src="${qrDataUrl}" style="width:320px;height:320px;" />
        <p style="margin-top:12px;font-weight:bold;">MWP Certificates</p>
        <p style="color:#666;font-size:12px;">${CERTIFICATES_URL}</p>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.list();
      setList(res.data?.data?.certificates || []);
    } catch {
      toast.error("Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...empty, displayOrder: list.length + 1 });
    setFile(null);
    setOpen(true);
  };

  const openEdit = (c: Certificate) => {
    setEditing(c);
    setForm({ title: c.title, displayOrder: c.displayOrder, isActive: c.isActive });
    setFile(null);
    setOpen(true);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!editing && !file) {
      toast.error("Please choose an image or PDF");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.update(editing.id, { ...form, file });
        toast.success("Certificate updated");
      } else {
        await api.create({ ...form, file: file! });
        toast.success("Certificate added");
      }
      setOpen(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: Certificate) => {
    if (!confirm(`Delete "${c.title}"?`)) return;
    try {
      await api.remove(c.id);
      toast.success("Deleted");
      load();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#1F2937] flex items-center gap-2">
            <BadgeCheck className="h-6 w-6 text-[#4CAF50]" /> Certificates
          </h1>
          <p className="text-sm text-[#9CA3AF] mt-1 max-w-xl">
            Upload GMP, FSSAI, lab reports and other compliance documents (image or PDF). They all
            appear together on the permanent{" "}
            <code className="bg-[#F3F4F6] px-1.5 py-0.5 rounded">/certificates</code> page — a QR
            code pointing there can be printed on packaging and will keep working even as you
            add, edit or remove certificates later.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Add Certificate
        </Button>
      </div>

      {/* Permanent QR code for the /certificates page */}
      <button
        onClick={() => setQrOpen(true)}
        className="w-full text-left rounded-xl border bg-white p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:border-[#4CAF50] transition-colors"
      >
        <div className="w-16 h-16 rounded-lg border bg-white p-1 shrink-0">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Certificates page QR" className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-[#9CA3AF]" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-[#1F2937] flex items-center gap-1.5">
            <QrCode className="h-4 w-4 text-[#4CAF50]" /> Certificates Page QR
          </h3>
          <p className="text-[11px] text-[#9CA3AF] mt-0.5 truncate" title={CERTIFICATES_URL}>
            {CERTIFICATES_URL}
          </p>
          <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-bold text-[#4CAF50]">
            View, download &amp; print QR
          </span>
        </div>
      </button>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#4CAF50]" />
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-20 border rounded-xl bg-white">
          <BadgeCheck className="h-10 w-10 text-[#9CA3AF] mx-auto mb-3" />
          <p className="text-[#1F2937] font-semibold">No certificates yet</p>
          <p className="text-sm text-[#9CA3AF] mt-1">Add your first certificate to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {list.map((c) => (
            <div key={c.id} className="rounded-xl border bg-white overflow-hidden">
              <a
                href={c.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative aspect-[3/4] bg-[#F3F4F6] flex items-center justify-center block group"
              >
                {c.fileType === "pdf" ? (
                  <div className="flex flex-col items-center text-[#9CA3AF]">
                    <FileText className="h-10 w-10" />
                    <span className="text-[10px] uppercase tracking-wide mt-1">PDF</span>
                  </div>
                ) : (
                  <img src={c.fileUrl} alt={c.title} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors">
                  <ExternalLink className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {!c.isActive && (
                  <span className="absolute top-2 left-2 bg-[#F59E0B] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    Hidden
                  </span>
                )}
                <span className="absolute top-2 right-2 bg-white/90 text-[#4B5563] text-[10px] font-bold px-2 py-0.5 rounded">
                  #{c.displayOrder}
                </span>
              </a>
              <div className="p-3">
                <h3 className="text-[13px] font-bold text-[#1F2937] leading-snug truncate">{c.title}</h3>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(c)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#EF4444] text-[#EF4444] hover:bg-[#FEF2F2]"
                    onClick={() => remove(c)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Certificate" : "Add Certificate"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. GMP Certification 2026"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => setForm((f) => ({ ...f, displayOrder: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                />
                <Label className="mb-0">Visible</Label>
              </div>
            </div>
            <div>
              <Label>File (image or PDF) {editing ? "— optional to replace" : "*"}</Label>
              <div
                onClick={() => fileRef.current?.click()}
                className="mt-1 border-2 border-dashed border-[#E5E7EB] rounded-lg p-4 text-center cursor-pointer hover:border-[#4CAF50]"
              >
                {file ? (
                  <p className="text-sm text-[#1F2937] font-medium">{file.name}</p>
                ) : editing ? (
                  <p className="text-sm text-[#9CA3AF]">Click to replace the current file</p>
                ) : (
                  <p className="text-sm text-[#9CA3AF]">Click to upload image or PDF</p>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={onFile}
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

      {/* QR preview dialog */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <div className="text-center py-2">
            <DialogHeader>
              <DialogTitle>MWP Certificates</DialogTitle>
            </DialogHeader>
            <div className="mt-3 mx-auto w-56 h-56 rounded-xl border p-3 bg-white">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Certificates QR" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-[#9CA3AF]" />
                </div>
              )}
            </div>
            <a
              href={CERTIFICATES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 text-xs text-[#4B5563] hover:text-[#2E7D32] inline-flex items-center gap-1"
            >
              {CERTIFICATES_URL.replace(/^https?:\/\//, "")} <ExternalLink className="h-3 w-3" />
            </a>

            <div className="flex flex-wrap justify-center gap-2 mt-5">
              <Button size="sm" variant="outline" onClick={downloadQrPng}>
                <Download className="h-3.5 w-3.5 mr-1.5" /> PNG
              </Button>
              <Button size="sm" variant="outline" onClick={downloadQrSvg}>
                <Download className="h-3.5 w-3.5 mr-1.5" /> SVG
              </Button>
              <Button size="sm" variant="outline" onClick={printQr}>
                <Printer className="h-3.5 w-3.5 mr-1.5" /> Print
              </Button>
              <Button size="sm" variant="outline" onClick={copyUrl}>
                {copied ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                Copy URL
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.open(CERTIFICATES_URL, "_blank")}>
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
