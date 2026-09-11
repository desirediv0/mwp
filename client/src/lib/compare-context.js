"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";

const MAX_COMPARE = 5;
const STORAGE_KEY = "mwp-compare";

const CompareContext = createContext(null);

export function CompareProvider({ children }) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);

  // hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed.slice(0, MAX_COMPARE));
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  // persist
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, ready]);

  const isInCompare = useCallback(
    (id) => items.some((p) => p.id === id),
    [items]
  );

  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  const addToCompare = useCallback((product) => {
    if (!product?.id) return;
    // Decide + toast OUTSIDE any state updater — React runs updaters twice
    // under StrictMode (dev) which would otherwise fire the toast twice.
    const cur = itemsRef.current;
    if (cur.some((p) => p.id === product.id)) return;
    if (cur.length >= MAX_COMPARE) {
      toast.error(`You can compare up to ${MAX_COMPARE} products`);
      return;
    }
    const snap = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      image:
        product.image ||
        product.images?.[0]?.url ||
        product.images?.[0] ||
        null,
    };
    setItems((prev) =>
      prev.some((p) => p.id === product.id) ? prev : [...prev, snap]
    );
    toast.success(`${product.name} added to compare`);
  }, []);

  const removeFromCompare = useCallback((id) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const toggleCompare = useCallback(
    (product) => {
      if (isInCompare(product.id)) removeFromCompare(product.id);
      else addToCompare(product);
    },
    [isInCompare, addToCompare, removeFromCompare]
  );

  const clearCompare = useCallback(() => setItems([]), []);

  return (
    <CompareContext.Provider
      value={{
        items,
        count: items.length,
        max: MAX_COMPARE,
        isInCompare,
        addToCompare,
        removeFromCompare,
        toggleCompare,
        clearCompare,
        ready,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) {
    // safe fallback so components don't crash if provider is missing
    return {
      items: [],
      count: 0,
      max: MAX_COMPARE,
      isInCompare: () => false,
      addToCompare: () => {},
      removeFromCompare: () => {},
      toggleCompare: () => {},
      clearCompare: () => {},
      ready: false,
    };
  }
  return ctx;
}
