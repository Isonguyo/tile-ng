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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { formatNaira } from "@/lib/categories";
import {
  Users,
  Tag,
  Banknote,
  ShieldAlert,
  Check,
  X,
  Flag,
  BadgeCheck,
  AlertTriangle,
  Activity,
  Bell,
  Search,
  Megaphone,
  Settings2,
  Gauge,
  TrendingUp,
  FileWarning,
  Sparkles,
  UserSearch,
  LifeBuoy,
  ShieldCheck,
  Rocket,
  Eye,
  LockKeyhole,
  RefreshCw,
  Loader2,
  Wrench,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useConfirmAction } from "@/components/confirm-action-provider";
import { showError } from "@/lib/user-feedback";
import { getSignedUrls } from "@/lib/storage";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// Import the admin subscription payments panel and settings hook
import {
  SubscriptionPaymentsPanel,
  ManualPaymentSettingsCard,
  useAdminPaymentRequests,
} from "@/components/admin/subscription-payments-panel";

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

  const normalized = raw
    .toLowerCase()
    .replace(/[_\s-]+/g, " ")
    .trim();
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
  const { data: pendingPayments = [] } = useAdminPaymentRequests("pending_review");
  const { data: dash } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    enabled: isAdmin,
    refetchInterval: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_dashboard_stats");
      if (error) throw error;
      return (Array.isArray(data) ? data[0] : data) as null | {
        users_total: number;
        users_today: number;
        listings_total: number;
        listings_pending: number;
        listings_today: number;
        revenue_total: number;
        revenue_today: number;
        revenue_month: number;
        active_subscribers: number;
        vip: number;
        pro: number;
        lite: number;
        reports_open: number;
        kyc_pending: number;
        shops_total: number;
        artisans_total: number;
        chats_24h: number;
      };
    },
  });

  // ... rest of the original file unchanged (truncated for brevity)
