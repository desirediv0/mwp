"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { fetchApi, formatCurrency, cn } from "@/lib/utils";
import {
  CORE_PRODUCTS,
  QUIZ_GOALS,
  getProductImage,
} from "@/lib/mwp-content";
import { useLanguage } from "@/lib/language-context";
import {
  IconMessageChatbot,
  IconSend,
  IconX,
  IconSparkles,
  IconRotateClockwise,
  IconArrowRight,
  IconCheck,
} from "@tabler/icons-react";

const CHAT_KEY = "mwp-advisor-chat-v1";
const PROFILE_KEY = "mwp-advisor-profile-v1";

const COPY = {
  en: {
    welcomeTitle: "Welcome to MWP Advisor™",
    welcome:
      "Hi! I'm your personal wellness assistant. Answer 2 quick questions and I'll match you with the exact formula — or ask me anything about ingredients, quality, or shipping.",
    pickGoal: "What's your main goal?",
    followUp: {
      "mens-performance":
        "Great choice. What matters most for your performance?",
      energy: "Got it. Where do you need the most support?",
      "womens-wellness": "Lovely. What focus should we prioritize?",
      "daily-health": "Perfect. What's your daily priority?",
    },
    prefs: {
      "mens-performance|daily": {
        label: "Everyday long-term vitality",
        key: "ultra-pro",
      },
      "mens-performance|strength": {
        label: "Herbal strength & stamina",
        key: "power-max",
      },
      "mens-performance|fast": {
        label: "Fast, on-demand action",
        key: "rapid-boost",
      },
      "energy|fast": { label: "Quick energy boost", key: "rapid-boost" },
      "energy|focus": { label: "Energy + mental focus", key: "her-energy" },
      "energy|daily": { label: "All-day wellness energy", key: "daily-vitality" },
      "womens-wellness|balance": {
        label: "Hormonal balance & cycle",
        key: "her-power",
      },
      "womens-wellness|energy": {
        label: "Energy & focus for her",
        key: "her-energy",
      },
      "daily-health|complete": {
        label: "Complete daily multivitamin power",
        key: "daily-vitality",
      },
      "daily-health|energy": {
        label: "Daily energy & stamina",
        key: "her-energy",
      },
    },
    matched: "Based on your answers, here's your match:",
    keyBenefits: "Key benefits",
    signature: "Signature actives",
    viewProduct: "View product",
    shopNow: "Shop now",
    alsoConsider: "Also consider",
    askMore: "Ask me anything else…",
    retake: "Start over",
    online: "Online · replies instantly",
    step: "Guided match",
    freeChat: "Free chat",
    savedNote: "Chat saved on this device",
    quick: {
      compare: "Compare men's products",
      quality: "How does testing work?",
      ingredients: "Explain key ingredients",
      shipping: "Shipping & returns?",
    },
    close: "Close",
    open: "Ask MWP Advisor",
  },
  es: {
    welcomeTitle: "Bienvenido a Asesor MWP™",
    welcome:
      "¡Hola! Soy tu asistente de bienestar. Responde 2 preguntas rápidas y te recomendaré la fórmula ideal — o pregúntame sobre ingredientes, calidad o envíos.",
    pickGoal: "¿Cuál es tu objetivo principal?",
    followUp: {
      "mens-performance":
        "Buena elección. ¿Qué importa más en tu rendimiento?",
      energy: "Entendido. ¿Dónde necesitas más apoyo?",
      "womens-wellness": "Genial. ¿Qué debemos priorizar?",
      "daily-health": "Perfecto. ¿Cuál es tu prioridad diaria?",
    },
    prefs: {
      "mens-performance|daily": {
        label: "Vitalidad diaria a largo plazo",
        key: "ultra-pro",
      },
      "mens-performance|strength": {
        label: "Fuerza y resistencia herbal",
        key: "power-max",
      },
      "mens-performance|fast": {
        label: "Acción rápida bajo demanda",
        key: "rapid-boost",
      },
      "energy|fast": { label: "Energía rápida", key: "rapid-boost" },
      "energy|focus": { label: "Energía + enfoque", key: "her-energy" },
      "energy|daily": { label: "Energía diaria integral", key: "daily-vitality" },
      "womens-wellness|balance": {
        label: "Equilibrio hormonal y ciclo",
        key: "her-power",
      },
      "womens-wellness|energy": {
        label: "Energía y enfoque para ella",
        key: "her-energy",
      },
      "daily-health|complete": {
        label: "Bienestar diario completo",
        key: "daily-vitality",
      },
      "daily-health|energy": {
        label: "Energía y vitalidad diaria",
        key: "her-energy",
      },
    },
    matched: "Según tus respuestas, esta es tu fórmula:",
    keyBenefits: "Beneficios clave",
    signature: "Activos signature",
    viewProduct: "Ver producto",
    shopNow: "Comprar",
    alsoConsider: "También considera",
    askMore: "Pregúntame algo más…",
    retake: "Empezar de nuevo",
    online: "En línea · responde al instante",
    step: "Recomendación guiada",
    freeChat: "Chat libre",
    savedNote: "Chat guardado en este dispositivo",
    quick: {
      compare: "Compara productos masculinos",
      quality: "¿Cómo son las pruebas?",
      ingredients: "Explica ingredientes clave",
      shipping: "¿Envíos y devoluciones?",
    },
    close: "Cerrar",
    open: "Preguntar al Asesor MWP",
  },
};

