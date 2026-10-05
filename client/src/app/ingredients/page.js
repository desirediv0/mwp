"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { IconArrowRight, IconSearch, IconX } from "@tabler/icons-react";
import { PageBreadcrumb } from "@/components/layout/Editorial";
import { INGREDIENT_LIBRARY } from "@/lib/ingredient-library";
import "./ingredients.css";

function IngredientPhoto({ ingredient }) {
  return (
    <div className="mwp-ingredient-photo" role="img" aria-label={`${ingredient.name} ingredient photograph`}>
      <Image
        src={`/ingredient-library/page-${ingredient.page}.jpg`}
        alt=""
        width={1275}
        height={1650}
        unoptimized
        loading="lazy"
        draggable={false}
        style={{
          width: `${(1275 / 192) * 100}%`,
          height: `${(1650 / 192) * 100}%`,
          left: `-${(ingredient.photoX / 192) * 100}%`,
          top: `-${(ingredient.photoY / 192) * 100}%`,
        }}
      />
    </div>
  );
}

function IngredientCard({ ingredient, index }) {
  return (
    <article className="mwp-ingredient-card">
      <IngredientPhoto ingredient={ingredient} />
      <div className="mwp-ingredient-copy">
        <span className="mwp-ingredient-number">{String(index + 1).padStart(2, "0")}</span>
        <h2>{ingredient.name}</h2>
        <p className="mwp-ingredient-origin"><span>Origin</span> {ingredient.origin}</p>
        <p className="mwp-ingredient-description">{ingredient.description}</p>
      </div>
    </article>
  );
}

export default function IngredientsPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    if (!query.trim()) {
      setDebouncedQuery("");
      return;
    }
    const timer = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const clearSearch = () => {
    setQuery("");
    setDebouncedQuery("");
  };

  const filtered = useMemo(() => {
    const term = debouncedQuery.trim().toLocaleLowerCase();
    if (!term) return INGREDIENT_LIBRARY;
    return INGREDIENT_LIBRARY.filter((ingredient) =>
      `${ingredient.name} ${ingredient.origin} ${ingredient.description}`.toLocaleLowerCase().includes(term)
    );
  }, [debouncedQuery]);

  return (
    <main className="mwp-page mwp-ingredients">
      <div className="mwp-container">
        <PageBreadcrumb current="Ingredient library" />
        <header className="mwp-ingredients-header">
          <div>
            <p className="mwp-ingredients-kicker">MWP / Ingredient library</p>
            <h1 className="mwp-title">Know what goes<br />into your formula.</h1>
            <p className="mwp-lead">Explore the ingredients featured across the MWP collection, with their reference origins and a clear introduction to each one.</p>
          </div>
          <div className="mwp-ingredients-count" aria-label="32 ingredients">
            <strong>{INGREDIENT_LIBRARY.length}</strong>
            <span>ingredients<br />to explore</span>
          </div>
        </header>
      </div>

      <section className="mwp-ingredients-section" aria-label="Ingredient collection">
        <div className="mwp-container">
          <div className="mwp-ingredients-toolbar">
            <div>
              <p className="mwp-ingredients-kicker">The collection</p>
              <h2>From root to routine.</h2>
            </div>
            <label className="mwp-ingredients-search">
              <IconSearch aria-hidden="true" size={20} stroke={1.8} />
              <span className="sr-only">Search ingredients, benefits, or origins</span>
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ingredients or origins" />
              {query && <button type="button" aria-label="Clear search" onClick={clearSearch}><IconX size={18} /></button>}
            </label>
          </div>
          <p className="mwp-ingredients-results" aria-live="polite">{query !== debouncedQuery ? "Searching ingredients…" : `Showing ${filtered.length} of ${INGREDIENT_LIBRARY.length} ingredients`}</p>

          {filtered.length ? (
            <div className="mwp-ingredients-grid">
              {filtered.map((ingredient) => <IngredientCard key={ingredient.id} ingredient={ingredient} index={INGREDIENT_LIBRARY.indexOf(ingredient)} />)}
            </div>
          ) : (
            <div className="mwp-ingredients-empty">
              <h2>No ingredients found.</h2>
              <p>Try another name or origin to explore the library.</p>
              <button type="button" className="mwp-button mwp-button-outline" onClick={clearSearch}>Clear search</button>
            </div>
          )}

          <p className="mwp-ingredients-note">Origins shown here reflect the sourcing targets in the supplied ingredient preview. Check the product label for current details.</p>
        </div>
      </section>

      <section className="mwp-ingredients-next mwp-container">
        <div>
          <p className="mwp-ingredients-kicker">Find your fit</p>
          <h2>See the formulas behind the ingredients.</h2>
        </div>
        <Link href="/products" className="mwp-button">Explore all products <IconArrowRight size={18} stroke={1.8} /></Link>
      </section>
    </main>
  );
}
