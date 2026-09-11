import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { products as productsApi } from "@/api/adminService";
import {
  QrCode,
  Download,
  ExternalLink,
  Loader2,
  Copy,
  Check,
  Search,
} from "lucide-react";
import { toast } from "sonner";

/* ---------------------------------------------------------------- */
/* Permanent site base — QR codes must always point at production.  */
const SITE_BASE = "https://mwpsupplements.com";

interface Manifest {
  name: string;
  url: string;
}
interface Product {
  id: string;
  name: string;
  slug: string;
}

const FORMATS = [
  { ext: "svg", label: "SVG" },
  { ext: "eps", label: "EPS" },
  { ext: "pdf", label: "PDF" },
  { ext: "png", label: "PNG" },
  { ext: "padded.png", label: "PNG (pad)" },
];

/* -------- reusable QR card that renders + downloads client-side --- */
function LiveQRCard({
  title,
  url,
  filePrefix,
  onCopy,
  copied,
}: {
  title: string;
  url: string;
  filePrefix: string;
  onCopy: (u: string) => void;
  copied: string | null;
}) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    QRCode.toDataURL(url, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 512,
      color: { dark: "#0A0A0A", light: "#FFFFFF" },
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(""));
  }, [url]);

  const downloadPng = async () => {
    const d = await QRCode.toDataURL(url, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 2000,
      color: { dark: "#0A0A0A", light: "#FFFFFF" },
    });
    const a = document.createElement("a");
    a.href = d;
    a.download = `mwp-qr-${filePrefix}.png`;
    a.click();
  };

  const downloadSvg = async () => {
    const svg = await QRCode.toString(url, {
      type: "svg",
      errorCorrectionLevel: "H",
      margin: 2,
      width: 1024,
      color: { dark: "#0A0A0A", light: "#FFFFFF" },
    });
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `mwp-qr-${filePrefix}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="p-4 flex items-start gap-4 border-b">
        <div className="w-24 h-24 rounded-lg border bg-white p-1.5 shrink-0">
          {dataUrl ? (
            <img src={dataUrl} alt={title} className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-[#9CA3AF]" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-[#1F2937] leading-snug">{title}</h3>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 text-[11px] text-[#4B5563] hover:text-[#2E7D32] truncate inline-flex items-center gap-1"
            title={url}
          >
            {url.replace(/^https?:\/\//, "")}
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
          <button
            onClick={() => onCopy(url)}
            className="mt-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-bold text-[#9CA3AF] hover:text-[#4B5563]"
          >
            {copied === url ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            Copy URL
          </button>
        </div>
      </div>
      <div className="p-3 grid grid-cols-2 gap-2">
        <Button size="sm" variant="outline" className="text-[11px] h-8" onClick={downloadPng}>
          <Download className="h-3.5 w-3.5 mr-1.5" /> PNG (2000px)
        </Button>
        <Button size="sm" variant="outline" className="text-[11px] h-8" onClick={downloadSvg}>
          <Download className="h-3.5 w-3.5 mr-1.5" /> SVG (vector)
        </Button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
export default function QRCodesPage() {
  const [manifest, setManifest] = useState<Manifest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/qr/manifest.json").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      productsApi
        .getProducts({ limit: 500 })
        .then((r: any) => r.data?.data?.products || [])
        .catch(() => []),
    ]).then(([m, p]: [Manifest[], any[]]) => {
      setManifest(Array.isArray(m) ? m : []);
      setProducts(
        (p || []).map((x: any) => ({ id: x.id, name: x.name, slug: x.slug }))
      );
      setLoading(false);
    });
  }, []);

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    toast.success("URL copied");
    setTimeout(() => setCopied(null), 1500);
  };

  const pretty = (name: string) =>
    name.replace(/^product-/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const filteredProducts = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(t) || p.slug.toLowerCase().includes(t)
    );
  }, [q, products]);

  const downloadPreGenerated = (name: string, ext: string) => {
    const a = document.createElement("a");
    a.href = `/qr/${name}.${ext}`;
    a.download = `mwp-qr-${name}.${ext}`;
    a.click();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#1F2937] flex items-center gap-2">
          <QrCode className="h-6 w-6 text-[#4CAF50]" /> QR Codes
        </h1>
        <p className="text-sm text-[#9CA3AF] mt-1 max-w-2xl">
          Print-ready QR codes that always point at{" "}
          <code className="bg-[#F3F4F6] px-1.5 py-0.5 rounded">mwpsupplements.com</code>. These
          URLs never change — pages may show &ldquo;Coming Soon&rdquo; first. Scanning a product
          QR opens that product page, where its full ingredient list (name, image, benefit) is
          shown.
        </p>
      </div>

      {/* ---------- Site pages (pre-generated: svg/eps/pdf/png) ---------- */}
      <section>
        <h2 className="text-base font-semibold text-[#1F2937] mb-3">Site Pages</h2>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-7 w-7 animate-spin text-[#4CAF50]" />
          </div>
        ) : manifest.length === 0 ? (
          <p className="text-sm text-[#9CA3AF]">
            No pre-generated codes found. Run <code className="bg-[#F3F4F6] px-1.5 py-0.5 rounded">npm run qr</code> in the server folder.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {manifest.map((m) => (
              <div key={m.name} className="rounded-xl border bg-white overflow-hidden">
                <div className="p-4 flex items-start gap-4 border-b">
                  <div className="w-24 h-24 rounded-lg border bg-white p-1.5 shrink-0">
                    <img src={`/qr/${m.name}.png`} alt={m.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-[#1F2937]">{pretty(m.name)}</h3>
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 text-[11px] text-[#4B5563] hover:text-[#2E7D32] truncate inline-flex items-center gap-1"
                    >
                      {m.url.replace(/^https?:\/\//, "")}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                    <button
                      onClick={() => copyUrl(m.url)}
                      className="mt-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-bold text-[#9CA3AF] hover:text-[#4B5563]"
                    >
                      {copied === m.url ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      Copy URL
                    </button>
                  </div>
                </div>
                <div className="p-3 grid grid-cols-3 gap-2">
                  {FORMATS.map((f) => (
                    <Button
                      key={f.ext}
                      size="sm"
                      variant="outline"
                      className="text-[10px] h-8 px-1"
                      onClick={() => downloadPreGenerated(m.name, f.ext)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      {f.label}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---------- Per-product (live client-side generation) ---------- */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <h2 className="text-base font-semibold text-[#1F2937]">
            Product Box QR Codes{" "}
            <span className="text-[#9CA3AF] font-normal">({filteredProducts.length})</span>
          </h2>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products…"
              className="pl-9 h-9"
            />
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-7 w-7 animate-spin text-[#4CAF50]" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <p className="text-sm text-[#9CA3AF]">No products found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProducts.map((p) => (
              <LiveQRCard
                key={p.id}
                title={p.name}
                url={`${SITE_BASE}/products/${p.slug}`}
                filePrefix={p.slug}
                onCopy={copyUrl}
                copied={copied}
              />
            ))}
          </div>
        )}
        <p className="text-xs text-[#9CA3AF] mt-3">
          Product QR codes are generated live and always point at the permanent product URL,
          so they keep working even after you add or edit the product&apos;s ingredients.
        </p>
      </section>
    </div>
  );
}
