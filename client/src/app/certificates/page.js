"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchApi } from "@/lib/utils";
import {
  IconCertificate,
  IconFileTypePdf,
  IconDownload,
  IconEye,
  IconX,
  IconExternalLink,
  IconShare,
  IconPrinter,
  IconCheck,
} from "@tabler/icons-react";

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const copyLink = (c) => {
    navigator.clipboard.writeText(c.fileUrl);
    setCopiedId(c.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const printFile = (c) => {
    const win = window.open(c.fileUrl, "_blank");
    if (!win) return;
    if (c.fileType === "pdf") {
      win.onload = () => win.print();
    } else {
      win.onload = () => {
        win.document.title = c.title;
        win.print();
      };
    }
  };

  useEffect(() => {
    fetchApi("/certificates")
      .then((r) => setCertificates(r?.data?.certificates || []))
      .catch(() => setCertificates([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0A0A0A] text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-[#141416] via-[#0f0f12] to-[#0A0A0A]" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-600/20 blur-[140px] rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 lg:px-10 py-16 md:py-24 text-center">
          <nav className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.15em] text-white/40 mb-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/80">Certificates</span>
          </nav>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-600/15 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-5">
            <IconCertificate className="h-3.5 w-3.5" /> Verified Compliance
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            Our <span className="text-red-500">Certificates</span>
          </h1>
          <p className="text-white/60 max-w-xl mx-auto text-[14px] md:text-base leading-relaxed">
            GMP, FSSAI and third-party lab reports for MWP SUPPLEMENTS formulations.
          </p>
        </div>
      </section>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10 py-12 md:py-16">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden animate-pulse bg-white border border-gray-200">
                <div className="aspect-[3/4] w-full bg-gray-100" />
                <div className="p-3">
                  <div className="h-3.5 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : certificates.length === 0 ? (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-50 flex items-center justify-center">
              <IconCertificate className="w-8 h-8 text-red-500" stroke={1.5} />
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-2">Coming Soon</h2>
            <p className="text-gray-500 text-[14px] max-w-sm mx-auto">
              Our certificates are being finalised and will appear here shortly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {certificates.map((c) => (
              <div key={c.id} className="group rounded-2xl bg-white border border-gray-200 overflow-hidden hover:border-red-300 hover:-translate-y-1 hover:shadow-[0_18px_44px_-18px_rgba(0,0,0,0.18)] transition-all duration-300">
                <button
                  onClick={() => setPreview(c)}
                  className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100 block"
                >
                  {c.fileType === "pdf" ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-gray-50 to-gray-200">
                      <IconFileTypePdf className="h-12 w-12 text-red-400" stroke={1.5} />
                      <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">PDF Document</span>
                    </div>
                  ) : (
                    <Image
                      src={c.fileUrl}
                      alt={c.title}
                      fill
                      sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <IconEye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" stroke={2} />
                  </div>
                </button>
                <div className="p-3.5">
                  <h3 className="text-[13px] font-bold text-gray-900 leading-snug truncate mb-2.5">{c.title}</h3>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPreview(c)}
                      className="flex-1 h-8 rounded-lg bg-gray-50 hover:bg-red-50 hover:text-red-600 text-gray-400 flex items-center justify-center transition-colors"
                      aria-label={`View ${c.title}`}
                      title="View"
                    >
                      <IconEye className="h-4 w-4" stroke={2} />
                    </button>
                    <a
                      href={c.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 h-8 rounded-lg bg-gray-50 hover:bg-red-50 hover:text-red-600 text-gray-400 flex items-center justify-center transition-colors"
                      aria-label={`Open ${c.title}`}
                      title="Open in new tab"
                    >
                      <IconExternalLink className="h-4 w-4" stroke={2} />
                    </a>
                    <button
                      onClick={() => printFile(c)}
                      className="flex-1 h-8 rounded-lg bg-gray-50 hover:bg-red-50 hover:text-red-600 text-gray-400 flex items-center justify-center transition-colors"
                      aria-label={`Print ${c.title}`}
                      title="Print"
                    >
                      <IconPrinter className="h-4 w-4" stroke={2} />
                    </button>
                    <button
                      onClick={() => copyLink(c)}
                      className="flex-1 h-8 rounded-lg bg-gray-50 hover:bg-red-50 hover:text-red-600 text-gray-400 flex items-center justify-center transition-colors"
                      aria-label={`Share link to ${c.title}`}
                      title="Copy link"
                    >
                      {copiedId === c.id ? (
                        <IconCheck className="h-4 w-4 text-emerald-500" stroke={2} />
                      ) : (
                        <IconShare className="h-4 w-4" stroke={2} />
                      )}
                    </button>
                    <a
                      href={c.fileUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 h-8 rounded-lg bg-gray-50 hover:bg-red-50 hover:text-red-600 text-gray-400 flex items-center justify-center transition-colors"
                      aria-label={`Download ${c.title}`}
                      title="Download"
                    >
                      <IconDownload className="h-4 w-4" stroke={2} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-5"
          onClick={() => setPreview(null)}
        >
          <button
            onClick={() => setPreview(null)}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Close"
          >
            <IconX className="h-5 w-5" stroke={2} />
          </button>
          <div className="max-w-3xl w-full max-h-[85vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            {preview.fileType === "pdf" ? (
              <iframe
                src={preview.fileUrl}
                title={preview.title}
                className="w-full h-[75vh] rounded-xl bg-white"
              />
            ) : (
              <div className="relative w-full h-[75vh] rounded-xl overflow-hidden bg-white">
                <Image src={preview.fileUrl} alt={preview.title} fill className="object-contain" sizes="800px" />
              </div>
            )}
            <div className="mt-4 flex flex-col items-center gap-3">
              <span className="text-white text-sm font-semibold">{preview.title}</span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <a
                  href={preview.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] uppercase tracking-wider font-bold transition-colors"
                >
                  <IconExternalLink className="h-3.5 w-3.5" /> Open
                </a>
                <button
                  onClick={() => printFile(preview)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] uppercase tracking-wider font-bold transition-colors"
                >
                  <IconPrinter className="h-3.5 w-3.5" /> Print
                </button>
                <button
                  onClick={() => copyLink(preview)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] uppercase tracking-wider font-bold transition-colors"
                >
                  {copiedId === preview.id ? (
                    <IconCheck className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <IconShare className="h-3.5 w-3.5" />
                  )}
                  {copiedId === preview.id ? "Copied" : "Share"}
                </button>
                <a
                  href={preview.fileUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] uppercase tracking-wider font-bold transition-colors"
                >
                  <IconDownload className="h-3.5 w-3.5" /> Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
