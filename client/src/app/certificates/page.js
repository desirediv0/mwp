"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { IconCertificate, IconFileTypePdf, IconDownload, IconExternalLink, IconShare, IconCheck, IconX } from "@tabler/icons-react";
import { toast } from "sonner";
import { fetchApi } from "@/lib/utils";
import { PageBreadcrumb, PageNextSteps } from "@/components/layout/Editorial";

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [copied, setCopied] = useState(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true); setError("");
    fetchApi("/certificates").then(r => { if (alive) setCertificates(r?.data?.certificates || []); })
      .catch(() => { if (alive) setError("Documents couldn't be loaded. Please try again."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [retry]);
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
  return <div className="mwp-page"><div className="mwp-container"><PageBreadcrumb current="Certificates" /><section className="mwp-doc-hero"><div><h1 className="mwp-title">The details.<br />Open for you.</h1><p className="mwp-lead">Our published quality documents, collected in one place. Open a certificate, read the report, and keep a copy for your records.</p></div><aside className="mwp-doc-note"><strong>A closer look at quality</strong>Only published documents appear here. For information about a specific product or batch, contact our team with the details on your bottle.</aside></section></div>
    <section className="mwp-section border-t border-neutral-200"><div className="mwp-container"><div className="mwp-library-toolbar"><h2>Document library</h2><p className="text-sm text-neutral-500">{loading ? "Loading documents…" : `${certificates.length} published ${certificates.length === 1 ? "document" : "documents"}`}</p></div>
      {loading ? <div className="mwp-doc-grid" role="status" aria-label="Loading documents">{[0,1,2].map(i => <div className="mwp-skeleton" key={i} />)}</div> : error ? <div className="mwp-empty" role="alert"><h2>Documents are unavailable</h2><p>{error}</p><button className="mwp-button" onClick={() => setRetry(r => r + 1)}>Try again</button></div> : !certificates.length ? <div className="mwp-empty"><IconCertificate className="mx-auto h-9 w-9 text-neutral-500" /><h2>No documents published yet.</h2><p>Certificates and reports will appear here when they are available. Our team can help with questions about your product.</p><a className="mwp-button mwp-button-outline" href="/contact">Ask our team</a></div> : <div className="mwp-doc-grid">{certificates.map(c => <article className="mwp-doc-card" key={c.id}><button className="mwp-doc-cover" onClick={() => setPreview(c)} aria-label={`Preview ${c.title}`}>{c.fileType === "pdf" ? <IconFileTypePdf className="h-16 w-16 text-neutral-400" stroke={1.2} /> : <Image src={c.fileUrl} alt={c.title} fill sizes="(max-width:640px) 90vw, (max-width:1024px) 45vw, 30vw" />}</button><div className="mwp-doc-info"><h3>{c.title}</h3><p>{c.fileType === "pdf" ? "PDF document" : "Image document"}</p><div className="mwp-doc-tools"><button className="mwp-button mwp-button-outline !px-5" onClick={() => setPreview(c)}>View document</button><button className="mwp-icon-button" onClick={() => download(c)} aria-label={`Download ${c.title}`}><IconDownload className="h-4 w-4" /></button><button className="mwp-icon-button" onClick={() => share(c)} aria-label={`Copy link to ${c.title}`}>{copied === c.id ? <IconCheck className="h-4 w-4" /> : <IconShare className="h-4 w-4" />}</button></div></div></article>)}</div>}
    </div></section><PageNextSteps title="Questions about your bottle?" text="Send us your product name and batch details. We'll help you find the information you need." primary="/university" primaryLabel="Visit MWP University" />
    <Dialog.Root open={!!preview} onOpenChange={open => { if (!open) setPreview(null); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm" /><Dialog.Content className="fixed left-1/2 top-1/2 z-[101] flex max-h-[90dvh] w-[calc(100%-24px)] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white p-4 text-neutral-900 sm:p-6"><div className="mb-4 flex items-center justify-between gap-4"><div><Dialog.Title className="text-lg font-semibold">{preview?.title}</Dialog.Title><Dialog.Description className="mt-1 text-sm text-neutral-500">Preview the published document.</Dialog.Description></div><Dialog.Close className="mwp-icon-button" aria-label="Close document"><IconX className="h-5 w-5" /></Dialog.Close></div>{preview && <><div className="relative min-h-0 flex-1 bg-neutral-50">{preview.fileType === "pdf" ? <iframe src={preview.fileUrl} title={preview.title} className="h-[60dvh] w-full rounded-lg" /> : <div className="relative h-[60dvh]"><Image src={preview.fileUrl} alt={preview.title} fill sizes="900px" className="object-contain" /></div>}</div><div className="mwp-actions mt-4"><a className="mwp-button mwp-button-outline" href={preview.fileUrl} target="_blank" rel="noopener noreferrer"><IconExternalLink className="h-4 w-4" />Open document</a><button className="mwp-button" onClick={() => download(preview)}><IconDownload className="h-4 w-4" />Download</button></div></>}</Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
