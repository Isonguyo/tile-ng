import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { formatNaira } from "@/lib/categories";
import {
  Users, Tag, Banknote, ShieldAlert, Check, X, Flag, BadgeCheck, KeyRound, AlertTriangle, Copy,
  Activity, Bell, Search, Megaphone, Settings2, Gauge, TrendingUp, FileWarning, Sparkles,
  UserSearch, LifeBuoy, ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getSignedUrls } from "@/lib/storage";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RTooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Cabin — Tile" }],
   links: [
      {
        rel: "icon",
        href: "https://res.cloudinary.com/dbozz4sgv/image/upload/v1781367385/tile-logo_vv2c8v.jpg",
      },
    ]
   }),
  component: Admin,
});

function Admin() {
  const { isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();

  // ─── Mission Control aggregated stats ───────────────────────────
  const { data: dash } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    enabled: isAdmin,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_dashboard_stats");
      if (error) throw error;
      return (Array.isArray(data) ? data[0] : data) as null | {
        users_total: number; users_today: number;
        listings_total: number; listings_pending: number; listings_today: number;
        revenue_total: number; revenue_today: number; revenue_month: number;
        active_subscribers: number; vip: number; pro: number; lite: number;
        reports_open: number; kyc_pending: number; shops_total: number; artisans_total: number;
        chats_24h: number;
      };
    },
  });

  // Legacy revenue (fallback details)
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    enabled: isAdmin,
    queryFn: async () => {
      const [u, a, r] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.rpc("admin_revenue_stats"),
      ]);
      const rev = (r.data?.[0] ?? null) as null | { total_revenue: number; monthly_revenue: number; yearly_revenue: number; active_subscribers: number; lite_active: number; pro_active: number; vip_active: number };
      return {
        users: u.count ?? 0,
        ads: a.count ?? 0,
        revenue: Number(rev?.total_revenue ?? 0),
        monthly: Number(rev?.monthly_revenue ?? 0),
        yearly: Number(rev?.yearly_revenue ?? 0),
        active: Number(rev?.active_subscribers ?? 0),
        lite: Number(rev?.lite_active ?? 0),
        pro: Number(rev?.pro_active ?? 0),
        vip: Number(rev?.vip_active ?? 0),
      };
    },
  });

  // ─── Live Activity Feed (auto refresh) ─────────────────────────
  const { data: activity = [] } = useQuery({
    queryKey: ["admin-activity-feed"],
    enabled: isAdmin,
    refetchInterval: 15_000,
    queryFn: async () => {
      const { data } = await supabase.rpc("admin_activity_feed", { _limit: 30 });
      return (data ?? []) as Array<{ kind: string; title: string; subtitle: string | null; at: string; entity_id: string }>;
    },
  });

  // ─── AI Moderation queue (risk-scored) ─────────────────────────
  const { data: modQueue = [] } = useQuery({
    queryKey: ["admin-mod-queue"],
    enabled: isAdmin,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data } = await supabase.rpc("admin_moderation_queue");
      return (data ?? []) as Array<{
        id: string; title: string; price: number | null; category: string; images: string[];
        created_at: string; seller_id: string; seller_name: string | null; seller_phone: string | null;
        account_age_days: number; risk_score: number; risk_reasons: string[];
      }>;
    },
  });

  const pending = modQueue; // Backwards-compat name used below in mod tab

  // ─── Reports Center ────────────────────────────────────────────
  const [reportFilter, setReportFilter] = useState<"open" | "resolved" | "dismissed">("open");
  const { data: reports = [] } = useQuery({
    queryKey: ["admin-reports", reportFilter],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await supabase.rpc("admin_list_reports", { _status: reportFilter });
      return (data ?? []) as Array<{ id: string; entity_type: string; entity_id: string; reason: string; details: string | null; status: string; reporter_id: string; reporter_name: string | null; created_at: string }>;
    },
  });

  // ─── Revenue trend (last 30 days) ──────────────────────────────
  const { data: trend = [] } = useQuery({
    queryKey: ["admin-revenue-trend"],
    enabled: isAdmin,
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
      const { data } = await supabase.from("wallet_transactions").select("amount,tx_type,created_at").in("tx_type", ["subscription", "promotion"]).gte("created_at", since);
      const byDay = new Map<string, number>();
      (data ?? []).forEach((t) => {
        const d = new Date(t.created_at).toISOString().slice(0, 10);
        byDay.set(d, (byDay.get(d) ?? 0) + Math.abs(Number(t.amount)));
      });
      const out: Array<{ day: string; revenue: number }> = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
        out.push({ day: d.slice(5), revenue: Math.round(byDay.get(d) ?? 0) });
      }
      return out;
    },
  });

  // ─── Platform settings (emergency controls) ────────────────────
  const { data: platform } = useQuery({
    queryKey: ["admin-platform-settings"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await supabase.from("platform_settings").select("*").eq("id", 1).maybeSingle();
      return data;
    },
  });

  const { data: kycPending = [] } = useQuery({
    queryKey: ["kyc-pending"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await supabase.rpc("admin_list_pending_kyc");
      return data ?? [];
    },
  });

  const { data: txns = [] } = useQuery({
    queryKey: ["txns"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await supabase.from("wallet_transactions").select("*").order("created_at", { ascending: false }).limit(50);
      return data ?? [];
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await supabase.rpc("admin_list_users");
      return (data ?? []) as Array<{ id: string; full_name: string | null; email: string | null; subscription_tier: string; is_verified: boolean; active_ads: number; created_at: string }>;
    },
  });


  if (!loading && !isAdmin) { nav({ to: "/" }); return null; }

  const approve = async (id: string) => {
    const { error } = await supabase.rpc("admin_approve_listing", { _id: id });
    if (error) return toast.error(error.message);
    toast.success("Approved"); qc.invalidateQueries({ queryKey: ["admin-mod-queue"] });
  };
  const reject = async (id: string, reason: string) => {
    const { error } = await supabase.rpc("admin_reject_listing", { _id: id, _reason: reason });
    if (error) return toast.error(error.message);
    toast.success("Rejected"); qc.invalidateQueries({ queryKey: ["admin-mod-queue"] });
  };
  const flag = async (id: string) => {
    const { error } = await supabase.rpc("admin_flag_seller", { _listing_id: id });
    if (error) return toast.error(error.message);
    toast.success("Seller flagged & listing removed");
    qc.invalidateQueries({ queryKey: ["admin-mod-queue"] });
  };
  const grantVerified = async (id: string) => {
    await supabase.from("profiles").update({ kyc_status: "verified", is_verified: true }).eq("id", id);
    toast.success("Verified badge granted");
    qc.invalidateQueries({ queryKey: ["kyc-pending"] });
  };

  // Bulk moderation
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggleSel = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const bulk = async (action: "approve" | "reject" | "flag") => {
    if (!selected.size) return toast.error("Select at least one listing");
    if (!confirm(`${action.toUpperCase()} ${selected.size} listings?`)) return;
    const ids = [...selected];
    for (const id of ids) {
      if (action === "approve") await supabase.rpc("admin_approve_listing", { _id: id });
      else if (action === "reject") await supabase.rpc("admin_reject_listing", { _id: id, _reason: "Bulk rejection" });
      else await supabase.rpc("admin_flag_seller", { _listing_id: id });
    }
    toast.success(`${ids.length} listings ${action}ed`);
    setSelected(new Set());
    qc.invalidateQueries({ queryKey: ["admin-mod-queue"] });
  };

  // User inspector drawer
  const [inspectId, setInspectId] = useState<string | null>(null);

  // User search filter
  const [userQuery, setUserQuery] = useState("");
  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => (u.full_name ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q));
  }, [users, userQuery]);

  const tierData = [
    { name: "VIP", value: dash?.vip ?? 0, color: "#f59e0b" },
    { name: "Pro", value: dash?.pro ?? 0, color: "#3b82f6" },
    { name: "Lite", value: dash?.lite ?? 0, color: "#10b981" },
  ];

  // Marketplace health score (heuristic from real signals)
  const health = useMemo(() => {
    if (!dash) return { score: 0, label: "—" };
    const reports = dash.reports_open;
    const kyc = dash.kyc_pending;
    const pending = dash.listings_pending;
    let score = 100;
    score -= Math.min(30, reports * 3);
    score -= Math.min(20, kyc * 2);
    score -= Math.min(20, Math.max(0, pending - 20));
    score = Math.max(0, score);
    const label = score >= 85 ? "Excellent" : score >= 70 ? "Good" : score >= 50 ? "Needs attention" : "Critical";
    return { score, label };
  }, [dash]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      {platform?.maintenance_mode && (
        <div className="bg-destructive text-destructive-foreground text-center text-sm py-2 font-semibold">
          ⚠ Maintenance mode is ACTIVE — public actions are frozen
        </div>
      )}
      {platform?.emergency_banner && (
        <div className="bg-amber-500 text-black text-center text-sm py-2 font-semibold">
          {platform.emergency_banner}
        </div>
      )}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2"><ShieldAlert className="text-accent" /> Operations Center</h1>
            <p className="text-muted-foreground">Mission control for the Tile marketplace</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
            <Gauge className={"h-5 w-5 " + (health.score >= 70 ? "text-emerald-500" : "text-amber-500")} />
            <div>
              <p className="text-[10px] uppercase text-muted-foreground font-bold">Marketplace health</p>
              <p className="text-sm font-bold">{health.score} · <span className="text-muted-foreground">{health.label}</span></p>
            </div>
          </div>
        </div>

        {/* Mission control tiles */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 my-6">
          <MiniStat label="Users" value={dash?.users_total ?? stats?.users ?? 0} sub={`+${dash?.users_today ?? 0} today`} icon={Users} tint="blue" />
          <MiniStat label="Listings" value={dash?.listings_total ?? 0} sub={`+${dash?.listings_today ?? 0} today`} icon={Tag} tint="green" />
          <MiniStat label="Revenue" value={formatNaira(dash?.revenue_total ?? stats?.revenue ?? 0)} sub={`+${formatNaira(dash?.revenue_today ?? 0)} today`} icon={Banknote} tint="amber" />
          <MiniStat label="Subscribers" value={dash?.active_subscribers ?? 0} sub={`VIP ${dash?.vip ?? 0} · Pro ${dash?.pro ?? 0}`} icon={BadgeCheck} tint="purple" />
          <MiniStat label="Chats (24h)" value={dash?.chats_24h ?? 0} sub={`${dash?.shops_total ?? 0} shops`} icon={Activity} tint="cyan" />
          <MiniStat label="Artisans" value={dash?.artisans_total ?? 0} sub="Directory" icon={Sparkles} tint="rose" />
        </div>

        {/* Pending work queue */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <QueueCard label="Pending listings" count={dash?.listings_pending ?? 0} icon={Tag} onClick={() => document.getElementById("tab-moderation")?.click()} />
          <QueueCard label="Pending KYC" count={dash?.kyc_pending ?? 0} icon={ShieldCheck} onClick={() => document.getElementById("tab-kyc")?.click()} />
          <QueueCard label="Open reports" count={dash?.reports_open ?? 0} icon={FileWarning} onClick={() => document.getElementById("tab-reports")?.click()} />
          <QueueCard label="Monthly revenue" count={formatNaira(dash?.revenue_month ?? 0)} icon={TrendingUp} onClick={() => document.getElementById("tab-money")?.click()} />
        </div>

    <Tabs defaultValue="overview" className="w-full">

  {/* Mobile-friendly tab navigation */}
  <div className="overflow-x-auto scrollbar-hide pb-2">
    <TabsList className="inline-flex w-max min-w-full md:min-w-0 gap-2">
      <TabsTrigger id="tab-overview" value="overview" className="whitespace-nowrap">📊 Overview</TabsTrigger>
      <TabsTrigger id="tab-moderation" value="moderation" className="whitespace-nowrap">🛡 Moderation</TabsTrigger>
      <TabsTrigger id="tab-reports" value="reports" className="whitespace-nowrap">🚩 Reports</TabsTrigger>
      <TabsTrigger id="tab-kyc" value="kyc" className="whitespace-nowrap">📄 KYC</TabsTrigger>
      <TabsTrigger id="tab-money" value="money" className="whitespace-nowrap">💳 Revenue</TabsTrigger>
      <TabsTrigger id="tab-users" value="users" className="whitespace-nowrap">👥 Users</TabsTrigger>
      <TabsTrigger value="broadcast" className="whitespace-nowrap">📣 Broadcast</TabsTrigger>
      <TabsTrigger value="settings" className="whitespace-nowrap">⚙ Platform</TabsTrigger>
      <TabsTrigger value="codes" className="whitespace-nowrap">🛡 Roles & Access</TabsTrigger>
    </TabsList>
  </div>

  {/* ═══ OVERVIEW ══════════════════════════════════════════ */}
  <TabsContent value="overview" className="mt-4">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="p-4 lg:col-span-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-500" /> Revenue — last 30 days</h3>
          <p className="text-sm text-muted-foreground">Total: {formatNaira(trend.reduce((s, t) => s + t.revenue, 0))}</p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="day" fontSize={11} />
              <YAxis fontSize={11} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
              <RTooltip formatter={(v: number) => formatNaira(v)} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#rev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-primary" /> Active subscribers</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={tierData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={4}>
                {tierData.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Legend />
              <RTooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4 lg:col-span-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2"><Activity className="h-4 w-4 text-emerald-500 animate-pulse" /> Live activity feed</h3>
          <Badge variant="outline" className="text-xs">Auto-refresh · 15s</Badge>
        </div>
        <div className="divide-y max-h-96 overflow-y-auto">
          {activity.length === 0 && <p className="text-center text-muted-foreground py-8">No recent activity</p>}
          {activity.map((a, i) => (
            <div key={`${a.kind}-${a.entity_id}-${i}`} className="flex items-center gap-3 py-2 text-sm">
              <ActivityDot kind={a.kind} />
              <span className="font-medium">{a.title}</span>
              {a.subtitle && <span className="text-muted-foreground text-xs truncate">· {a.subtitle}</span>}
              <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">{timeAgo(a.at)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </TabsContent>

  <TabsContent value="moderation" className="mt-4">
            {selected.size > 0 && (
              <Card className="p-3 mb-3 flex flex-wrap items-center gap-2 border-primary/50 bg-primary/5">
                <span className="text-sm font-semibold">{selected.size} selected</span>
                <Button size="sm" onClick={() => bulk("approve")} className="bg-emerald-600 hover:bg-emerald-700"><Check className="h-3 w-3 mr-1" />Approve all</Button>
                <Button size="sm" variant="outline" onClick={() => bulk("reject")}><X className="h-3 w-3 mr-1" />Reject all</Button>
                <Button size="sm" variant="destructive" onClick={() => bulk("flag")}><Flag className="h-3 w-3 mr-1" />Flag sellers</Button>
                <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
              </Card>
            )}
            <Card className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">🎉 Nothing pending — inbox zero</TableCell></TableRow>}
                  {pending.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell><input type="checkbox" checked={selected.has(l.id)} onChange={() => toggleSel(l.id)} className="h-4 w-4" /></TableCell>
                      <TableCell className="font-medium">
                        <PendingTitle l={l} />
                      </TableCell>
                      <TableCell className="text-sm">
                        <button onClick={() => setInspectId(l.seller_id)} className="hover:text-primary underline-offset-2 hover:underline text-left">
                          {l.seller_name ?? "—"}
                        </button>
                        <div className="text-xs text-muted-foreground">{l.account_age_days}d old</div>
                      </TableCell>
                      <TableCell><RiskCell score={l.risk_score} reasons={l.risk_reasons ?? []} /></TableCell>
                      <TableCell>{formatNaira(l.price)}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" onClick={() => approve(l.id)} className="bg-accent text-accent-foreground"><Check className="h-3 w-3 mr-1" />Approve</Button>
                        <RejectModal onConfirm={(r) => reject(l.id, r)} />
                        <Button size="sm" variant="destructive" onClick={() => flag(l.id)}><Flag className="h-3 w-3 mr-1" />Flag</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* ═══ REPORTS ═════════════════════════════════════════ */}
          <TabsContent value="reports" className="mt-4">
            <div className="flex items-center gap-2 mb-3">
              {(["open", "resolved", "dismissed"] as const).map((s) => (
                <Button key={s} size="sm" variant={reportFilter === s ? "default" : "outline"} onClick={() => setReportFilter(s)} className="capitalize">{s}</Button>
              ))}
            </div>
            <Card className="p-0 overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Target</TableHead><TableHead>Reason</TableHead><TableHead>Reporter</TableHead><TableHead>When</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {reports.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No {reportFilter} reports</TableCell></TableRow>}
                  {reports.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell><Badge variant="outline" className="capitalize">{r.entity_type}</Badge><div className="font-mono text-[10px] text-muted-foreground mt-1">{r.entity_id.slice(0, 8)}…</div></TableCell>
                      <TableCell className="text-sm max-w-xs"><div className="font-medium">{r.reason}</div>{r.details && <div className="text-xs text-muted-foreground truncate">{r.details}</div>}</TableCell>
                      <TableCell className="text-xs">{r.reporter_name ?? "—"}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{timeAgo(r.created_at)}</TableCell>
                      <TableCell className="text-right"><ReportActions report={r} onDone={() => qc.invalidateQueries({ queryKey: ["admin-reports"] })} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="kyc" className="mt-4">
            <Card className="p-0 overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Phone</TableHead><TableHead>Status</TableHead><TableHead>Document</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                <TableBody>
                  {kycPending.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No pending KYC</TableCell></TableRow>}
                  {kycPending.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        <button onClick={() => setInspectId(p.id)} className="hover:text-primary underline-offset-2 hover:underline text-left">{p.full_name}</button>
                      </TableCell>
                      <TableCell>{p.phone ?? "—"}</TableCell>
                      <TableCell><Badge className="capitalize">{p.kyc_status}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{p.kyc_doc_url ? "uploaded" : "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => grantVerified(p.id)} className="bg-accent text-accent-foreground"><BadgeCheck className="h-3 w-3 mr-1" />Grant Verified</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="money" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <Card className="p-3"><p className="text-[10px] uppercase text-muted-foreground font-bold">Today</p><p className="text-lg font-extrabold">{formatNaira(dash?.revenue_today ?? 0)}</p></Card>
              <Card className="p-3"><p className="text-[10px] uppercase text-muted-foreground font-bold">This month</p><p className="text-lg font-extrabold">{formatNaira(dash?.revenue_month ?? 0)}</p></Card>
              <Card className="p-3"><p className="text-[10px] uppercase text-muted-foreground font-bold">This year</p><p className="text-lg font-extrabold">{formatNaira(stats?.yearly ?? 0)}</p></Card>
              <Card className="p-3"><p className="text-[10px] uppercase text-muted-foreground font-bold">Lifetime</p><p className="text-lg font-extrabold">{formatNaira(dash?.revenue_total ?? 0)}</p></Card>
            </div>
            <Card className="p-0 overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>When</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Reference</TableHead></TableRow></TableHeader>
                <TableBody>
                  {txns.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No transactions yet</TableCell></TableRow>}
                  {txns.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-xs">{new Date(t.created_at).toLocaleString()}</TableCell>
                      <TableCell><Badge className="capitalize">{t.tx_type}</Badge></TableCell>
                      <TableCell className={Number(t.amount) < 0 ? "text-destructive" : "text-accent"}>{formatNaira(Number(t.amount))}</TableCell>
                      <TableCell className="font-mono text-xs">{t.reference ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-4 text-xs text-muted-foreground border-t">Plan prices: Lite ₦5,000 · Pro ₦15,000 · VIP ₦40,000</div>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            <div className="mb-3 relative max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input placeholder="Search by name or email…" value={userQuery} onChange={(e) => setUserQuery(e.target.value)} className="pl-9" />
            </div>
            <Card className="p-0 overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Tier</TableHead><TableHead>KYC</TableHead><TableHead className="text-right">Active Ads</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No users match</TableCell></TableRow>}
                  {filteredUsers.slice(0, 100).map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        <button onClick={() => setInspectId(u.id)} className="hover:text-primary underline-offset-2 hover:underline text-left flex items-center gap-1">
                          <UserSearch className="h-3.5 w-3.5" />{u.full_name ?? "—"}
                        </button>
                      </TableCell>
                      <TableCell className="text-xs">{u.email ?? "—"}</TableCell>
                      <TableCell><Badge className="capitalize">{u.subscription_tier}</Badge>{u.is_verified && <BadgeCheck className="inline h-4 w-4 text-accent ml-1" />}</TableCell>
                      <TableCell className="text-xs capitalize">{(u as { kyc_status?: string }).kyc_status ?? "—"}</TableCell>
                      <TableCell className="text-right font-mono">{u.active_ads}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredUsers.length > 100 && <div className="p-3 text-xs text-muted-foreground text-center border-t">Showing first 100 of {filteredUsers.length}. Refine your search.</div>}
            </Card>
          </TabsContent>

          {/* ═══ BROADCAST ═══════════════════════════════════════ */}
          <TabsContent value="broadcast" className="mt-4">
            <BroadcastPanel />
          </TabsContent>

          {/* ═══ PLATFORM SETTINGS / EMERGENCY ═══════════════════ */}
          <TabsContent value="settings" className="mt-4">
            <PlatformSettings initial={platform} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-platform-settings"] })} />
          </TabsContent>

          <TabsContent value="codes" className="mt-4 space-y-4">
            <RolesPanel />
          </TabsContent>
        </Tabs>

        {/* User Inspector Drawer */}
        <UserInspector id={inspectId} onClose={() => setInspectId(null)} />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card className="p-5 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-primary-foreground/70 uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-extrabold mt-1">{value}</p>
        </div>
        <Icon className="h-10 w-10 opacity-60" />
      </div>
    </Card>
  );
}

function RejectModal({ onConfirm }: { onConfirm: (reason: string) => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><X className="h-3 w-3 mr-1" />Reject</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Reject listing</DialogTitle></DialogHeader>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (sent to vendor)" rows={4} />
        <DialogFooter><Button onClick={() => { onConfirm(reason); setOpen(false); }} variant="destructive">Confirm reject</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PendingTitle({ l }: { l: { id: string; title: string; type?: string; images: string[] } }) {
  const [urls, setUrls] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => { if (l.images?.length) getSignedUrls(l.images).then(setUrls); }, [l.images]);
  return (
    <div className="flex items-center gap-2">
      {urls[0] ? (
        <button onClick={() => setOpen(true)} className="h-12 w-12 rounded overflow-hidden border hover:border-accent">
          <img src={urls[0]} alt="" className="w-full h-full object-cover" />
        </button>
      ) : <span className="h-12 w-12 rounded bg-muted inline-block" />}
      <div className="flex-1">
        <a href={`/listing/${l.id}`} target="_blank" rel="noreferrer" className="hover:text-accent underline-offset-2 hover:underline">{l.title}</a>
        {l.type === "goods" && (l.images?.length ?? 0) < 2 && (
          <Badge variant="destructive" className="ml-2 gap-1"><AlertTriangle className="h-3 w-3" />Low image count</Badge>
        )}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{l.title} — images ({urls.length})</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[70vh] overflow-y-auto">
            {urls.map((u, i) => <img key={i} src={u} alt="" className="w-full rounded border" />)}
          </div>
          <DialogFooter>
            <Button asChild variant="outline"><a href={`/listing/${l.id}`} target="_blank" rel="noreferrer">Open full listing</a></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Helper components ─────────────────────────────────────────

const TINTS: Record<string, string> = {
  blue: "from-blue-500/15 to-blue-500/5 text-blue-600 dark:text-blue-400",
  green: "from-emerald-500/15 to-emerald-500/5 text-emerald-600 dark:text-emerald-400",
  amber: "from-amber-500/15 to-amber-500/5 text-amber-600 dark:text-amber-400",
  purple: "from-purple-500/15 to-purple-500/5 text-purple-600 dark:text-purple-400",
  cyan: "from-cyan-500/15 to-cyan-500/5 text-cyan-600 dark:text-cyan-400",
  rose: "from-rose-500/15 to-rose-500/5 text-rose-600 dark:text-rose-400",
};

function MiniStat({ label, value, sub, icon: Icon, tint = "blue" }: { label: string; value: string | number; sub?: string; icon: React.ComponentType<{ className?: string }>; tint?: string }) {
  return (
    <Card className={`p-4 bg-gradient-to-br ${TINTS[tint] ?? TINTS.blue} border-border/50`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wide font-bold text-muted-foreground">{label}</p>
          <p className="text-xl font-extrabold mt-1 text-foreground truncate">{value}</p>
          {sub && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{sub}</p>}
        </div>
        <Icon className="h-5 w-5 opacity-70" />
      </div>
    </Card>
  );
}

function QueueCard({ label, count, icon: Icon, onClick }: { label: string; count: number | string; icon: React.ComponentType<{ className?: string }>; onClick?: () => void }) {
  const isEmpty = count === 0 || count === "₦0";
  return (
    <button onClick={onClick} className={`text-left rounded-lg border p-4 transition-colors hover:border-primary/50 ${isEmpty ? "bg-card" : "bg-primary/5 border-primary/40"}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase font-bold"><Icon className="h-3.5 w-3.5" />{label}</div>
      <p className="text-2xl font-extrabold mt-2">{count}</p>
      {!isEmpty && <p className="text-[10px] text-primary mt-1 font-semibold">Needs urgent attention →</p>}
    </button>
  );
}

function ActivityDot({ kind }: { kind: string }) {
  const map: Record<string, string> = {
    signup: "bg-blue-500", listing: "bg-emerald-500", payment: "bg-amber-500", report: "bg-rose-500",
  };
  return <span className={`h-2 w-2 rounded-full ${map[kind] ?? "bg-muted-foreground"}`} />;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function RiskCell({ score, reasons }: { score: number; reasons: string[] }) {
  const color = score >= 70 ? "bg-red-500" : score >= 40 ? "bg-amber-500" : "bg-emerald-500";
  const label = score >= 70 ? "HIGH" : score >= 40 ? "MED" : "LOW";
  return (
    <div className="min-w-[140px]">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${color}`} />
        <span className="text-sm font-bold">{score}</span>
        <Badge variant="outline" className="text-[10px] py-0 h-4">{label}</Badge>
      </div>
      {reasons.length > 0 && (
        <div className="mt-1 space-y-0.5">
          {reasons.slice(0, 2).map((r, i) => (
            <div key={i} className="text-[10px] text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-2.5 w-2.5" />{r}
            </div>
          ))}
          {reasons.length > 2 && <div className="text-[10px] text-muted-foreground">+{reasons.length - 2} more</div>}
        </div>
      )}
    </div>
  );
}

function ReportActions({ report, onDone }: { report: { id: string; entity_type: string; status: string }; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<string>("dismiss");
  const [note, setNote] = useState("");
  const resolve = async () => {
    if (!confirm(`Apply "${action}" to this report?`)) return;
    const { error } = await supabase.rpc("admin_resolve_report", { _report_id: report.id, _action: action, _note: note || undefined });
    if (error) return toast.error(error.message);
    toast.success("Report resolved");
    setOpen(false);
    onDone();
  };
  if (report.status !== "open") return <Badge variant="outline" className="capitalize">{report.status}</Badge>;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline">Resolve</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Resolve report</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Action</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dismiss">Dismiss</SelectItem>
                {report.entity_type === "user" && <SelectItem value="warn">Warn user</SelectItem>}
                {report.entity_type === "listing" && <SelectItem value="remove_listing">Remove listing</SelectItem>}
                {report.entity_type === "user" && <SelectItem value="suspend_user">Suspend user</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Internal note (optional)</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Context for audit log…" />
          </div>
        </div>
        <DialogFooter><Button onClick={resolve}>Apply</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BroadcastPanel() {
  const [audience, setAudience] = useState("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);
  const send = async () => {
    if (title.length < 2 || body.length < 2) return toast.error("Title and body required");
    if (!confirm(`Send broadcast to "${audience}" audience?`)) return;
    setSending(true);
    const { data, error } = await supabase.rpc("admin_broadcast", { _audience: audience, _title: title, _body: body, _link: link || undefined });
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success(`Sent to ${data} users`);
    setTitle(""); setBody(""); setLink("");
  };
  return (
    <Card className="p-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-4"><Megaphone className="h-5 w-5 text-primary" /><h3 className="font-semibold text-lg">Compose broadcast</h3></div>
      <div className="space-y-4">
        <div>
          <Label>Audience</Label>
          <Select value={audience} onValueChange={setAudience}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Everyone</SelectItem>
              <SelectItem value="verified">Verified users</SelectItem>
              <SelectItem value="vip">VIP subscribers</SelectItem>
              <SelectItem value="pro">Pro subscribers</SelectItem>
              <SelectItem value="lite">Lite subscribers</SelectItem>
              <SelectItem value="shops">Shop owners</SelectItem>
              <SelectItem value="artisans">Artisans</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short, catchy headline" maxLength={80} /></div>
        <div><Label>Body</Label><Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="What do you want users to know?" maxLength={500} /></div>
        <div><Label>Link (optional)</Label><Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/dashboard" /></div>
        <Button onClick={send} disabled={sending} className="w-full"><Bell className="h-4 w-4 mr-2" />{sending ? "Sending…" : "Send broadcast"}</Button>
      </div>
    </Card>
  );
}

function PlatformSettings({ initial, onSaved }: { initial: { maintenance_mode: boolean; disable_registration: boolean; disable_posting: boolean; disable_payments: boolean; disable_withdrawals: boolean; disable_messaging: boolean; emergency_banner: string | null } | null | undefined; onSaved: () => void }) {
  const [s, setS] = useState({
    maintenance_mode: initial?.maintenance_mode ?? false,
    disable_registration: initial?.disable_registration ?? false,
    disable_posting: initial?.disable_posting ?? false,
    disable_payments: initial?.disable_payments ?? false,
    disable_withdrawals: initial?.disable_withdrawals ?? false,
    disable_messaging: initial?.disable_messaging ?? false,
    emergency_banner: initial?.emergency_banner ?? "",
  });
  useEffect(() => {
    if (initial) setS({
      maintenance_mode: initial.maintenance_mode, disable_registration: initial.disable_registration,
      disable_posting: initial.disable_posting, disable_payments: initial.disable_payments,
      disable_withdrawals: initial.disable_withdrawals, disable_messaging: initial.disable_messaging,
      emergency_banner: initial.emergency_banner ?? "",
    });
  }, [initial]);
  const save = async () => {
    if (!confirm("Apply platform settings now?")) return;
    const { error } = await supabase.rpc("admin_update_platform_settings", {
      _maintenance: s.maintenance_mode, _disable_registration: s.disable_registration,
      _disable_posting: s.disable_posting, _disable_payments: s.disable_payments,
      _disable_withdrawals: s.disable_withdrawals, _disable_messaging: s.disable_messaging,
      _banner: s.emergency_banner,
    });
    if (error) return toast.error(error.message);
    toast.success("Platform settings updated");
    onSaved();
  };
  const toggles: Array<[keyof typeof s, string, string]> = [
    ["maintenance_mode", "Maintenance mode", "Freeze all public actions and show a banner"],
    ["disable_registration", "Disable new signups", "Block new account creation"],
    ["disable_posting", "Disable new listings", "Block ad posting temporarily"],
    ["disable_payments", "Disable payments", "Block subscription and boost payments"],
    ["disable_withdrawals", "Freeze withdrawals", "Halt payouts pending review"],
    ["disable_messaging", "Disable messaging", "Freeze buyer↔seller chats"],
  ];
  return (
    <div className="space-y-4 max-w-3xl">
      <Card className="p-6 border-destructive/40">
        <div className="flex items-center gap-2 mb-4"><Settings2 className="h-5 w-5 text-destructive" /><h3 className="font-semibold text-lg">Emergency controls</h3></div>
        <p className="text-sm text-muted-foreground mb-4">Changes apply platform-wide immediately. Every change is audit-logged.</p>
        <div className="space-y-3">
          {toggles.map(([key, label, desc]) => (
            <div key={key} className="flex items-center justify-between gap-4 rounded-lg border p-3">
              <div><p className="font-medium text-sm">{label}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
              <Switch checked={s[key] as boolean} onCheckedChange={(v) => setS((prev) => ({ ...prev, [key]: v }))} />
            </div>
          ))}
          <div className="rounded-lg border p-3">
            <Label>Emergency banner (shown site-wide when non-empty)</Label>
            <Textarea value={s.emergency_banner} onChange={(e) => setS((prev) => ({ ...prev, emergency_banner: e.target.value }))} rows={2} placeholder="e.g. Scheduled maintenance from 2am–3am WAT" className="mt-1" />
          </div>
          <Button onClick={save} className="w-full bg-destructive hover:bg-destructive/90"><ShieldAlert className="h-4 w-4 mr-2" />Apply settings</Button>
        </div>
      </Card>
    </div>
  );
}

function UserInspector({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-user-inspector", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase.rpc("admin_user_inspector", { _uid: id! });
      return (Array.isArray(data) ? data[0] : data) as null | {
        id: string; full_name: string | null; email: string | null; phone: string | null; state: string | null;
        created_at: string; is_verified: boolean; kyc_status: string; subscription_tier: string;
        subscription_until: string | null; wallet_balance: number; shop_slug: string | null; is_artisan: boolean;
        listings_count: number; active_listings: number; chats_count: number; reports_against: number;
        wallet_txns: number; trust_score: number;
      };
    },
  });
  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><UserSearch className="h-4 w-4" /> User inspector</SheetTitle>
          <SheetDescription>Deep dive into any user's activity</SheetDescription>
        </SheetHeader>
        {isLoading && <div className="py-16 text-center text-muted-foreground">Loading…</div>}
        {data && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/70 grid place-items-center text-white text-xl font-bold">
                {(data.full_name ?? "?").slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className="font-bold">{data.full_name ?? "Anonymous"}</p>
                <p className="text-xs text-muted-foreground">{data.email ?? "—"}</p>
                <div className="flex gap-1 mt-1">
                  <Badge className="capitalize">{data.subscription_tier}</Badge>
                  {data.is_verified && <Badge className="bg-emerald-500 text-white gap-1"><BadgeCheck className="h-3 w-3" />Verified</Badge>}
                </div>
              </div>
            </div>

            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs uppercase font-bold text-muted-foreground">Trust score</p>
                <p className="text-lg font-extrabold">{data.trust_score}/100</p>
              </div>
              <Progress value={data.trust_score} className="h-2" />
            </Card>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <InspectStat label="Listings" value={`${data.active_listings}/${data.listings_count}`} />
              <InspectStat label="Chats" value={data.chats_count} />
              <InspectStat label="Reports against" value={data.reports_against} danger={data.reports_against > 0} />
              <InspectStat label="Wallet" value={formatNaira(data.wallet_balance)} />
              <InspectStat label="Wallet txns" value={data.wallet_txns} />
              <InspectStat label="KYC" value={data.kyc_status} />
              <InspectStat label="Phone" value={data.phone ?? "—"} />
              <InspectStat label="State" value={data.state ?? "—"} />
              <InspectStat label="Shop" value={data.shop_slug ?? "—"} />
              <InspectStat label="Artisan" value={data.is_artisan ? "Yes" : "No"} />
              <InspectStat label="Joined" value={timeAgo(data.created_at)} />
              <InspectStat label="Sub. until" value={data.subscription_until ? new Date(data.subscription_until).toLocaleDateString() : "—"} />
            </div>

            <div className="pt-2 border-t space-y-2">
              <p className="text-xs font-bold uppercase text-muted-foreground">Quick actions</p>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" asChild><a href={`mailto:${data.email}`}><LifeBuoy className="h-3.5 w-3.5 mr-1" />Email</a></Button>
                {data.shop_slug && <Button size="sm" variant="outline" asChild><a href={`/shop/${data.shop_slug}`} target="_blank" rel="noreferrer">View shop</a></Button>}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function InspectStat({ label, value, danger }: { label: string; value: string | number; danger?: boolean }) {
  return (
    <div className={`rounded-lg border p-2.5 ${danger ? "border-destructive/50 bg-destructive/5" : ""}`}>
      <p className="text-[10px] uppercase font-bold text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 ${danger ? "text-destructive" : ""}`}>{value}</p>
    </div>
  );
}

// ═══ ROLE MANAGEMENT ═════════════════════════════════════════════
type StaffRow = { user_id: string; full_name: string | null; email: string | null; roles: string[] };

function RolesPanel() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const { data: staff = [] } = useQuery({
    queryKey: ["admin-staff"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_staff");
      if (error) throw error;
      return (data ?? []) as StaffRow[];
    },
  });

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["admin-user-search", term],
    enabled: term.trim().length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_search_users", { _q: term.trim() });
      if (error) throw error;
      return (data ?? []) as StaffRow[];
    },
  });

  const setRole = async (userId: string, role: "admin" | "moderator" | "support", grant: boolean) => {
    setBusy(userId + role);
    const { error } = await supabase.rpc("admin_set_user_role", { _user_id: userId, _role: role, _grant: grant });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(grant ? `${role} role granted` : `${role} role removed`);
    qc.invalidateQueries({ queryKey: ["admin-staff"] });
    qc.invalidateQueries({ queryKey: ["admin-user-search"] });
  };

  const RoleButtons = ({ row }: { row: StaffRow }) => (
    <div className="flex flex-wrap gap-1.5 justify-end">
      {(["admin", "moderator", "support"] as const).map((r) => {
        const has = row.roles?.includes(r);
        return (
          <Button
            key={r}
            size="sm"
            variant={has ? "destructive" : "outline"}
            disabled={busy === row.user_id + r}
            onClick={() => setRole(row.user_id, r, !has)}
          >
            {has ? `Remove ${r}` : `Make ${r}`}
          </Button>
        );
      })}
    </div>
  );

  return (
    <>
      <Card className="p-4 space-y-3">
        <div>
          <p className="font-semibold flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Grant platform roles</p>
          <p className="text-sm text-muted-foreground">Search any registered user by name or email and grant or remove admin, moderator or support access.</p>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => { e.preventDefault(); setTerm(q); }}
        >
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email…" />
          <Button type="submit" className="bg-accent text-accent-foreground"><Search className="h-4 w-4 mr-1" />Search</Button>
        </form>
        {term.trim().length >= 2 && (
          <div className="rounded-lg border divide-y">
            {isFetching && <p className="p-3 text-sm text-muted-foreground">Searching…</p>}
            {!isFetching && results.length === 0 && <p className="p-3 text-sm text-muted-foreground">No users match “{term}”.</p>}
            {results.map((r) => (
              <div key={r.user_id} className="p-3 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="font-medium text-sm">{r.full_name ?? "Unnamed user"}</p>
                  <p className="text-xs text-muted-foreground">{r.email ?? "—"}</p>
                </div>
                <RoleButtons row={r} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-0 overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Roles</TableHead><TableHead className="text-right">Manage</TableHead></TableRow></TableHeader>
          <TableBody>
            {staff.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No staff accounts yet</TableCell></TableRow>}
            {staff.map((s) => (
              <TableRow key={s.user_id}>
                <TableCell className="font-medium">{s.full_name ?? "—"}</TableCell>
                <TableCell className="text-xs">{s.email ?? "—"}</TableCell>
                <TableCell className="space-x-1">
                  {(s.roles ?? []).map((r) => <Badge key={r} className="capitalize">{r}</Badge>)}
                </TableCell>
                <TableCell className="text-right"><RoleButtons row={s} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
