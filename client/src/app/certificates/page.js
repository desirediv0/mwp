"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { IconCertificate, IconFileTypePdf, IconDownload, IconExternalLink, IconShare, IconCheck, IconX, IconArrowRight, IconSearch, IconEye, IconFiles } from "@tabler/icons-react";
import { toast } from "sonner";
import { fetchApi } from "@/lib/utils";
import { PageBreadcrumb, PageNextSteps } from "@/components/layout/Editorial";
import { EditorialCanvas } from "@/components/layout/EditorialCanvas";

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [copied, setCopied] = useState(null);
  const [retry, setRetry] = useState(0);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const previewTrigger = useRef(null);
  useEffect(() => {
    let alive = true;
    setLoading(true); setError("");
    fetchApi("/certificates").then(r => { if (alive) setCertificates(r?.data?.certificates || []); })
      .catch(() => { if (alive) setError("Documents couldn't be loaded. Please try again."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [retry]);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(null), 2500);
    return () => clearTimeout(timer);
  }, [copied]);
  const filtered = useMemo(() => certificates.filter(c => c.title.toLowerCase().includes(search.trim().toLowerCase()) && (type === "all" || (type === "pdf" ? c.fileType === "pdf" : c.fileType !== "pdf"))), [certificates, search, type]);
  const openPreview = (certificate, event) => { previewTrigger.current = event.currentTarget; setPreview(certificate); };
  const resetFilters = () => { setSearch(""); setType("all"); };
  const share = async c => {
    try { await navigator.clipboard.writeText(c.fileUrl); setCopied(c.id); toast.success("Document link copied"); }
    catch { toast.error("Couldn't copy the link. Use Open document to access the file."); }
  };
  const download = async c => {
    try {
      const response = await fetch(c.fileUrl);
      if (!response.ok) throw new Error("Download unavailable");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url; link.download = `${c.title.replace(/[^a-z0-9-]/gi, "-")}.${c.fileType === "pdf" ? "pdf" : "jpg"}`;
      link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { window.open(c.fileUrl, "_blank", "noopener,noreferrer"); toast.info("Document opened. Use your browser to save the file."); }
  };

  return (
    <EditorialCanvas className="mwp-certificates">
      <div className="mwp-container">
        <PageBreadcrumb current="Certificates" />
        <section className="mwp-doc-hero">
          <div data-editorial-reveal><p className="mwp-editorial-kicker"><IconCertificate size={17} stroke={1.4} /> THE MWP CERTIFICATE WALL</p><h1 className="mwp-title">The details.<br /><span>Open for you.</span></h1><p className="mwp-lead">Confidence starts with clarity. Our published quality documents, collected in one place for you to read, explore and keep.</p><div className="mwp-actions mt-7"><a href="#documents" className="mwp-button">Explore documents <IconArrowRight size={17} /></a><Link href="/contact" className="mwp-text-link">Ask about your batch</Link></div></div>
          <aside className="mwp-document-art" data-editorial-reveal><p>YOUR WINDOW INTO THE DETAILS</p><div className="mwp-document-art-card"><div><IconFiles size={31} stroke={1.2} /><span>Document library</span></div><strong>{loading ? "..." : error ? "--" : String(certificates.length).padStart(2, "0")}</strong><p>{loading ? "Loading published documents" : error ? "Documents are currently unavailable" : !certificates.length ? "Documents appear here when published" : `${certificates.length === 1 ? "Published document" : "Published documents"}, ready to explore`}</p></div><small>Only published documents appear here. For a specific product or batch, send our team the details on your bottle.</small></aside>
        </section>
      </div>
      <section id="documents" className="mwp-section border-t border-neutral-200" style={{ scrollMarginTop: 132 }}>
        <div className="mwp-container">
          <div className="mwp-library-toolbar"><div><p className="mwp-editorial-kicker">A CLOSER LOOK AT QUALITY</p><h2>Document library.</h2></div><div className="mwp-editorial-search"><IconSearch size={18} /><input type="search" className="mwp-field" aria-label="Search documents" placeholder="Find a document..." value={search} onChange={event => setSearch(event.target.value)} />{search && <button aria-label="Clear document search" onClick={() => setSearch("")}><IconX size={17} /></button>}</div></div>
          <div className="mwp-topic-list" role="group" aria-label="Document types">{[["all", "All documents"], ["pdf", "PDF reports"], ["image", "Image documents"]].map(([value, label]) => <button key={value} className="mwp-chip" aria-pressed={type === value} onClick={() => setType(value)}>{label}</button>)}</div>
          {!loading && !error && <p className="mwp-editorial-results" aria-live="polite"><span>{filtered.length}</span> of {certificates.length} published documents</p>}
          {loading ? <div className="mwp-doc-grid" role="status" aria-label="Loading documents">{[0, 1, 2].map(i => <div className="mwp-skeleton" key={i} />)}</div>
            : error ? <div className="mwp-empty" role="alert"><h2>Documents are unavailable</h2><p>{error}</p><button className="mwp-button" onClick={() => setRetry(r => r + 1)}>Try again</button></div>
            : !certificates.length ? <div className="mwp-empty"><IconCertificate className="mx-auto h-10 w-10" stroke={1.2} /><h2>No documents published yet.</h2><p>Certificates and reports will appear here when they are available. Our team can help with questions about your product.</p><Link className="mwp-button mwp-button-outline" href="/contact">Ask our team <IconArrowRight size={16} /></Link></div>
            : !filtered.length ? <div className="mwp-empty"><IconSearch className="mx-auto h-9 w-9" stroke={1.3} /><h2>No matching documents.</h2><p>Try a different title or document type.</p><button className="mwp-button mwp-button-outline" onClick={resetFilters}>Reset filters</button></div>
            : <div className="mwp-doc-grid">{filtered.map(c => <article className="mwp-doc-card" key={c.id}><button className="mwp-doc-cover" onClick={event => openPreview(c, event)} aria-label={`Preview ${c.title}`}>{c.fileType === "pdf" ? <IconFileTypePdf className="h-16 w-16" stroke={1.1} /> : <Image src={c.fileUrl} alt="" fill sizes="(max-width:640px) 90vw, (max-width:1024px) 45vw, 30vw" />}<span className="mwp-doc-type">{c.fileType === "pdf" ? "PDF REPORT" : "IMAGE DOCUMENT"}</span><span className="mwp-doc-preview-label"><IconEye size={14} /> Preview</span></button><div className="mwp-doc-info"><h3>{c.title}</h3><p>{c.fileType === "pdf" ? "PDF document" : "Image document"}</p><div className="mwp-doc-tools"><button className="mwp-button mwp-button-outline" onClick={event => openPreview(c, event)}>View document <IconArrowRight size={14} /></button><button className="mwp-icon-button" onClick={() => download(c)} aria-label={`Download ${c.title}`}><IconDownload size={17} /></button><button className="mwp-icon-button" onClick={() => share(c)} aria-label={`Copy link to ${c.title}`}>{copied === c.id ? <IconCheck size={17} /> : <IconShare size={17} />}</button></div></div></article>)}</div>}
        </div>
      </section>
      <PageNextSteps title="Questions about your bottle?" text="Send us your product name and batch details. We'll help you find the information you need." primary="/university" primaryLabel="Visit MWP University" />
      <Dialog.Root open={!!preview} onOpenChange={open => { if (!open) setPreview(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[100] bg-[#182c3d]/40 backdrop-blur-sm" />
          <Dialog.Content onCloseAutoFocus={event => { event.preventDefault(); previewTrigger.current?.focus(); }} className="mwp-document-dialog fixed left-1/2 top-1/2 z-[101] flex max-h-[90dvh] w-[calc(100%-24px)] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white p-4 text-neutral-900 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-4"><div><Dialog.Title className="text-lg">{preview?.title}</Dialog.Title><Dialog.Description className="mt-1 text-xs text-neutral-500">Preview the published document.</Dialog.Description></div><Dialog.Close className="mwp-icon-button" aria-label="Close document"><IconX size={20} /></Dialog.Close></div>
            {preview && <><div className="relative min-h-0 flex-1 bg-neutral-50">{preview.fileType === "pdf" ? <iframe src={preview.fileUrl} title={preview.title} className="h-[55dvh] w-full rounded-lg" /> : <div className="relative h-[55dvh]"><Image src={preview.fileUrl} alt={preview.title} fill sizes="900px" className="object-contain" /></div>}</div><div className="mwp-actions mt-4"><a className="mwp-button mwp-button-outline" href={preview.fileUrl} target="_blank" rel="noopener noreferrer"><IconExternalLink size={16} />Open document</a><button className="mwp-button" onClick={() => download(preview)}><IconDownload size={16} />Download</button></div></>}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </EditorialCanvas>
  );
}
