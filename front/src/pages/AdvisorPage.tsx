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
import { Loader2, Bot, KeyRound, Search, ShieldAlert, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/api/api";

interface Settings {
  isEnabled: boolean;
  hasKey: boolean;
  keyMask: string | null;
  model: string;
  effort: string;
  usesDefaultPrompt: boolean;
  systemPrompt: string;
  greeting: string;
  defaultGreeting: string;
  maxUserMessages: number;
  dailyMessageLimit: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  messagesToday: number;
  models: { id: string; label: string }[];
  efforts: string[];
}

interface Conv {
  id: string;
  who: string;
  email: string | null;
  signedIn: boolean;
  firstMessage: string;
  messageCount: number;
  flagged: boolean;
  flagReason: string | null;
  reviewed: boolean;
  pageUrl: string | null;
  createdAt: string;
  lastMessageAt: string;
}

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  model: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  toolsUsed: string[];
}

interface Detail extends Conv {
  userAgent: string | null;
  messages: Msg[];
}

const when = (d: string) => new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const num = (n: number) => n.toLocaleString("en-US");
const selectCls = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

export default function AdvisorPage() {
  const [tab, setTab] = useState<"settings" | "chats">("settings");
  const [s, setS] = useState<Settings | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [prompt, setPrompt] = useState("");
  const [greeting, setGreeting] = useState("");
  const [model, setModel] = useState("claude-opus-5-5");
  const [effort, setEffort] = useState("low");
  const [maxMsgs, setMaxMsgs] = useState(40);
  const [daily, setDaily] = useState(600);
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const apply = (x: Settings) => {
    setS(x);
    setPrompt(x.systemPrompt);
    setGreeting(x.greeting);
    setModel(x.model);
    setEffort(x.effort);
    setMaxMsgs(x.maxUserMessages);
    setDaily(x.dailyMessageLimit);
    setEnabled(x.isEnabled);
  };

  const loadSettings = useCallback(() => {
    api
      .get("/api/admin/advisor/settings")
      .then((r) => apply(r.data.data.settings))
      .catch(() => toast.error("Failed to load advisor settings"));
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const save = async (extra: Record<string, unknown> = {}, okMessage = "Settings saved") => {
    setSaving(true);
    try {
      const r = await api.put("/api/admin/advisor/settings", {
        isEnabled: enabled,
        model,
        effort,
        greeting,
        systemPrompt: prompt,
        maxUserMessages: maxMsgs,
        dailyMessageLimit: daily,
        ...extra,
      });
      apply(r.data.data.settings);
      toast.success(okMessage);
      return true;
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not save");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveKey = async () => {
    if (!apiKey.trim()) return;
    if (await save({ apiKey: apiKey.trim() }, "API key saved (encrypted)")) setApiKey("");
  };

  const testKey = async () => {
    setTesting(true);
    try {
      const r = await api.post("/api/admin/advisor/test", { apiKey: apiKey.trim() || undefined });
      toast.success(`The key works (${r.data.data.model})`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "The key did not work");
    } finally {
      setTesting(false);
    }
  };

  const resetPrompt = async () => {
    try {
      const r = await api.get("/api/admin/advisor/default-prompt");
      setPrompt(r.data.data.systemPrompt);
      toast.success("Built-in prompt loaded. Press Save settings to use it.");
    } catch {
      toast.error("Could not load the built-in prompt");
    }
  };

  /* ---------------- chats ---------------- */
  const [convs, setConvs] = useState<Conv[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [needsReview, setNeedsReview] = useState(false);
  const [flaggedOpen, setFlaggedOpen] = useState(0);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Detail | null>(null);

  const loadConvs = useCallback(async () => {
    setLoadingConvs(true);
    try {
      const r = await api.get("/api/admin/advisor/conversations", { params: { page, limit: 15, search: search || undefined, flagged: needsReview ? "true" : undefined, unreviewed: needsReview ? "true" : undefined } });
      setConvs(r.data.data.conversations);
      setPages(r.data.data.pagination.pages || 1);
      setFlaggedOpen(r.data.data.flaggedOpen || 0);
    } catch {
      toast.error("Failed to load chats");
    } finally {
      setLoadingConvs(false);
    }
  }, [page, search, needsReview]);

  useEffect(() => {
    if (tab === "chats") loadConvs();
  }, [tab, loadConvs]);

  const open = async (id: string) => {
    try {
      const r = await api.get(`/api/admin/advisor/conversations/${id}`);
      setDetail(r.data.data.conversation);
    } catch {
      toast.error("Could not open this chat");
    }
  };

  const markReviewed = async (c: Detail) => {
    await api.patch(`/api/admin/advisor/conversations/${c.id}`, { reviewed: !c.reviewed });
    setDetail({ ...c, reviewed: !c.reviewed });
    loadConvs();
  };

  const remove = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/api/admin/advisor/conversations/${confirmDelete.id}`);
      toast.success("Chat deleted");
      setConfirmDelete(null);
      setDetail(null);
      loadConvs();
    } catch {
      toast.error("Could not delete the chat");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Bot className="h-6 w-6" /> AI Advisor
          </h1>
          <p className="text-sm text-muted-foreground">The chat assistant on your website, powered by Claude. Put your Anthropic key here, then review every conversation.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={tab === "settings" ? "default" : "outline"} onClick={() => setTab("settings")}>Settings</Button>
          <Button variant={tab === "chats" ? "default" : "outline"} onClick={() => setTab("chats")}>
            Chats {flaggedOpen > 0 && <Badge className="ml-2 bg-red-600 hover:bg-red-600">{flaggedOpen}</Badge>}
          </Button>
        </div>
      </div>

      {tab === "settings" && s && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>How it works (read this first)</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
                <li><b>Get an API key.</b> Sign in at console.anthropic.com, open &quot;API keys&quot;, create a key (it starts with <code>sk-ant-</code>) and add some credit. The key is billed to your Anthropic account, not to us.</li>
                <li><b>Paste it below and press Save key.</b> It is stored encrypted and is never shown again, only its first and last characters. Press &quot;Test key&quot; to check it works.</li>
                <li><b>Turn the advisor on.</b> Until you do, the chat button on the website tells visitors to email or call you instead.</li>
                <li><b>What it knows.</b> The instructions below (from your client&apos;s prompt file), plus live product prices, stock and your FAQ answers. It cannot see orders, customers or payments, and it cannot change anything.</li>
                <li><b>Every chat is saved</b> under the Chats tab: who asked (name and email if they were signed in, otherwise &quot;Guest visitor&quot;), what they asked and what it answered. Chats that mention health, medication or safety words are flagged for you to review.</li>
                <li><b>Cost control.</b> The daily limit below stops all chats for the day once reached. The model setting trades answer quality for price: Opus is the best, Haiku is the cheapest.</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Anthropic API key</CardTitle>
              <CardDescription>
                {s.hasKey ? <>A key is saved: <b>{s.keyMask}</b>. Paste a new one to replace it.</> : "No key saved yet. The advisor stays off until you add one."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Input type="password" autoComplete="off" className="max-w-md" placeholder="sk-ant-..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
                <Button onClick={saveKey} disabled={saving || !apiKey.trim()}>Save key</Button>
                <Button variant="outline" onClick={testKey} disabled={testing || (!apiKey.trim() && !s.hasKey)}>
                  {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Test key
                </Button>
                {s.hasKey && (
                  <Button variant="outline" onClick={() => save({ clearKey: true }, "Key removed, the advisor is off")} disabled={saving}>Remove key</Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Advisor settings</CardTitle>
              <CardDescription>Used today: {num(s.messagesToday)} of {num(s.dailyMessageLimit)} messages. Tokens so far: {num(s.totalInputTokens)} in, {num(s.totalOutputTokens)} out.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-3">
                <Switch
                  checked={enabled}
                  disabled={!s.hasKey || saving}
                  onCheckedChange={(v) => {
                    setEnabled(v);
                    save({ isEnabled: v }, v ? "Advisor is now ON" : "Advisor is now OFF").then((ok) => {
                      if (!ok) setEnabled(!v);
                    });
                  }}
                />
                <Label>Advisor is {enabled ? "ACTIVE (customers can chat)" : "INACTIVE (customers see the contact details instead)"}</Label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="model">Model</Label>
                  <select id="model" className={selectCls} value={model} onChange={(e) => setModel(e.target.value)}>
                    {s.models.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="effort">Thinking effort</Label>
                  <select id="effort" className={selectCls} value={effort} onChange={(e) => setEffort(e.target.value)}>
                    {s.efforts.map((e) => <option key={e} value={e}>{e === "low" ? "low (fast, cheapest)" : e === "medium" ? "medium" : "high (slow, most careful)"}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="mm">Messages allowed per chat</Label>
                  <Input id="mm" type="number" min={3} max={200} value={maxMsgs} onChange={(e) => setMaxMsgs(Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dl">Daily limit (all visitors together)</Label>
                  <Input id="dl" type="number" min={10} max={100000} value={daily} onChange={(e) => setDaily(Number(e.target.value))} />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="gr">First message visitors see</Label>
                <Textarea id="gr" rows={3} value={greeting} placeholder={s.defaultGreeting} onChange={(e) => setGreeting(e.target.value)} />
                <p className="text-xs text-muted-foreground">Leave empty to use the standard greeting.</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sp">Instructions for the advisor (system prompt)</Label>
                  <Button size="sm" variant="outline" onClick={resetPrompt}>Load built-in prompt</Button>
                </div>
                <Textarea id="sp" rows={22} className="font-mono text-xs" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                <p className="text-xs text-muted-foreground">
                  This is your client&apos;s prompt file. <code>{"{{SUPPORT_PHONE}}"}</code> and <code>{"{{PRICE:power-max}}"}</code> are filled in automatically (phone from your store settings, price from your product). {s.usesDefaultPrompt ? "Now using the built-in prompt." : "Now using a customised prompt."}
                </p>
              </div>

              <Button onClick={() => save()} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save settings
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {tab === "chats" && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Switch checked={needsReview} onCheckedChange={(v) => { setNeedsReview(v); setPage(1); }} />
                <Label>Only chats that need review (health, medication or safety words)</Label>
              </div>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" placeholder="Search a name, email or words" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Who</TableHead>
                    <TableHead>Asked</TableHead>
                    <TableHead>Messages</TableHead>
                    <TableHead>Last activity</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingConvs ? (
                    <TableRow><TableCell colSpan={5} className="py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
                  ) : convs.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No chats yet</TableCell></TableRow>
                  ) : (
                    convs.map((c) => (
                      <TableRow key={c.id} className="cursor-pointer" onClick={() => open(c.id)}>
                        <TableCell>
                          <div className="font-medium">{c.who}</div>
                          <div className="text-xs text-muted-foreground">{c.email || (c.signedIn ? "" : "not signed in")}</div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{c.firstMessage}</TableCell>
                        <TableCell>{c.messageCount}</TableCell>
                        <TableCell>{when(c.lastMessageAt)}</TableCell>
                        <TableCell>
                          {c.flagged && !c.reviewed ? (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><ShieldAlert className="mr-1 h-3 w-3" /> Review</Badge>
                          ) : c.reviewed ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle2 className="mr-1 h-3 w-3" /> Reviewed</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
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
      )}

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>{detail.who}</DialogTitle>
                <DialogDescription>
                  {detail.email ? `${detail.email} · ` : ""}{when(detail.createdAt)}{detail.pageUrl ? ` · started on ${detail.pageUrl.replace(/^https?:\/\/[^/]+/, "")}` : ""}
                </DialogDescription>
              </DialogHeader>
              {detail.flagged && (
                <p className="rounded-md bg-red-50 p-2 text-sm text-red-800"><ShieldAlert className="mr-1 inline h-4 w-4" /> {detail.flagReason || "Needs review"}</p>
              )}
              <div className="max-h-[50vh] space-y-3 overflow-y-auto rounded-md border bg-muted/30 p-3">
                {detail.messages.map((m) => (
                  <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                    <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${m.role === "user" ? "bg-slate-800 text-white" : "border bg-white"}`}>
                      <p className="whitespace-pre-line">{m.content}</p>
                      <p className={`mt-1 text-[10px] ${m.role === "user" ? "text-slate-300" : "text-muted-foreground"}`}>
                        {when(m.createdAt)}{m.toolsUsed?.length ? ` · looked up: ${m.toolsUsed.join(", ")}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <DialogFooter className="gap-2 sm:justify-between">
                <Button variant="destructive" onClick={() => setConfirmDelete(detail)}><Trash2 className="mr-2 h-4 w-4" /> Delete chat</Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => markReviewed(detail)}>{detail.reviewed ? "Mark as not reviewed" : "Mark as reviewed"}</Button>
                  <Button onClick={() => setDetail(null)}>Close</Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this chat?</DialogTitle>
            <DialogDescription>The whole conversation is removed for good. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Keep it</Button>
            <Button variant="destructive" onClick={remove}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
