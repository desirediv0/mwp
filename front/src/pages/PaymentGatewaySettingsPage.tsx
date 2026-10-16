import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CreditCard, Info, Copy, Check, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import api from "@/api/api";

interface StripeSettings {
  configured: boolean;
  isActive: boolean;
  mode: "TEST" | "LIVE";
  publishableKey: string;
  secretKeyMasked: string | null;
  webhookSecretMasked: string | null;
  webhookUrl: string;
}

export default function PaymentGatewaySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<StripeSettings | null>(null);
  const [form, setForm] = useState({
    isActive: true,
    mode: "TEST" as "TEST" | "LIVE",
    publishableKey: "",
    secretKey: "",
    webhookSecret: "",
  });
  const [copied, setCopied] = useState(false);

  const apply = (data: StripeSettings) => {
    setSettings(data);
    setForm({
      isActive: data.configured ? data.isActive : true,
      mode: data.mode,
      publishableKey: data.publishableKey || "",
      secretKey: "",
      webhookSecret: "",
    });
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/stripe-settings");
      apply(res.data?.data);
    } catch {
      toast.error("Failed to load Stripe settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!settings?.configured && !form.secretKey.trim()) {
      toast.error("Enter your Stripe Secret Key");
      return;
    }
    setSaving(true);
    try {
      const res = await api.put("/api/admin/stripe-settings", {
        isActive: form.isActive,
        mode: form.mode,
        publishableKey: form.publishableKey,
        secretKey: form.secretKey,
        webhookSecret: form.webhookSecret,
      });
      apply(res.data?.data);
      toast.success("Stripe settings saved");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not save Stripe settings");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm("Remove the saved Stripe keys? Checkout will stop working until you add them again.")) return;
    try {
      const res = await api.delete("/api/admin/stripe-settings");
      apply(res.data?.data);
      toast.success("Stripe keys removed");
    } catch {
      toast.error("Could not remove the keys");
    }
  };

  const copyWebhook = () => {
    if (!settings) return;
    navigator.clipboard.writeText(settings.webhookUrl);
    setCopied(true);
    toast.success("Webhook URL copied");
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <CreditCard className="h-6 w-6" /> Stripe Payments
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Customers pay by card on Stripe&apos;s secure page. All orders and payments are in US dollars (USD).
        </p>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm text-blue-900">
              <p className="font-medium">How to set it up</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-800">
                <li>
                  In your Stripe Dashboard, open Developers &rarr; API keys and copy the <b>Secret key</b> (starts with
                  <code className="mx-1">sk_test_</code> for test or <code className="mx-1">sk_live_</code> for live).
                </li>
                <li>Paste it below, choose the matching mode, and save. The key is checked with Stripe before it is stored.</li>
                <li>
                  In Developers &rarr; Webhooks, add the webhook URL shown below for the event
                  <code className="mx-1">checkout.session.completed</code> (also add <code className="mx-1">checkout.session.expired</code>),
                  then paste its <b>Signing secret</b> (<code>whsec_...</code>) here.
                </li>
                <li>Test with a test key and the card 4242 4242 4242 4242 before going live.</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Stripe keys</span>
            {settings?.configured && (
              <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                Keys saved
              </span>
            )}
          </CardTitle>
          <CardDescription>The secret key and webhook secret are stored encrypted and are never shown again in full.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="stripe-active" className="text-base font-medium">
                Accept payments with Stripe
              </Label>
              <p className="text-sm text-muted-foreground">Turn this off to pause checkout without deleting your keys.</p>
            </div>
            <Switch id="stripe-active" checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
          </div>

          <div className="space-y-2">
            <Label>Mode</Label>
            <Select value={form.mode} onValueChange={(v: "TEST" | "LIVE") => setForm({ ...form, mode: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TEST">Test mode (no real money)</SelectItem>
                <SelectItem value="LIVE">Live mode (real payments)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stripe-secret">Secret key *</Label>
            <Input
              id="stripe-secret"
              type="password"
              autoComplete="off"
              placeholder={settings?.secretKeyMasked ? `Saved (${settings.secretKeyMasked}). Paste a new key to replace it` : "sk_test_..."}
              value={form.secretKey}
              onChange={(e) => setForm({ ...form, secretKey: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stripe-publishable">Publishable key (optional)</Label>
            <Input
              id="stripe-publishable"
              autoComplete="off"
              placeholder="pk_test_..."
              value={form.publishableKey}
              onChange={(e) => setForm({ ...form, publishableKey: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stripe-webhook">Webhook signing secret</Label>
            <Input
              id="stripe-webhook"
              type="password"
              autoComplete="off"
              placeholder={settings?.webhookSecretMasked ? `Saved (${settings.webhookSecretMasked}). Paste a new one to replace it` : "whsec_..."}
              value={form.webhookSecret}
              onChange={(e) => setForm({ ...form, webhookSecret: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Needed so an order is still created if a customer closes the page right after paying.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Webhook URL to add in Stripe</Label>
            <div className="flex gap-2">
              <Input readOnly value={settings?.webhookUrl || ""} className="bg-muted" />
              <Button type="button" variant="outline" onClick={copyWebhook}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex gap-2">
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Stripe settings
              </Button>
              {settings?.configured && (
                <Button variant="outline" className="border-[#EF4444] text-[#EF4444] hover:bg-[#FEF2F2]" onClick={remove}>
                  <Trash2 className="h-4 w-4 mr-2" /> Remove keys
                </Button>
              )}
            </div>
            <a
              href="https://dashboard.stripe.com/apikeys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              Open Stripe dashboard <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
