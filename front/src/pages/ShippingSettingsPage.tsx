import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Truck, Info, Copy, Check, ExternalLink, PlugZap } from "lucide-react";
import { toast } from "sonner";
import api from "@/api/api";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS",
  "MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];
const CARRIER_CHOICES = ["USPS", "UPS", "FEDEX", "DHLEXPRESS"];
const CARRIER_LABEL: Record<string, string> = { USPS: "USPS", UPS: "UPS", FEDEX: "FedEx", DHLEXPRESS: "DHL Express" };

interface ShippingSettings {
  isEnabled: boolean;
  bookingMode: "AUTO" | "MANUAL";
  keyConfigured: boolean;
  apiKeyMasked: string | null;
  keyMode: "TEST" | "LIVE";
  webhookSecretMasked: string | null;
  webhookUrl: string;
  origin: { name: string; company: string; street1: string; street2: string; city: string; state: string; zip: string; phone: string; email: string };
  parcel: { defaultWeightLb: number; packagingWeightLb: number; defaultLengthIn: number; defaultWidthIn: number; defaultHeightIn: number };
  rateStrategy: "CHEAPEST" | "FASTEST";
  allowedCarriers: string[];
  handlingFee: number;
  freeShippingThreshold: number;
  flatRate: number;
}

export default function ShippingSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState<ShippingSettings | null>(null);
  const [form, setForm] = useState<ShippingSettings | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [carriers, setCarriers] = useState<{ id: string; name: string }[] | null>(null);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/shipping/settings");
      setSaved(res.data.data);
      setForm(res.data.data);
    } catch {
      toast.error("Failed to load shipping settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = <K extends keyof ShippingSettings>(key: K, value: ShippingSettings[K]) => setForm((f) => (f ? { ...f, [key]: value } : f));
  const setOrigin = (key: keyof ShippingSettings["origin"], value: string) =>
    setForm((f) => (f ? { ...f, origin: { ...f.origin, [key]: value } } : f));
  const setParcel = (key: keyof ShippingSettings["parcel"], value: string) =>
    setForm((f) => (f ? { ...f, parcel: { ...f.parcel, [key]: value === "" ? 0 : Number(value) } } : f));

  const save = async (override?: Partial<{ isEnabled: boolean }>) => {
    if (!form) return;
    setSaving(true);
    try {
      const res = await api.put("/api/admin/shipping/settings", {
        isEnabled: override?.isEnabled ?? form.isEnabled,
        bookingMode: form.bookingMode,
        rateStrategy: form.rateStrategy,
        allowedCarriers: form.allowedCarriers,
        origin: form.origin,
        parcel: form.parcel,
        handlingFee: form.handlingFee,
        freeShippingThreshold: form.freeShippingThreshold,
        flatRate: form.flatRate,
        ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
        ...(webhookSecret.trim() ? { webhookSecret: webhookSecret.trim() } : {}),
      });
      setSaved(res.data.data);
      setForm(res.data.data);
      setApiKey("");
      setWebhookSecret("");
      toast.success("Shipping settings saved");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not save shipping settings");
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const res = await api.post("/api/admin/shipping/test-connection");
      setCarriers(res.data.data.carriers);
      toast.success("Connected to EasyPost");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not connect to EasyPost");
    } finally {
      setTesting(false);
    }
  };

  const toggleCarrier = (c: string) =>
    setForm((f) => {
      if (!f) return f;
      const has = f.allowedCarriers.includes(c);
      return { ...f, allowedCarriers: has ? f.allowedCarriers.filter((x) => x !== c) : [...f.allowedCarriers, c] };
    });

  const copyWebhook = () => {
    if (!saved) return;
    navigator.clipboard.writeText(saved.webhookUrl);
    setCopied(true);
    toast.success("Webhook URL copied");
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading || !form || !saved) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const field = (label: string, node: React.ReactNode, hint?: string) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {node}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Truck className="h-6 w-6" /> Shipping (USA)
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Live USPS, UPS and FedEx rates, shipping labels and tracking through EasyPost. All shipping is within the United States.
        </p>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Create a free account at easypost.com and copy an API key (test keys start with EZTK, production with EZAK).</li>
              <li>In EasyPost, add the carriers you want to use (USPS works out of the box; add UPS or FedEx accounts if you have them).</li>
              <li>Paste the key below, fill in the ship-from address, and save. Use a test key first.</li>
              <li>Add the webhook URL shown below in EasyPost (Webhooks, event <code>tracker.updated</code>) so tracking updates arrive by themselves.</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Status</span>
            {saved.keyConfigured && (
              <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                {saved.keyMode === "LIVE" ? "Live key saved" : "Test key saved"}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="text-base font-medium">Use EasyPost shipping</Label>
              <p className="text-sm text-muted-foreground">Off = checkout uses the flat rate below (if set), and no labels can be bought.</p>
            </div>
            <Switch
              checked={form.isEnabled}
              disabled={saving}
              onCheckedChange={(v) => {
                set("isEnabled", v);
                save({ isEnabled: v });
              }}
            />
          </div>

          {field(
            "When are shipping labels bought?",
            <Select value={form.bookingMode} onValueChange={(v: "AUTO" | "MANUAL") => set("bookingMode", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AUTO">Automatically, as soon as an order is paid</SelectItem>
                <SelectItem value="MANUAL">Manually, when I click "Create label" on the order</SelectItem>
              </SelectContent>
            </Select>,
            "Automatic is fastest. Manual lets you check the order and choose another carrier first."
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>EasyPost connection</CardTitle>
          <CardDescription>The key is stored encrypted and never shown again in full.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {field(
            "API key",
            <Input
              type="password"
              autoComplete="off"
              placeholder={saved.apiKeyMasked ? `Saved (${saved.apiKeyMasked}). Paste a new key to replace it` : "EZTK... or EZAK..."}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={testConnection} disabled={testing || !saved.keyConfigured}>
              {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlugZap className="h-4 w-4 mr-2" />}
              Test connection
            </Button>
            <a href="https://app.easypost.com/account/api-keys" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              Open EasyPost <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          {carriers && (
            <p className="text-sm text-muted-foreground">
              Carriers on your account: {carriers.length ? carriers.map((c) => c.name).join(", ") : "none yet, add one in EasyPost"}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ship-from address</CardTitle>
          <CardDescription>Where your packages are sent from (your warehouse). Must be a US address.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {field("Name / contact *", <Input value={form.origin.name} onChange={(e) => setOrigin("name", e.target.value)} placeholder="MWP Supplements" />)}
          {field("Company", <Input value={form.origin.company} onChange={(e) => setOrigin("company", e.target.value)} placeholder="MWP Supplements LLC" />)}
          <div className="sm:col-span-2">{field("Street address *", <Input value={form.origin.street1} onChange={(e) => setOrigin("street1", e.target.value)} placeholder="531 Main Street" />)}</div>
          <div className="sm:col-span-2">{field("Apartment / suite", <Input value={form.origin.street2} onChange={(e) => setOrigin("street2", e.target.value)} placeholder="PMB 1127" />)}</div>
          {field("City *", <Input value={form.origin.city} onChange={(e) => setOrigin("city", e.target.value)} placeholder="El Segundo" />)}
          {field(
            "State *",
            <Select value={form.origin.state} onValueChange={(v) => setOrigin("state", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {field("ZIP code *", <Input value={form.origin.zip} onChange={(e) => setOrigin("zip", e.target.value)} placeholder="90245" />)}
          {field("Phone *", <Input value={form.origin.phone} onChange={(e) => setOrigin("phone", e.target.value)} placeholder="(562) 524-3557" />)}
          <div className="sm:col-span-2">{field("Email (optional)", <Input value={form.origin.email} onChange={(e) => setOrigin("email", e.target.value)} placeholder="support@mwpsupplements.com" />)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Package</CardTitle>
          <CardDescription>
            Used for rates when a product has no weight or size of its own. You can set weight and size per product (pounds, inches).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {field("Default item weight (lb)", <Input type="number" step="0.01" min="0" value={form.parcel.defaultWeightLb} onChange={(e) => setParcel("defaultWeightLb", e.target.value)} />)}
          {field("Packaging weight (lb)", <Input type="number" step="0.01" min="0" value={form.parcel.packagingWeightLb} onChange={(e) => setParcel("packagingWeightLb", e.target.value)} />, "Box and filler, added to every order")}
          <div />
          {field("Box length (in)", <Input type="number" step="0.1" min="0" value={form.parcel.defaultLengthIn} onChange={(e) => setParcel("defaultLengthIn", e.target.value)} />)}
          {field("Box width (in)", <Input type="number" step="0.1" min="0" value={form.parcel.defaultWidthIn} onChange={(e) => setParcel("defaultWidthIn", e.target.value)} />)}
          {field("Box height (in)", <Input type="number" step="0.1" min="0" value={form.parcel.defaultHeightIn} onChange={(e) => setParcel("defaultHeightIn", e.target.value)} />)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rates shown at checkout</CardTitle>
          <CardDescription>Customers see live carrier prices; the best option is selected for them.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {field(
            "Pick the best option by",
            <Select value={form.rateStrategy} onValueChange={(v: "CHEAPEST" | "FASTEST") => set("rateStrategy", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CHEAPEST">Lowest price (shown first)</SelectItem>
                <SelectItem value="FASTEST">Fastest delivery (shown first)</SelectItem>
              </SelectContent>
            </Select>
          )}

          <div className="space-y-2">
            <Label>Carriers to offer</Label>
            <div className="flex flex-wrap gap-3">
              {CARRIER_CHOICES.map((c) => (
                <label key={c} className="flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer">
                  <input type="checkbox" checked={form.allowedCarriers.includes(c)} onChange={() => toggleCarrier(c)} className="h-4 w-4" />
                  <span className="text-sm">{CARRIER_LABEL[c]}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Leave all unchecked to offer every carrier on your EasyPost account.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {field("Handling fee ($)", <Input type="number" step="0.01" min="0" value={form.handlingFee} onChange={(e) => set("handlingFee", Number(e.target.value))} />, "Added to every rate (packing cost)")}
            {field("Free shipping over ($)", <Input type="number" step="0.01" min="0" value={form.freeShippingThreshold} onChange={(e) => set("freeShippingThreshold", Number(e.target.value))} />, "0 = never free. The cheapest option becomes free.")}
            {field("Backup flat rate ($)", <Input type="number" step="0.01" min="0" value={form.flatRate} onChange={(e) => set("flatRate", Number(e.target.value))} />, "Used only if live rates are down. 0 = block checkout instead.")}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tracking updates (webhook)</CardTitle>
          <CardDescription>Lets tracking, "shipped" and "delivered" updates arrive automatically.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {field(
            "Webhook URL to add in EasyPost",
            <div className="flex gap-2">
              <Input readOnly value={saved.webhookUrl} className="bg-muted" />
              <Button type="button" variant="outline" onClick={copyWebhook}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          )}
          {field(
            "Webhook secret (optional)",
            <Input
              type="password"
              autoComplete="off"
              placeholder={saved.webhookSecretMasked ? `Saved (${saved.webhookSecretMasked}). Paste a new one to replace it` : "The secret you set on the EasyPost webhook"}
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
            />,
            "If you add a secret in EasyPost, paste the same one here so fake requests are rejected."
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => save()} disabled={saving} size="lg">
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save shipping settings
        </Button>
      </div>
    </div>
  );
}
