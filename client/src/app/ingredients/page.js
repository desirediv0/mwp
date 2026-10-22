"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { IconArrowRight, IconArrowUpRight, IconSearch, IconX, IconMapPin, IconAdjustmentsHorizontal } from "@tabler/icons-react";
import { PageBreadcrumb } from "@/components/layout/Editorial";
import { INGREDIENT_LIBRARY } from "@/lib/ingredient-library";
import "./ingredients.css";

const FILTERS = [
  { name: "All ingredients", test: null },
  { name: "Energy & vitality", test: /energy|vitality|stamina|performance|endurance/i },
  { name: "Balance & calm", test: /stress|calm|relaxation|mood|balance|women/i },
  { name: "Immune & antioxidant", test: /immune|antioxidant/i },
  { name: "Metabolism & circulation", test: /metabol|glucose|circulation|blood flow|cardiovascular/i },
];
const ORIGINS = [...new Set(INGREDIENT_LIBRARY.map(ingredient => ingredient.origin))].sort();

// Country flags (small local images in /public/flags)
const FLAGS = { India: "in", Malaysia: "my", USA: "us", Japan: "jp", Iran: "ir", "South Korea": "kr", Peru: "pe", Germany: "de", France: "fr", Sweden: "se", China: "cn", Italy: "it" };
function Flag({ country }) {
  const code = FLAGS[country];
  if (!code) return <IconMapPin size={12} stroke={1.5} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/flags/${code}.png`} alt="" width={20} height={14} className="mwp-flag" loading="lazy" />;
}

function IngredientPhoto({ ingredient, eager = false }) {
  return (
    <div className="mwp-ingredient-photo" role="img" aria-label={`${ingredient.name} ingredient photograph`}>
      <Image
        src={`/ingredients/${ingredient.id}.jpg`}
        alt=""
        width={560}
        height={560}
        unoptimized
        loading={eager ? "eager" : "lazy"}
        draggable={false}
      />
    </div>
  );
}

function IngredientCard({ ingredient, index }) {
  return (
    <article className="mwp-ingredient-card">
      <div className={`mwp-ingredient-visual mwp-ingredient-tone-${index % 4}`}>
        <span className="mwp-ingredient-number">{String(index + 1).padStart(2, "0")} / {INGREDIENT_LIBRARY.length}</span>
        <span className="mwp-ingredient-origin"><Flag country={ingredient.origin} /> {ingredient.origin}</span>
        <div className="mwp-ingredient-photo-wrap"><IngredientPhoto ingredient={ingredient} /></div>
      </div>
      <div className="mwp-ingredient-copy">
        <p className="mwp-ingredient-reference"><Flag country={ingredient.origin} /> Reference origin: {ingredient.origin}</p>
        <h2>{ingredient.name}</h2>
        <p className="mwp-ingredient-description">{ingredient.description}</p>
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <button className="mwp-ingredient-details-button" aria-label={`Explore ${ingredient.name}`}>
              Explore ingredient <IconArrowUpRight size={17} stroke={1.5} />
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="mwp-ingredient-dialog-overlay" />
            <Dialog.Content className="mwp-ingredient-dialog">
              <Dialog.Close className="mwp-ingredient-dialog-close" aria-label="Close ingredient details"><IconX size={20} /></Dialog.Close>
              <div className={`mwp-ingredient-dialog-visual mwp-ingredient-tone-${index % 4}`}><IngredientPhoto ingredient={ingredient} /></div>
              <div className="mwp-ingredient-dialog-copy">
                <p className="mwp-ingredients-kicker">Inside the ingredient library</p>
                <Dialog.Title>{ingredient.name}</Dialog.Title>
                <Dialog.Description>{ingredient.description}</Dialog.Description>
                <div className="mwp-ingredient-dialog-origin"><Flag country={ingredient.origin} /><div><span>Reference origin</span><p>{ingredient.origin}</p></div></div>
                <p className="mwp-ingredient-dialog-note">The origin shown is a sourcing target from the ingredient preview. Check the product label for current formula and sourcing details.</p>
                <Link href="/products" className="mwp-ingredients-primary">Explore the formulas <IconArrowRight size={17} /></Link>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </article>
  );
}

export default function IngredientsPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState(0);
  const [origin, setOrigin] = useState("");
  const gridRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) { setDebouncedQuery(""); return; }
    const timer = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const clearSearch = () => { setQuery(""); setDebouncedQuery(""); searchRef.current?.focus(); };
  const resetFilters = () => { clearSearch(); setCategory(0); setOrigin(""); };
  const filtered = useMemo(() => {
    const term = debouncedQuery.trim().toLocaleLowerCase();
    return INGREDIENT_LIBRARY.filter(ingredient =>
      (!term || `${ingredient.name} ${ingredient.origin} ${ingredient.description}`.toLocaleLowerCase().includes(term)) &&
      (!origin || ingredient.origin === origin) &&
      (!FILTERS[category].test || FILTERS[category].test.test(ingredient.description))
    );
  }, [debouncedQuery, category, origin]);

  // Lazy loading: only the first cards are rendered, the rest appear as the visitor scrolls
  const PAGE = 9;
  const [visible, setVisible] = useState(PAGE);
  const moreRef = useRef(null);
  useEffect(() => { setVisible(PAGE); }, [debouncedQuery, category, origin]);
  useEffect(() => {
    const node = moreRef.current;
    if (!node || visible >= filtered.length) return;
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) setVisible(v => Math.min(v + PAGE, filtered.length));
    }, { rootMargin: "500px 0px" });
    io.observe(node);
    return () => io.disconnect();
  }, [visible, filtered.length]);
  const shown = useMemo(() => filtered.slice(0, visible), [filtered, visible]);

  useEffect(() => {
    let mounted = true;
    let media;
    (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (!mounted || !gridRef.current) return;
      gsap.registerPlugin(ScrollTrigger);
      media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gridRef.current.querySelectorAll(".mwp-ingredient-copy").forEach(copy => {
          gsap.from(copy, { y: 20, opacity: 0, duration: 0.65, ease: "power3.out", scrollTrigger: { trigger: copy, start: "top 95%", once: true } });
        });
      }, gridRef);
    })().catch(() => media?.revert());
    return () => { mounted = false; media?.revert(); };
  }, [shown]);

  return (
    <main className="mwp-page mwp-ingredients">
      <div className="mwp-container">
        <PageBreadcrumb current="Ingredient library" />
      </div>

      <section className="mwp-ingredients-section" id="ingredient-collection" aria-label="Ingredient collection">
        <div className="mwp-container">
          <div className="mwp-ingredients-toolbar">
            <div><p className="mwp-ingredients-kicker">GLOBALLY SOURCED</p><h1>Ingredients from around the world.</h1></div>
            <div className="mwp-ingredients-search">
              <IconSearch aria-hidden="true" size={20} stroke={1.5} />
              <label htmlFor="ingredient-search" className="sr-only">Search ingredients, benefits, or origins</label>
              <input ref={searchRef} id="ingredient-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Find an ingredient..." />
              {query && <button type="button" aria-label="Clear search" onClick={clearSearch}><IconX size={18} /></button>}
            </div>
          </div>
          <div className="mwp-ingredients-results">
            <p aria-live="polite">{query !== debouncedQuery ? "Searching ingredients..." : <><span>{filtered.length}</span> of {INGREDIENT_LIBRARY.length} ingredients</>}</p>
            {(query || category > 0 || origin) ? <button onClick={resetFilters}>Clear search <IconX size={13} /></button> : <span>Every ingredient has a story.</span>}
          </div>
          <div ref={gridRef}>
            {filtered.length ? <div className="mwp-ingredients-grid">{shown.map(ingredient => <IngredientCard key={ingredient.id} ingredient={ingredient} index={INGREDIENT_LIBRARY.indexOf(ingredient)} />)}</div>
              : <div className="mwp-ingredients-empty"><IconSearch size={30} stroke={1.2} /><h2>No matching ingredients.</h2><p>Try another name, benefit or origin, or reset your filters.</p><button className="mwp-ingredients-primary" onClick={resetFilters}>Show all ingredients <IconArrowRight size={16} /></button></div>}
          </div>
          {visible < filtered.length && <div ref={moreRef} className="mwp-ingredients-more" aria-hidden="true" />}
          <p className="mwp-ingredients-note"><IconMapPin size={15} /> Origins reflect the sourcing targets in the supplied ingredient preview. Check the product label for current details.</p>
        </div>
      </section>

      <section className="mwp-ingredients-next mwp-container">
        <div className="mwp-ingredients-next-panel">
          <div><p className="mwp-ingredients-kicker">INGREDIENTS, MEET YOUR EVERYDAY</p><h2>Find the formula<br />that fits your routine.</h2><p>Explore the collection and see how the ingredients come together.</p></div>
          <div className="mwp-ingredients-next-actions"><Link href="/products" className="mwp-ingredients-primary">Explore all formulas <IconArrowUpRight size={18} /></Link><Link href="/quiz">Find your formula <IconArrowRight size={16} /></Link></div>
        </div>
      </section>
    </main>
  );
}
