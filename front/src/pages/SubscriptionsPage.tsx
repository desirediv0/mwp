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
  orders: { id: string; orderNumber: string; total: string; status: string; createdAt: string; isSubscriptionRenewal: boolean }[];
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
      toast.success(`Reminders sent: ${d.reminders}. Renewals due: ${d.renewals}, charged: ${d.charged}.`);
      load();
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
