import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Repeat, Play, Search } from "lucide-react";
import { toast } from "sonner";
import api from "@/api/api";

type Status = "ACTIVE" | "PAST_DUE" | "CANCELLED";

interface Sub {
  id: string;
  status: Status;
  quantity: number;
  product: { name: string; slug?: string };
  unitPrice: number | null;
  discountPercent: number;
  nextBillingDate: string;
  lastBilledAt: string | null;
  billingCount: number;
  failedAttempts: number;
  lastError: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  cancelledBy: string | null;
  createdAt: string;
  orderCount: number;
  user: { id: string; name: string | null; email: string; phone: string | null };
}

interface Detail extends Sub {
  orders: { id: string; orderNumber: string; total: string; status: string; createdAt: string; isSubscriptionRenewal: boolean; shippingStatus: string | null; trackingCode: string | null; trackingUrl: string | null; labelUrl: string | null; shippingCarrier: string | null }[];
}

interface Forecast {
  scheduler?: { running: boolean; lastRunAt: string | null };
  days: number;
  dueNow: number;
  dueWeek: number;
  totalSubscriptions: number;
  expectedRevenue: number;
  products: { variantId: string; product: string; sku: string; units: number; subscriptions: number; inStock: number; shortBy: number }[];
}

interface PriceRow {
  variantId: string;
  product: string;
  sku: string;
  variantLabel: string;
  price: number;
  salePrice: number | null;
  sellingPrice: number;
  subscriptionPrice: number | null;
  effectivePrice: number;
  isActive: boolean;
}

interface Settings {
  isEnabled: boolean;
  discountPercent: number;
  reminderDays: number;
  maxRetries: number;
}

const date = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-");
const money = (n: number | string | null | undefined) => (n == null ? "-" : `$${Number(n).toFixed(2)}`);

const StatusBadge = ({ s }: { s: Status }) => {
  const map: Record<Status, string> = {
    ACTIVE: "bg-green-100 text-green-800 hover:bg-green-100",
    PAST_DUE: "bg-amber-100 text-amber-800 hover:bg-amber-100",
    CANCELLED: "bg-red-100 text-red-800 hover:bg-red-100",
  };
  const label: Record<Status, string> = { ACTIVE: "Active", PAST_DUE: "Payment issue", CANCELLED: "Cancelled" };
  return <Badge className={map[s]}>{label[s]}</Badge>;
};

