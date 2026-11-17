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
import { Loader2, Store, Search, Copy, Plus, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import api from "@/api/api";

const BASE = "/api/admin/wholesale";
const money = (n: number) => `$${Number(n || 0).toFixed(2)}`;
const when = (d?: string | null) => (d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "-");
const selectCls = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
const errMsg = (e: any, fallback: string) => e?.response?.data?.message || fallback;

/* ---------------------------------- types ---------------------------------- */

interface Partner {
  id: string; business: string; contact: string; email: string; phone: string; businessType: string; ein?: string | null;
  address: string; volume?: string | null; interested?: string | null; notes?: string | null; status: "pending" | "approved" | "rejected" | "suspended";
  codeHint?: string | null; hasCertificate: boolean; certificateName?: string | null; adminNote?: string | null;
  approvedAt?: string | null; lastLoginAt?: string | null; createdAt: string; orderCount?: number;
}
interface OrderItem { id: string; productName: string; packLabel: string; contains: string; detail: string; qty: number; unitPrice: number; lineTotal: number }
interface Order {
  id: string; orderNumber: string; status: string; paymentStatus: string; paymentNote?: string | null; invoiceNumber?: string | null;
  totalBoxes: number; subtotal: number; shippingCost: number; total: number; shippingAddress: string; customerNote?: string | null;
  carrier?: string | null; trackingNumber?: string | null; adminNote?: string | null; createdAt: string;
  partner?: { id: string; business: string; contact: string; email: string; phone: string };
  items: OrderItem[];
}
interface Pack { id?: string; type: "bottle" | "blister"; label: string; contains: string; detail: string; unit: string; units: number; price: number | string; isActive: boolean }
interface WProduct { id: string; name: string; slug: string; isActive: boolean; wholesaleEnabled: boolean; image: string | null; packs: Pack[] }

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800", approved: "bg-green-100 text-green-800", rejected: "bg-red-100 text-red-800", suspended: "bg-slate-200 text-slate-700",
  received: "bg-amber-100 text-amber-800", invoiced: "bg-blue-100 text-blue-800", shipped: "bg-green-100 text-green-800", delivered: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800",
  unpaid: "bg-red-100 text-red-800", paid: "bg-green-100 text-green-800", refunded: "bg-slate-200 text-slate-700",
};
const Pill = ({ v }: { v: string }) => <Badge className={`${STATUS_COLOR[v] || ""} hover:${STATUS_COLOR[v] || ""} capitalize`}>{v}</Badge>;

/* ---------------------------------- page ---------------------------------- */

export default function WholesalePage() {
  const [tab, setTab] = useState<"orders" | "partners" | "products">("orders");
  const [pending, setPending] = useState(0);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold"><Store className="h-6 w-6" /> Wholesale</h1>
          <p className="text-sm text-muted-foreground">Approved business partners order by the box at wholesale prices. Their orders and payments are kept separate from store orders.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={tab === "orders" ? "default" : "outline"} onClick={() => setTab("orders")}>Orders and payments</Button>
          <Button variant={tab === "partners" ? "default" : "outline"} onClick={() => setTab("partners")}>
            Partners {pending > 0 && <Badge className="ml-2 bg-red-600 hover:bg-red-600">{pending}</Badge>}
          </Button>
          <Button variant={tab === "products" ? "default" : "outline"} onClick={() => setTab("products")}>Products and prices</Button>
        </div>
      </div>
      {tab === "orders" && <OrdersTab />}
      {tab === "partners" && <PartnersTab onPending={setPending} />}
      {tab === "products" && <ProductsTab />}
    </div>
  );
}

/* ---------------------------------- orders ---------------------------------- */

