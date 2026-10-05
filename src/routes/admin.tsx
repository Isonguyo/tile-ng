import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { rpcUntyped } from "@/lib/waitlist-rpc";
import { fromUntyped } from "@/lib/db-untyped";
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
  Users, Tag, Banknote, ShieldAlert, Check, X, Flag, BadgeCheck, AlertTriangle,
  Activity, Bell, Search, Megaphone, Settings2, Gauge, TrendingUp, FileWarning, Sparkles,
  UserSearch, LifeBuoy, ShieldCheck, Rocket, Eye, LockKeyhole, RefreshCw, Loader2, Wrench, ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useConfirmAction } from "@/components/confirm-action-provider";
import { showError } from "@/lib/user-feedback";
import { getSignedUrls } from "@/lib/storage";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RTooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin Cabin — Tile" }],
    links: [
      {
        rel: "icon",
        href: "https://res.cloudinary.com/dbozz4sgv/image/upload/v1781367385/tile-logo_vv2c8v.jpg",
      },
    ],
  }),
  component: Admin,
});

type AdminUserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  subscription_tier: string;
  is_verified: boolean;
  active_ads: number;
  created_at: string;
  kyc_status?: string;
  signupSource: string;
};

type WaitlistMatchRow = {
  id?: string;
  full_name?: string | null;
  email: string | null;
  phone: string | null;
  state?: string | null;
  city?: string | null;
  user_type?: string | null;
  source: string | null;
  created_at?: string;
  auth_user_id?: string | null;
  account_created_at?: string | null;
  queue_position?: number | null;
};

const PUBLIC_MARKETPLACE_QUERY_KEYS = [
  ["listings"],
  ["public-marketplace-catalog"],
  ["platform-stats"],
  ["featured-artisans"],
  ["featured-shops"],
  ["artisans-ranked"],
  ["shop-listings"],
  ["listing"],
] as const;

