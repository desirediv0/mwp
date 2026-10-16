import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, BookOpen, Info, Copy, Check, PlugZap, Link2, Unlink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import api from "@/api/api";

interface QbSettings {
  isEnabled: boolean;
  environment: "SANDBOX" | "PRODUCTION";
  syncMode: "AUTO" | "MANUAL";
  connected: boolean;
  companyName: string | null;
  realmId: string | null;
  connectedAt: string | null;
  lastSyncAt: string | null;
  lastError: string | null;
  redirectUri: string;
  sandbox: { clientId: string; secretMasked: string | null };
  production: { clientId: string; secretMasked: string | null };
  stats: { synced: number; failed: number; pending: number };
}

export default function QuickBooksSettingsPage() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<QbSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [env, setEnv] = useState<"SANDBOX" | "PRODUCTION">("SANDBOX");
  const [syncMode, setSyncMode] = useState<"AUTO" | "MANUAL">("AUTO");
  const [sandboxId, setSandboxId] = useState("");
  const [sandboxSecret, setSandboxSecret] = useState("");
  const [prodId, setProdId] = useState("");
  const [prodSecret, setProdSecret] = useState("");
  const [copied, setCopied] = useState(false);

  const apply = (d: QbSettings) => {
    setData(d);
    setEnv(d.environment);
    setSyncMode(d.syncMode);
    setSandboxId(d.sandbox.clientId);
    setProdId(d.production.clientId);
  };

  const load = async () => {
    try {
      const res = await api.get("/api/admin/quickbooks/settings");
      apply(res.data.data);
    } catch {
      toast.error("Failed to load QuickBooks settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Message after returning from the Intuit sign-in page
  useEffect(() => {
    const qb = params.get("qb");
    if (!qb) return;
    if (qb === "connected") toast.success("QuickBooks connected");
    else if (qb === "denied") toast.error("QuickBooks sign-in was cancelled");
    else if (qb === "invalid_state") toast.error("The sign-in expired. Please try Connect again.");
    else toast.error(params.get("reason") || "Could not connect QuickBooks");
    setParams({}, { replace: true });
    load();
  }, [params]);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  const save = (extra: Record<string, unknown> = {}, okMessage = "QuickBooks settings saved") =>
    run("save", async () => {
      const res = await api.put("/api/admin/quickbooks/settings", {
        environment: env,
        syncMode,
        sandbox: { clientId: sandboxId, clientSecret: sandboxSecret },
        production: { clientId: prodId, clientSecret: prodSecret },
        ...extra,
      });
      apply(res.data.data);
      setSandboxSecret("");
      setProdSecret("");
      toast.success(okMessage);
    });

  const connect = () =>
    run("connect", async () => {
      // keys must be saved before the Intuit sign-in
      await api.put("/api/admin/quickbooks/settings", {
        environment: env,
        sandbox: { clientId: sandboxId, clientSecret: sandboxSecret },
        production: { clientId: prodId, clientSecret: prodSecret },
      });
      const res = await api.get("/api/admin/quickbooks/connect-url", { params: { returnUrl: window.location.origin } });
      window.location.href = res.data.data.url;
    });

  const disconnect = () =>
    run("disconnect", async () => {
      if (!window.confirm("Disconnect QuickBooks? Orders will stop syncing until you connect again.")) return;
      const res = await api.post("/api/admin/quickbooks/disconnect");
      apply(res.data.data);
      toast.success("QuickBooks disconnected");
    });

  const test = () =>
    run("test", async () => {
      const res = await api.post("/api/admin/quickbooks/test-connection");
      toast.success(`Connected to ${res.data.data.companyName || "QuickBooks"}`);
    });

  const syncAll = () =>
    run("sync", async () => {
      const res = await api.post("/api/admin/quickbooks/sync-pending");
      const r = res.data.data;
      if (r.failed) toast.error(`${r.synced} synced, ${r.failed} failed. ${r.errors[0] || ""}`);
      else toast.success(r.total ? `${r.synced} order(s) sent to QuickBooks` : "Nothing to sync");
      await load();
    });

  const copy = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.redirectUri);
    setCopied(true);
    toast.success("Redirect URI copied");
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading || !data) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isLive = env === "PRODUCTION";
  const keyBlock = (
    label: string,
    id: string,
    setId: (v: string) => void,
    secret: string,
    setSecret: (v: string) => void,
    masked: string | null
  ) => (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label>{label} Client ID</Label>
        <Input value={id} onChange={(e) => setId(e.target.value)} autoComplete="off" placeholder="From developer.intuit.com > Keys & credentials" />
      </div>
      <div className="space-y-1.5">
        <Label>{label} Client Secret</Label>
        <Input
          type="password"
          autoComplete="off"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder={masked ? `Saved (${masked}). Paste a new one to replace it` : "Client secret"}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <BookOpen className="h-6 w-6" /> QuickBooks Online
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Every paid order is recorded in QuickBooks as a Sales Receipt. Cancelled orders and returns are recorded as Refund Receipts.
        </p>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Create an app at developer.intuit.com (Accounting scope). Test keys use a free sandbox company, live keys use your real company.</li>
              <li>In the app, add the Redirect URI shown below, for both Development and Production keys.</li>
              <li>Paste the Client ID and Secret below, save, then click Connect and sign in to QuickBooks.</li>
              <li>Test with the sandbox first. Switch to Live keys only after a test order looks right in QuickBooks.</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Connection</span>
            <span
              className={`text-xs font-semibold rounded-full px-3 py-1 border ${
                data.connected ? "text-green-700 bg-green-50 border-green-200" : "text-amber-700 bg-amber-50 border-amber-200"
              }`}
            >
              {data.connected ? `Connected${data.companyName ? `: ${data.companyName}` : ""}` : "Not connected"}
            </span>
          </CardTitle>
          {data.connected && (
            <CardDescription>
              {data.environment === "PRODUCTION" ? "Live company" : "Sandbox (test) company"}
              {data.connectedAt ? `, connected ${new Date(data.connectedAt).toLocaleDateString()}` : ""}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label>Redirect URI (add this in your Intuit app)</Label>
            <div className="flex gap-2">
              <Input readOnly value={data.redirectUri} className="bg-muted" />
              <Button type="button" variant="outline" onClick={copy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Live keys require an https address. Set API_PUBLIC_URL on the server so this shows your real domain.</p>
          </div>

          <div className="space-y-1.5">
            <Label>Which keys to use</Label>
            <Select value={env} onValueChange={(v: "SANDBOX" | "PRODUCTION") => setEnv(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SANDBOX">Test (sandbox company)</SelectItem>
                <SelectItem value="PRODUCTION">Live (real company)</SelectItem>
              </SelectContent>
            </Select>
            {env !== data.environment && <p className="text-xs text-amber-600">Saving a change here disconnects QuickBooks. You will connect again with the other keys.</p>}
          </div>

          {isLive ? keyBlock("Live", prodId, setProdId, prodSecret, setProdSecret, data.production.secretMasked) : keyBlock("Test", sandboxId, setSandboxId, sandboxSecret, setSandboxSecret, data.sandbox.secretMasked)}

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={() => save()} disabled={busy !== null}>
              {busy === "save" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save keys
            </Button>
            <Button type="button" onClick={connect} disabled={busy !== null}>
              {busy === "connect" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />}
              {data.connected ? "Reconnect" : "Connect QuickBooks"}
            </Button>
            {data.connected && (
              <>
                <Button type="button" variant="outline" onClick={test} disabled={busy !== null}>
                  {busy === "test" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlugZap className="h-4 w-4 mr-2" />}
                  Test connection
                </Button>
                <Button type="button" variant="outline" onClick={disconnect} disabled={busy !== null}>
                  <Unlink className="h-4 w-4 mr-2" /> Disconnect
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order sync</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="text-base font-medium">Send orders to QuickBooks</Label>
              <p className="text-sm text-muted-foreground">{data.connected ? "Turn off to pause syncing." : "Connect QuickBooks first."}</p>
            </div>
            <Switch
              checked={data.isEnabled}
              disabled={!data.connected || busy !== null}
              onCheckedChange={(v) => save({ isEnabled: v }, v ? "QuickBooks sync is on" : "QuickBooks sync is off")}
            />
          </div>

          <div className="space-y-1.5">
            <Label>When are orders sent?</Label>
            <Select
              value={syncMode}
              onValueChange={(v: "AUTO" | "MANUAL") => {
                setSyncMode(v);
                save({ syncMode: v }, "Sync mode saved");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AUTO">Automatically, as soon as an order is paid</SelectItem>
                <SelectItem value="MANUAL">Manually, with the Sync button on each order</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Refunds for cancelled orders and returns are recorded automatically when sync is on and mode is Automatic.</p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border p-3">
              <p className="text-2xl font-semibold text-green-700">{data.stats.synced}</p>
              <p className="text-xs text-muted-foreground">Synced</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-2xl font-semibold text-amber-600">{data.stats.pending}</p>
              <p className="text-xs text-muted-foreground">Waiting</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-2xl font-semibold text-red-600">{data.stats.failed}</p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
          </div>

          {data.lastError && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">Last problem: {data.lastError}</div>}

          <Button type="button" variant="outline" onClick={syncAll} disabled={!data.connected || busy !== null}>
            {busy === "sync" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Send waiting and failed orders now
          </Button>
          {data.lastSyncAt && <p className="text-xs text-muted-foreground">Last sync: {new Date(data.lastSyncAt).toLocaleString()}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What appears in QuickBooks</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1.5">
          <p>One Sales Receipt per order, numbered with the order number, for the customer (created automatically by email).</p>
          <p>Lines: each product, any discount, shipping charged, and sales tax collected. The total always equals what the customer paid in Stripe.</p>
          <p>The items "MWP Online Sales", "MWP Shipping Charged" and "MWP Sales Tax Collected" are created for you the first time.</p>
          <p>Cancelled or refunded orders and completed returns create a Refund Receipt for the refunded amount.</p>
        </CardContent>
      </Card>
    </div>
  );
}