export default function SubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Sub[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<"" | Status>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [prices, setPrices] = useState<PriceRow[]>([]);
  const [priceDraft, setPriceDraft] = useState<Record<string, string>>({});
  const [savingPrice, setSavingPrice] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [running, setRunning] = useState(false);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Sub | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/subscriptions", { params: { status: status || undefined, search: search || undefined, page, limit: 15 } });
      setRows(res.data.data.subscriptions);
      setCounts(res.data.data.counts || {});
      setPages(res.data.data.pagination.pages || 1);
    } catch {
      toast.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }, [status, search, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api
      .get("/api/admin/subscriptions/settings")
      .then((r) => setSettings(r.data.data.settings))
      .catch(() => toast.error("Failed to load subscription settings"));
  }, []);

  const loadForecast = useCallback(() => {
    api
      .get("/api/admin/subscriptions/forecast", { params: { days: 30 } })
      .then((r) => setForecast(r.data.data))
      .catch(() => setForecast(null));
  }, []);

  useEffect(() => {
    loadForecast();
  }, [loadForecast]);

  const loadPrices = useCallback(() => {
    api
      .get("/api/admin/subscriptions/prices")
      .then((r) => {
        setPrices(r.data.data.variants);
        setPriceDraft({});
      })
      .catch(() => toast.error("Failed to load product prices"));
  }, []);

  useEffect(() => {
    loadPrices();
  }, [loadPrices]);

  const savePrice = async (row: PriceRow, clear = false) => {
    const raw = clear ? "" : (priceDraft[row.variantId] ?? "");
    setSavingPrice(row.variantId);
    try {
      await api.put(`/api/admin/subscriptions/prices/${row.variantId}`, { subscriptionPrice: raw === "" ? null : Number(raw) });
      toast.success(raw === "" ? "Back to the global discount" : "Subscriber price saved");
      loadPrices();
      loadForecast();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not save the price");
    } finally {
      setSavingPrice(null);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    try {
      const r = await api.put("/api/admin/subscriptions/settings", settings);
      setSettings(r.data.data.settings);
      toast.success("Subscription settings saved");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const runNow = async () => {
    setRunning(true);
    try {
      const r = await api.post("/api/admin/subscriptions/run");
      const d = r.data.data;
      toast.success(`Reminders sent: ${d.reminders}. Due: ${d.renewals}, charged: ${d.charged}, failed: ${d.failed}, delayed: ${d.postponed}.`);
      load();
      loadForecast();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not run the jobs");
    } finally {
      setRunning(false);
    }
  };

  const openDetail = async (id: string) => {
    try {
      const r = await api.get(`/api/admin/subscriptions/${id}`);
      setDetail(r.data.data.subscription);
    } catch {
      toast.error("Could not load this subscription");
    }
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await api.post(`/api/admin/subscriptions/${cancelTarget.id}/cancel`, { reason: cancelReason || undefined });
      toast.success("Subscription cancelled and the customer was emailed");
      setCancelTarget(null);
      setCancelReason("");
      setDetail(null);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not cancel");
    } finally {
      setCancelling(false);
    }
  };

  const tabs: { key: "" | Status; label: string }[] = [
    { key: "", label: "All" },
    { key: "ACTIVE", label: `Active (${counts.ACTIVE || 0})` },
    { key: "PAST_DUE", label: `Payment issue (${counts.PAST_DUE || 0})` },
    { key: "CANCELLED", label: `Cancelled (${counts.CANCELLED || 0})` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Repeat className="h-6 w-6" /> Subscriptions
          </h1>
          <p className="text-sm text-muted-foreground">Customers who subscribed to a monthly delivery. Each renewal creates a normal order.</p>
        </div>
        <Button variant="outline" onClick={runNow} disabled={running}>
          {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />} Run billing now
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How subscriptions work (read this first)</CardTitle>
          <CardDescription>Everything below works the same for every product, whether it has one option or many pack sizes.</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed">
            <li>
              <b>Turn it on.</b> In &quot;Subscription settings&quot; below, switch Subscriptions on. Every product page then shows two choices: &quot;One-time purchase&quot; and &quot;Subscribe monthly&quot;.
            </li>
            <li>
              <b>Choose the subscriber price.</b> You have two ways, and you can mix them:
              <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                <li><b>Same % off for everything:</b> type a number in &quot;Subscriber discount (%)&quot; (for example 5). A $100 product then costs subscribers $95.</li>
                <li><b>Exact price for one product:</b> in &quot;Subscriber price per product&quot; type the monthly price next to that product or pack size (for example 95) and press Save. This price wins over the % for that product. Clear it to go back to the % discount.</li>
              </ul>
              A product with several pack sizes (for example 30, 60 and 90 capsules) has one row per pack size, so each pack can have its own subscriber price. A product with only one option has just one row.
            </li>
            <li>
              <b>Customer subscribes.</b> The customer picks &quot;Subscribe monthly&quot;, chooses the delivery address and quantity, agrees to monthly billing and pays the first month on Stripe. Their card is saved by Stripe for the next months.
            </li>
            <li>
              <b>Price is locked.</b> A customer keeps the price they signed up at every month, even if you change prices later. New customers get the new price.
            </li>
            <li>
              <b>Every month, automatically.</b> A few days before the charge date (you set how many days) the customer gets a reminder email. On the charge date the card is charged and a normal order is created. It appears in Orders with a &quot;Subscription renewal&quot; tag, stock goes down, and the shipping label works the same as for any other order.
            </li>
            <li>
              <b>If a payment fails.</b> We try again 2 days later, up to the number of attempts you set. The customer gets an email each time. After the last failed attempt the subscription is cancelled and you get an email. If the product is out of stock the customer is not charged; we wait 3 days and try again. If the product is removed from the store the subscription is cancelled and the customer is told.
            </li>
            <li>
              <b>Cancel or skip.</b> Customers can skip the next shipment, change the delivery address or cancel any time in My Account → Subscriptions. You can cancel any subscription yourself from the list below. Deleting a customer account cancels their subscriptions.
            </li>
            <li>
              <b>Parcels.</b> Open a subscription to see every order it created with the carrier, tracking number or &quot;Needs label&quot;. Use the normal Orders page to buy labels and ship, exactly like other orders. The &quot;Coming up&quot; box shows how many units you need for the next 30 days compared with your stock.
            </li>
            <li>
              <b>Run billing now.</b> Billing runs by itself every 10 minutes on the live server. The &quot;Run billing now&quot; button runs it immediately (useful for testing).
            </li>
          </ol>
        </CardContent>
      </Card>

      {forecast && (
        <Card>
          <CardHeader>
            <CardTitle>Coming up (next {forecast.days} days)</CardTitle>
            <CardDescription>Plan stock and shipping: every charge creates an order that appears in Orders with a Subscription tag.{" "}{forecast.scheduler?.running ? `Automatic billing is running${forecast.scheduler.lastRunAt ? ` (last check ${new Date(forecast.scheduler.lastRunAt).toLocaleString()})` : " (first check shortly after start)"}.` : "Automatic billing is NOT running on this server. Use Run billing now or enable the scheduler."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Due now</div><div className="text-2xl font-semibold">{forecast.dueNow}</div></div>
              <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Due in 7 days</div><div className="text-2xl font-semibold">{forecast.dueWeek}</div></div>
              <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Open subscriptions</div><div className="text-2xl font-semibold">{forecast.totalSubscriptions}</div></div>
              <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Expected revenue</div><div className="text-2xl font-semibold">{money(forecast.expectedRevenue)}</div></div>
            </div>
            {forecast.products.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Subscriptions</TableHead>
                    <TableHead>Units needed</TableHead>
                    <TableHead>In stock</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forecast.products.map((p) => (
                    <TableRow key={p.variantId}>
                      <TableCell>{p.product} <span className="text-xs text-muted-foreground">{p.sku}</span></TableCell>
                      <TableCell>{p.subscriptions}</TableCell>
                      <TableCell>{p.units}</TableCell>
                      <TableCell>{p.inStock}</TableCell>
                      <TableCell>{p.shortBy > 0 ? <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Short by {p.shortBy}</Badge> : <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Enough stock</Badge>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Subscription settings</CardTitle>
          <CardDescription>The discount shows on the product page as &quot;Save X%&quot; and applies to every shipment of new subscriptions.</CardDescription>
        </CardHeader>
        <CardContent>
          {settings ? (
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex items-center gap-3">
                <Switch checked={settings.isEnabled} onCheckedChange={(v) => setSettings({ ...settings, isEnabled: v })} />
                <Label>Subscriptions on</Label>
              </div>
              <div className="space-y-1">
                <Label htmlFor="disc">Subscriber discount (%)</Label>
                <Input id="disc" type="number" min={0} max={50} step="0.5" value={settings.discountPercent} onChange={(e) => setSettings({ ...settings, discountPercent: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="rem">Reminder email (days before)</Label>
                <Input id="rem" type="number" min={1} max={14} value={settings.reminderDays} onChange={(e) => setSettings({ ...settings, reminderDays: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ret">Charge attempts before cancel</Label>
                <Input id="ret" type="number" min={1} max={6} value={settings.maxRetries} onChange={(e) => setSettings({ ...settings, maxRetries: Number(e.target.value) })} />
              </div>
              <div className="md:col-span-4">
                <Button onClick={saveSettings} disabled={savingSettings}>
                  {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save settings
                </Button>
              </div>
            </div>
          ) : (
            <Loader2 className="h-5 w-5 animate-spin" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscriber price per product</CardTitle>
          <CardDescription>
            Set an exact monthly price for a product (for example $95 on a $100 product). Leave it empty to use the global discount above. Customers keep the price they signed up at, even if you change it later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Selling price</TableHead>
                  <TableHead>Subscribers pay</TableHead>
                  <TableHead>Set fixed price</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {prices.map((p) => (
                  <TableRow key={p.variantId}>
                    <TableCell>
                      <div className="font-medium">{p.product}</div>
                      <div className="text-xs text-muted-foreground">{p.variantLabel} · {p.sku}</div>
                    </TableCell>
                    <TableCell>{money(p.sellingPrice)}</TableCell>
                    <TableCell>
                      <span className="font-medium">{money(p.effectivePrice)}</span>{" "}
                      <span className="text-xs text-muted-foreground">{p.subscriptionPrice != null ? "fixed price" : "global discount"}</span>
                    </TableCell>
                    <TableCell>
                      <Input
                        className="w-28"
                        type="number"
                        min={1}
                        step="0.01"
                        placeholder={p.subscriptionPrice != null ? String(p.subscriptionPrice) : "e.g. 95"}
                        value={priceDraft[p.variantId] ?? ""}
                        onChange={(e) => setPriceDraft({ ...priceDraft, [p.variantId]: e.target.value })}
                      />
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button size="sm" disabled={savingPrice === p.variantId || !(priceDraft[p.variantId] ?? "")} onClick={() => savePrice(p)}>Save</Button>
                      {p.subscriptionPrice != null && (
                        <Button size="sm" variant="outline" disabled={savingPrice === p.variantId} onClick={() => savePrice(p, true)}>Use global discount</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {tabs.map((t) => (
                <Button key={t.key || "all"} size="sm" variant={status === t.key ? "default" : "outline"} onClick={() => { setStatus(t.key); setPage(1); }}>
                  {t.label}
                </Button>
              ))}
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Search customer or product" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next charge</TableHead>
                  <TableHead>Shipments</TableHead>
                  <TableHead>Per shipment</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">No subscriptions found</TableCell>
                  </TableRow>
                ) : (
                  rows.map((s) => (
                    <TableRow key={s.id} className="cursor-pointer" onClick={() => openDetail(s.id)}>
                      <TableCell>
                        <div className="font-medium">{s.user.name || "-"}</div>
                        <div className="text-xs text-muted-foreground">{s.user.email}</div>
                      </TableCell>
                      <TableCell>{s.product.name} x {s.quantity}</TableCell>
                      <TableCell><StatusBadge s={s.status} /></TableCell>
                      <TableCell>{s.status === "CANCELLED" ? "-" : date(s.nextBillingDate)}</TableCell>
                      <TableCell>{s.billingCount}</TableCell>
                      <TableCell>{money(s.unitPrice != null ? s.unitPrice * s.quantity : null)}</TableCell>
                      <TableCell className="text-right">
                        {s.status !== "CANCELLED" && (
                          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setCancelTarget(s); }}>Cancel</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-end gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
              <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>{detail.product.name} x {detail.quantity}</DialogTitle>
                <DialogDescription>{detail.user.name} · {detail.user.email}{detail.user.phone ? ` · ${detail.user.phone}` : ""}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Status</span><div className="mt-1"><StatusBadge s={detail.status} /></div></div>
                <div><span className="text-muted-foreground">Started</span><div>{date(detail.createdAt)}</div></div>
                <div><span className="text-muted-foreground">Next charge</span><div>{detail.status === "CANCELLED" ? "-" : date(detail.nextBillingDate)}</div></div>
                <div><span className="text-muted-foreground">Last charged</span><div>{date(detail.lastBilledAt)}</div></div>
                <div><span className="text-muted-foreground">Discount</span><div>{detail.discountPercent}%</div></div>
                <div><span className="text-muted-foreground">Failed attempts</span><div>{detail.failedAttempts}</div></div>
                {detail.lastError && <div className="col-span-2"><span className="text-muted-foreground">Last error</span><div className="text-red-700">{detail.lastError}</div></div>}
                {detail.status === "CANCELLED" && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Cancelled {date(detail.cancelledAt)} by {detail.cancelledBy || "-"}</span>
                    {detail.cancelReason && <div>{detail.cancelReason}</div>}
                  </div>
                )}
              </div>
              <div>
                <h3 className="mb-2 text-sm font-medium">Orders from this subscription</h3>
                <div className="max-h-56 overflow-y-auto rounded border">
                  <Table>
                    <TableBody>
                      {detail.orders.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell><a className="text-blue-700 underline" href={`/orders/${o.id}`}>#{o.orderNumber}</a></TableCell>
                          <TableCell>{o.isSubscriptionRenewal ? "Renewal" : "First order"}</TableCell>
                          <TableCell>{o.status}</TableCell>
                          <TableCell>{money(o.total)}</TableCell>
                          <TableCell>{date(o.createdAt)}</TableCell>
                          <TableCell className="text-xs">
                            {o.trackingCode ? (
                              <a className="text-blue-700 underline" href={o.trackingUrl || "#"} target="_blank" rel="noreferrer">{o.shippingCarrier || "Track"} {o.trackingCode}</a>
                            ) : o.labelUrl ? (
                              <a className="text-blue-700 underline" href={o.labelUrl} target="_blank" rel="noreferrer">Label ready</a>
                            ) : (
                              <span className="text-muted-foreground">Needs label</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <DialogFooter>
                {detail.status !== "CANCELLED" && <Button variant="destructive" onClick={() => setCancelTarget(detail)}>Cancel subscription</Button>}
                <Button variant="outline" onClick={() => setDetail(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!cancelTarget} onOpenChange={(o) => !o && !cancelling && setCancelTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this subscription?</DialogTitle>
            <DialogDescription>
              {cancelTarget?.user.email} will not be charged again and gets a cancellation email. Orders already placed are not affected.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label htmlFor="creason">Reason (optional)</Label>
            <Input id="creason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Shown only to your team" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)} disabled={cancelling}>Keep it</Button>
            <Button variant="destructive" onClick={confirmCancel} disabled={cancelling}>
              {cancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Cancel subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