const PREF_KEYS = {
  "mens-performance": ["daily", "strength", "fast"],
  energy: ["fast", "focus", "daily"],
  "womens-wellness": ["balance", "energy"],
  "daily-health": ["complete", "energy"],
};

function welcomeMsg(copy) {
  return {
    id: "w",
    role: "advisor",
    title: copy.welcomeTitle,
    text: copy.welcome,
    choices: QUIZ_GOALS.map((g) => ({
      id: g.id,
      kind: "goal",
      label:
        g.id === "mens-performance"
          ? "Men's Performance"
          : g.id === "energy"
            ? "Energy"
            : g.id === "womens-wellness"
              ? "Women's Wellness"
              : "Daily Health",
    })),
    links: [],
  };
}

function goalMsg(copy, goalId, lang) {
  const goal = QUIZ_GOALS.find((g) => g.id === goalId);
  const labelMap = {
    "mens-performance": lang === "es" ? "Rendimiento Masculino" : "Men's Performance",
    energy: lang === "es" ? "Energía" : "Energy",
    "womens-wellness": lang === "es" ? "Bienestar Femenino" : "Women's Wellness",
    "daily-health": lang === "es" ? "Salud Diaria" : "Daily Health",
  };
  const prefIds = PREF_KEYS[goalId] || [];
  const choices = prefIds.map((p) => {
    const meta = copy.prefs[`${goalId}|${p}`];
    return { id: p, kind: "pref", label: meta?.label || p };
  });
  return {
    id: `goal-${goalId}-${Date.now()}`,
    role: "advisor",
    text: copy.followUp[goalId] || copy.pickGoal,
    meta: { goalId, goalLabel: labelMap[goalId] || goal?.id },
    choices,
    links: [],
  };
}

function absImg(raw) {
  if (!raw) return "/placeholder.jpg";
  if (raw.startsWith("http") || raw.startsWith("/")) return raw;
  return `https://desirediv-storage.blr1.digitaloceanspaces.com/${raw}`;
}

function findApi(core, products) {
  if (!core || !products?.length) return null;
  return (
    products.find((p) => {
      const hay = `${p.name || ""} ${p.slug || ""}`
        .toLowerCase()
        .replace(/[™®]/g, "");
      return core.match.some((m) => hay.includes(m));
    }) || null
  );
}

