"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "mwp-lang";

const LanguageContext = createContext({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

export const UI_STRINGS = {
  en: {
    allProducts: "All Products",
    ingredients: "MWP Ingredients",
    university: "MWP University",
    founderLetter: "A Letter From Our Founder",
    certificateWall: "MWP Certificate Wall",
    contact: "Contact Us",
    search: "Search",
    account: "Account",
    cart: "Cart",
    shopNow: "Shop Now",
    discoverFormula: "Discover Formula",
    viewAll: "View All",
    home: "Home",
    keyBenefits: "Key Benefits",
    whyThisFormula: "Why This Formula",
    ingredientsInside: "Ingredients Inside",
    qualityProof: "Quality Proof",
    reviews: "Reviews",
    findYourFormula: "Find Your Formula",
    startQuiz: "Start Quiz",
    recommendedForYou: "Recommended For You",
    learnMore: "Learn More",
    readMore: "Read More",
    relatedArticles: "Related Articles",
    categories: "Categories",
    all: "All",
    askAdvisor: "Ask MWP Advisor",
    advisorTitle: "MWP Advisor™",
    advisorSubtitle: "Your personal wellness assistant",
    typeMessage: "Ask about formulas, ingredients, quality…",
    send: "Send",
    goalQuestion: "What is your goal?",
    mensPerformance: "Men's Performance",
    energy: "Energy",
    womensWellness: "Women's Wellness",
    dailyHealth: "Daily Health",
    yourMatch: "Your match",
    retake: "Retake quiz",
    freeShipping: "Free shipping on orders above ₹999",
    premiumIngredients: "Premium Ingredients",
    qualityTested: "Quality Tested",
    trustedFormula: "Trusted Formula",
    madeForResults: "Made For Results",
    returnPolicy: "Return Policy",
    products: "Products",
    language: "Language",
  },
  es: {
    allProducts: "Todos los Productos",
    ingredients: "Ingredientes MWP",
    university: "Universidad MWP",
    founderLetter: "Una Carta de Nuestro Fundador",
    certificateWall: "Muro de Certificados MWP",
    contact: "Contáctenos",
    search: "Buscar",
    account: "Cuenta",
    cart: "Carrito",
    shopNow: "Comprar Ahora",
    discoverFormula: "Descubrir Fórmula",
    viewAll: "Ver Todo",
    home: "Inicio",
    keyBenefits: "Beneficios Clave",
    whyThisFormula: "Por Qué Esta Fórmula",
    ingredientsInside: "Ingredientes",
    qualityProof: "Prueba de Calidad",
    reviews: "Reseñas",
    findYourFormula: "Encuentra Tu Fórmula",
    startQuiz: "Iniciar Test",
    recommendedForYou: "Recomendado Para Ti",
    learnMore: "Saber Más",
    readMore: "Leer Más",
    relatedArticles: "Artículos Relacionados",
    categories: "Categorías",
    all: "Todos",
    askAdvisor: "Preguntar al Asesor MWP",
    advisorTitle: "Asesor MWP™",
    advisorSubtitle: "Tu asistente personal de bienestar",
    typeMessage: "Pregunta sobre fórmulas, ingredientes, calidad…",
    send: "Enviar",
    goalQuestion: "¿Cuál es tu objetivo?",
    mensPerformance: "Rendimiento Masculino",
    energy: "Energía",
    womensWellness: "Bienestar Femenino",
    dailyHealth: "Salud Diaria",
    yourMatch: "Tu recomendación",
    retake: "Repetir test",
    freeShipping: "Envío gratis en pedidos superiores a ₹999",
    premiumIngredients: "Ingredientes Premium",
    qualityTested: "Calidad Probada",
    trustedFormula: "Fórmula de Confianza",
    madeForResults: "Hecho Para Resultados",
    returnPolicy: "Política de Devolución",
    products: "Productos",
    language: "Idioma",
  },
};

function detectLang() {
  if (typeof window === "undefined") return "en";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "es") return saved;
  } catch {}
  const nav = (navigator.language || "en").toLowerCase();
  return nav.startsWith("es") ? "es" : "en";
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState("en");

  useEffect(() => {
    setLangState(detectLang());
  }, []);

  const setLang = useCallback((next) => {
    const value = next === "es" ? "es" : "en";
    setLangState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {}
    document.documentElement.lang = value;
  }, []);

  const t = useCallback(
    (key) => UI_STRINGS[lang]?.[key] ?? UI_STRINGS.en[key] ?? key,
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
