// Shared jewellery category icon mapping
// Used by CategoriesCarousel, CategoryGrid, and page layouts

import {
  Sparkles,
  Scissors,
  Crown,
  Heart,
  Gift,
  Gem,
  Award,
  Wrench,
  Package,
} from "lucide-react";

// Map: keyword → { icon component, color }
export const PHARMA_ICON_MAP = [
  { keys: ["hair", "accessories", "headband", "clip"], Icon: Crown, color: "#A958A4" },
  { keys: ["diy", "kit", "craft"], Icon: Wrench, color: "#00AEEF" },
  { keys: ["necklace", "pendant", "chain"], Icon: Gem, color: "#A958A4" },
  { keys: ["earrings", "jhumka", "studs"], Icon: Sparkles, color: "#00AEEF" },
  { keys: ["ring", "bands"], Icon: Heart, color: "#A958A4" },
  { keys: ["bracelets", "bangles"], Icon: Gift, color: "#00AEEF" },
  { keys: ["custom", "bespoke", "founder"], Icon: Award, color: "#A958A4" },
  { keys: ["box", "gift", "packaging"], Icon: Package, color: "#00AEEF" },
];

export function getPharmaIcon(name = "", slug = "") {
  const n = name.toLowerCase();
  const s = slug.toLowerCase();
  for (const entry of PHARMA_ICON_MAP) {
    if (entry.keys.some((k) => n.includes(k) || s.includes(k))) {
      return entry;
    }
  }
  // Default fallback icon
  return { Icon: Sparkles, color: "#A958A4" };
}