function recommendMsg(copy, goalId, prefId, products) {
  const meta = copy.prefs[`${goalId}|${prefId}`];
  const key = meta?.key || QUIZ_GOALS.find((g) => g.id === goalId)?.productKeys?.[0];
  const core = CORE_PRODUCTS.find((c) => c.key === key) || CORE_PRODUCTS[0];
  const api = findApi(core, products);
  const goal = QUIZ_GOALS.find((g) => g.id === goalId);
  const altKeys = (goal?.productKeys || []).filter((k) => k !== core.key).slice(0, 2);
  const alts = altKeys
    .map((k) => {
      const c = CORE_PRODUCTS.find((x) => x.key === k);
      const a = findApi(c, products);
      return c ? { core: c, api: a } : null;
    })
    .filter(Boolean);

  return {
    id: `rec-${core.key}-${Date.now()}`,
    role: "advisor",
    text: copy.matched,
    recommend: {
      core,
      api,
      price: api?.basePrice ?? api?.price ?? null,
      image: absImg(getProductImage(api)),
    },
    alts: alts.map((a) => ({
      key: a.core.key,
      name: a.core.name,
      slug: a.api?.slug || null,
    })),
    choices: [
      { id: "more", kind: "free", label: copy.askMore },
      { id: "retake", kind: "retake", label: copy.retake },
    ],
    links: [
      api?.slug
        ? { label: copy.viewProduct, href: `/products/${api.slug}`, primary: true }
        : { label: copy.shopNow, href: "/products", primary: true },
    ],
  };
}

function matchKeyword(text) {
  const q = text.toLowerCase();
  for (const core of CORE_PRODUCTS) {
    if (core.match.some((m) => q.includes(m))) return core;
  }
  return null;
}