function normalizeLookupValue(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function getSignupSourceLabel(source: string | null | undefined) {
  const raw = (source ?? "").trim();
  if (!raw) return "Waitlist";

  const normalized = raw.toLowerCase().replace(/[_\s-]+/g, " ").trim();
  const mapping: Record<string, string> = {
    facebook: "Facebook",
    whatsapp: "WhatsApp",
    instagram: "Instagram",
    "qr code": "QR Code",
    qr: "QR Code",
    referral: "Referral",
  };

  const mapped = mapping[normalized];
  return mapped ? `Waitlist (${mapped})` : "Waitlist";
}

function Admin() {
  const confirm = useConfirmAction();
  const { isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const invalidatePublicMarketplace = () => {
    PUBLIC_MARKETPLACE_QUERY_KEYS.forEach((queryKey) => {
      void qc.invalidateQueries({ queryKey });
    });
  };

  useEffect(() => {
    if (!loading && !isAdmin) nav({ to: "/" });
  }, [isAdmin, loading, nav]);

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
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, price, category, images, created_at, user_id, status")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const pendingRows = data ?? [];
      const sellerIds = pendingRows.map((row) => row.user_id).filter(Boolean);
      let profilesById = new Map<string, { full_name: string | null; phone: string | null; created_at: string | null }>();

      if (sellerIds.length) {
        const { data: sellerProfiles, error: sellerError } = await supabase
          .from("profiles")
          .select("id, full_name, phone, created_at")
          .in("id", sellerIds);

        if (sellerError) throw sellerError;

        profilesById = new Map((sellerProfiles ?? []).map((profile) => [profile.id, profile]));
      }

      return pendingRows.map((listing) => {
        const seller = profilesById.get(listing.user_id);
        const accountAgeDays = seller?.created_at
          ? Math.max(0, Math.floor((Date.now() - new Date(seller.created_at).getTime()) / 86_400_000))
          : 0;

        return {
          id: listing.id,
          title: listing.title,
          price: listing.price,
          category: listing.category,
          images: (listing.images ?? []) as string[],
          created_at: listing.created_at,
          seller_id: listing.user_id,
          seller_name: seller?.full_name ?? null,
          seller_phone: seller?.phone ?? null,
          account_age_days: accountAgeDays,
          risk_score: 0,
          risk_reasons: [] as string[],
        };
      }) as Array<{
        id: string; title: string; price: number | null; category: string; images: string[];
        created_at: string; seller_id: string; seller_name: string | null; seller_phone: string | null;
        account_age_days: number; risk_score: number; risk_reasons: string[];
      }>;
    },
  });

  const pending = modQueue;

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

  const { data: usersRpc = [] } = useQuery({
    queryKey: ["admin-users"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_users");
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; full_name: string | null; email: string | null; subscription_tier: string; is_verified: boolean; active_ads: number; created_at: string; kyc_status: string }>;
    },
  });

  const { data: userProfiles = [] } = useQuery({
    queryKey: ["admin-user-profiles"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id,full_name,phone,created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Array<{ id: string; email: string | null; phone: string | null }>;
    },
  });

  const { data: waitlistEntries = [] } = useQuery({
    queryKey: ["admin-waitlist-signups"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await fromUntyped("waitlist")
        .select("id,full_name,email,phone,state,city,user_type,source,created_at,auth_user_id,account_created_at,queue_position")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      return (data ?? []) as WaitlistMatchRow[];
    },
  });

  // ─── Approved listings still waiting for public launch ─────────
  const { data: prelaunchListings = [], isFetching: prelaunchFetching } = useQuery({
    queryKey: ["admin-prelaunch-approved-listings"],
    enabled: isAdmin,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await rpcUntyped("admin_list_prelaunch_listings");
      if (error) throw error;

      const rows = (data ?? []) as Array<{
        id: string;
        title: string;
        price: number | null;
        category: string;
        created_at: string;
        user_id: string;
        seller_name?: string | null;
        business_name?: string | null;
        status?: string;
      }>;
      const ids = [...new Set(rows.map((row) => row.user_id).filter(Boolean))];
      let profileMap = new Map<string, { full_name: string | null }>();

      if (ids.length) {
        const { data: profiles, error: profileError } = await supabase
          .from("profiles")
          .select("id,full_name")
          .in("id", ids);

        if (profileError) throw profileError;

        profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
      }

      return rows.map((row) => ({
        ...row,
        seller_name: row.seller_name ?? row.business_name ?? profileMap.get(row.user_id)?.full_name ?? "Unknown seller",
      }));
    },
  });

  const { data: prelaunchArtisans = [], isFetching: prelaunchArtisansFetching } = useQuery({
    queryKey: ["admin-prelaunch-approved-artisans"],
    enabled: isAdmin,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await rpcUntyped("admin_list_prelaunch_artisans");
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        user_id?: string | null;
        full_name: string | null;
        profession: string | null;
        state?: string | null;
        lga?: string | null;
        location?: string | null;
        artisan_status?: string | null;
        is_prelaunch?: boolean | null;
        created_at: string;
      }>;
    },
  });

  // ─── Pending artisan profiles ─────────────────────────────────
  const { data: pendingArtisans = [], isFetching: artisansFetching } = useQuery({
    queryKey: ["admin-pending-artisans"],
    enabled: isAdmin,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await rpcUntyped("admin_list_pending_artisans");
      if (error) throw error;
      return (data ?? []) as unknown as Array<{
        id: string;
        full_name: string | null;
        profession: string | null;
        bio: string | null;
        phone: string | null;
        whatsapp: string | null;
        email: string | null;
        state: string | null;
        lga: string | null;
        years_experience: number | null;
        profile_photo: string | null;
        is_available: boolean | null;
        is_prelaunch: boolean;
        artisan_status: string;
        created_at: string;
        user_id: string;
      }>;
    },
  });

  const users = useMemo<AdminUserRow[]>(() => {
    const profileLookup = new Map(userProfiles.map((profile) => [profile.id, profile]));
    const waitlistLookup = new Map<string, WaitlistMatchRow>();

    for (const entry of waitlistEntries) {
      const email = normalizeLookupValue(entry.email);
      const phone = normalizeLookupValue(entry.phone);
      if (email) waitlistLookup.set(`email:${email}`, entry);
      if (phone) waitlistLookup.set(`phone:${phone}`, entry);
    }

    return usersRpc.map((user) => {
      const profile = profileLookup.get(user.id);
      const email = normalizeLookupValue(user.email);
      const phone = normalizeLookupValue(profile?.phone);
      const matchedByEmail = email ? waitlistLookup.get(`email:${email}`) : undefined;
      const matchedByPhone = phone ? waitlistLookup.get(`phone:${phone}`) : undefined;
      const matched = matchedByEmail ?? matchedByPhone;

      return {
        ...user,
        signupSource: matched ? getSignupSourceLabel(matched.source) : "Direct Signup",
      };
    });
  }, [userProfiles, usersRpc, waitlistEntries]);

  const signupStats = useMemo(() => {
    const waitlistUsers = users.filter((user) => user.signupSource !== "Direct Signup").length;
    const totalWaitlistEntries = waitlistEntries.length;
    const conversionPercent = totalWaitlistEntries > 0 ? (waitlistUsers / totalWaitlistEntries) * 100 : 0;

    return {
      registeredUsers: userProfiles.length,
      waitlistUsers,
      directSignups: userProfiles.length - waitlistUsers,
      conversionPercent: Number(conversionPercent.toFixed(1)),
    };
  }, [userProfiles.length, users, waitlistEntries]);

  const approve = async (id: string) => {
    const { error } = await supabase.rpc("admin_approve_listing", { _id: id });
    if (error) return showError(error, "We couldn't approve that listing. Please try again.");
    toast.success("Approved"); void qc.invalidateQueries({ queryKey: ["admin-mod-queue"] }); void qc.invalidateQueries({ queryKey: ["admin-dashboard-stats"] }); void qc.invalidateQueries({ queryKey: ["admin-prelaunch-approved-listings"] }); invalidatePublicMarketplace();
  };
  const reject = async (id: string, reason: string) => {
    const { error } = await supabase.rpc("admin_reject_listing", { _id: id, _reason: reason });
    if (error) return showError(error, "We couldn't reject that listing. Please try again.");
    toast.success("Rejected"); void qc.invalidateQueries({ queryKey: ["admin-mod-queue"] }); void qc.invalidateQueries({ queryKey: ["admin-dashboard-stats"] }); void qc.invalidateQueries({ queryKey: ["admin-prelaunch-approved-listings"] }); invalidatePublicMarketplace();
  };
  const flag = async (id: string) => {
    const { error } = await supabase.rpc("admin_flag_seller", { _listing_id: id });
    if (error) return showError(error, "We couldn't flag that seller. Please try again.");
    toast.success("Seller flagged & listing removed");
    void qc.invalidateQueries({ queryKey: ["admin-mod-queue"] });
    void qc.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    void qc.invalidateQueries({ queryKey: ["admin-prelaunch-approved-listings"] });
    invalidatePublicMarketplace();
  };
  const grantVerified = async (id: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ kyc_status: "verified", is_verified: true })
      .eq("id", id);

    if (error) return showError(error, "We couldn't verify this vendor. Please try again.");

    toast.success("Verified badge granted");
    void qc.invalidateQueries({ queryKey: ["kyc-pending"] });
    void qc.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
  };

  // Bulk moderation
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggleSel = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const bulk = async (action: "approve" | "reject" | "flag") => {
    if (!selected.size) return toast.error("Select at least one listing");
    const confirmed = await confirm({
      title: `Confirm bulk ${action}?`,
      description: `This will ${action} ${selected.size} selected listings.`,
      confirmLabel: `Yes, ${action}`,
      destructive: action !== "approve",
    });
    if (!confirmed) return;
    const ids = [...selected];
    let failed = 0;
    for (const id of ids) {
      const result = action === "approve"
        ? await supabase.rpc("admin_approve_listing", { _id: id })
        : action === "reject"
          ? await supabase.rpc("admin_reject_listing", { _id: id, _reason: "Bulk rejection" })
          : await supabase.rpc("admin_flag_seller", { _listing_id: id });
      if (result.error) failed += 1;
    }
    const completed = ids.length - failed;
    if (failed === 0) {
      toast.success(`${completed} listing${completed === 1 ? "" : "s"} ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "flagged"}.`);
    } else {
      toast.error(`${completed} listing${completed === 1 ? "" : "s"} updated; ${failed} couldn't be ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "flagged"}. Refresh and review the remaining items.`);
    }
    setSelected(new Set());
    void qc.invalidateQueries({ queryKey: ["admin-mod-queue"] });
    void qc.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    void qc.invalidateQueries({ queryKey: ["admin-prelaunch-approved-listings"] });
    invalidatePublicMarketplace();
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

  // Marketplace health score
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

  if (!loading && !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950/20 dark:bg-slate-950/40 text-foreground">
      <SiteHeader />
      
      {platform?.maintenance_mode && (
        <div className="bg-destructive/90 backdrop-blur-md text-destructive-foreground text-center text-xs tracking-wider uppercase py-2 font-bold shadow-md animate-pulse">
          ⚠ Maintenance mode is ACTIVE — public actions are frozen
        </div>
      )}
      {platform?.emergency_banner && (
        <div className="bg-amber-500/90 backdrop-blur-md text-slate-950 text-center text-xs font-bold py-2 shadow-sm">
          {platform.emergency_banner}
        </div>
      )}

      <div className="container mx-auto px-4 sm:px-6 py-8 space-y-8 max-w-7xl">
        {/* Header Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-r from-card via-card/80 to-background p-6 md:p-8 shadow-sm">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
                <ShieldAlert className="h-3.5 w-3.5" /> Operations Control
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                Mission Control Hub
              </h1>
              <p className="text-sm text-muted-foreground max-w-md">
                Real-time operational overview, moderation queue, user intelligence, and platform governance for Tile marketplace.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/admin/directory"
                  className="group inline-flex min-h-10 items-center gap-2 rounded-xl border border-border/60 bg-background/55 px-3 py-2 text-xs font-semibold shadow-sm transition hover:border-primary/40 hover:bg-primary/5"
                >
                  <Users className="h-4 w-4 text-primary" />
                  <span>Full directory</span>
                  <span className="hidden text-muted-foreground sm:inline">Users, ads & artisans</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/admin/waitlist"
                  className="group inline-flex min-h-10 items-center gap-2 rounded-xl border border-border/60 bg-background/55 px-3 py-2 text-xs font-semibold shadow-sm transition hover:border-primary/40 hover:bg-primary/5"
                >
                  <Rocket className="h-4 w-4 text-primary" />
                  <span>Waitlist analytics</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-background/60 backdrop-blur-md border border-border/60 p-3.5 rounded-xl shadow-sm self-start md:self-auto">
              <div className={`p-2.5 rounded-lg ${health.score >= 70 ? "bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20" : "bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20"}`}>
                <Gauge className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">System Health</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black">{health.score}</span>
                  <span className="text-xs font-medium text-muted-foreground">/ 100</span>
                  <Badge variant="outline" className={`ml-1 text-[10px] font-bold py-0.5 px-2 ${health.score >= 70 ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5" : "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5"}`}>
                    {health.label}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Signup Analytics Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/50 shadow-sm hover:border-border transition-all">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Registered Users</p>
            <p className="text-2xl font-black mt-2 tracking-tight">{signupStats.registeredUsers}</p>
          </Card>
          <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/50 shadow-sm hover:border-border transition-all">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Waitlist Users</p>
            <p className="text-2xl font-black mt-2 tracking-tight text-primary">{signupStats.waitlistUsers}</p>
          </Card>
          <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/50 shadow-sm hover:border-border transition-all">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Direct Signups</p>
            <p className="text-2xl font-black mt-2 tracking-tight">{signupStats.directSignups}</p>
          </Card>
          <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/50 shadow-sm hover:border-border transition-all">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Waitlist Conversion</p>
            <p className="text-2xl font-black mt-2 tracking-tight text-emerald-500">{signupStats.conversionPercent.toFixed(1)}%</p>
          </Card>
        </div>

        {/* Mission Control Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <MiniStat label="Users" value={dash?.users_total ?? stats?.users ?? 0} sub={`+${dash?.users_today ?? 0} today`} icon={Users} tint="blue" />
          <MiniStat label="Listings" value={dash?.listings_total ?? 0} sub={`+${dash?.listings_today ?? 0} today`} icon={Tag} tint="green" />
          <MiniStat label="Revenue" value={formatNaira(dash?.revenue_total ?? stats?.revenue ?? 0)} sub={`+${formatNaira(dash?.revenue_today ?? 0)} today`} icon={Banknote} tint="amber" />
          <MiniStat label="Subscribers" value={dash?.active_subscribers ?? 0} sub={`VIP ${dash?.vip ?? 0} · Pro ${dash?.pro ?? 0}`} icon={BadgeCheck} tint="purple" />
          <MiniStat label="Chats (24h)" value={dash?.chats_24h ?? 0} sub={`${dash?.shops_total ?? 0} shops`} icon={Activity} tint="cyan" />
          <MiniStat label="Artisans" value={dash?.artisans_total ?? 0} sub="Directory" icon={Sparkles} tint="rose" />
        </div>

        {/* Action Needed Queues */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <QueueCard label="Pending listings" count={dash?.listings_pending ?? 0} icon={Tag} onClick={() => document.getElementById("tab-moderation")?.click()} />
          <QueueCard label="Pending artisans" count={pendingArtisans.length} icon={Wrench} onClick={() => document.getElementById("tab-artisans")?.click()} />
          <QueueCard label="Pending KYC" count={dash?.kyc_pending ?? 0} icon={ShieldCheck} onClick={() => document.getElementById("tab-kyc")?.click()} />
          <QueueCard label="Open reports" count={dash?.reports_open ?? 0} icon={FileWarning} onClick={() => document.getElementById("tab-reports")?.click()} />
          <QueueCard label="Monthly revenue" count={formatNaira(dash?.revenue_month ?? 0)} icon={TrendingUp} onClick={() => document.getElementById("tab-money")?.click()} />
        </div>

        {/* Tab Navigation & Content */}
        <Tabs defaultValue="overview" className="w-full space-y-6">
          <div className="overflow-x-auto scrollbar-hide pb-1">
            <TabsList className="inline-flex h-11 items-center justify-start rounded-xl bg-muted/60 p-1 text-muted-foreground backdrop-blur-md border border-border/40 min-w-max">
              <TabsTrigger id="tab-overview" value="overview" className="rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">📊 Overview</TabsTrigger>
              <TabsTrigger id="tab-moderation" value="moderation" className="rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">🛡 Moderation</TabsTrigger>
              <TabsTrigger id="tab-artisans" value="artisans" className="rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">🧰 Artisans</TabsTrigger>
              <TabsTrigger id="tab-reports" value="reports" className="rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">🚩 Reports</TabsTrigger>
              <TabsTrigger id="tab-kyc" value="kyc" className="rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">📄 KYC</TabsTrigger>
              <TabsTrigger id="tab-money" value="money" className="rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">💳 Revenue</TabsTrigger>
              <TabsTrigger id="tab-users" value="users" className="rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">👥 Users</TabsTrigger>
              <TabsTrigger value="broadcast" className="rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">📣 Broadcast</TabsTrigger>
              <TabsTrigger value="waitlist" className="rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">🚀 Waitlist</TabsTrigger>
              <TabsTrigger value="launch" className="rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">🌐 Launch Review</TabsTrigger>
              <TabsTrigger value="settings" className="rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">⚙ Platform</TabsTrigger>
              <TabsTrigger value="codes" className="rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">🛡 Roles & Access</TabsTrigger>
            </TabsList>
          </div>

          {/* ═══ OVERVIEW ══════════════════════════════════════════ */}
          <TabsContent value="overview" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="p-5 lg:col-span-2 border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-500" /> 30-Day Revenue Trend
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Subscription & ad promotions revenue</p>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    Total: {formatNaira(trend.reduce((s, t) => s + t.revenue, 0))}
                  </Badge>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trend}>
                      <defs>
                        <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="day" fontSize={11} stroke="currentColor" className="text-muted-foreground opacity-70" />
                      <YAxis fontSize={11} stroke="currentColor" className="text-muted-foreground opacity-70" tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                      <RTooltip formatter={(v: number) => formatNaira(v)} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#rev)" strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-5 border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
                <h3 className="font-bold text-base mb-1 flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4 text-primary" /> Subscription Breakdown
                </h3>
                <p className="text-xs text-muted-foreground mb-4">Active paid tier distribution</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={tierData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={4}>
                        {tierData.map((d) => <Cell key={d.name} fill={d.color} />)}
                      </Pie>
                      <Legend />
                      <RTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-5 lg:col-span-3 border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-base flex items-center gap-2">
                      <Activity className="h-4 w-4 text-emerald-500 animate-pulse" /> Live Activity Feed
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Real-time marketplace events and registrations</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono py-1 px-2.5">Auto-refresh · 15s</Badge>
                </div>
                <div className="divide-y divide-border/40 max-h-96 overflow-y-auto pr-1">
                  {activity.length === 0 && <p className="text-center text-muted-foreground py-10 text-sm">No recent activity detected</p>}
                  {activity.map((a, i) => (
                    <div key={`${a.kind}-${a.entity_id}-${i}`} className="flex items-center gap-3 py-3 text-sm hover:bg-muted/20 px-2 rounded-lg transition-colors">
                      <ActivityDot kind={a.kind} />
                      <span className="font-medium">{a.title}</span>
                      {a.subtitle && <span className="text-muted-foreground text-xs truncate max-w-xs">· {a.subtitle}</span>}
                      <span className="ml-auto text-xs font-mono text-muted-foreground whitespace-nowrap">{timeAgo(a.at)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* ═══ MODERATION ══════════════════════════════════════════ */}
          <TabsContent value="moderation" className="space-y-4 mt-0">
            {selected.size > 0 && (
              <Card className="p-3.5 flex flex-wrap items-center gap-3 border-primary/40 bg-primary/10 backdrop-blur-sm">
                <span className="text-xs font-bold uppercase tracking-wider">{selected.size} selected</span>
                <Button size="sm" onClick={() => bulk("approve")} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"><Check className="h-3.5 w-3.5 mr-1" />Approve all</Button>
                <Button size="sm" variant="outline" onClick={() => bulk("reject")} className="font-medium"><X className="h-3.5 w-3.5 mr-1" />Reject all</Button>
                <Button size="sm" variant="destructive" onClick={() => bulk("flag")} className="font-medium"><Flag className="h-3.5 w-3.5 mr-1" />Flag sellers</Button>
                <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
              </Card>
            )}
            <Card className="p-0 overflow-hidden border-border/50 shadow-sm">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-10 text-center"></TableHead>
                    <TableHead>Listing Item</TableHead>
                    <TableHead>Seller Account</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">🎉 Nothing pending — moderation queue clear</TableCell></TableRow>}
                  {pending.map((l) => (
                    <TableRow key={l.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-center"><input type="checkbox" checked={selected.has(l.id)} onChange={() => toggleSel(l.id)} className="rounded border-border h-4 w-4 accent-primary cursor-pointer" /></TableCell>
                      <TableCell className="font-medium">
                        <PendingTitle l={l} />
                      </TableCell>
                      <TableCell className="text-sm">
                        <button onClick={() => setInspectId(l.seller_id)} className="font-medium hover:text-primary underline-offset-2 hover:underline text-left transition-colors">
                          {l.seller_name ?? "—"}
                        </button>
                        <div className="text-xs text-muted-foreground">{l.account_age_days}d account age</div>
                      </TableCell>
                      <TableCell><RiskCell score={l.risk_score} reasons={l.risk_reasons ?? []} /></TableCell>
                      <TableCell className="font-semibold">{formatNaira(l.price)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="sm" onClick={() => approve(l.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-8"><Check className="h-3.5 w-3.5 mr-1" />Approve</Button>
                          <RejectModal onConfirm={(r) => reject(l.id, r)} />
                          <Button size="sm" variant="destructive" onClick={() => flag(l.id)} className="h-8"><Flag className="h-3.5 w-3.5 mr-1" />Flag</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* ═══ ARTISAN MODERATION ══════════════════════════════ */}
          <TabsContent value="artisans" className="space-y-4 mt-0">
            <Card className="p-5 border-primary/20 bg-primary/5 backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Wrench className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-base">Pending Artisan Profiles</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Review pre-launch artisan registrations before enabling public directory visibility.
                  </p>
                </div>
                <Badge variant="outline" className="font-mono text-xs font-bold">
                  {artisansFetching ? "Loading…" : `${pendingArtisans.length} pending`}
                </Badge>
              </div>
            </Card>

            <Card className="p-0 overflow-hidden border-border/50 shadow-sm">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Artisan</TableHead>
                    <TableHead>Profession</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {artisansFetching && pendingArtisans.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                        Loading artisan review queue…
                      </TableCell>
                    </TableRow>
                  )}
                  {!artisansFetching && pendingArtisans.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                        🎉 No pending artisan profiles
                      </TableCell>
                    </TableRow>
                  )}
                  {pendingArtisans.map((artisan) => (
                    <TableRow key={artisan.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3 min-w-[220px]">
                          {artisan.profile_photo ? (
                            <img src={artisan.profile_photo} alt="" className="h-10 w-10 rounded-full object-cover border border-border" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary/10 grid place-items-center text-primary font-bold">
                              <Wrench className="h-4 w-4" />
                            </div>
                          )}
                          <div>
                            <button
                              type="button"
                              onClick={() => setInspectId(artisan.user_id)}
                              className="font-bold text-sm hover:text-primary hover:underline text-left transition-colors"
                            >
                              {artisan.full_name ?? "Unnamed artisan"}
                            </button>
                            <p className="text-xs text-muted-foreground">
                              {artisan.email ?? artisan.phone ?? "No contact info"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{artisan.profession ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {[artisan.lga, artisan.state].filter(Boolean).join(", ") || "—"}
                      </TableCell>
                      <TableCell className="text-sm">{artisan.years_experience ?? 0} yrs</TableCell>
                      <TableCell>
                        <Badge variant={artisan.is_available ? "default" : "secondary"} className="text-[10px]">
                          {artisan.is_available ? "Available" : "Unavailable"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {artisan.artisan_status === "approved" && (!artisan.is_prelaunch || (platform as { launch_mode?: string } | null)?.launch_mode === "launched") ? "Public" : "Private"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => setInspectId(artisan.user_id)} className="h-8">
                            <Eye className="h-3.5 w-3.5 mr-1" />Inspect
                          </Button>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8"
                            onClick={async () => {
                              const { error } = await rpcUntyped("admin_approve_artisan", { _user_id: artisan.user_id });
                              if (error) return showError(error, "We couldn't approve this artisan. Please try again.");
                              toast.success("Artisan approved");
                              void qc.invalidateQueries({ queryKey: ["admin-pending-artisans"] });
                              void qc.invalidateQueries({ queryKey: ["admin-prelaunch-approved-artisans"] });
                              void qc.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
                              invalidatePublicMarketplace();
                            }}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />Approve
                          </Button>

                          <RejectArtisanModal
                            onConfirm={async (reason) => {
                              const { error } = await rpcUntyped("admin_reject_artisan", {
                                _user_id: artisan.user_id,
                                _reason: reason,
                              });
                              if (error) { showError(error, "We couldn't update this artisan. Please try again."); return; }
                              toast.success("Artisan sent back for changes");
                              void qc.invalidateQueries({ queryKey: ["admin-pending-artisans"] });
                              void qc.invalidateQueries({ queryKey: ["admin-prelaunch-approved-artisans"] });
                              invalidatePublicMarketplace();
                            }}
                          />

                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8"
                            onClick={async () => {
                              const confirmed = await confirm({
                                title: "Flag this artisan?",
                                description: `${artisan.full_name ?? "This artisan"} will be flagged for review.`,
                                confirmLabel: "Flag artisan",
                                destructive: true,
                              });
                              if (!confirmed) return;
                              const { error } = await rpcUntyped("admin_flag_artisan", { _user_id: artisan.user_id });
                              if (error) return showError(error, "We couldn't flag this artisan. Please try again.");
                              toast.success("Artisan flagged");
                              void qc.invalidateQueries({ queryKey: ["admin-pending-artisans"] });
                              void qc.invalidateQueries({ queryKey: ["admin-prelaunch-approved-artisans"] });
                              invalidatePublicMarketplace();
                            }}
                          >
                            <Flag className="h-3.5 w-3.5 mr-1" />Flag
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* ═══ REPORTS ═════════════════════════════════════════ */}
          <TabsContent value="reports" className="space-y-4 mt-0">
            <div className="flex items-center gap-2">
              {(["open", "resolved", "dismissed"] as const).map((s) => (
                <Button key={s} size="sm" variant={reportFilter === s ? "default" : "outline"} onClick={() => setReportFilter(s)} className="capitalize text-xs font-medium">
                  {s}
                </Button>
              ))}
            </div>
            <Card className="p-0 overflow-hidden border-border/50 shadow-sm">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow><TableHead>Target</TableHead><TableHead>Reason</TableHead><TableHead>Reporter</TableHead><TableHead>Reported At</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {reports.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12">No {reportFilter} reports found</TableCell></TableRow>}
                  {reports.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell><Badge variant="outline" className="capitalize text-[10px]">{r.entity_type}</Badge><div className="font-mono text-[10px] text-muted-foreground mt-1">{r.entity_id.slice(0, 8)}…</div></TableCell>
                      <TableCell className="text-sm max-w-xs"><div className="font-medium">{r.reason}</div>{r.details && <div className="text-xs text-muted-foreground truncate">{r.details}</div>}</TableCell>
                      <TableCell className="text-xs">{r.reporter_name ?? "—"}</TableCell>
                      <TableCell className="text-xs font-mono whitespace-nowrap">{timeAgo(r.created_at)}</TableCell>
                      <TableCell className="text-right"><ReportActions report={r} onDone={() => qc.invalidateQueries({ queryKey: ["admin-reports"] })} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* ═══ KYC ═════════════════════════════════════════ */}
          <TabsContent value="kyc" className="space-y-4 mt-0">
            <Card className="p-0 overflow-hidden border-border/50 shadow-sm">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow><TableHead>User Account</TableHead><TableHead>Phone</TableHead><TableHead>Status</TableHead><TableHead>Document</TableHead><TableHead className="text-right">Action</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {kycPending.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12">No pending KYC verifications</TableCell></TableRow>}
                  {kycPending.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">
                        <button onClick={() => setInspectId(p.id)} className="hover:text-primary underline-offset-2 hover:underline text-left">{p.full_name}</button>
                      </TableCell>
                      <TableCell className="text-sm">{p.phone ?? "—"}</TableCell>
                      <TableCell><Badge className="capitalize text-[10px]">{p.kyc_status}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{p.kyc_doc_url ? "uploaded" : "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => grantVerified(p.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white h-8"><BadgeCheck className="h-3.5 w-3.5 mr-1" />Grant Verified</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* ═══ REVENUE ═════════════════════════════════════════ */}
          <TabsContent value="money" className="space-y-4 mt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/50"><p className="text-[10px] uppercase text-muted-foreground font-bold">Today</p><p className="text-xl font-black mt-1">{formatNaira(dash?.revenue_today ?? 0)}</p></Card>
              <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/50"><p className="text-[10px] uppercase text-muted-foreground font-bold">This month</p><p className="text-xl font-black mt-1 text-primary">{formatNaira(dash?.revenue_month ?? 0)}</p></Card>
              <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/50"><p className="text-[10px] uppercase text-muted-foreground font-bold">This year</p><p className="text-xl font-black mt-1">{formatNaira(stats?.yearly ?? 0)}</p></Card>
              <Card className="p-4 bg-card/60 backdrop-blur-sm border-border/50"><p className="text-[10px] uppercase text-muted-foreground font-bold">Lifetime</p><p className="text-xl font-black mt-1 text-emerald-500">{formatNaira(dash?.revenue_total ?? 0)}</p></Card>
            </div>
            <Card className="p-0 overflow-hidden border-border/50 shadow-sm">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow><TableHead>Timestamp</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Reference ID</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {txns.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-12">No revenue transactions recorded</TableCell></TableRow>}
                  {txns.map((t) => (
                    <TableRow key={t.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-xs font-mono">{new Date(t.created_at).toLocaleString()}</TableCell>
                      <TableCell><Badge className="capitalize text-[10px]">{t.tx_type}</Badge></TableCell>
                      <TableCell className={`font-mono font-bold ${Number(t.amount) < 0 ? "text-destructive" : "text-emerald-500"}`}>{formatNaira(Number(t.amount))}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{t.reference ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-3.5 text-xs text-muted-foreground border-t bg-muted/20">Plan price tiers: Lite ₦5,000 · Pro ₦15,000 · VIP ₦40,000</div>
            </Card>
          </TabsContent>

          {/* ═══ USERS ═════════════════════════════════════════ */}
          <TabsContent value="users" className="space-y-4 mt-0">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input placeholder="Search users by name or email…" value={userQuery} onChange={(e) => setUserQuery(e.target.value)} className="pl-9 h-10 border-border/60 bg-card/60" />
            </div>
            <Card className="p-0 overflow-hidden border-border/50 shadow-sm">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Tier</TableHead><TableHead>Signup Source</TableHead><TableHead>KYC</TableHead><TableHead className="text-right">Active Ads</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">No users match search criteria</TableCell></TableRow>}
                  {filteredUsers.slice(0, 100).map((u) => (
                    <TableRow key={u.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">
                        <button onClick={() => setInspectId(u.id)} className="hover:text-primary underline-offset-2 hover:underline text-left flex items-center gap-1.5 font-semibold">
                          <UserSearch className="h-3.5 w-3.5 text-muted-foreground" />{u.full_name ?? "—"}
                        </button>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{u.email ?? "—"}</TableCell>
                      <TableCell><Badge className="capitalize text-[10px]">{u.subscription_tier}</Badge>{u.is_verified && <BadgeCheck className="inline h-4 w-4 text-emerald-500 ml-1" />}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={u.signupSource === "Direct Signup" ? "border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5" : "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"}>
                          {u.signupSource}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs capitalize">{u.kyc_status ?? "—"}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">{u.active_ads}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredUsers.length > 100 && <div className="p-3 text-xs text-muted-foreground text-center border-t bg-muted/20">Showing first 100 of {filteredUsers.length} users.</div>}
            </Card>
          </TabsContent>

          {/* ═══ BROADCAST ═══════════════════════════════════════ */}
          <TabsContent value="broadcast" className="space-y-4 mt-0">
            <BroadcastPanel />
          </TabsContent>

          {/* ═══ WAITLIST ═══════════════════════════════════════ */}
          <TabsContent value="waitlist" className="space-y-4 mt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-card/60 border-border/50">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Waitlist</p>
                <p className="text-2xl font-black mt-1">{waitlistEntries.length}</p>
              </Card>
              <Card className="p-4 bg-card/60 border-border/50">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Accounts Linked</p>
                <p className="text-2xl font-black mt-1 text-emerald-500">
                  {waitlistEntries.filter((w) => Boolean(w.auth_user_id)).length}
                </p>
              </Card>
              <Card className="p-4 bg-card/60 border-border/50">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Sellers / Artisans</p>
                <p className="text-2xl font-black mt-1 text-primary">
                  {waitlistEntries.filter((w) => w.user_type === "seller" || w.user_type === "artisan" || w.user_type === "all").length}
                </p>
              </Card>
              <Card className="p-4 bg-card/60 border-border/50">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Pre-launch Approved Ads</p>
                <p className="text-2xl font-black mt-1">{prelaunchListings.length}</p>
              </Card>
            </div>

            <Card className="p-0 overflow-hidden border-border/50 shadow-sm">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Queue Position</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email Address</TableHead>
                    <TableHead>Account Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Account Status</TableHead>
                    <TableHead>Joined Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {waitlistEntries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                        No waitlist signups recorded
                      </TableCell>
                    </TableRow>
                  )}
                  {waitlistEntries.map((entry) => (
                    <TableRow key={entry.id ?? `${entry.email}-${entry.created_at}`} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono font-bold text-xs">#{entry.queue_position ?? "—"}</TableCell>
                      <TableCell className="font-medium">{entry.full_name ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{entry.email ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-[10px]">{entry.user_type ?? "buyer"}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {[entry.city, entry.state].filter(Boolean).join(", ") || "—"}
                      </TableCell>
                      <TableCell>
                        {entry.auth_user_id ? (
                          <Badge className="bg-emerald-600 text-white gap-1 text-[10px]">
                            <BadgeCheck className="h-3 w-3" /> Linked
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Waitlist only</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                        {entry.created_at ? timeAgo(entry.created_at) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* ═══ LAUNCH REVIEW ═══════════════════════════════════ */}
          <TabsContent value="launch" className="space-y-4 mt-0">
            <Card className="p-5 border-primary/20 bg-primary/5 backdrop-blur-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-base">Pre-Launch Content</h3>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Approved marketplace content remains private until launch.
                  </p>
                </div>
                <Badge variant="outline" className="w-fit text-xs font-bold font-mono">
                  {(platform as { launch_mode?: string } | undefined)?.launch_mode === "launched" ? "Marketplace Launched" : "Pre-launch Mode"}
                </Badge>
              </div>
            </Card>

            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Listings</p><p className="mt-1 text-2xl font-black">{prelaunchFetching ? "…" : prelaunchListings.length}</p><p className="text-xs text-muted-foreground">Approved and waiting for launch</p></Card>
              <Card className="p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Artisan Profiles</p><p className="mt-1 text-2xl font-black">{prelaunchArtisansFetching ? "…" : prelaunchArtisans.length}</p><p className="text-xs text-muted-foreground">Approved and waiting for launch</p></Card>
              <Card className="border-primary/30 bg-primary/5 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Approved Content</p><p className="mt-1 text-2xl font-black">{prelaunchFetching || prelaunchArtisansFetching ? "…" : prelaunchListings.length + prelaunchArtisans.length}</p><p className="text-xs text-muted-foreground">Private until Marketplace Launch</p></Card>
            </div>

            <Card className="p-0 overflow-hidden border-border/50 shadow-sm">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Listing</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Approval & Visibility</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prelaunchFetching && prelaunchListings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                        Loading pre-launch listings…
                      </TableCell>
                    </TableRow>
                  )}
                  {!prelaunchFetching && prelaunchListings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                        No approved pre-launch listings waiting.
                      </TableCell>
                    </TableRow>
                  )}
                  {prelaunchListings.map((listing) => (
                    <TableRow key={listing.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-bold text-sm">{listing.title}</TableCell>
                      <TableCell className="text-sm">{listing.seller_name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{listing.category}</TableCell>
                      <TableCell className="font-semibold">{formatNaira(listing.price)}</TableCell>
                      <TableCell><div className="flex flex-wrap gap-1.5"><Badge>Approved</Badge><Badge variant="outline">Private / Pre-Launch</Badge></div></TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(listing.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </Card>

            <Card className="overflow-hidden border-border/50 p-0 shadow-sm">
              <div className="flex flex-col gap-2 border-b border-border/50 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div><h3 className="font-bold">Approved Artisan Profiles Waiting for Launch</h3><p className="mt-1 text-xs text-muted-foreground">Approved profiles remain private until Marketplace Launch.</p></div>
                <Badge variant="outline" className="w-fit">{prelaunchArtisansFetching ? "Loading…" : `${prelaunchArtisans.length} profiles`}</Badge>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/40"><TableRow><TableHead>Artisan</TableHead><TableHead>Profession</TableHead><TableHead>Location</TableHead><TableHead>Approval Status</TableHead><TableHead>Visibility</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {prelaunchArtisansFetching && prelaunchArtisans.length === 0 && <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">Loading approved artisan profiles…</TableCell></TableRow>}
                    {!prelaunchArtisansFetching && prelaunchArtisans.length === 0 && <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">No approved artisan profiles are waiting for launch.</TableCell></TableRow>}
                    {prelaunchArtisans.map((artisan) => (
                      <TableRow key={artisan.id} className="hover:bg-muted/30">
                        <TableCell className="font-semibold">{artisan.full_name ?? "Unnamed artisan"}</TableCell>
                        <TableCell>{artisan.profession ?? "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{artisan.location || [artisan.lga, artisan.state].filter(Boolean).join(", ") || "—"}</TableCell>
                        <TableCell><Badge className="capitalize">{(artisan.artisan_status ?? "approved").replaceAll("_", " ")}</Badge></TableCell>
                        <TableCell><Badge variant="outline">Private / Pre-Launch</Badge></TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{new Date(artisan.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* ═══ PLATFORM SETTINGS ═══════════════════════════════ */}
          <TabsContent value="settings" className="space-y-4 mt-0">
            <PlatformSettings
              initial={platform}
              prelaunchListingCount={prelaunchListings.length}
              prelaunchListingLoading={prelaunchFetching}
              prelaunchArtisanCount={prelaunchArtisans.length}
              prelaunchArtisanLoading={prelaunchArtisansFetching}
              onLaunchChanged={() => {
                void qc.invalidateQueries({ queryKey: ["admin-platform-settings"] });
                void qc.invalidateQueries({ queryKey: ["admin-prelaunch-approved-listings"] });
                void qc.invalidateQueries({ queryKey: ["admin-prelaunch-approved-artisans"] });
                void qc.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
                void qc.invalidateQueries({ queryKey: ["admin-stats"] });
                invalidatePublicMarketplace();
              }}
              onSaved={() => void qc.invalidateQueries({ queryKey: ["admin-platform-settings"] })}
            />
          </TabsContent>

          {/* ═══ ROLES & ACCESS ═══════════════════════════════════ */}
          <TabsContent value="codes" className="space-y-4 mt-0">
            <RolesPanel />
          </TabsContent>
        </Tabs>

        {/* User Inspector Drawer */}
        <UserInspector id={inspectId} onClose={() => setInspectId(null)} />
      </div>
    </div>
  );
}

function RejectArtisanModal({ onConfirm }: { onConfirm: (reason: string) => void | Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const submit = async () => {
    await onConfirm(reason);
    setOpen(false);
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8">
          <X className="h-3.5 w-3.5 mr-1" />Reject
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Request Artisan Profile Changes</DialogTitle></DialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain what the artisan needs to update or fix…"
          rows={4}
          className="mt-2"
        />
        <DialogFooter className="mt-4">
          <Button variant="destructive" onClick={submit} disabled={!reason.trim()}>
            Send Rejection Reason
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RejectModal({ onConfirm }: { onConfirm: (reason: string) => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline" className="h-8"><X className="h-3.5 w-3.5 mr-1" />Reject</Button></DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Reject Listing</DialogTitle></DialogHeader>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for rejection (sent to vendor)" rows={4} className="mt-2" />
        <DialogFooter className="mt-4"><Button onClick={() => { onConfirm(reason); setOpen(false); }} variant="destructive">Confirm Reject</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PendingTitle({ l }: { l: { id: string; title: string; type?: string; images: string[] } }) {
  const [urls, setUrls] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => { if (l.images?.length) getSignedUrls(l.images).then(setUrls); }, [l.images]);
  return (
    <div className="flex items-center gap-3">
      {urls[0] ? (
        <button onClick={() => setOpen(true)} className="h-12 w-12 rounded-lg overflow-hidden border border-border/80 hover:border-primary transition-all shrink-0 shadow-sm">
          <img src={urls[0]} alt="" className="w-full h-full object-cover" />
        </button>
      ) : <span className="h-12 w-12 rounded-lg bg-muted border border-border/60 inline-block shrink-0" />}
      <div className="flex-1 min-w-0">
        <a href={`/listing/${l.id}`} target="_blank" rel="noreferrer" className="hover:text-primary underline-offset-2 hover:underline font-semibold block text-sm truncate">
          {l.title}
        </a>
        {l.type === "goods" && (l.images?.length ?? 0) < 2 && (
          <Badge variant="destructive" className="mt-1 gap-1 text-[10px] py-0 px-1.5"><AlertTriangle className="h-2.5 w-2.5" />Low images ({l.images?.length ?? 0})</Badge>
        )}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{l.title} — Images ({urls.length})</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto p-1">
            {urls.map((u, i) => <img key={i} src={u} alt="" className="w-full h-40 object-cover rounded-lg border border-border" />)}
          </div>
          <DialogFooter>
            <Button asChild variant="outline"><a href={`/listing/${l.id}`} target="_blank" rel="noreferrer">View Full Listing Page</a></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Helper UI Components ─────────────────────────────────────────

const TINTS: Record<string, string> = {
  blue: "border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400",
  green: "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
  amber: "border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400",
  purple: "border-purple-500/20 bg-purple-500/5 text-purple-600 dark:text-purple-400",
  cyan: "border-cyan-500/20 bg-cyan-500/5 text-cyan-600 dark:text-cyan-400",
  rose: "border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400",
};

function MiniStat({ label, value, sub, icon: Icon, tint = "blue" }: { label: string; value: string | number; sub?: string; icon: React.ComponentType<{ className?: string }>; tint?: string }) {
  return (
    <Card className={`p-4 border backdrop-blur-sm shadow-sm transition-all hover:scale-[1.01] ${TINTS[tint] ?? TINTS.blue}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider font-bold opacity-80">{label}</p>
          <p className="text-xl font-black mt-1 text-foreground truncate">{value}</p>
          {sub && <p className="text-[10px] opacity-75 mt-0.5 truncate">{sub}</p>}
        </div>
        <Icon className="h-5 w-5 opacity-70 shrink-0" />
      </div>
    </Card>
  );
}

function QueueCard({ label, count, icon: Icon, onClick }: { label: string; count: number | string; icon: React.ComponentType<{ className?: string }>; onClick?: () => void }) {
  const isEmpty = count === 0 || count === "₦0";
  return (
    <button onClick={onClick} className={`group text-left rounded-xl border p-4 transition-all duration-200 shadow-sm hover:shadow-md ${isEmpty ? "bg-card/60 border-border/50 hover:border-border" : "bg-primary/5 border-primary/30 hover:border-primary/60"}`}>
      <div className="flex items-center justify-between text-xs text-muted-foreground font-bold uppercase tracking-wider">
        <span className="flex items-center gap-1.5"><Icon className="h-3.5 w-3.5 text-primary" />{label}</span>
      </div>
      <p className="text-2xl font-black mt-2 tracking-tight">{count}</p>
      {!isEmpty && <p className="text-[10px] text-primary mt-1 font-semibold flex items-center gap-0.5">Review immediately <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" /></p>}
    </button>
  );
}

function ActivityDot({ kind }: { kind: string }) {
  const map: Record<string, string> = {
    signup: "bg-blue-500 ring-blue-500/20", listing: "bg-emerald-500 ring-emerald-500/20", payment: "bg-amber-500 ring-amber-500/20", report: "bg-rose-500 ring-rose-500/20",
  };
  return <span className={`h-2.5 w-2.5 rounded-full ring-4 ${map[kind] ?? "bg-muted-foreground ring-muted/20"}`} />;
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
  const color = score >= 70 ? "bg-rose-500" : score >= 40 ? "bg-amber-500" : "bg-emerald-500";
  const label = score >= 70 ? "HIGH" : score >= 40 ? "MED" : "LOW";
  return (
    <div className="min-w-[130px]">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${color}`} />
        <span className="text-sm font-black">{score}</span>
        <Badge variant="outline" className="text-[9px] py-0 px-1 font-bold">{label}</Badge>
      </div>
      {reasons.length > 0 && (
        <div className="mt-1 space-y-0.5">
          {reasons.slice(0, 2).map((r, i) => (
            <div key={i} className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
              <AlertTriangle className="h-2.5 w-2.5 shrink-0" />{r}
            </div>
          ))}
          {reasons.length > 2 && <div className="text-[10px] text-muted-foreground font-mono">+{reasons.length - 2} more</div>}
        </div>
      )}
    </div>
  );
}

function ReportActions({ report, onDone }: { report: { id: string; entity_type: string; status: string }; onDone: () => void }) {
  const confirm = useConfirmAction();
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<string>("dismiss");
  const [note, setNote] = useState("");
  const resolve = async () => {
    const confirmed = await confirm({
      title: "Resolve this report?",
      description: `The action “${action}” will be applied to this ${report.entity_type} report.`,
      confirmLabel: "Resolve report",
      destructive: action !== "dismiss",
    });
    if (!confirmed) return;
    const { error } = await supabase.rpc("admin_resolve_report", { _report_id: report.id, _action: action, _note: note || undefined });
    if (error) return showError(error, "We couldn't resolve this report. Please try again.");
    toast.success("Report resolved");
    setOpen(false);
    onDone();
  };
  if (report.status !== "open") return <Badge variant="outline" className="capitalize text-[10px]">{report.status}</Badge>;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline" className="h-8">Resolve</Button></DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Resolve Moderation Report</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider">Action</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dismiss">Dismiss Report</SelectItem>
                {report.entity_type === "user" && <SelectItem value="warn">Warn User</SelectItem>}
                {report.entity_type === "listing" && <SelectItem value="remove_listing">Remove Listing</SelectItem>}
                {report.entity_type === "user" && <SelectItem value="suspend_user">Suspend User</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider">Internal Audit Note</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Provide audit context for this action…" className="mt-1" />
          </div>
        </div>
        <DialogFooter className="mt-4"><Button onClick={resolve} className="w-full">Apply Action</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BroadcastPanel() {
  const confirm = useConfirmAction();
  const [audience, setAudience] = useState("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);
  const send = async () => {
    if (title.length < 2 || body.length < 2) return toast.error("Title and body required");
    const confirmed = await confirm({
      title: "Send this announcement?",
      description: `This announcement will be sent to the ${audience} audience.`,
      confirmLabel: "Send announcement",
    });
    if (!confirmed) return;
    setSending(true);
    const { data, error } = await supabase.rpc("admin_broadcast", { _audience: audience, _title: title, _body: body, _link: link || undefined });
    setSending(false);
    if (error) return showError(error, "We couldn't send the announcement. Please try again.");
    toast.success(`Sent broadcast to ${data} users`);
    setTitle(""); setBody(""); setLink("");
  };
  return (
    <Card className="p-6 max-w-2xl border-border/50 bg-card/60 backdrop-blur-sm shadow-sm">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b">
        <Megaphone className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-lg">Compose System Broadcast</h3>
      </div>
      <div className="space-y-4">
        <div>
          <Label className="text-xs font-bold uppercase tracking-wider">Target Audience</Label>
          <Select value={audience} onValueChange={setAudience}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Everyone</SelectItem>
              <SelectItem value="verified">Verified Users Only</SelectItem>
              <SelectItem value="vip">VIP Subscribers</SelectItem>
              <SelectItem value="pro">Pro Subscribers</SelectItem>
              <SelectItem value="lite">Lite Subscribers</SelectItem>
              <SelectItem value="shops">Shop Owners</SelectItem>
              <SelectItem value="artisans">Artisans</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs font-bold uppercase tracking-wider">Notification Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Catchy, concise headline" maxLength={80} className="mt-1.5" />
        </div>
        <div>
          <Label className="text-xs font-bold uppercase tracking-wider">Broadcast Body Message</Label>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Announcement text to display to selected users..." maxLength={500} className="mt-1.5" />
        </div>
        <div>
          <Label className="text-xs font-bold uppercase tracking-wider">Action Link (Optional)</Label>
          <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="e.g. /dashboard or /upgrade" className="mt-1.5" />
        </div>
        <Button onClick={send} disabled={sending} className="w-full h-10 font-semibold">
          <Bell className="h-4 w-4 mr-2" />{sending ? "Dispatching Broadcast…" : "Dispatch Broadcast"}
        </Button>
      </div>
    </Card>
  );
}

function PlatformSettings({
  initial,
  prelaunchListingCount,
  prelaunchListingLoading,
  prelaunchArtisanCount,
  prelaunchArtisanLoading,
  onLaunchChanged,
  onSaved,
}: {
  initial:
    | {
        maintenance_mode: boolean;
        disable_registration: boolean;
        disable_posting: boolean;
        disable_payments: boolean;
        disable_withdrawals: boolean;
        disable_messaging: boolean;
        emergency_banner: string | null;
        launch_mode?: "prelaunch" | "launched" | null;
      }
    | null
    | undefined;
  prelaunchListingCount: number;
  prelaunchListingLoading: boolean;
  prelaunchArtisanCount: number;
  prelaunchArtisanLoading: boolean;
  onLaunchChanged: () => void;
  onSaved: () => void;
}) {
  const confirm = useConfirmAction();
  const [s, setS] = useState({
    maintenance_mode: initial?.maintenance_mode ?? false,
    disable_registration: initial?.disable_registration ?? false,
    disable_posting: initial?.disable_posting ?? false,
    disable_payments: initial?.disable_payments ?? false,
    disable_withdrawals: initial?.disable_withdrawals ?? false,
    disable_messaging: initial?.disable_messaging ?? false,
    emergency_banner: initial?.emergency_banner ?? "",
  });
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    if (initial) {
      setS({
        maintenance_mode: initial.maintenance_mode,
        disable_registration: initial.disable_registration,
        disable_posting: initial.disable_posting,
        disable_payments: initial.disable_payments,
        disable_withdrawals: initial.disable_withdrawals,
        disable_messaging: initial.disable_messaging,
        emergency_banner: initial.emergency_banner ?? "",
      });
    }
  }, [initial]);

  const save = async () => {
    const confirmed = await confirm({
      title: "Apply platform settings?",
      description: "These changes will take effect across Tile immediately.",
      confirmLabel: "Apply settings",
    });
    if (!confirmed) return;

    const { error } = await supabase.rpc("admin_update_platform_settings", {
      _maintenance: s.maintenance_mode,
      _disable_registration: s.disable_registration,
      _disable_posting: s.disable_posting,
      _disable_payments: s.disable_payments,
      _disable_withdrawals: s.disable_withdrawals,
      _disable_messaging: s.disable_messaging,
      _banner: s.emergency_banner,
    });

    if (error) return showError(error, "We couldn't update the platform settings. Please try again.");

    toast.success("Platform settings updated");
    onSaved();
  };

  const launchMarketplace = async () => {
    if (initial?.launch_mode === "launched") return;

    const approvedListingCount = prelaunchListingCount;
    const approvedArtisanCount = prelaunchArtisanCount;
    const approvedCount = approvedListingCount + approvedArtisanCount;
    const confirmed = await confirm({
      title: "Launch Tile Marketplace?",
      description: `This will publish ${approvedListingCount} approved listing${approvedListingCount === 1 ? "" : "s"} and ${approvedArtisanCount} approved artisan profile${approvedArtisanCount === 1 ? "" : "s"} (${approvedCount} pieces of approved content). This action cannot be undone automatically.`,
      confirmLabel: "Launch marketplace",
    });
    if (!confirmed) return;

    setLaunching(true);
    const { error } = await rpcUntyped("admin_set_launch_mode", { _launch_mode: "launched" });
    setLaunching(false);

    if (error) return showError(error, "We couldn't launch the marketplace. Please try again.");

    toast.success("Tile Marketplace has been launched!");
    onLaunchChanged();
  };

  const toggles: Array<[keyof typeof s, string, string]> = [
    ["maintenance_mode", "Maintenance mode", "Freeze all public user actions site-wide"],
    ["disable_registration", "Disable new signups", "Block new account creation"],
    ["disable_posting", "Disable new listings", "Block ad posting temporarily"],
    ["disable_payments", "Disable payments", "Block subscription and boost payments"],
    ["disable_withdrawals", "Freeze withdrawals", "Halt seller payouts pending review"],
    ["disable_messaging", "Disable messaging", "Freeze buyer-seller chat system"],
  ];

  const launched = initial?.launch_mode === "launched";

  return (
    <div className="space-y-6 max-w-3xl">
      <Card className="p-6 border-primary/30 bg-primary/5 backdrop-blur-sm shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-lg">Marketplace Launch Control</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Approved marketplace content remains private until launch.
            </p>
          </div>

          <Badge className={launched ? "bg-emerald-600 text-white font-mono text-[10px]" : "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 font-mono text-[10px]"}>
            {launched ? "LIVE MARKETPLACE" : "PRE-LAUNCH MODE"}
          </Badge>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-card/60 p-4 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Approved Listings</p>
            <p className="mt-1 text-2xl font-black">{prelaunchListingLoading ? "…" : prelaunchListingCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Waiting for Marketplace Launch.</p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/60 p-4 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Approved Artisan Profiles</p>
            <p className="mt-1 text-2xl font-black">{prelaunchArtisanLoading ? "…" : prelaunchArtisanCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Waiting for Marketplace Launch.</p>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/60 p-4 shadow-sm">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Visibility State</p>
            <p className="mt-1 text-base font-bold flex items-center gap-2">
              {launched ? <><Eye className="h-4 w-4 text-emerald-500" /> Public Marketplace</> : <><LockKeyhole className="h-4 w-4 text-amber-500" /> Hidden Until Launch</>}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Enforced at the database RPC layer.</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {prelaunchListingLoading || prelaunchArtisanLoading
            ? "Loading approved content totals…"
            : `${prelaunchListingCount + prelaunchArtisanCount} total approved items are waiting for launch.`}
        </p>

        <div className="mt-5">
          {launched ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2">
              <BadgeCheck className="h-5 w-5" /> Marketplace is live for the public.
            </div>
          ) : (
            <Button onClick={launchMarketplace} disabled={launching} className="w-full h-11 bg-primary font-bold">
              {launching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Rocket className="h-4 w-4 mr-2" />}
              {launching ? "Launching Marketplace…" : "Launch Marketplace Now"}
            </Button>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="h-3.5 w-3.5" />
          Launch state syncs real-time with production databases.
        </div>
      </Card>

      <Card className="p-6 border-destructive/30 bg-card/60 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/40">
          <Settings2 className="h-5 w-5 text-destructive" />
          <h3 className="font-bold text-lg">Emergency Controls & Overrides</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Changes take effect immediately across all client sessions.</p>
        <div className="space-y-3">
          {toggles.map(([key, label, desc]) => (
            <div key={key} className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-background/50 p-3.5">
              <div><p className="font-bold text-sm">{label}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
              <Switch checked={s[key] as boolean} onCheckedChange={(v) => setS((prev) => ({ ...prev, [key]: v }))} />
            </div>
          ))}
          <div className="rounded-xl border border-border/60 bg-background/50 p-3.5">
            <Label className="text-xs font-bold uppercase tracking-wider">Emergency Announcement Banner</Label>
            <Textarea value={s.emergency_banner} onChange={(e) => setS((prev) => ({ ...prev, emergency_banner: e.target.value }))} rows={2} placeholder="e.g. Scheduled maintenance in progress until 4:00 AM WAT" className="mt-1.5" />
          </div>
          <Button onClick={save} variant="destructive" className="w-full h-10 font-bold mt-2">
            <ShieldAlert className="h-4 w-4 mr-2" />Save & Apply Emergency Controls
          </Button>
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
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-6">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><UserSearch className="h-5 w-5 text-primary" /> User Inspector</SheetTitle>
          <SheetDescription className="text-xs">Comprehensive profile and operational telemetry</SheetDescription>
        </SheetHeader>
        {isLoading && <div className="py-20 text-center text-muted-foreground text-sm">Fetching user records…</div>}
        {data && (
          <div className="mt-6 space-y-5">
            <div className="flex items-center gap-4 p-4 rounded-xl border border-border/60 bg-muted/20">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/60 grid place-items-center text-primary-foreground text-xl font-black shadow-inner shrink-0">
                {(data.full_name ?? "?").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-base truncate">{data.full_name ?? "Anonymous User"}</p>
                <p className="text-xs text-muted-foreground truncate">{data.email ?? "—"}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <Badge className="capitalize text-[10px]">{data.subscription_tier}</Badge>
                  {data.is_verified && <Badge className="bg-emerald-600 text-white gap-1 text-[10px]"><BadgeCheck className="h-3 w-3" />Verified</Badge>}
                </div>
              </div>
            </div>

            <Card className="p-4 border-border/60 bg-card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Account Trust Score</p>
                <p className="text-lg font-black">{data.trust_score}/100</p>
              </div>
              <Progress value={data.trust_score} className="h-2" />
            </Card>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <InspectStat label="Listings (Active/Total)" value={`${data.active_listings}/${data.listings_count}`} />
              <InspectStat label="Chats Count" value={data.chats_count} />
              <InspectStat label="Reports Against" value={data.reports_against} danger={data.reports_against > 0} />
              <InspectStat label="Wallet Balance" value={formatNaira(data.wallet_balance)} />
              <InspectStat label="Wallet Transactions" value={data.wallet_txns} />
              <InspectStat label="KYC Status" value={data.kyc_status} />
              <InspectStat label="Phone Number" value={data.phone ?? "—"} />
              <InspectStat label="State" value={data.state ?? "—"} />
              <InspectStat label="Shop Slug" value={data.shop_slug ?? "—"} />
              <InspectStat label="Artisan Status" value={data.is_artisan ? "Yes" : "No"} />
              <InspectStat label="Account Created" value={timeAgo(data.created_at)} />
              <InspectStat label="Sub Expires" value={data.subscription_until ? new Date(data.subscription_until).toLocaleDateString() : "—"} />
            </div>

            <div className="pt-4 border-t space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Admin Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" asChild className="h-9"><a href={`mailto:${data.email}`}><LifeBuoy className="h-3.5 w-3.5 mr-1.5" />Send Email</a></Button>
                {data.shop_slug && <Button size="sm" variant="outline" asChild className="h-9"><a href={`/shop/${data.shop_slug}`} target="_blank" rel="noreferrer">Open Shop</a></Button>}
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
    <div className={`rounded-xl border p-3 ${danger ? "border-rose-500/40 bg-rose-500/5 text-rose-500" : "border-border/60 bg-card/60"}`}>
      <p className="text-[9px] uppercase font-bold text-muted-foreground">{label}</p>
      <p className={`text-xs font-bold mt-1 truncate ${danger ? "text-rose-500" : ""}`}>{value}</p>
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
    if (error) return showError(error, "We couldn't update this user's role. Please try again.");
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
            className="h-8 text-xs font-medium"
          >
            {has ? `Remove ${r}` : `Make ${r}`}
          </Button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      <Card className="p-5 border-border/50 bg-card/60 backdrop-blur-sm shadow-sm space-y-4">
        <div>
          <p className="font-bold text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" />Grant Platform Access Roles</p>
          <p className="text-xs text-muted-foreground mt-0.5">Search any user account to grant admin, moderator, or support privileges.</p>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => { e.preventDefault(); setTerm(q); }}
        >
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search user by name or email…" className="h-10 border-border/60 bg-background/50" />
          <Button type="submit" className="h-10 font-semibold px-4"><Search className="h-4 w-4 mr-1.5" />Search</Button>
        </form>
        {term.trim().length >= 2 && (
          <div className="rounded-xl border border-border/60 divide-y divide-border/40 overflow-hidden bg-background/40">
            {isFetching && <p className="p-4 text-xs text-muted-foreground">Searching user directory…</p>}
            {!isFetching && results.length === 0 && <p className="p-4 text-xs text-muted-foreground">No users match “{term}”.</p>}
            {results.map((r) => (
              <div key={r.user_id} className="p-3.5 flex items-center justify-between gap-3 flex-wrap hover:bg-muted/30 transition-colors">
                <div>
                  <p className="font-bold text-sm">{r.full_name ?? "Unnamed user"}</p>
                  <p className="text-xs text-muted-foreground">{r.email ?? "—"}</p>
                </div>
                <RoleButtons row={r} />
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-0 overflow-hidden border-border/50 shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow><TableHead>Staff Name</TableHead><TableHead>Email</TableHead><TableHead>Assigned Roles</TableHead><TableHead className="text-right">Access Controls</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {staff.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-12">No elevated staff accounts found</TableCell></TableRow>}
            {staff.map((s) => (
              <TableRow key={s.user_id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-bold text-sm">{s.full_name ?? "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{s.email ?? "—"}</TableCell>
                <TableCell className="space-x-1">
                  {(s.roles ?? []).map((r) => <Badge key={r} className="capitalize text-[10px] font-semibold">{r}</Badge>)}
                </TableCell>
                <TableCell className="text-right"><RoleButtons row={s} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
