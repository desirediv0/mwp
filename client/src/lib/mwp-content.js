export const CORE_PRODUCTS = [
  {
    key: "ultra-pro",
    match: ["ultra pro", "ultra-pro"],
    name: "MWP ULTRA PRO™",
    headline: "",
    focus:
      "Advanced men's vitality formula designed to support natural performance, energy, stamina and confidence.",
    benefits: [
      "Testosterone Support",
      "Stamina Support",
      "Male Vitality Support",
      "Stress Balance Support",
      "Blood Flow Support",
      "Energy Support",
      "Confidence Support",
      "Recovery Support",
    ],
    accent: "#C9A227",
    bg: "from-[#0A0A0A] via-[#12213F] to-[#1A1408]",
    quizGoals: ["mens-performance"],
    signature: "KSM-66 Ashwagandha · Tongkat Ali · Shilajit",
  },
  {
    key: "power-max",
    match: ["power max", "power-max"],
    name: "MWP POWER MAX™",
    headline: "Train with purpose.",
    focus:
      "A men's formula with L-Citrulline, Tongkat Ali, Ashwagandha and Panax Ginseng, made to support endurance, daily energy and healthy circulation.*",
    benefits: [
      "Supports Endurance*",
      "Supports Daily Energy*",
      "Supports Physical Performance*",
      "Supports Healthy Circulation*",
    ],
    accent: "#A6841C",
    bg: "from-[#0A0A0A] via-[#14100C] to-[#1C1508]",
    quizGoals: ["mens-performance"],
    signature: "L-Citrulline · Tongkat Ali · Panax Ginseng",
  },
  {
    key: "rapid-boost",
    match: ["rapid boost", "rapid-boost"],
    name: "MWP RAPID BOOST™",
    headline: "Energy, focus and physical performance.*",
    focus:
      "A men's formula with L-Arginine, Beet Root and Panax Ginseng, made to support energy, focus and physical performance.*",
    benefits: [
      "Supports Energy & Endurance*",
      "Supports Healthy Circulation*",
      "Supports Physical Performance*",
      "Supports Mental Focus*",
    ],
    accent: "#E5C56A",
    bg: "from-[#070A0E] via-[#0E1012] to-[#12140C]",
    quizGoals: ["mens-performance", "energy"],
    signature: "L-Arginine · Panax Ginseng · Saffron",
  },
  {
    key: "her-power",
    match: ["her power", "her-power"],
    name: "MWP HER POWER™",
    headline: "Her wellness. Her way.",
    focus:
      "A women's daily formula with Myo-Inositol, Shatavari and Magnesium, made to support daily wellness, a healthy stress response and normal energy metabolism.*",
    benefits: [
      "Supports Women's Daily Wellness*",
      "Supports a Healthy Stress Response*",
      "Supports Energy Metabolism*",
      "Supports Bone & Muscle Health*",
    ],
    accent: "#D4AF37",
    bg: "from-[#0A0A0C] via-[#14100C] to-[#1A1408]",
    quizGoals: ["womens-wellness"],
    signature: "Myo-Inositol · Shatavari · Magnesium",
  },
  {
    key: "her-energy",
    match: ["her energy", "her-energy"],
    name: "MWP HER ENERGY™",
    headline: "The Miracle That Keeps Up With Her",
    focus:
      "Daily energy and focus formula designed for active women.",
    benefits: [
      "Energy Support",
      "Focus Support",
      "Mental Performance",
      "Fatigue Support",
      "Stamina Support",
      "Daily Wellness",
    ],
    accent: "#E0C46E",
    bg: "from-[#090A0E] via-[#10100E] to-[#141208]",
    quizGoals: ["energy", "womens-wellness"],
    signature: "Rhodiola · Cordyceps · CoQ10",
  },
  {
    key: "daily-vitality",
    match: ["daily vitality", "daily-vitality", "daily boost", "daily-boost"],
    name: "MWP DAILY VITALITY™",
    headline: "Daily wellness",
    focus:
      "A daily formula for men and women with CoQ10, KSM-66® Ashwagandha and Berberine, made to support cellular energy, heart health and antioxidant defense.*",
    benefits: [
      "Supports Cellular Energy*",
      "Provides Antioxidant Support*",
      "Supports Heart Health*",
      "Supports Healthy Glucose Metabolism Within Normal Range*",
    ],
    accent: "#8B6914",
    bg: "from-[#080A0A] via-[#0E100C] to-[#0C1208]",
    quizGoals: ["daily-health"],
    signature: "CoQ10 · KSM-66 Ashwagandha · Berberine",
  },
];

export const CERT_SECTIONS = [
  {
    id: "gmp",
    title: "GMP Certification",
    keywords: ["gmp", "good manufacturing"],
    desc: "Manufactured under Good Manufacturing Practice standards.",
  },
  {
    id: "lab",
    title: "Lab Testing",
    keywords: ["lab", "testing", "third-party", "third party"],
    desc: "Independent third-party laboratory verification of purity and potency.",
  },
  {
    id: "coa",
    title: "COA (Certificate of Analysis)",
    keywords: ["coa", "certificate of analysis"],
    desc: "Batch-level analysis confirming identity, strength and purity.",
  },
  {
    id: "heavy-metals",
    title: "Heavy Metals Testing",
    keywords: ["heavy metal", "heavy metals", "metal"],
    desc: "Screening for lead, arsenic, cadmium and mercury limits.",
  },
  {
    id: "microbial",
    title: "Microbial Testing",
    keywords: ["microb", "microbiol", "microbial"],
    desc: "Microbiological safety testing for every released batch.",
  },
  {
    id: "source",
    title: "Ingredient Source Verification",
    keywords: ["source", "origin", "ingredient", "sourcing"],
    desc: "Verified origin and quality documentation for raw materials.",
  },
];

export const QUIZ_GOALS = [
  {
    id: "mens-performance",
    labelKey: "mensPerformance",
    icon: "bolt",
    productKeys: ["ultra-pro", "power-max", "rapid-boost"],
  },
  {
    id: "energy",
    labelKey: "energy",
    icon: "zap",
    productKeys: ["rapid-boost", "her-energy", "daily-vitality"],
  },
  {
    id: "womens-wellness",
    labelKey: "womensWellness",
    icon: "heart",
    productKeys: ["her-power", "her-energy"],
  },
  {
    id: "daily-health",
    labelKey: "dailyHealth",
    icon: "shield",
    productKeys: ["daily-vitality", "her-energy"],
  },
];

export function matchCoreProduct(name = "", slug = "") {
  const hay = `${name} ${slug}`.toLowerCase().replace(/[™®]/g, "");
  return CORE_PRODUCTS.find((p) =>
    p.match.some((m) => hay.includes(m))
  );
}

export function pickSlideProducts(apiProducts = []) {
  const used = new Set();
  const slides = [];

  for (const core of CORE_PRODUCTS) {
    const apiP = (apiProducts || []).find((p) => {
      if (used.has(p.id || p.slug)) return false;
      const hay = `${p.name || ""} ${p.slug || ""}`.toLowerCase();
      return core.match.some((m) => hay.includes(m));
    });
    if (apiP) used.add(apiP.id || apiP.slug);
    slides.push({ ...core, product: apiP || null });
  }
  return slides;
}

export function getProductImage(p) {
  if (!p) return "/placeholder.jpg";
  if (p.image) return p.image;
  const vImg = p.variants?.find((v) => v.images?.length)?.images?.[0];
  if (vImg?.url) return vImg.url;
  return "/placeholder.jpg";
}