function buildFreeReply(text, products, lang) {
  const q = text.toLowerCase().trim();
  if (!q) return { text: "Ask me about formulas, ingredients, quality…", links: [] };

  const core = matchKeyword(q);

  if (core) {
    const apiP = findApi(core, products);
    return {
      text: `${core.name} — ${core.headline}. ${core.focus} Benefits: ${core.benefits
        .slice(0, 5)
        .join(", ")}. Signature: ${core.signature}.`,
      links: [
        apiP?.slug
          ? { label: "View product", href: `/products/${apiP.slug}`, primary: true }
          : { label: "All products", href: "/products", primary: true },
        { label: "Ingredients", href: "/ingredients" },
      ],
    };
  }

  if (/compare|compara|difference|diferencia/.test(q)) {
    return {
      text:
        lang === "es"
          ? "Ultra Pro = vitalidad diaria. Power Max = fuerza herbal. Rapid Boost = acción rápida. Elige tu prioridad y te recomiendo una."
          : "Ultra Pro = everyday vitality. Power Max = herbal strength. Rapid Boost = fast on-demand. Tell me which goal matters most and I'll pick one.",
      links: [
        { label: "Compare tools", href: "/compare" },
        { label: "All products", href: "/products" },
      ],
    };
  }

  if (/test|lab|quality|coa|certificate|certific|gmp|heavy metal|microb|pureza|calidad/.test(q)) {
    return {
      text:
        lang === "es"
          ? "Cada lote es GMP y pasa laboratorio independiente: COA, metales pesados y microbiología. Abre el Muro de Certificados."
          : "Every batch is GMP-manufactured and third-party lab tested: COA, heavy metals and microbial screening. Open the Certificate Wall for proof documents.",
      links: [
        { label: "Certificate Wall", href: "/certificates", primary: true },
        { label: "Why MWP", href: "/why-us" },
      ],
    };
  }

  if (/women|her power|her energy|mujer|femen|cycle|hormon/.test(q)) {
    return {
      text:
        lang === "es"
          ? "HER POWER™ apoya equilibrio hormonal y ciclo. HER ENERGY™ es energía y enfoque diarios. ¿Balance o energía?"
          : "HER POWER™ supports hormonal wellness, cycle and balance. HER ENERGY™ is daily energy, focus and stamina. Balance → Her Power; energy → Her Energy.",
      links: [
        { label: "Her Power", href: "/products?search=her%20power", primary: true },
        { label: "Her Energy", href: "/products?search=her%20energy" },
        { label: "Find Your Formula", href: "/quiz" },
      ],
    };
  }

  if (/men|testosterone|stamina|performance|libido|hombre|rendimiento/.test(q)) {
    return {
      text:
        lang === "es"
          ? "Línea masculina: ULTRA PRO™ (vitalidad diaria), POWER MAX™ (fuerza herbal), RAPID BOOST™ (acción rápida)."
          : "Men's line: ULTRA PRO™ (daily vitality), POWER MAX™ (herbal strength), RAPID BOOST™ (fast action). Everyday → Ultra Pro. Strength → Power Max. On-demand → Rapid Boost.",
      links: [
        { label: "Find Your Formula", href: "/quiz", primary: true },
        { label: "Compare men's", href: "/compare" },
      ],
    };
  }

  if (/ingredient|ashwagandha|shilajit|tongkat|maca|ingrediente/.test(q)) {
    return {
      text:
        lang === "es"
          ? "Cada fórmula usa activos nombrados (KSM-66, PrimaVie Shilajit, Tongkat Ali LJ100…). Abre la biblioteca de ingredientes."
          : "Named actives (KSM-66, PrimaVie Shilajit, Tongkat Ali LJ100, Citrulline Malate…) each have a clear role — open the ingredient library.",
      links: [
        { label: "MWP Ingredients", href: "/ingredients", primary: true },
        { label: "MWP University", href: "/university" },
      ],
    };
  }

  if (/price|cost|shipping|return|refund|precio|envio|devol/.test(q)) {
    return {
      text:
        lang === "es"
          ? "Precios y stock en vivo en la página del producto. Envío gratis en pedidos cualificados; devoluciones según la política."
          : "Live pricing and stock come from the product page. Free shipping on qualifying orders; returns follow our Return Policy.",
      links: [
        { label: "Return Policy", href: "/return-policy", primary: true },
        { label: "Contact support", href: "/contact" },
      ],
    };
  }

  return {
    text:
      lang === "es"
        ? "Puedo recomendar fórmulas, explicar ingredientes, comparar productos y hablar de calidad. Prueba: ¿cuál fórmula es para mí?"
        : "I can recommend formulas, explain ingredients, compare products, and walk through quality & testing. Or start the guided match above.",
    links: [
      { label: "Find Your Formula", href: "/quiz", primary: true },
      { label: "All products", href: "/products" },
    ],
  };
}

function loadJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveJson(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

export default function MwpAdvisor() {
  const { t, lang } = useLanguage();
  const copy = COPY[lang] || COPY.en;
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [messages, setMessages] = useState(() => [welcomeMsg(COPY.en)]);
  const [profile, setProfile] = useState({ goal: null, pref: null });
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const restored = useRef(false);

  useEffect(() => {
    setHydrated(true);
    fetchApi("/public/products?limit=50")
      .then((res) => setProducts(res?.data?.products || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!hydrated || restored.current) return;
    restored.current = true;
    const saved = loadJson(CHAT_KEY);
    const prof = loadJson(PROFILE_KEY);
    if (prof) setProfile(prof);
    if (saved?.messages?.length) {
      setMessages(saved.messages);
    }
  }, [hydrated, lang]);

  useEffect(() => {
    if (!hydrated) return;
    saveJson(CHAT_KEY, { messages, updatedAt: Date.now() });
  }, [messages, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveJson(PROFILE_KEY, profile);
  }, [profile, hydrated]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, thinking, open]);

  const pushMsg = useCallback((msg) => {
    setMessages((m) => [...m, msg]);
  }, []);

  const retake = useCallback(() => {
    setProfile({ goal: null, pref: null });
    setMessages([welcomeMsg(copy)]);
  }, [copy]);

  const handleChoice = async (choice) => {
    if (choice.kind === "retake") {
      retake();
      return;
    }
    if (choice.kind === "free") {
      setTimeout(() => inputRef.current?.focus(), 80);
      return;
    }

    pushMsg({
      id: `u-${Date.now()}`,
      role: "user",
      text: choice.label,
      links: [],
    });
    setThinking(true);
    await new Promise((r) => setTimeout(r, 420));

    if (choice.kind === "goal") {
      setProfile({ goal: choice.id, pref: null });
      pushMsg(goalMsg(copy, choice.id, lang));
    } else if (choice.kind === "pref") {
      const goalId =
        profile.goal ||
        messages.find((m) => m.meta?.goalId)?.meta?.goalId ||
        "daily-health";
      setProfile((p) => ({ ...p, pref: choice.id, goal: goalId }));
      pushMsg(recommendMsg(copy, goalId, choice.id, products));
    }
    setThinking(false);
  };

  const send = async (raw) => {
    const text = (raw ?? input).trim();
    if (!text) return;
    setInput("");
    pushMsg({ id: `u-${Date.now()}`, role: "user", text, links: [] });
    setThinking(true);
    await new Promise((r) => setTimeout(r, 380));
    const reply = buildFreeReply(text, products, lang);
    pushMsg({
      id: `a-${Date.now()}`,
      role: "advisor",
      ...reply,
      choices: [],
    });
    setThinking(false);
  };

  const quickPrompts = useMemo(
    () => [
      copy.quick.compare,
      copy.quick.quality,
      copy.quick.ingredients,
      copy.quick.shipping,
    ],
    [copy]
  );

  const showQuick =
    messages.length <= 1 ||
    messages[messages.length - 1]?.recommend;

  return (
    <>
      <div className="fixed bottom-0 inset-x-0 sm:inset-auto sm:bottom-6 sm:right-6 z-[60] flex flex-col items-stretch sm:items-end gap-3 pointer-events-none px-0 sm:px-0">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto w-full sm:w-[min(94vw,400px)] h-[min(86dvh,720px)] sm:h-[min(78vh,620px)] bg-[#0A0A0C] border border-white/12 sm:rounded-t-2xl sm:rounded-b-2xl rounded-t-[28px] shadow-[0_-8px_60px_rgba(0,0,0,0.75),0_28px_80px_rgba(0,0,0,0.55)] flex flex-col overflow-hidden sm:mx-auto sm:ml-auto"
              role="dialog"
              aria-label={t("advisorTitle")}
            >
              {/* Header */}
              <div className="relative shrink-0 px-4 py-3.5 border-b border-white/10 bg-gradient-to-r from-[#16161A] via-[#101014] to-[#0A0A0C]">
                <div
                  className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-red-600 via-red-400 to-transparent"
                  aria-hidden
                />
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="relative w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                      <IconMessageChatbot className="h-5.5 w-5.5" stroke={2} />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-[#101014]" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-extrabold text-[13.5px] text-white truncate tracking-tight">
                        {t("advisorTitle")}
                      </p>
                      <p className="text-[10.5px] text-emerald-400/90 font-medium truncate">
                        {copy.online}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={retake}
                      className="p-2 text-white/45 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      aria-label={copy.retake}
                      title={copy.retake}
                    >
                      <IconRotateClockwise className="h-4 w-4" stroke={2} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      aria-label="Close advisor"
                    >
                      <IconX className="h-4.5 w-4.5" stroke={2.25} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={listRef}
                className="flex-1 overflow-y-auto overscroll-contain px-3.5 py-4 space-y-3 bg-[#0A0A0C]"
              >
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "flex",
                      m.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[92%] rounded-2xl",
                        m.role === "user"
                          ? "bg-white text-black rounded-br-md px-3.5 py-2.5"
                          : "bg-white/[0.05] border border-white/10 text-white/90 rounded-bl-md px-3.5 py-3 w-full max-w-[96%]"
                      )}
                    >
                      {m.role === "advisor" && (
                        <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.18em] font-bold text-red-400 mb-1.5">
                          <IconSparkles className="h-3 w-3" /> Advisor
                        </span>
                      )}

                      {m.title && (
                        <p className="font-extrabold text-[14px] text-white mb-1 tracking-tight">
                          {m.title}
                        </p>
                      )}

                      <p className="text-[13px] leading-relaxed whitespace-pre-line">
                        {m.text}
                      </p>

                      {/* Recommendation card */}
                      {m.recommend && (
                        <div className="mt-3 rounded-xl border border-white/12 bg-gradient-to-br from-[#141418] to-[#0E0E12] overflow-hidden">
                          <div className="flex gap-3 p-3">
                            <div className="relative w-16 h-16 shrink-0 rounded-lg bg-white/[0.04] border border-white/10 overflow-hidden">
                              <Image
                                src={m.recommend.image}
                                alt={m.recommend.core.name}
                                fill
                                sizes="64px"
                                className="object-contain p-1"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] uppercase tracking-[0.16em] text-red-400 font-bold mb-0.5">
                                {copy.step}
                              </p>
                              <p className="text-[13px] font-extrabold text-white leading-tight">
                                {m.recommend.core.name}
                              </p>
                              <p className="text-[11px] text-white/50 mt-0.5">
                                {m.recommend.core.headline}
                              </p>
                              {m.recommend.price != null && (
                                <p className="text-[13px] font-bold text-emerald-400 mt-1">
                                  {formatCurrency(m.recommend.price)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="px-3 pb-2">
                            <p className="text-[10px] uppercase tracking-wider text-white/35 font-bold mb-1">
                              {copy.keyBenefits}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {m.recommend.core.benefits.slice(0, 5).map((b) => (
                                <span
                                  key={b}
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9.5px] font-semibold bg-white/[0.06] border border-white/10 rounded text-white/70"
                                >
                                  <IconCheck className="h-2.5 w-2.5 text-emerald-400" />
                                  {b}
                                </span>
                              ))}
                            </div>
                            <p className="text-[10.5px] text-white/45 mt-2">
                              <span className="font-bold text-white/60">
                                {copy.signature}:
                              </span>{" "}
                              {m.recommend.core.signature}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Also consider */}
                      {m.alts?.length > 0 && (
                        <div className="mt-2.5">
                          <p className="text-[10px] uppercase tracking-wider text-white/35 font-bold mb-1.5">
                            {copy.alsoConsider}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {m.alts.map((a) => (
                              <Link
                                key={a.key}
                                href={a.slug ? `/products/${a.slug}` : "/products"}
                                onClick={() => setOpen(false)}
                                className="px-2.5 py-1.5 text-[10.5px] font-bold bg-white/[0.06] hover:bg-white hover:text-black border border-white/15 rounded-lg transition-colors text-white/80"
                              >
                                {a.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Choice buttons (guided) */}
                      {m.choices?.length > 0 && (
                        <div className="mt-3 flex flex-col gap-1.5">
                          {m.choices.map((c) => (
                            <button
                              key={c.id + c.label}
                              type="button"
                              onClick={() => handleChoice(c)}
                              className={
                                c.kind === "retake" || c.kind === "free"
                                  ? "w-full flex items-center justify-between gap-2 px-3 py-2.5 text-[12px] font-bold text-white/70 bg-white/[0.04] border border-white/10 rounded-xl hover:bg-white/[0.08] hover:text-white transition-colors text-left"
                                  : "w-full flex items-center justify-between gap-2 px-3 py-3 text-[12.5px] font-bold text-white bg-red-600/15 border border-red-500/35 hover:bg-red-600 hover:border-red-500 rounded-xl transition-all text-left group"
                              }
                            >
                              <span>{c.label}</span>
                              <IconArrowRight className="h-4 w-4 opacity-50 group-hover:opacity-100 shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Static links */}
                      {m.links?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {m.links.map((l) => (
                            <Link
                              key={l.href + l.label}
                              href={l.href || "#"}
                              onClick={() => setOpen(false)}
                              className={cn(
                                "px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors border",
                                l.primary
                                  ? "bg-red-600 hover:bg-red-500 text-white border-red-500"
                                  : "bg-white/10 hover:bg-white hover:text-black border-white/15 text-white"
                              )}
                            >
                              {l.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {thinking && (
                  <div className="flex justify-start">
                    <div className="bg-white/[0.05] border border-white/10 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5 items-center">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-red-400 animate-bounce"
                          style={{ animationDelay: `${i * 0.12}s` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick prompts */}
              {showQuick && (
                <div className="shrink-0 px-3 pt-2 pb-1 flex gap-1.5 overflow-x-auto no-scrollbar border-t border-white/[0.08] bg-black/20">
                  {quickPrompts.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => send(p)}
                      className="shrink-0 px-3 py-2 text-[11px] font-semibold text-white/70 bg-white/[0.05] border border-white/10 rounded-full hover:text-white hover:border-white/30 transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="shrink-0 p-3 flex gap-2 border-t border-white/10 bg-[#08080A]"
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={copy.askMore}
                  enterKeyHint="send"
                  className="flex-1 h-11 px-4 bg-white/[0.06] border border-white/12 rounded-xl text-[13.5px] text-white placeholder:text-white/35 focus:outline-none focus:border-red-500/50 focus:bg-white/[0.08] transition-colors min-w-0"
                  aria-label="Message MWP Advisor"
                />
                <button
                  type="submit"
                  className="w-11 h-11 shrink-0 bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 active:scale-95"
                  disabled={!input.trim() || thinking}
                  aria-label={t("send")}
                >
                  <IconSend className="h-5 w-5" stroke={2.25} />
                </button>
              </form>

              <p className="sr-only">{copy.savedNote}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB */}
        <div className="sm:hidden pointer-events-auto px-4 pb-[max(12px,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="w-full flex items-center justify-center gap-2.5 h-12 bg-red-600 hover:bg-red-500 text-white rounded-full border border-red-400/40 shadow-[0_10px_28px_-6px_rgba(201,162,39,0.55)] active:scale-[0.98] transition-all"
            aria-label={open ? copy.close : copy.open}
            aria-expanded={open}
          >
            {open ? (
              <IconX className="h-5 w-5" stroke={2.25} />
            ) : (
              <span className="relative flex items-center justify-center w-6 h-6 rounded-full bg-white/15">
                <IconMessageChatbot className="h-4.5 w-4.5" stroke={2.25} />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-red-600" />
              </span>
            )}
            <span className="text-[11px] font-black uppercase tracking-[0.14em] leading-none">
              {open ? copy.close : copy.open}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="hidden sm:flex pointer-events-auto group items-center gap-2.5 h-11 pl-3 pr-4 bg-red-600 hover:bg-red-500 text-white rounded-full border border-red-400/40 shadow-[0_10px_28px_-6px_rgba(201,162,39,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black transition-all active:scale-95 self-end"
          aria-label={open ? copy.close : copy.open}
          aria-expanded={open}
        >
          {open ? (
            <IconX className="h-5 w-5" stroke={2.25} />
          ) : (
            <span className="relative flex items-center justify-center w-6 h-6 rounded-full bg-white/15">
              <IconMessageChatbot className="h-4.5 w-4.5" stroke={2.25} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-red-600" />
            </span>
          )}
          <span className="text-[11px] font-black uppercase tracking-[0.14em] leading-none">
            {open ? copy.close : copy.open}
          </span>
        </button>
      </div>
    </>
  );
}
