import { BankTransferPanel, useMyPaymentRequests, isOpenRequest } from "@/components/billing/bank-transfer-checkout";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { formatNaira, LOCATIONS } from "@/lib/categories";
import {
  Heart,
  Package,
  Wallet,
  Plus,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Store,
  Share2,
  Crown,
  AlertTriangle,
  RefreshCw,
  Pencil,
  Trash2,
  Eye,
  MousePointerClick,
  Copy as CopyIcon,
  Download,
  Briefcase,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { uploadKyc } from "@/lib/storage";
import { TierBadge } from "@/components/tier-badge";
import { QRCodeSVG } from "qrcode.react";
import { useConfirmAction } from "@/components/confirm-action-provider";
import { showError } from "@/lib/user-feedback";
import { rpcUntyped } from "@/lib/waitlist-rpc";
import {
  useTileEntitlements,
  isTopAdsEntitled,
  hasVendorAnalytics,
  hasAdvancedVendorAnalytics,
  hasProOrVipEntitlement,
  hasVipEntitlement,
  type TileEntitlements,
} from "@/hooks/use-tile-entitlements";
import { TopAdUsageCard } from "@/components/top-ad-usage-card";
import { VendorAnalyticsCard } from "@/components/vendor-analytics";
import { CustomerInquiryDashboard } from "@/components/customer-inquiry-dashboard";
import { SocialSharingTools } from "@/components/social-sharing-tools";
import { SupportCenter } from "@/components/support-center";
import {
  VipAiAssistantSection,
  VipAnalyticsSection,
  VipIntegrationsSection,
  VipStaffSection,
} from "@/components/vip-merchant-tools";
import { useMerchantStaffContext } from "@/hooks/use-merchant-staff-context";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — Tile" }],
    links: [
      {
        rel: "icon",
        href: "https://res.cloudinary.com/dbozz4sgv/image/upload/v1781367385/tile-logo_vv2c8v.jpg",
      },
    ],
  }),
  component: Dashboard,
});

const DASHBOARD_CARD_CLASS =
  "border-[#1b3b2a] bg-gradient-to-br from-[#10241a] to-[#0b1a13] text-slate-100 shadow-[0_18px_48px_rgba(0,0,0,0.16)] transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-emerald-300/20";

