import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Store, Search, Copy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/api/api";

const BASE = "/api/admin/wholesale";
const money = (n: number) => `$${Number(n || 0).toFixed(2)}`;
const when = (d?: string | null) => (d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "-");
const selectCls = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
const errMsg = (e: any, fallback: string) => e?.response?.data?.message || fallback;

/* ---------------------------------- types ---------------------------------- */

interface OrderItem { id: string; productName: string; packLabel: string; contains: string; detail: string; qty: number; unitPrice: number; lineTotal: number }
interface Order {
  id: string; orderNumber: string; status: string; paymentStatus: string; paymentNote?: string | null; invoiceNumber?: string | null;
  paidAt?: string | null; paymentIntentId?: string | null; hasAccount: boolean;
  totalBoxes: number; subtotal: number; shippingCost: number; total: number; shippingAddress: string; customerNote?: string | null;
  carrier?: string | null; trackingNumber?: string | null; adminNote?: string | null; createdAt: string;
  buyer: { business: string; name: string; email: string; phone: string };
  items: OrderItem[];
}
interface Pack { id?: string; type: "bottle" | "blister"; label: string; contains: string; detail: string; unit: string; units: number; price: number | string; isActive: boolean }
interface WProduct { id: string; name: string; slug: string; isActive: boolean; wholesaleEnabled: boolean; image: string | null; packs: Pack[] }

const STATUS_COLOR: Record<string, string> = {
  pending_payment: "bg-slate-200 text-slate-700", received: "bg-amber-100 text-amber-800", shipped: "bg-blue-100 text-blue-800", delivered: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800",
  unpaid: "bg-red-100 text-red-800", paid: "bg-green-100 text-green-800", refunded: "bg-slate-200 text-slate-700",
};
const Pill = ({ v }: { v: string }) => <Badge className={`${STATUS_COLOR[v] || ""} hover:${STATUS_COLOR[v] || ""}`}>{v === "received" ? "paid, to ship" : v === "pending_payment" ? "awaiting payment" : v}</Badge>;

/* ---------------------------------- page ---------------------------------- */

export default function WholesalePage() {
  const [tab, setTab] = useState<"orders" | "products" | "settings">("orders");
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold"><Store className="h-6 w-6" /> Wholesale</h1>
          <p className="text-sm text-muted-foreground">Wholesale buyers order by the box at the prices you set here and pay by card on Stripe. Their orders and payments are kept separate from store orders.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={tab === "orders" ? "default" : "outline"} onClick={() => setTab("orders")}>Orders and payments</Button>
                    <Button variant={tab === "products" ? "default" : "outline"} onClick={() => setTab("products")}>Products and prices</Button>
          <Button variant={tab === "settings" ? "default" : "outline"} onClick={() => setTab("settings")}>Link and settings</Button>
        </div>
      </div>
      {tab === "orders" && <OrdersTab />}
            {tab === "products" && <ProductsTab />}
      {tab === "settings" && <SettingsTab />}
    </div>
  );
}

/* ---------------------------------- orders ---------------------------------- */

const STATUS_LABEL: Record<string, string> = { pending_payment: "awaiting payment", received: "paid, to ship", shipped: "shipped", delivered: "delivered", cancelled: "cancelled" };

function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [status, setStatus] = useState("");
  const [pay, setPay] = useState("");
  const [search, setSearch] = useState("");
  const [summary, setSummary] = useState({ paidTotal: 0, toShip: 0 });
  const [open, setOpen] = useState<Order | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get(`${BASE}/orders`, { params: { page, status: status || undefined, paymentStatus: pay || undefined, search: search || undefined } });
      setOrders(r.data.data.orders);
      setPages(r.data.data.pagination.pages);
      setSummary(r.data.data.summary);
    } catch (e) {
      toast.error(errMsg(e, "Could not load orders"));
    } finally {
      setLoading(false);
    }
  }, [page, status, pay, search]);
  useEffect(() => { load(); }, [load]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Paid orders waiting to ship</p><p className="text-3xl font-semibold">{summary.toShip}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total paid (all wholesale orders)</p><p className="text-3xl font-semibold">{money(summary.paidTotal)}</p></CardContent></Card>
      </div>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Order number, business or email" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <select className={`${selectCls} w-48`} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All paid orders</option>
              {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select className={`${selectCls} w-44`} value={pay} onChange={(e) => { setPay(e.target.value); setPage(1); }}>
              <option value="">All payments</option>
              {["paid", "refunded", "unpaid"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Business</TableHead><TableHead>Boxes</TableHead><TableHead>Total</TableHead><TableHead>Order status</TableHead><TableHead>Payment</TableHead><TableHead>Placed</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
                ) : orders.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">No wholesale orders yet</TableCell></TableRow>
                ) : orders.map((o) => (
                  <TableRow key={o.id} className="cursor-pointer" onClick={() => setOpen(o)}>
                    <TableCell className="font-medium">{o.orderNumber}</TableCell>
                    <TableCell><div>{o.buyer.business}</div><div className="text-xs text-muted-foreground">{o.buyer.email}{o.hasAccount ? " · has account" : " · guest"}</div></TableCell>
                    <TableCell>{o.totalBoxes}</TableCell>
                    <TableCell>{money(o.total)}</TableCell>
                    <TableCell><Pill v={o.status} /></TableCell>
                    <TableCell><Pill v={o.paymentStatus} /></TableCell>
                    <TableCell>{when(o.createdAt)}</TableCell>
                  </TableRow>
                ))}
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
      {open && <OrderDialog order={open} onClose={() => setOpen(null)} onSaved={(o) => { setOpen(o); load(); }} />}
    </>
  );
}

