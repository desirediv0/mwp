"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconMessageChatbot, IconX, IconSend, IconRotateClockwise, IconLoader2 } from "@tabler/icons-react";
import { fetchApi } from "@/lib/utils";
import { SITE_CONTACT } from "@/lib/siteContact";

// The website chat assistant. Answers come from Claude through our own server (/api/advisor/chat):
// the API key never reaches the browser, and every chat is saved so the team can review it.

const SID_KEY = "mwp_advisor_sid";
const QUICK = ["Which product is right for me?", "How do I take Power Max?", "Shipping and returns", "Are your products FDA approved?"];

const newSid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`);

function getSid() {
  try {
    let s = localStorage.getItem(SID_KEY);
    if (!s || !/^[A-Za-z0-9-]{16,64}$/.test(s)) {
      s = newSid();
      localStorage.setItem(SID_KEY, s);
    }
    return s;
  } catch {
    return newSid();
  }
}

// Turns links to our own site into normal links and keeps line breaks and "-" lists
function Message({ text }) {
  const parts = String(text).split(/(https?:\/\/[^\s)]+)/g);
  return (
    <p className="whitespace-pre-line text-[14px] leading-relaxed">
      {parts.map((p, i) =>
        /^https?:\/\//.test(p) ? (
          <a key={i} href={p.replace(/^https?:\/\/(www\.)?mwpsupplements\.com/, "")} className="font-semibold underline underline-offset-2" target={/mwpsupplements\.com/.test(p) ? undefined : "_blank"} rel="noopener noreferrer">
            {p.replace(/^https?:\/\/(www\.)?/, "")}
          </a>
        ) : (
          p
        )
      )}
    </p>
  );
}

function Avatar() {
  return (
    <span className="mb-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#E2B64D] to-[#b45f10] text-[#12213F]">
      <IconMessageChatbot size={15} stroke={2} />
    </span>
  );
}

export default function MwpAdvisor() {
  const [open, setOpen] = useState(false);
  const [cfg, setCfg] = useState(null); // { enabled, greeting, disclaimer }
  const [sid, setSid] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const loaded = useRef(false);

  // load settings and the earlier chat of this browser the first time the window opens
  useEffect(() => {
    if (!open || loaded.current) return;
    loaded.current = true;
    const id = getSid();
    setSid(id);
    fetchApi("/advisor/config")
      .then((r) => setCfg(r.data))
      .catch(() => setCfg({ enabled: false }));
    fetchApi(`/advisor/history?sessionId=${id}`)
      .then((r) => setMessages((r.data?.messages || []).map((m) => ({ role: m.role, text: m.content }))))
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open, cfg]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, busy, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const send = useCallback(
    async (raw) => {
      const text = String(raw ?? input).trim();
      if (!text || busy) return;
      setInput("");
      setError("");
      setMessages((m) => [...m, { role: "user", text }]);
      setBusy(true);
      try {
        const r = await fetchApi("/advisor/chat", {
          method: "POST",
          credentials: "include",
          body: JSON.stringify({ sessionId: sid, message: text, pageUrl: typeof window !== "undefined" ? window.location.href : "" }),
        });
        setMessages((m) => [...m, { role: "assistant", text: r.data.reply }]);
      } catch (e) {
        setError(e.message || "Something went wrong. Please try again.");
      } finally {
        setBusy(false);
      }
    },
    [input, busy, sid]
  );

  const restart = () => {
    const id = newSid();
    try {
      localStorage.setItem(SID_KEY, id);
    } catch {}
    setSid(id);
    setMessages([]);
    setError("");
  };

  const offline = cfg && !cfg.enabled;
  const greeting = cfg?.greeting || "Hi, I'm the MWP Advisor, an AI assistant. How can I help?";

  return (
    <div className={`fixed z-[60] pointer-events-none ${open ? "inset-0 sm:inset-auto sm:bottom-6 sm:right-6" : "bottom-[max(16px,env(safe-area-inset-bottom))] right-4 sm:bottom-4 sm:right-4"}`}>
      {open ? (
        <section
          role="dialog"
          aria-label="MWP Advisor chat"
          className="pointer-events-auto flex h-full w-full flex-col overflow-hidden bg-[#F6F1E4] shadow-[0_30px_80px_-20px_rgba(18,33,63,0.6)] sm:h-[min(82vh,660px)] sm:w-[410px] sm:rounded-3xl sm:border sm:border-[#D9CFAE]"
        >
          <header className="flex items-center justify-between gap-3 border-b-4 border-[#C9972B] bg-gradient-to-br from-[#12213F] via-[#1B3158] to-[#12213F] px-4 py-4 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#E2B64D] to-[#b45f10] text-[#12213F] shadow-lg">
                <IconMessageChatbot size={22} stroke={1.8} />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#12213F]" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold">MWP Advisor</p>
                <p className="truncate text-[11.5px] text-white/75"><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />Online · AI assistant, not a doctor</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={restart} className="grid h-9 w-9 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white" aria-label="Start a new chat" title="New chat">
                <IconRotateClockwise size={18} />
              </button>
              <button onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white" aria-label="Close chat">
                <IconX size={20} />
              </button>
            </div>
          </header>

          <div ref={listRef} className="flex-1 space-y-3.5 overflow-y-auto overscroll-contain px-3.5 py-4">
            {!cfg ? (
              <div className="grid place-items-center py-10 text-[#b45f10]"><IconLoader2 className="animate-spin" /></div>
            ) : offline ? (
              <div className="rounded-2xl border border-[#E6DFC9] bg-white p-4 text-[14px] leading-relaxed text-[#26314D]">
                The chat assistant is not available right now. Our team is happy to help:
                <br />
                <a className="font-semibold underline" href={`mailto:${SITE_CONTACT.email}`}>{SITE_CONTACT.email}</a>
                <br />
                <a className="font-semibold underline" href={SITE_CONTACT.phoneHref}>{SITE_CONTACT.phone}</a>
              </div>
            ) : (
              <>
                <div className="flex items-end gap-2"><Avatar /><div className="max-w-[85%] rounded-2xl rounded-bl-md border border-[#E6DFC9] bg-white px-4 py-3 text-[#26314D] shadow-sm"><Message text={greeting} /></div></div>
                {messages.map((m, i) => (
                  <div key={i} className={m.role === "user" ? "flex justify-end" : "flex items-end gap-2"}>
                    {m.role !== "user" && <Avatar />}
                    <div className={`max-w-[85%] px-4 py-3 shadow-sm ${m.role === "user" ? "rounded-2xl rounded-br-md bg-gradient-to-br from-[#12213F] to-[#24407A] text-white" : "rounded-2xl rounded-bl-md border border-[#E6DFC9] bg-white text-[#26314D]"}`}>
                      <Message text={m.text} />
                    </div>
                  </div>
                ))}
                {busy && (
                  <div className="flex items-end gap-2">
                    <Avatar />
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-[#E6DFC9] bg-white px-4 py-3.5" aria-label="The advisor is typing">
                      {[0, 1, 2].map((d) => <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-[#b45f10]" style={{ animationDelay: `${d * 140}ms` }} />)}
                    </div>
                  </div>
                )}
                {error && <p role="alert" className="rounded-xl border border-[#a81f24]/30 bg-[#a81f24]/5 px-3 py-2 text-[13px] text-[#a81f24]">{error}</p>}
              </>
            )}
          </div>

          {!offline && cfg && messages.length === 0 && (
            <div className="flex gap-2 overflow-x-auto px-3 pb-2" style={{ scrollbarWidth: "none" }}>
              {QUICK.map((q) => (
                <button key={q} onClick={() => send(q)} disabled={busy} className="shrink-0 rounded-full border border-[#C9972B]/60 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-[#12213F] shadow-sm hover:bg-[#12213F] hover:text-white disabled:opacity-50">
                  {q}
                </button>
              ))}
            </div>
          )}

          {!offline && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="border-t border-[#E6DFC9] bg-white p-3"
            >
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  maxLength={600}
                  placeholder="Ask about our products..."
                  aria-label="Your message"
                  disabled={!cfg || busy}
                  className="h-11 min-w-0 flex-1 rounded-xl border border-[#DDD6C0] bg-white px-4 text-[14.5px] text-[#12213F] outline-none focus:border-[#12213F] focus:ring-4 focus:ring-[#12213F]/10"
                />
                <button type="submit" disabled={!cfg || busy || !input.trim()} aria-label="Send" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#E2B64D] to-[#b45f10] text-[#12213F] shadow hover:brightness-110 disabled:opacity-40">
                  <IconSend size={19} />
                </button>
              </div>
              <p className="mt-2 text-[11px] leading-snug text-[#6B7388]">{cfg?.disclaimer || "Chats are saved so our team can improve support. Please do not share personal health details."}</p>
            </form>
          )}
        </section>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="pointer-events-auto inline-flex items-center gap-2.5 rounded-full border-2 border-[#C9972B] bg-gradient-to-br from-[#12213F] to-[#24407A] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.1em] text-white shadow-[0_16px_34px_-14px_rgba(18,33,63,0.9)] transition-transform hover:-translate-y-0.5 hover:bg-[#a81f24]"
          aria-label="Open the MWP Advisor chat"
        >
          <span className="relative">
            <IconMessageChatbot size={20} stroke={1.8} />
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Ask MWP Advisor
        </button>
      )}
    </div>
  );
}
