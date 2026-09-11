import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  Search,
  X,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Save,
  AlertTriangle,
} from "lucide-react";
import {
  products as productsApi,
  checkoutRecommendations,
} from "@/api/adminService";

interface ProductLite {
  id: string;
  name: string;
  slug?: string;
  image?: string | null;
  price?: number;
  missing?: boolean;
}

const MAX = 6;

export default function CheckoutRecommendationsPage() {
  const [selected, setSelected] = useState<ProductLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ProductLite[]>([]);
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await checkoutRecommendations.get();
      if (res.data.success) {
        const items = (res.data.data?.items || []).map((it: any) => ({
          id: it.product.id,
          name: it.product.name,
          slug: it.product.slug,
          image: it.product.image,
          price: it.product.price,
          missing: it.product.missing,
        }));
        setSelected(items);
        setDirty(false);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load checkout recommendations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Debounced product search
  useEffect(() => {
    if (search.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await productsApi.getProducts({
          search: search.trim(),
          limit: 20,
        });
        if (res.data.success) {
          const found = res.data.data?.products || [];
          setResults(
            found
              .filter((p: any) => !selected.some((s) => s.id === p.id))
              .map((p: any) => ({
                id: p.id,
                name: p.name,
                slug: p.slug,
                image:
                  p.image ||
                  p.images?.find((i: any) => i.isPrimary)?.url ||
                  p.images?.[0]?.url ||
                  null,
                price: p.basePrice ?? p.price ?? p.variants?.[0]?.price ?? 0,
              }))
          );
        }
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [search, selected]);

  const add = (p: ProductLite) => {
    if (selected.length >= MAX) {
      toast.error(`You can recommend at most ${MAX} products`);
      return;
    }
    setSelected((prev) => [...prev, p]);
    setResults((prev) => prev.filter((r) => r.id !== p.id));
    setDirty(true);
  };

  const remove = (id: string) => {
    setSelected((prev) => prev.filter((p) => p.id !== id));
    setDirty(true);
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= selected.length) return;
    setSelected((prev) => {
      const copy = [...prev];
      [copy[index], copy[next]] = [copy[next], copy[index]];
      return copy;
    });
    setDirty(true);
  };

  const save = async () => {
    try {
      setSaving(true);
      const res = await checkoutRecommendations.set(selected.map((p) => p.id));
      if (res.data.success) {
        toast.success("Checkout recommendations saved");
        setDirty(false);
      } else {
        toast.error(res.data.message || "Failed to save");
      }
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || "Failed to save recommendations"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Checkout Recommendations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pick up to {MAX} products to show as &ldquo;You may also like&rdquo;
            on the cart and checkout pages. Order here = display order.
          </p>
        </div>
        <Button onClick={save} disabled={saving || !dirty}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Selected list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Selected ({selected.length}/{MAX})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {selected.length === 0 && (
                <p className="text-sm text-muted-foreground py-4">
                  No products selected yet. Search below to add.
                </p>
              )}
              {selected.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 border rounded-lg p-2.5"
                >
                  <div className="h-12 w-12 rounded bg-muted overflow-hidden flex-shrink-0">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate flex items-center gap-2">
                      {p.name}
                      {p.missing && (
                        <Badge
                          variant="destructive"
                          className="text-[10px] gap-1"
                        >
                          <AlertTriangle className="h-3 w-3" /> missing
                        </Badge>
                      )}
                    </p>
                    {typeof p.price === "number" && p.price > 0 && (
                      <p className="text-xs text-muted-foreground">
                        ₹{p.price.toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      disabled={i === selected.length - 1}
                      onClick={() => move(i, 1)}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => remove(p.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Search / add */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add a product</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products by name…"
                  className="pl-9"
                  disabled={selected.length >= MAX}
                />
              </div>

              {selected.length >= MAX && (
                <p className="text-xs text-amber-600">
                  Limit reached — remove a product to add another.
                </p>
              )}

              {searching && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Searching…
                </div>
              )}

              {!searching && search.trim().length >= 2 && results.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">
                  No matching products.
                </p>
              )}

              <div className="space-y-1.5">
                {results.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => add(p)}
                    disabled={selected.length >= MAX}
                    className="w-full flex items-center gap-3 border rounded-lg p-2 hover:bg-accent text-left disabled:opacity-50"
                  >
                    <div className="h-10 w-10 rounded bg-muted overflow-hidden flex-shrink-0">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <span className="text-sm flex-1 truncate">{p.name}</span>
                    <span className="text-xs text-muted-foreground">Add</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