function OrderDialog({ order, onClose, onSaved }: { order: Order; onClose: () => void; onSaved: (o: Order) => void }) {
  const [f, setF] = useState({ status: order.status, carrier: order.carrier || "", trackingNumber: order.trackingNumber || "", invoiceNumber: order.invoiceNumber || "", adminNote: order.adminNote || "" });
  const [saving, setSaving] = useState(false);
  const [confirmRefund, setConfirmRefund] = useState(false);
  const set = (k: string, v: string) => setF((x) => ({ ...x, [k]: v }));
  const paid = order.paymentStatus === "paid";

  const save = async () => {
    setSaving(true);
    try {
      const r = await api.patch(`${BASE}/orders/${order.id}`, f);
      toast.success("Order updated");
      onSaved(r.data.data.order);
    } catch (e) {
      toast.error(errMsg(e, "Could not save"));
    } finally {
      setSaving(false);
    }
  };
  const refund = async () => {
    setSaving(true);
    try {
      const r = await api.post(`${BASE}/orders/${order.id}/refund`);
      toast.success("Refund sent to the customer's card");
      setConfirmRefund(false);
      onSaved(r.data.data.order);
    } catch (e) {
      toast.error(errMsg(e, "Refund failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order {order.orderNumber}</DialogTitle>
          <DialogDescription>{order.buyer.business} · {order.buyer.name} · {order.buyer.email} · {order.buyer.phone} · {order.hasAccount ? "has a store account" : "guest"} · placed {when(order.createdAt)}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Pack</TableHead><TableHead>Boxes</TableHead><TableHead>Price</TableHead><TableHead className="text-right">Line total</TableHead></TableRow></TableHeader>
              <TableBody>
                {order.items.map((i) => (
                  <TableRow key={i.id}><TableCell>{i.productName}</TableCell><TableCell>{i.packLabel}<div className="text-xs text-muted-foreground">{i.contains}</div></TableCell><TableCell>{i.qty}</TableCell><TableCell>{money(i.unitPrice)}</TableCell><TableCell className="text-right">{money(i.lineTotal)}</TableCell></TableRow>
                ))}
                <TableRow><TableCell colSpan={4} className="text-right">Shipping</TableCell><TableCell className="text-right">{money(order.shippingCost)}</TableCell></TableRow>
                <TableRow><TableCell colSpan={4} className="text-right font-semibold">Total</TableCell><TableCell className="text-right font-semibold">{money(order.total)}</TableCell></TableRow>
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm"><Pill v={order.paymentStatus} /> <span className="text-muted-foreground">{paid ? `Paid by card on Stripe${order.paidAt ? ` on ${when(order.paidAt)}` : ""}${order.paymentIntentId ? ` · ${order.paymentIntentId}` : ""}` : order.paymentStatus === "refunded" ? "Refunded to the customer's card" : "Not paid. The customer has not finished paying on Stripe."}</span></div>
          <p className="text-sm"><b>Ship to:</b> {order.shippingAddress}</p>
          {order.customerNote && <p className="text-sm"><b>Buyer note:</b> {order.customerNote}</p>}
          {order.adminNote?.includes("CHECK PAYMENT") && <p className="rounded-md bg-red-50 p-2 text-sm text-red-800">{order.adminNote}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1"><Label>Order status</Label>
              <select className={selectCls} value={f.status} onChange={(e) => set("status", e.target.value)}>{Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
              <p className="text-xs text-muted-foreground">Choosing &quot;shipped&quot; emails the buyer the carrier and tracking number.</p></div>
            <div className="space-y-1"><Label>Invoice / receipt number (optional)</Label><Input value={f.invoiceNumber} onChange={(e) => set("invoiceNumber", e.target.value)} /></div>
            <div className="space-y-1"><Label>Carrier</Label><Input value={f.carrier} onChange={(e) => set("carrier", e.target.value)} placeholder="USPS, UPS, FedEx" /></div>
            <div className="space-y-1"><Label>Tracking number</Label><Input value={f.trackingNumber} onChange={(e) => set("trackingNumber", e.target.value)} /></div>
            <div className="space-y-1 sm:col-span-2"><Label>Internal note (never shown to the buyer)</Label><Textarea rows={2} value={f.adminNote} onChange={(e) => set("adminNote", e.target.value)} /></div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {paid ? <Button variant="destructive" onClick={() => setConfirmRefund(true)} disabled={saving}>Refund in full</Button> : <span />}
          <div className="flex gap-2"><Button variant="outline" onClick={onClose}>Close</Button><Button onClick={save} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save order</Button></div>
        </DialogFooter>
        <Dialog open={confirmRefund} onOpenChange={setConfirmRefund}>
          <DialogContent>
            <DialogHeader><DialogTitle>Refund {money(order.total)}?</DialogTitle><DialogDescription>The full amount goes back to the buyer&apos;s card through Stripe and the order is cancelled. This cannot be undone.</DialogDescription></DialogHeader>
            <DialogFooter><Button variant="outline" onClick={() => setConfirmRefund(false)}>Keep the order</Button><Button variant="destructive" onClick={refund} disabled={saving}>Refund</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------------- settings ---------------------------------- */

function SettingsTab() {
  const [s, setS] = useState<{ isEnabled: boolean; minBoxes: number | string; shippingFlat: number | string } | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    api.get(`${BASE}/settings`).then((r) => setS(r.data.data.settings)).catch((e) => toast.error(errMsg(e, "Could not load settings")));
  }, []);
  const link = "https://www.mwpsupplements.com/wholesale";
  const save = async () => {
    if (!s) return;
    setSaving(true);
    try {
      await api.put(`${BASE}/settings`, { isEnabled: s.isEnabled, minBoxes: Number(s.minBoxes), shippingFlat: Number(s.shippingFlat) });
      toast.success("Wholesale settings saved");
    } catch (e) {
      toast.error(errMsg(e, "Could not save"));
    } finally {
      setSaving(false);
    }
  };
  if (!s) return <Loader2 className="h-5 w-5 animate-spin" />;
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>How wholesale works</CardTitle></CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
            <li><b>Set prices.</b> In the Products and prices tab, turn wholesale on for a product and set its box prices (separate from the store price).</li>
            <li><b>Share the private link</b> with your wholesale buyers (not shown anywhere on the store): <span className="font-mono">{link}</span>
              <Button size="sm" variant="outline" className="ml-2" onClick={() => { navigator.clipboard?.writeText(link); toast.success("Link copied"); }}><Copy className="mr-1 h-3 w-3" /> Copy</Button></li>
            <li><b>Buyers order and pay by card on Stripe.</b> They can sign in (the order then shows in their account) or buy as a guest. A page is never marked paid until Stripe confirms the full amount, and a double click never charges twice.</li>
            <li><b>You ship.</b> Open the order here, add the carrier and tracking number and mark it shipped. The buyer gets an email.</li>
          </ol>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Settings</CardTitle><CardDescription>If the link ever leaks, switch the page off here.</CardDescription></CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-3"><Switch checked={s.isEnabled} onCheckedChange={(v) => setS({ ...s, isEnabled: v })} /><Label>{s.isEnabled ? "Wholesale page is ON" : "Wholesale page is OFF (buyers see a not-available message)"}</Label></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1"><Label>Minimum boxes per order</Label><Input type="number" min="1" value={s.minBoxes} onChange={(e) => setS({ ...s, minBoxes: e.target.value })} /></div>
            <div className="space-y-1"><Label>Shipping added to each order (USD, 0 = free)</Label><Input type="number" min="0" step="0.01" value={s.shippingFlat} onChange={(e) => setS({ ...s, shippingFlat: e.target.value })} /></div>
          </div>
          <Button onClick={save} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------------------------- products ---------------------------------- */

const blankPack = (type: "bottle" | "blister"): Pack =>
  type === "bottle"
    ? { type, label: "Bottle Box", contains: "6 bottles per box", detail: "", unit: "bottle", units: 6, price: "", isActive: true }
    : { type, label: "Blister Box", contains: "24 blisters per box", detail: "1 blister = 3 capsules · 1-day serving", unit: "blister", units: 24, price: "", isActive: true };

function ProductsTab() {
  const [products, setProducts] = useState<WProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [edit, setEdit] = useState<WProduct | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get(`${BASE}/products`);
      setProducts(r.data.data.products);
    } catch (e) {
      toast.error(errMsg(e, "Could not load products"));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const shown = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <Card>
        <CardHeader><CardTitle>Products and wholesale prices</CardTitle>
          <CardDescription>Turn wholesale on for any product and set its own box prices (separate from the store price). Buyers only see these prices on your private wholesale link.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="relative w-full max-w-xs"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Find a product" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Wholesale</TableHead><TableHead>Packs and prices</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={4} className="py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
                  : shown.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell><div className="flex items-center gap-3">{p.image && <img src={p.image} alt="" className="h-10 w-10 rounded object-contain" />}<div><div className="font-medium">{p.name}</div>{!p.isActive && <div className="text-xs text-muted-foreground">Hidden in the store</div>}</div></div></TableCell>
                      <TableCell>{p.wholesaleEnabled ? <Badge className="bg-green-100 text-green-800 hover:bg-green-100">On</Badge> : <Badge variant="outline">Off</Badge>}</TableCell>
                      <TableCell className="text-sm">{p.packs.length === 0 ? <span className="text-muted-foreground">No packs yet</span> : p.packs.map((k) => <div key={k.id}>{k.label}: <b>{money(Number(k.price))}</b> <span className="text-muted-foreground">({k.contains}){k.isActive ? "" : " · off"}</span></div>)}</TableCell>
                      <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => setEdit(JSON.parse(JSON.stringify(p)))}>Edit</Button></TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {edit && <ProductDialog product={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} />}
    </>
  );
}

function ProductDialog({ product, onClose, onSaved }: { product: WProduct; onClose: () => void; onSaved: () => void }) {
  const [enabled, setEnabled] = useState(product.wholesaleEnabled);
  const [packs, setPacks] = useState<Pack[]>(product.packs);
  const [saving, setSaving] = useState(false);
  const patch = (i: number, k: keyof Pack, v: string | number | boolean) => setPacks((ps) => ps.map((p, j) => (j === i ? { ...p, [k]: v } : p)));

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`${BASE}/products/${product.id}`, { wholesaleEnabled: enabled, packs: packs.map((p) => ({ ...p, price: Number(p.price), units: Number(p.units) })) });
      toast.success("Wholesale settings saved");
      onSaved();
    } catch (e) {
      toast.error(errMsg(e, "Could not save"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle>{product.name}: wholesale</DialogTitle><DialogDescription>Prices are per box. The per-item price shown to partners is calculated from &quot;items in box&quot;.</DialogDescription></DialogHeader>
        <div className="flex items-center gap-3"><Switch checked={enabled} onCheckedChange={setEnabled} /><Label>{enabled ? "On: buyers on the wholesale link can order this product" : "Off: not shown on the wholesale page"}</Label></div>
        <div className="space-y-3">
          {packs.map((p, i) => (
            <div key={i} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-6">
              <div className="space-y-1"><Label>Type</Label>
                <select className={selectCls} value={p.type} onChange={(e) => patch(i, "type", e.target.value)}><option value="bottle">Bottle</option><option value="blister">Blister</option></select></div>
              <div className="space-y-1 sm:col-span-2"><Label>Pack name</Label><Input value={p.label} onChange={(e) => patch(i, "label", e.target.value)} /></div>
              <div className="space-y-1 sm:col-span-2"><Label>What is in a box</Label><Input value={p.contains} onChange={(e) => patch(i, "contains", e.target.value)} placeholder="6 bottles per box" /></div>
              <div className="space-y-1"><Label>Price per box (USD)</Label><Input type="number" min="0" step="0.01" value={p.price} onChange={(e) => patch(i, "price", e.target.value)} /></div>
              <div className="space-y-1 sm:col-span-3"><Label>Detail line</Label><Input value={p.detail} onChange={(e) => patch(i, "detail", e.target.value)} placeholder="90 capsules per bottle" /></div>
              <div className="space-y-1"><Label>Items in box</Label><Input type="number" min="1" value={p.units} onChange={(e) => patch(i, "units", e.target.value)} /></div>
              <div className="space-y-1"><Label>Item name</Label><Input value={p.unit} onChange={(e) => patch(i, "unit", e.target.value)} placeholder="bottle" /></div>
              <div className="flex items-end justify-between gap-2"><label className="flex items-center gap-2 text-sm"><Switch checked={p.isActive} onCheckedChange={(v) => patch(i, "isActive", v)} /> Active</label>
                <Button size="icon" variant="ghost" onClick={() => setPacks((ps) => ps.filter((_, j) => j !== i))} aria-label="Remove pack"><Trash2 className="h-4 w-4" /></Button></div>
            </div>
          ))}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPacks((ps) => [...ps, blankPack("bottle")])}><Plus className="mr-1 h-4 w-4" /> Bottle box</Button>
            <Button variant="outline" size="sm" onClick={() => setPacks((ps) => [...ps, blankPack("blister")])}><Plus className="mr-1 h-4 w-4" /> Blister box</Button>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