function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [status, setStatus] = useState("");
  const [pay, setPay] = useState("");
  const [search, setSearch] = useState("");
  const [summary, setSummary] = useState({ awaitingPayment: 0, openOrders: 0 });
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
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Open orders (not shipped yet)</p><p className="text-3xl font-semibold">{summary.openOrders}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Waiting for payment</p><p className="text-3xl font-semibold">{money(summary.awaitingPayment)}</p></CardContent></Card>
      </div>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Order number, business or email" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <select className={`${selectCls} w-44`} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All order statuses</option>
              {["received", "invoiced", "shipped", "delivered", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className={`${selectCls} w-44`} value={pay} onChange={(e) => { setPay(e.target.value); setPage(1); }}>
              <option value="">All payment statuses</option>
              {["unpaid", "invoiced", "paid", "refunded"].map((s) => <option key={s} value={s}>{s}</option>)}
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
                    <TableCell><div>{o.partner?.business}</div><div className="text-xs text-muted-foreground">{o.partner?.email}</div></TableCell>
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
  const [f, setF] = useState({
    status: order.status, paymentStatus: order.paymentStatus, paymentNote: order.paymentNote || "", invoiceNumber: order.invoiceNumber || "",
    shippingCost: String(order.shippingCost ?? 0), carrier: order.carrier || "", trackingNumber: order.trackingNumber || "", adminNote: order.adminNote || "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setF((x) => ({ ...x, [k]: v }));
  const total = Number(order.subtotal) + (Number(f.shippingCost) || 0);

  const save = async () => {
    setSaving(true);
    try {
      const r = await api.patch(`${BASE}/orders/${order.id}`, { ...f, shippingCost: Number(f.shippingCost) || 0 });
      toast.success("Order updated");
      onSaved(r.data.data.order);
    } catch (e) {
      toast.error(errMsg(e, "Could not save"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order {order.orderNumber}</DialogTitle>
          <DialogDescription>{order.partner?.business} · {order.partner?.contact} · {order.partner?.email} · {order.partner?.phone} · placed {when(order.createdAt)}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Pack</TableHead><TableHead>Boxes</TableHead><TableHead>Price</TableHead><TableHead className="text-right">Line total</TableHead></TableRow></TableHeader>
              <TableBody>
                {order.items.map((i) => (
                  <TableRow key={i.id}><TableCell>{i.productName}</TableCell><TableCell>{i.packLabel}<div className="text-xs text-muted-foreground">{i.contains}</div></TableCell><TableCell>{i.qty}</TableCell><TableCell>{money(i.unitPrice)}</TableCell><TableCell className="text-right">{money(i.lineTotal)}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="text-sm"><b>Ship to:</b> {order.shippingAddress}</p>
          {order.customerNote && <p className="text-sm"><b>Partner note:</b> {order.customerNote}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1"><Label>Order status</Label>
              <select className={selectCls} value={f.status} onChange={(e) => set("status", e.target.value)}>{["received", "invoiced", "shipped", "delivered", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}</select>
              <p className="text-xs text-muted-foreground">Choosing &quot;shipped&quot; emails the partner the carrier and tracking number.</p></div>
            <div className="space-y-1"><Label>Payment status</Label>
              <select className={selectCls} value={f.paymentStatus} onChange={(e) => set("paymentStatus", e.target.value)}>{["unpaid", "invoiced", "paid", "refunded"].map((s) => <option key={s} value={s}>{s}</option>)}</select>
              <p className="text-xs text-muted-foreground">Choosing &quot;invoiced&quot; emails the partner the total and invoice number.</p></div>
            <div className="space-y-1"><Label>Shipping cost (USD)</Label><Input type="number" min="0" step="0.01" value={f.shippingCost} onChange={(e) => set("shippingCost", e.target.value)} />
              <p className="text-xs text-muted-foreground">Order total: <b>{money(total)}</b> (boxes {money(order.subtotal)} + shipping)</p></div>
            <div className="space-y-1"><Label>Invoice number</Label><Input value={f.invoiceNumber} onChange={(e) => set("invoiceNumber", e.target.value)} /></div>
            <div className="space-y-1"><Label>Payment note (how/when they paid)</Label><Input value={f.paymentNote} onChange={(e) => set("paymentNote", e.target.value)} /></div>
            <div className="space-y-1"><Label>Carrier</Label><Input value={f.carrier} onChange={(e) => set("carrier", e.target.value)} placeholder="USPS, UPS, FedEx" /></div>
            <div className="space-y-1 sm:col-span-2"><Label>Tracking number</Label><Input value={f.trackingNumber} onChange={(e) => set("trackingNumber", e.target.value)} /></div>
            <div className="space-y-1 sm:col-span-2"><Label>Internal note (never shown to the partner)</Label><Textarea rows={2} value={f.adminNote} onChange={(e) => set("adminNote", e.target.value)} /></div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Close</Button><Button onClick={save} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save order</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------------- partners ---------------------------------- */

function PartnersTab({ onPending }: { onPending: (n: number) => void }) {
  const [rows, setRows] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<Partner | null>(null);
  const [code, setCode] = useState<{ business: string; code: string } | null>(null);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get(`${BASE}/partners`, { params: { status: status || undefined, search: search || undefined } });
      setRows(r.data.data.partners);
      onPending(r.data.data.pending);
    } catch (e) {
      toast.error(errMsg(e, "Could not load partners"));
    } finally {
      setLoading(false);
    }
  }, [status, search, onPending]);
  useEffect(() => { load(); }, [load]);

  const act = async (p: Partner, action: "approve" | "reject" | "suspend" | "reset-code") => {
    try {
      const r = await api.post(`${BASE}/partners/${p.id}/${action}`);
      if (r.data.data.code) setCode({ business: p.business, code: r.data.data.code });
      else toast.success(r.data.message);
      setOpen(null);
      load();
    } catch (e) {
      toast.error(errMsg(e, "Could not complete the action"));
    }
  };

  const viewCertificate = async (p: Partner) => {
    try {
      const r = await api.get(`${BASE}/partners/${p.id}/certificate`, { responseType: "blob" });
      window.open(URL.createObjectURL(r.data), "_blank", "noopener");
    } catch (e) {
      toast.error(errMsg(e, "Could not open the certificate"));
    }
  };

  const saveNote = async (p: Partner) => {
    try {
      await api.patch(`${BASE}/partners/${p.id}`, { adminNote: note });
      toast.success("Note saved");
      load();
    } catch (e) {
      toast.error(errMsg(e, "Could not save"));
    }
  };

  return (
    <>
      <Card>
        <CardHeader><CardTitle>Wholesale partners</CardTitle>
          <CardDescription>Applications arrive here. Approve a business to create its private access code; the code is emailed to the partner and shown to you once. Only a scrambled copy is stored.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative w-full max-w-xs"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Business, name or email" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <select className={`${selectCls} w-44`} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>{["pending", "approved", "rejected", "suspended"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Business</TableHead><TableHead>Contact</TableHead><TableHead>Status</TableHead><TableHead>Orders</TableHead><TableHead>Applied</TableHead><TableHead>Last sign-in</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={6} className="py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
                  : rows.length === 0 ? <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No partners yet</TableCell></TableRow>
                  : rows.map((p) => (
                    <TableRow key={p.id} className="cursor-pointer" onClick={() => { setOpen(p); setNote(p.adminNote || ""); }}>
                      <TableCell className="font-medium">{p.business}<div className="text-xs text-muted-foreground">{p.businessType}</div></TableCell>
                      <TableCell>{p.contact}<div className="text-xs text-muted-foreground">{p.email}</div></TableCell>
                      <TableCell><Pill v={p.status} /></TableCell>
                      <TableCell>{p.orderCount ?? 0}</TableCell>
                      <TableCell>{when(p.createdAt)}</TableCell>
                      <TableCell>{when(p.lastLoginAt)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {open && (
            <>
              <DialogHeader><DialogTitle>{open.business}</DialogTitle><DialogDescription>Applied {when(open.createdAt)} · <span className="capitalize">{open.status}</span>{open.codeHint ? ` · code ends in ${open.codeHint}` : ""}</DialogDescription></DialogHeader>
              <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                {([["Contact", open.contact], ["Email", open.email], ["Phone", open.phone], ["Business type", open.businessType], ["EIN / Tax ID", open.ein || "-"], ["Expected volume", open.volume || "-"], ["Interested in", open.interested || "-"]] as [string, string][]).map(([k, v]) => (
                  <div key={k}><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
                ))}
                <div className="sm:col-span-2"><dt className="text-muted-foreground">Shipping address</dt><dd className="font-medium">{open.address}</dd></div>
                {open.notes && <div className="sm:col-span-2"><dt className="text-muted-foreground">Their note</dt><dd>{open.notes}</dd></div>}
              </dl>
              {open.hasCertificate && <Button variant="outline" className="w-fit" onClick={() => viewCertificate(open)}><FileText className="mr-2 h-4 w-4" /> View resale certificate</Button>}
              <div className="space-y-1"><Label>Internal note</Label><Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} /><Button size="sm" variant="outline" onClick={() => saveNote(open)}>Save note</Button></div>
              <DialogFooter className="gap-2">
                {open.status !== "approved" && <Button onClick={() => act(open, "approve")}>Approve and create access code</Button>}
                {open.status === "approved" && <Button variant="outline" onClick={() => act(open, "reset-code")}>Create new access code</Button>}
                {open.status === "approved" && <Button variant="destructive" onClick={() => act(open, "suspend")}>Suspend</Button>}
                {open.status === "pending" && <Button variant="destructive" onClick={() => act(open, "reject")}>Reject</Button>}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!code} onOpenChange={(o) => !o && setCode(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Access code for {code?.business}</DialogTitle><DialogDescription>It was emailed to the partner. This is the only time you can see it; if it is lost, create a new one.</DialogDescription></DialogHeader>
          <div className="flex items-center gap-2 rounded-md border bg-muted p-3 font-mono text-lg tracking-wider">
            <span className="flex-1 break-all">{code?.code}</span>
            <Button size="icon" variant="outline" onClick={() => { navigator.clipboard?.writeText(code?.code || ""); toast.success("Copied"); }}><Copy className="h-4 w-4" /></Button>
          </div>
          <DialogFooter><Button onClick={() => setCode(null)}>Done</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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
  const [minBoxes, setMinBoxes] = useState(4);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get(`${BASE}/products`);
      setProducts(r.data.data.products);
      setMinBoxes(r.data.data.minBoxes);
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
          <CardDescription>Turn wholesale on for any product and set its own box prices (separate from the store price). Minimum order is {minBoxes} boxes (set with WHOLESALE_MIN_BOXES). Only approved partners can ever see these prices.</CardDescription></CardHeader>
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
        <div className="flex items-center gap-3"><Switch checked={enabled} onCheckedChange={setEnabled} /><Label>{enabled ? "On: approved partners can order this product" : "Off: not shown to partners"}</Label></div>
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