function Dashboard() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [activeDashboardTab, setActiveDashboardTab] = useState("buyer");
  const {
    data: entitlements,
    isLoading: entitlementsLoading,
    isError: entitlementsError,
    refetch: refetchEntitlements,
  } = useTileEntitlements();
  const staffContextQuery = useMerchantStaffContext(user?.id);
  const staffContext = staffContextQuery.data;
  const isMerchantStaff = staffContext?.is_staff === true && !!staffContext.owner_id;
  const workspaceOwnerId = isMerchantStaff ? staffContext.owner_id! : user?.id;
  const merchantWorkspace = profile?.is_merchant === true || isMerchantStaff;
  const isVip = hasVipEntitlement(entitlements);

  const { data: ownerWorkspaceProfile } = useQuery({
    queryKey: ["merchant-workspace-profile", workspaceOwnerId],
    enabled: !!workspaceOwnerId && isMerchantStaff,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("business_name, shop_slug, is_merchant")
        .eq("id", workspaceOwnerId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const workspaceShopSlug = isMerchantStaff ? ownerWorkspaceProfile?.shop_slug : profile?.shop_slug;

  const { data: myListings = [] } = useQuery({
    queryKey: ["my-listings", workspaceOwnerId],
    enabled: !!workspaceOwnerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("user_id", workspaceOwnerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: artisanProfile } = useQuery({
    queryKey: ["artisan-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
        id,
        full_name,
        profession,
        is_artisan,
        is_verified,
        subscription_tier,
        avg_rating,
        review_count,
        years_experience,
        starting_price,
        profile_photo
      `,
        )
        .eq("id", user!.id)
        .maybeSingle();

      if (error) throw error;

      return data;
    },
  });

  const isArtisan = artisanProfile?.is_artisan === true;

  const { data: favorites = [] } = useQuery({
    queryKey: ["favs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("favorites")
        .select("listing_id, listings(*)")
        .eq("user_id", user!.id);
      return (data ?? []).map((f) => f.listings).filter(Boolean) as {
        id: string;
        title: string;
        price: number | null;
        location: string;
        type: string;
      }[];
    },
  });

  const { data: chats = [] } = useQuery({
    queryKey: ["chats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("chats")
        .select("id, listing_id, listings(title)")
        .or(`buyer_id.eq.${user!.id},seller_id.eq.${workspaceOwnerId ?? user!.id}`)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const overview = [
    {
      label: "Saved listings",
      value: favorites.length,
      detail: "Kept close for later",
      icon: Heart,
    },
    {
      label: "Your listings",
      value: myListings.length,
      detail: "Products and services",
      icon: Package,
    },
    {
      label: "Conversations",
      value: chats.length,
      detail: "Buyer and seller chats",
      icon: MessageSquare,
    },
  ];

  const merchantNavigation = [
    { label: "Overview", href: "#merchant-overview" },
    { label: "Listings", href: "#listings" },
    { label: "Promotions", href: "#top-ads" },
    { label: "Analytics", href: "#vip-analytics" },
    { label: "Customer Inquiries", href: "#customer-inquiries" },
    ...(entitlements?.multiple_staff_accounts === true ? [{ label: "Staff", href: "#staff" }] : []),
    ...(entitlements?.google_business_integration === true ||
    entitlements?.automated_social_posting === true
      ? [{ label: "Integrations", href: "#integrations" }]
      : []),
    ...(entitlements?.ai_sales_assistant === true
      ? [{ label: "AI Sales Assistant", href: "#ai-sales-assistant" }]
      : []),
    ...(!isMerchantStaff ? [{ label: "Billing", href: "#billing" }] : []),
  ];

  if (!loading && !user) {
    nav({ to: "/auth" });
    return null;
  }
  if (loading || !profile)
    return (
      <div className="min-h-screen bg-[#06120d] text-slate-100">
        <SiteHeader />
        <div className="container mx-auto flex min-h-[40vh] items-center justify-center px-4 text-sm text-slate-400">
          Preparing your Tile dashboard…
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#06120d] text-slate-100">
      <SiteHeader />
      <main className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-32 -top-36 h-[28rem] w-[28rem] rounded-full bg-emerald-400/[0.08] blur-[110px]" />
          <div className="absolute -bottom-48 -left-32 h-[34rem] w-[34rem] rounded-full bg-emerald-700/[0.12] blur-[130px]" />
        </div>
        <div className="container relative z-10 mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:py-12">
          <section className="relative isolate overflow-hidden rounded-[28px] border border-[#22543a] bg-[linear-gradient(135deg,#102c20_0%,#0a1c14_58%,#0a2118_100%)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.2)] sm:p-7">
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-emerald-300/10 bg-emerald-300/[0.035]" />
            <div aria-hidden="true" className="pointer-events-none absolute right-12 top-14 h-44 w-44 rounded-full bg-emerald-400/10 blur-[75px]" />
            <div className="relative">
              <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80] shadow-[0_0_10px_#4ade80]" />
                    {isArtisan
                      ? "Artisan workspace"
                      : merchantWorkspace
                        ? `${isVip ? "VIP " : ""}Seller workspace`
                        : "Your Tile dashboard"}
                  </div>
                  <h1 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
                    Welcome back, <span className="text-[#55e995]">{profile.full_name?.trim().split(/\s+/)[0] || "there"}</span>
                  </h1>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
                    Your marketplace activity, conversations and business tools, all in one place.
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-xs font-medium text-slate-200">
                      <ShieldCheck className="h-4 w-4 text-emerald-300" />
                      Account overview
                    </span>
                    <TierBadge tier={profile.subscription_tier} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 lg:pt-6">
                  <Button asChild className="h-11 rounded-xl bg-[#35d879] px-5 font-bold text-[#04120a] shadow-[0_8px_28px_rgba(53,216,121,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#52e98f]">
                    <Link to="/post-ad">
                      <Plus className="mr-2 h-4 w-4 stroke-[2.5]" />
                      Post an ad
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-11 rounded-xl border-white/15 bg-white/[0.035] px-5 text-slate-100 hover:border-emerald-300/30 hover:bg-white/[0.08] hover:text-white">
                    <Link to="/">
                      Explore marketplace
                      <ArrowRight className="ml-2 h-4 w-4 text-emerald-300" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {overview.map(({ label, value, detail, icon: Icon }) => (
                  <div key={label} className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#06150e]/65 p-4 backdrop-blur-sm transition-colors hover:border-emerald-300/20 hover:bg-white/[0.02]">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-300/15 bg-emerald-300/[0.08] text-emerald-300">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-2xl font-bold tracking-tight text-white">{value}</p>
                      <p className="truncate text-sm font-semibold text-slate-200">{label}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="mt-8 sm:mt-10">
            <Tabs value={activeDashboardTab} onValueChange={setActiveDashboardTab} className="w-full">
              <TabsList className="flex h-auto w-full max-w-full items-center justify-start gap-1 overflow-x-auto rounded-2xl border border-[#1b3b2a] bg-[#09170f]/90 p-1.5 shadow-lg shadow-black/10">
                <TabsTrigger value="buyer" className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-400 transition-all hover:bg-white/[0.05] hover:text-white data-[state=active]:bg-[#35d879] data-[state=active]:text-[#04120a]">
                  Buyer Hub
                </TabsTrigger>
                <TabsTrigger value="merchant" className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-400 transition-all hover:bg-white/[0.05] hover:text-white data-[state=active]:bg-[#35d879] data-[state=active]:text-[#04120a]">
                  Merchant Hub
                </TabsTrigger>
                {profile.is_artisan && (
                  <TabsTrigger value="artisan" className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-400 transition-all hover:bg-white/[0.05] hover:text-white data-[state=active]:bg-[#35d879] data-[state=active]:text-[#04120a]">
                    Artisan Hub
                  </TabsTrigger>
                )}
                <TabsTrigger value="support" className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-400 transition-all hover:bg-white/[0.05] hover:text-white data-[state=active]:bg-[#35d879] data-[state=active]:text-[#04120a]">
                  Support
                </TabsTrigger>
              </TabsList>

              <TabsContent value="buyer" className="mt-5 space-y-5 sm:mt-6">
                <Card className={`p-5 sm:p-6 ${DASHBOARD_CARD_CLASS}`}>
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-400/10 text-rose-300">
                        <Heart className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="font-semibold text-white">Saved for later</h3>
                        <p className="mt-0.5 text-xs text-slate-400">Your favorite finds in one place</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-300">
                      {favorites.length} saved
                    </span>
                  </div>
                  {favorites.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-white/10 bg-black/10 px-4 py-5 text-sm text-slate-400">
                      Tap the heart on any listing to keep it here.
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {favorites.map((f) => (
                        <Link key={f.id} to="/listing/$id" params={{ id: f.id }} className="group rounded-2xl border border-white/[0.08] bg-[#07170f]/70 p-4 transition-all hover:-translate-y-0.5 hover:border-emerald-300/30 hover:bg-[#0b2117]">
                          <div className="flex items-start justify-between gap-3">
                            <p className="line-clamp-2 font-semibold leading-5 text-slate-100 transition-colors group-hover:text-emerald-200">{f.title}</p>
                            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 transition-all group-hover:translate-x-0.5 group-hover:text-emerald-300" />
                          </div>
                          <p className="mt-3 text-sm font-bold text-emerald-300">{formatNaira(f.price)}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="merchant" className="mt-5 space-y-5 sm:mt-6">
                <Card className={`p-5 sm:p-6 ${DASHBOARD_CARD_CLASS}`}>
                  <h3 className="font-semibold text-white">Merchant workspace</h3>
                  <p className="mt-2 text-sm text-slate-400">Your listings, wallet, promotions, and analytics.</p>
                </Card>
              </TabsContent>

              {profile.is_artisan && (
                <TabsContent value="artisan" className="mt-5 space-y-5 sm:mt-6">
                  <Card className={`p-5 sm:p-6 ${DASHBOARD_CARD_CLASS}`}>
                    <h3 className="font-semibold text-white">Artisan workspace</h3>
                    <p className="mt-2 text-sm text-slate-400">Manage your artisan profile and portfolio.</p>
                  </Card>
                </TabsContent>
              )}

              <TabsContent value="support" className="mt-5 space-y-5 sm:mt-6">
                <Card className={`p-5 sm:p-6 ${DASHBOARD_CARD_CLASS}`}>
                  <h3 className="font-semibold text-white">Support</h3>
                  <p className="mt-2 text-sm text-slate-400">Need help? Use the support center and check your account status.</p>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
