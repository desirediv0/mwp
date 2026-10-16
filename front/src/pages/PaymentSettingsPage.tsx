import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/api/api";

// Checkout runs on Stripe only (USD). This page is the on/off switch; the keys live in
// "Payment Gateway Settings".
export default function PaymentSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [hasKeys, setHasKeys] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [settings, stripe] = await Promise.all([
          api.get("/api/admin/payment-settings"),
          api.get("/api/admin/stripe-settings"),
        ]);
        setStripeEnabled(!!settings.data?.data?.stripeEnabled);
        setHasKeys(!!stripe.data?.data?.configured && !!stripe.data?.data?.isActive);
      } catch {
        toast.error("Failed to load payment settings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = async (checked: boolean) => {
    if (checked && !hasKeys) {
      toast.error("Add and activate your Stripe keys first");
      return;
    }
    setSaving(true);
    try {
      await api.put("/api/admin/payment-settings", { stripeEnabled: checked });
      setStripeEnabled(checked);
      toast.success(checked ? "Stripe checkout is on" : "Stripe checkout is off");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not update payment settings");
    } finally {
      setSaving(false);
    }
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
          <CreditCard className="h-6 w-6" /> Payment Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">All payments are taken by card through Stripe, in US dollars (USD).</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="stripe-checkout" className="text-base font-medium">
                Card payments (Stripe)
              </Label>
              <p className="text-sm text-muted-foreground">When off, customers cannot check out.</p>
              {hasKeys ? (
                <p className="text-xs text-green-700 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Stripe keys are saved and active
                </p>
              ) : (
                <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> Stripe keys are not set up yet
                </p>
              )}
            </div>
            <Switch id="stripe-checkout" checked={stripeEnabled} disabled={saving} onCheckedChange={toggle} />
          </div>

          <Link to="/payment-gateway-settings">
            <Button variant="outline">{hasKeys ? "Edit Stripe keys" : "Add Stripe keys"}</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
