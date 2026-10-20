import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, BarChart3, Info, CheckCircle2, CircleDashed } from "lucide-react";
import { toast } from "sonner";
import api from "@/api/api";

interface TrackingSettings {
  googleAnalyticsId: string;
  googleTagManagerId: string;
  googleSiteVerification: string;
  metaPixelId: string;
  metaCapiConfigured: boolean;
  metaCapiTokenMasked: string | null;
  metaTestEventCode: string;
  updatedAt?: string;
}

const Status = ({ on }: { on: boolean }) =>
  on ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
      <CheckCircle2 className="h-3.5 w-3.5" /> Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <CircleDashed className="h-3.5 w-3.5" /> Not set
    </span>
  );

export default function TrackingSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<TrackingSettings | null>(null);
  const [ga, setGa] = useState("");
  const [gtm, setGtm] = useState("");
  const [verification, setVerification] = useState("");
  const [pixel, setPixel] = useState("");
  const [capiToken, setCapiToken] = useState("");
  const [testCode, setTestCode] = useState("");

  const apply = (d: TrackingSettings) => {
    setSaved(d);
    setGa(d.googleAnalyticsId);
    setGtm(d.googleTagManagerId);
    setVerification(d.googleSiteVerification);
    setPixel(d.metaPixelId);
    setTestCode(d.metaTestEventCode);
  };

  useEffect(() => {
    api
      .get("/api/admin/tracking/settings")
      .then((res) => apply(res.data.data))
      .catch(() => toast.error("Failed to load tracking settings"))
      .finally(() => setLoading(false));
  }, []);

  const save = async (extra: Record<string, unknown> = {}) => {
    setSaving(true);
    try {
      const res = await api.put("/api/admin/tracking/settings", {
        googleAnalyticsId: ga,
        googleTagManagerId: gtm,
        googleSiteVerification: verification,
        metaPixelId: pixel,
        metaTestEventCode: testCode,
        ...(capiToken.trim() ? { metaCapiToken: capiToken.trim() } : {}),
        ...extra,
      });
      apply(res.data.data);
      setCapiToken("");
      toast.success(res.data.message || "Saved");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not save tracking settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !saved) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" /> Tracking and verification
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Add an ID to turn a tool on. Clear the field and save to remove it. No code change or redeploy is needed; the website picks it up within a minute.
        </p>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
              <li>Use either Google Tag Manager or Google Analytics. If both are added, Tag Manager loads and Analytics should be set up inside it, so visits are not counted twice.</li>
              <li>Purchase, add to cart and checkout events are already sent to every tool you add here.</li>
              <li>Test with the Meta Pixel Helper or the test event code below before running ads.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Google</CardTitle>
          <CardDescription>Analytics, Tag Manager and Search Console.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Google Analytics ID (GA4)</Label>
              <Status on={!!saved.googleAnalyticsId} />
            </div>
            <Input value={ga} onChange={(e) => setGa(e.target.value)} placeholder="G-XXXXXXXXXX" autoComplete="off" />
            <p className="text-xs text-muted-foreground">Analytics, Admin, Data streams, Measurement ID.</p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Google Tag Manager ID</Label>
              <Status on={!!saved.googleTagManagerId} />
            </div>
            <Input value={gtm} onChange={(e) => setGtm(e.target.value)} placeholder="GTM-XXXXXXX" autoComplete="off" />
            <p className="text-xs text-muted-foreground">Shown at the top of your Tag Manager workspace.</p>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex items-center justify-between">
              <Label>Google Site Verification</Label>
              <Status on={!!saved.googleSiteVerification} />
            </div>
            <Input value={verification} onChange={(e) => setVerification(e.target.value)} placeholder="abc123..." autoComplete="off" />
            <p className="text-xs text-muted-foreground">
              The content value of the google-site-verification meta tag from Search Console. You can paste the whole tag, the value is picked out for you.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meta (Facebook and Instagram)</CardTitle>
          <CardDescription>Pixel in the browser, plus the Conversions API from our server for more accurate purchase tracking.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Meta Pixel ID</Label>
              <Status on={!!saved.metaPixelId} />
            </div>
            <Input value={pixel} onChange={(e) => setPixel(e.target.value)} placeholder="1234567890123456" autoComplete="off" inputMode="numeric" />
            <p className="text-xs text-muted-foreground">Facebook/Instagram Ads pixel ID (numbers only).</p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Conversions API access token</Label>
              <Status on={saved.metaCapiConfigured} />
            </div>
            <Input
              type="password"
              autoComplete="new-password"
              value={capiToken}
              onChange={(e) => setCapiToken(e.target.value)}
              placeholder={saved.metaCapiTokenMasked ? `Saved (${saved.metaCapiTokenMasked}). Paste a new one to replace it` : "Events Manager, Settings, Conversions API, Generate access token"}
            />
            <p className="text-xs text-muted-foreground">Stored encrypted and never shown again. Needs the Pixel ID above.</p>
            {saved.metaCapiConfigured && (
              <button type="button" className="text-xs text-red-600 underline" onClick={() => save({ clearMetaCapiToken: true })} disabled={saving}>
                Remove saved token
              </button>
            )}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Test event code (optional)</Label>
            <Input value={testCode} onChange={(e) => setTestCode(e.target.value)} placeholder="TEST12345" autoComplete="off" />
            <p className="text-xs text-muted-foreground">Only while testing: server events then show in Events Manager under Test events. Clear it before going live.</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        {saved.updatedAt && <span className="text-xs text-muted-foreground">Last saved {new Date(saved.updatedAt).toLocaleString()}</span>}
        <Button onClick={() => save()} disabled={saving} size="lg">
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save
        </Button>
      </div>
    </div>
  );
}
