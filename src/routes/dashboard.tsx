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
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { uploadKyc } from "@/lib/storage";
import { TierBadge } from "@/components/tier-badge";
import { QRCodeSVG } from "qrcode.react";

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
  "border-[#1b3b2a] bg-gradient-to-br from-[#10241a] to-[#0b1a13] text-slate-100 shadow-[0_18px_48px_rgba(0,0,0,0.16)] transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-[#2c6944] hover:shadow-[0_22px_56px_rgba(0,0,0,0.24)]";

function Dashboard() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: myListings = [] } = useQuery({
    queryKey: ["my-listings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("listings").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: artisanProfile } = useQuery({
    queryKey: ["artisan-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
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
      `)
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
      const { data } = await supabase.from("favorites").select("listing_id, listings(*)").eq("user_id", user!.id);
      return (data ?? []).map((f) => f.listings).filter(Boolean) as { id: string; title: string; price: number | null; location: string; type: string }[];
    },
  });

  const { data: chats = [] } = useQuery({
    queryKey: ["chats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("chats").select("id, listing_id, listings(title)").or(`buyer_id.eq.${user!.id},seller_id.eq.${user!.id}`).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const overview = [
    { label: "Saved listings", value: favorites.length, detail: "Kept close for later", icon: Heart },
    { label: "Your listings", value: myListings.length, detail: "Products and services", icon: Package },
    { label: "Conversations", value: chats.length, detail: "Buyer and seller chats", icon: MessageSquare },
  ];

  if (!loading && !user) { nav({ to: "/auth" }); return null; }
  if (loading || !profile) return <div className="min-h-screen bg-[#06120d] text-slate-100"><SiteHeader /><div className="container mx-auto flex min-h-[40vh] items-center justify-center px-4 text-sm text-slate-400">Preparing your Tile dashboard…</div></div>;

  return (
    <div className="min-h-screen bg-[#06120d] text-slate-100">
      <SiteHeader />
      <main className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-32 -top-36 h-[28rem] w-[28rem] rounded-full bg-emerald-400/[0.08] blur-[110px]" />
          <div className="absolute -bottom-48 -left-32 h-[34rem] w-[34rem] rounded-full bg-emerald-700/[0.12] blur-[130px]" />
        </div>
        <div className="container relative z-10 mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:py-12">
          <section className="relative isolate overflow-hidden rounded-[28px] border border-[#22543a] bg-[linear-gradient(135deg,#102c20_0%,#0a1c14_58%,#0a2118_100%)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.3)] animate-in fade-in slide-in-from-bottom-3 duration-700 motion-reduce:animate-none sm:rounded-[34px] sm:p-8 lg:p-10">
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-emerald-300/10 bg-emerald-300/[0.035]" />
            <div aria-hidden="true" className="pointer-events-none absolute right-12 top-14 h-44 w-44 rounded-full bg-emerald-400/10 blur-[75px]" />
            <div className="relative">
              <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80] shadow-[0_0_10px_#4ade80]" />
                    {isArtisan ? "Artisan workspace" : profile.is_merchant ? "Seller workspace" : "Your Tile dashboard"}
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
                    <Link to="/post-ad"><Plus className="mr-2 h-4 w-4 stroke-[2.5]" />Post an ad</Link>
                  </Button>
                  <Button asChild variant="outline" className="h-11 rounded-xl border-white/15 bg-white/[0.035] px-5 text-slate-100 hover:border-emerald-300/30 hover:bg-white/[0.08] hover:text-white">
                    <Link to="/">Explore marketplace<ArrowRight className="ml-2 h-4 w-4 text-emerald-300" /></Link>
                  </Button>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {overview.map(({ label, value, detail, icon: Icon }) => (
                  <div key={label} className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#06150e]/65 p-4 backdrop-blur-sm transition-colors hover:border-emerald-300/20 hover:bg-[#071a11]/85 sm:p-5">
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
            <Tabs defaultValue="buyer" className="w-full">
          <TabsList className="flex h-auto w-full max-w-full items-center justify-start gap-1 overflow-x-auto rounded-2xl border border-[#1b3b2a] bg-[#09170f]/90 p-1.5 shadow-lg shadow-black/20 sm:w-fit [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsTrigger
              value="buyer"
              className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-400 transition-all hover:bg-white/[0.05] hover:text-white data-[state=active]:bg-[#35d879] data-[state=active]:text-[#04120a] data-[state=active]:shadow-[0_4px_16px_rgba(53,216,121,0.18)] sm:px-6"
            >
              Buyer Hub
            </TabsTrigger>

            <TabsTrigger
              value="merchant"
              className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-400 transition-all hover:bg-white/[0.05] hover:text-white data-[state=active]:bg-[#35d879] data-[state=active]:text-[#04120a] data-[state=active]:shadow-[0_4px_16px_rgba(53,216,121,0.18)] sm:px-6"
            >
              Merchant Hub
            </TabsTrigger>

            {profile.is_artisan && (
              <TabsTrigger
                value="artisan"
                className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-400 transition-all hover:bg-white/[0.05] hover:text-white data-[state=active]:bg-[#35d879] data-[state=active]:text-[#04120a] data-[state=active]:shadow-[0_4px_16px_rgba(53,216,121,0.18)] sm:px-6"
              >
                Artisan Hub
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="buyer" className="mt-5 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none sm:mt-6">
            <Card className={`p-5 sm:p-6 ${DASHBOARD_CARD_CLASS}`}>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-400/10 text-rose-300"><Heart className="h-5 w-5" /></span>
                  <div><h3 className="font-semibold text-white">Saved for later</h3><p className="mt-0.5 text-xs text-slate-400">Your favorite finds in one place</p></div>
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-300">{favorites.length} saved</span>
              </div>
              {favorites.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 bg-black/10 px-4 py-5 text-sm text-slate-400">Tap the heart on any listing to keep it here.</p> : (
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
            <Card className={`p-5 sm:p-6 ${DASHBOARD_CARD_CLASS}`}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300"><MessageSquare className="h-5 w-5" /></span>
                  <div><h3 className="font-semibold text-white">Recent conversations</h3><p className="mt-0.5 text-xs text-slate-400">Pick up where you left off</p></div>
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-300">{chats.length} chats</span>
              </div>
              {chats.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 bg-black/10 px-4 py-5 text-sm text-slate-400">When you start a conversation, it will appear here.</p> : (
                <ul className="divide-y divide-white/[0.07]">
                  {chats.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                      <span className="min-w-0 truncate text-sm font-medium text-slate-200">{(c.listings as { title: string } | null)?.title ?? "Chat"}</span>
                      <Link to="/listing/$id" params={{ id: c.listing_id }} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-300 transition-colors hover:text-emerald-200">Open<ArrowRight className="h-3.5 w-3.5" /></Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="merchant" className="mt-5 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none sm:mt-6">
            <div className="mb-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">Merchant workspace</p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">Run your business on Tile</h2>
                <p className="mt-1 text-sm text-slate-400">Your storefront, listings, wallet and growth tools.</p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-300">
                <span className={`h-1.5 w-1.5 rounded-full ${profile.is_merchant ? "bg-emerald-300" : "bg-slate-500"}`} />
                {profile.is_merchant ? "Merchant account active" : "Shop setup available"}
              </span>
            </div>
            {!profile.is_merchant && <MerchantOnboarding onDone={refreshProfile} />}
            {profile.is_merchant && profile.shop_slug && <ShopLinkCard slug={profile.shop_slug} />}
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className={`p-5 sm:p-6 lg:col-span-2 ${DASHBOARD_CARD_CLASS}`}>
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-300"><Package className="h-5 w-5" /></span>
                    <div><h3 className="font-semibold text-white">Your listings</h3><p className="mt-0.5 text-xs text-slate-400">Manage and track your posts</p></div>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-300">{myListings.length} total</span>
                </div>
                {myListings.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 bg-black/10 px-4 py-5 text-sm text-slate-400">You haven’t posted anything yet. Create a listing to get discovered.</p> : (
                  <ul className="divide-y divide-white/[0.07]">
                    {myListings.map((l) => (
                      <ListingRow key={l.id} l={l} onChange={() => qc.invalidateQueries({ queryKey: ["my-listings", user?.id] })} />
                    ))}
                  </ul>
                )}
              </Card>
              <WalletCard balance={profile.wallet_balance} onTopup={() => { refreshProfile(); qc.invalidateQueries(); }} />
            </div>

            <BillingCard tier={profile.subscription_tier ?? "free"} until={profile.subscription_until} onChange={refreshProfile} />

            {profile.is_artisan && (
              <ArtisanProfileCard
                profile={profile}
                onChange={refreshProfile}
              />
            )}

            <KycCard status={profile.kyc_status} onUpload={refreshProfile} />

          </TabsContent>

          <TabsContent value="artisan" className="mt-5 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none sm:mt-6">

            <Card className={`overflow-hidden p-5 sm:p-7 ${DASHBOARD_CARD_CLASS}`}>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Professional profile</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    Your artisan workspace
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Manage your artisan profile and portfolio.
                  </p>
                </div>

                <Button asChild className="rounded-xl bg-[#35d879] font-semibold text-[#04120a] hover:bg-[#52e98f]">
                  <Link to="/artisans/$id" params={{ id: profile.id }}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Public Profile
                  </Link>
                </Button>
              </div>
            </Card>

            <Card className={`p-5 sm:p-7 ${DASHBOARD_CARD_CLASS}`}>
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">At a glance</p><h3 className="mt-1 font-semibold text-lg text-white">
                  Artisan Profile
                </h3></div>

                <Button asChild variant="outline" className="rounded-xl border-white/15 bg-white/[0.03] text-slate-100 hover:bg-white/[0.08] hover:text-white">
                  <Link to="/artisan/edit">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Link>
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">

                <div>
                  <p className="text-xs font-medium text-slate-400">
                    Profession
                  </p>

                  <p className="mt-1 font-semibold text-slate-100">
                    {profile.profession || "Not set"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-400">
                    Experience
                  </p>

                  <p className="mt-1 font-semibold text-slate-100">
                    {profile.years_experience ?? 0} Years
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-400">
                    Starting Price
                  </p>

                  <p className="mt-1 font-semibold text-slate-100">
                    {profile.starting_price
                      ? formatNaira(profile.starting_price)
                      : "Not set"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-400">
                    Rating
                  </p>

                  <p className="mt-1 font-semibold text-slate-100">
                    ⭐ {(profile.avg_rating ?? 0).toFixed(1)}
                  </p>
                </div>

              </div>
            </Card>

          </TabsContent>
          </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}

function WalletCard({ balance, onTopup }: { balance: number; onTopup: () => void }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("5000");
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<"transfer" | "opay" | "card">("transfer");
  const [confirming, setConfirming] = useState(false);
  const [expiry, setExpiry] = useState(30 * 60);
  useEffect(() => {
    if (!open) { setExpiry(30 * 60); return; }
    const t = setInterval(() => setExpiry((e) => Math.max(0, e - 1)), 1000);
    return () => clearInterval(t);
  }, [open]);
  const account = { bank: "Sterling Bank", number: "6982792154", name: "Tile Marketplace Ltd" };
  const mins = Math.floor(expiry / 60), secs = expiry % 60;

  const submit = async () => {
    setLoading(true); setConfirming(true);
    const { error } = await supabase.rpc("topup_wallet", { _amount: Number(amount), _reference: `paystack-mock-${Date.now()}` });
    setLoading(false); setConfirming(false);
    if (error) return toast.error(error.message);
    toast.success("Payment confirmed — wallet credited");
    setOpen(false); onTopup();
  };

  return (
    <Card className="relative isolate flex h-full flex-col overflow-hidden border-[#237747]/50 bg-[linear-gradient(145deg,#123624_0%,#0a2116_55%,#091810_100%)] p-5 text-white shadow-[0_18px_48px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#35d879]/60 sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 -z-10 h-40 w-40 rounded-full bg-emerald-400/15 blur-[55px]" />
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/15 bg-emerald-300/10 text-emerald-300"><Wallet className="h-5 w-5" /></span><div><h3 className="font-semibold">Tile wallet</h3><p className="mt-0.5 text-[11px] text-emerald-100/55">Marketplace balance</p></div></div>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-200">Ready</span>
      </div>
      <div className="mt-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100/55">Available balance</p>
        <p className="mt-2 break-all text-[clamp(1.75rem,3vw,2.25rem)] font-extrabold leading-none tracking-tight text-white">{formatNaira(balance)}</p>
      </div>
      <div className="mt-6 rounded-xl border border-white/[0.08] bg-black/[0.12] px-4 py-3">
        <p className="text-xs font-medium text-slate-200">A simpler way to keep your Tile activity moving.</p>
        <p className="mt-1 text-[11px] leading-5 text-slate-400">Use your balance for subscriptions and listing promotions.</p>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="mt-auto h-11 w-full rounded-xl bg-[#35d879] font-bold text-[#04120a] hover:bg-[#52e98f] sm:mt-6">Add funds<Plus className="ml-2 h-4 w-4" /></Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-[#234633] bg-[#0b1d14] p-0 text-slate-100 shadow-[0_28px_100px_rgba(0,0,0,0.65)]">
          <div className="grid sm:grid-cols-[190px_minmax(0,1fr)]">
            <div className="space-y-2 border-b border-white/[0.07] bg-[#07170f] p-4 sm:border-b-0 sm:border-r sm:p-5">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Choose a method</p>
              {([
                { id: "transfer", label: "Bank Transfer" },
                { id: "opay", label: "Opay" },
                { id: "card", label: "Card" },
              ] as const).map((m) => (
                <button key={m.id} onClick={() => setMethod(m.id)} className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors ${method === m.id ? "border-emerald-300/25 bg-emerald-300/[0.08] text-emerald-100" : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"}`}>
                  {m.label}
                </button>
              ))}
            </div>
            <div className="space-y-5 bg-[#0b1d14] p-5 text-slate-100 sm:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Add to your wallet</p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-white">{formatNaira(Number(amount))}</p>
                <Input type="number" min="100" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-3 border-white/10 bg-[#07170f] text-white placeholder:text-slate-500 focus-visible:ring-emerald-400" />
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">{[1000, 5000, 10000, 25000].map((v) => (
                  <Button key={v} size="sm" variant="outline" className="rounded-lg border-white/10 bg-white/[0.03] text-xs text-slate-200 hover:bg-white/[0.08] hover:text-white" onClick={() => setAmount(String(v))}>{formatNaira(v)}</Button>
                ))}</div>
              </div>
              {method === "transfer" && (
                <>
                  <p className="text-sm leading-6 text-slate-400">Transfer <b className="text-slate-100">{formatNaira(Number(amount))}</b> from your bank to <b className="text-slate-100">{account.name}</b>.</p>
                  <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-[#07170f] p-4">
                    <Row label="Bank Name" value={account.bank} />
                    <Row label="Account Number" value={account.number} copyable />
                    <Row label="Amount" value={`${formatNaira(Number(amount))}`} copyable />
                  </div>
                  <div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.06] p-3 text-xs leading-5 text-amber-100/85">
                    Ensure you send the amount indicated only once.<br />
                    This account will expire in <b>{mins} minutes {secs.toString().padStart(2, "0")} seconds</b>. Do not save for future use.
                  </div>
                  <Button onClick={submit} disabled={loading || expiry === 0} className="h-11 w-full rounded-xl bg-[#35d879] font-bold text-[#04120a] hover:bg-[#52e98f] disabled:bg-white/10 disabled:text-slate-500">
                    {confirming ? "Verifying transfer…" : "I've sent the transfer — confirm"}
                  </Button>
                </>
              )}
              {method === "opay" && (
                <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-[#07170f] p-5 text-center sm:p-8">
                  <p className="text-sm leading-6 text-slate-400">Continue with Opay, then return here to confirm your wallet top up.</p>
                  <Button onClick={submit} disabled={loading} className="h-11 w-full rounded-xl bg-[#35d879] font-bold text-[#04120a] hover:bg-[#52e98f]">Simulate Opay payment</Button>
                </div>
              )}
              {method === "card" && (
                <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-[#07170f] p-4">
                  <p className="text-sm font-semibold text-white">Pay by card</p>
                  <Input placeholder="Card number" className="border-white/10 bg-[#0b1d14] text-white placeholder:text-slate-500" />
                  <div className="grid grid-cols-2 gap-2"><Input placeholder="MM / YY" className="border-white/10 bg-[#0b1d14] text-white placeholder:text-slate-500" /><Input placeholder="CVV" className="border-white/10 bg-[#0b1d14] text-white placeholder:text-slate-500" /></div>
                  <Button onClick={submit} disabled={loading} className="h-11 w-full rounded-xl bg-[#35d879] font-bold text-[#04120a] hover:bg-[#52e98f]">Pay {formatNaira(Number(amount))}</Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function Row({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-1 font-semibold text-slate-100">{value}</p>
      </div>
      {copyable && (
        <Button size="sm" variant="outline" className="shrink-0 rounded-lg border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.08] hover:text-white" onClick={() => { navigator.clipboard.writeText(value.replace(/[^\d.]/g, "")); toast.success("Copied"); }}>
          <CopyIcon className="mr-1 h-3 w-3" />Copy
        </Button>
      )}
    </div>
  );
}

function KycCard({ status, onUpload }: { status: string; onUpload: () => void }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setBusy(true);
    try {
      const path = await uploadKyc(user.id, file);
      await supabase.from("profiles").update({ kyc_status: "pending", kyc_doc_url: path }).eq("id", user.id);
      toast.success("KYC submitted — awaiting review");
      onUpload();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Upload failed"); }
    setBusy(false);
  };

  return (
    <Card className={`p-5 sm:p-6 ${DASHBOARD_CARD_CLASS}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-300"><ShieldCheck className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-white">Identity verification</h3><Badge className="capitalize border border-white/10 bg-white/[0.06] text-slate-200 hover:bg-white/[0.06]">{status}</Badge></div>
          <p className="mt-1 text-sm text-slate-400">Keep your account trusted with a verified identity.</p>
        </div>
      </div>
      {status === "verified" ? (
        <p className="mt-4 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.06] px-4 py-3 text-sm font-medium text-emerald-200">Your identity is verified. Thanks for helping keep Tile safe.</p>
      ) : (
        <label className="mt-4 inline-flex">
          <input type="file" accept="image/*,.pdf" className="hidden" onChange={handle} disabled={busy} />
          <Button asChild variant="outline" className="rounded-xl border-white/15 bg-white/[0.03] text-slate-100 hover:bg-white/[0.08] hover:text-white"><span>{busy ? "Uploading…" : "Upload government ID"}</span></Button>
        </label>
      )}
    </Card>
  );
}

function MerchantOnboarding({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ business_name: "", state: "", bio: "", whatsapp: "", bank_name: "", bank_account: "", bank_account_name: "" });

  const submit = async () => {
    if (!user || !form.business_name) return toast.error("Business name required");
    setBusy(true);
    const { data: slug } = await supabase.rpc("gen_shop_slug", { _name: form.business_name });
    const { error } = await supabase.from("profiles").update({
      ...form, is_merchant: true, shop_slug: slug,
    }).eq("id", user.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Your shop is live");
    setOpen(false); onDone();
  };

  return (
    <Card className="border-emerald-300/20 bg-[linear-gradient(135deg,#10281c,#0b1b13)] p-5 shadow-[0_18px_48px_rgba(0,0,0,0.16)] sm:p-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-white"><Store className="h-5 w-5 text-emerald-300" /> Open your personal shop</h3>
          <p className="mt-1 text-sm text-slate-400">Create a shareable shop URL, showcase your listings and connect with buyers.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="w-full shrink-0 rounded-xl bg-[#35d879] font-bold text-[#04120a] hover:bg-[#52e98f] sm:w-auto">Become a merchant</Button></DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Merchant onboarding</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Business name *</Label><Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} /></div>
              <div><Label>State</Label>
                <Select value={form.state} onValueChange={(v) => setForm({ ...form, state: v })}>
                  <SelectTrigger><SelectValue placeholder="Pick a state" /></SelectTrigger>
                  <SelectContent>{LOCATIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Bio</Label><Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
              <div><Label>WhatsApp number</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+234…" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Bank name</Label><Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} /></div>
                <div><Label>Account #</Label><Input value={form.bank_account} onChange={(e) => setForm({ ...form, bank_account: e.target.value })} /></div>
              </div>
              <div><Label>Account name (Paystack verified — simulated)</Label><Input value={form.bank_account_name} onChange={(e) => setForm({ ...form, bank_account_name: e.target.value })} /></div>
            </div>
            <DialogFooter><Button disabled={busy} onClick={submit} className="bg-accent text-accent-foreground">{busy ? "Saving…" : "Open my shop"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}

function ShopLinkCard({ slug }: { slug: string }) {
  const [origin, setOrigin] = useState("");
  const qrRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const url = `${origin}/shop/${slug}`;

  const copy = async () => { await navigator.clipboard.writeText(url); toast.success("Link copied"); };
  const downloadQr = () => {
    if (!qrRef.current) return;

    const svg = new XMLSerializer().serializeToString(qrRef.current);
    const file = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const objectUrl = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `tile-shop-${slug}.svg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    toast.success("Shop QR code downloaded");
  };

  return (
    <Card className={`relative isolate overflow-hidden p-0 ${DASHBOARD_CARD_CLASS}`}>
      <div aria-hidden="true" className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full bg-emerald-400/[0.08] blur-[90px]" />
      <div className="relative grid lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="p-5 sm:p-7 lg:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.08] text-emerald-300"><Store className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-white">Your storefront</h3>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />Live</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">A shareable home for your business on Tile</p>
            </div>
          </div>

          <div className="mt-7 max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Your public shop link</p>
            <div className="mt-2 rounded-xl border border-white/[0.08] bg-[#07170f]/75 px-4 py-3">
              <code className="block break-all text-sm font-medium leading-6 text-emerald-200">{url}</code>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button onClick={copy} variant="outline" className="h-10 rounded-xl border-white/15 bg-white/[0.03] text-slate-100 hover:border-emerald-300/25 hover:bg-white/[0.07] hover:text-white"><CopyIcon className="mr-2 h-4 w-4" />Copy shop link</Button>
              <Button asChild className="h-10 rounded-xl bg-[#35d879] font-semibold text-[#04120a] hover:bg-[#52e98f]"><Link to="/shop/$slug" params={{ slug }}>Visit storefront<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </div>
          </div>
        </div>

        <aside className="border-t border-white/[0.07] bg-[#07170f]/55 p-5 sm:p-7 lg:border-l lg:border-t-0">
          <div className="mx-auto max-w-[240px]">
            <div className="flex items-center justify-between gap-2">
              <div><p className="text-sm font-semibold text-white">Shop QR code</p><p className="mt-0.5 text-[11px] text-slate-500">Scan to open your shop</p></div>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-emerald-300"><Share2 className="h-4 w-4" /></span>
            </div>
            <div className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.04] p-3 shadow-[0_16px_40px_rgba(0,0,0,0.22)]">
              <div className="flex items-center justify-center rounded-2xl bg-[#f8faf9] p-3">
                <QRCodeSVG ref={qrRef} value={url} size={168} level="H" marginSize={4} bgColor="#f8faf9" fgColor="#07170f" title={`QR code for Tile shop ${slug}`} />
              </div>
              <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Tile · {slug}</p>
            </div>
            <Button onClick={downloadQr} variant="outline" className="mt-3 h-10 w-full rounded-xl border-white/15 bg-transparent text-xs font-semibold text-slate-200 hover:border-emerald-300/25 hover:bg-white/[0.06] hover:text-white"><Download className="mr-2 h-4 w-4 text-emerald-300" />Download QR code</Button>
          </div>
        </aside>
      </div>
    </Card>
  );
}

const PLANS: { tier: "lite" | "pro" | "vip"; price: number; perks: string[] }[] = [
  {
    tier: "lite",
    price: 5000,
    perks: [
      "Verified Vendor Badge",
      "Custom Shop URL",
      "QR Code For Shop",
      "1 Promoted Listing Every 7 Days",
      "Basic Analytics",
      "Priority Support"
    ]
  },
  {
    tier: "pro",
    price: 15000,
    perks: [
      "Everything in Lite",
      "5 Promoted Listings Monthly",
      "Homepage Priority",
      "Featured Vendor Placement",
      "Product Performance Analytics",
      "Customer Inquiry Dashboard",
      "Social Sharing Tools"
    ]
  },
  {
    tier: "vip",
    price: 40000,
    perks: [
      "Everything in Pro",
      "Unlimited Listings",
      "Unlimited Promotions",
      "Homepage Featured Placement",
      "Multiple Staff Accounts",
      "Advanced Analytics",
      "Google Business Integration",
      "Automated Social Posting",
      "AI Sales Assistant"
    ]
  }
];

function BillingCard({ tier, until, onChange }: { tier: string; until?: string | null; onChange: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const activate = async (t: "lite" | "pro" | "vip") => {
    setBusy(t);
    const { error } = await supabase.rpc("activate_subscription", { _tier: t });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`${t.toUpperCase()} plan activated`);
    onChange();
  };
  return (
    <Card className={`p-5 sm:p-6 ${DASHBOARD_CARD_CLASS}`}>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-300/15 bg-amber-300/[0.08] text-amber-200"><Crown className="h-5 w-5" /></span>
          <div><h3 className="font-semibold text-white">Plans for your business</h3><p className="mt-1 text-xs text-slate-400">Choose the level of support that fits your next step</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-white/[0.08] bg-[#07170f]/75 px-4 py-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Current plan</span>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-2.5 py-1 text-xs font-bold capitalize text-emerald-200">{tier}</span>
          {until && tier !== "free" && <span className="text-xs text-slate-400">Renews {new Date(until).toLocaleDateString()}</span>}
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {PLANS.map((p) => (
          <div key={p.tier} className={`flex h-full flex-col rounded-2xl border p-4 transition-all duration-200 sm:p-5 ${tier === p.tier ? "border-emerald-300/40 bg-[linear-gradient(145deg,rgba(52,211,153,0.1),rgba(7,23,15,0.8))] shadow-[0_0_28px_rgba(52,211,153,0.08)]" : "border-white/[0.08] bg-[#07170f]/60 hover:border-white/15 hover:bg-[#0b2016]"}`}>
            <div className="flex min-h-6 items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">{p.tier}</p>
              {tier === p.tier ? <span className="rounded-full bg-emerald-300/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-200">Your plan</span> : p.tier === "pro" ? <span className="rounded-full bg-emerald-300/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-200">Popular</span> : null}
            </div>
            <p className="mt-3 text-2xl font-extrabold tracking-tight text-emerald-300">{formatNaira(p.price)}<span className="ml-1 text-xs font-medium text-slate-500">/ month</span></p>
            <div className="my-4 h-px bg-white/[0.07]" />
            <ul className="flex-1 space-y-2.5 text-xs leading-5 text-slate-400">{p.perks.map((x) => <li key={x} className="flex gap-2.5"><span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-300/10 text-[10px] text-emerald-300">✓</span><span>{x}</span></li>)}</ul>
            <Button size="sm" disabled={busy === p.tier || tier === p.tier} onClick={() => activate(p.tier)} className={`mt-5 h-10 w-full rounded-xl font-semibold ${tier === p.tier ? "border border-emerald-300/20 bg-emerald-300/[0.08] text-emerald-100 hover:bg-emerald-300/[0.08] disabled:opacity-100" : "bg-[#35d879] text-[#04120a] hover:bg-[#52e98f]"}`}>
              {tier === p.tier ? "Current plan" : busy === p.tier ? "Activating…" : `Choose ${p.tier}`}
            </Button>
          </div>
        ))}
      </div>
      <p className="mt-5 flex items-center gap-2 text-xs text-slate-500"><Wallet className="h-3.5 w-3.5 text-emerald-300/70" />Plan payments are deducted from your Tile wallet. Add funds before upgrading if needed.</p>
    </Card>
  );
}

function ListingRow({ l, onChange }: {
  l: {
    id: string;
    title: string;
    type: string;
    status: string;
    is_promoted?: boolean;
    expires_at?: string | null;
  };
  onChange: () => void;
}) {
  const expiresAt = l.expires_at ? new Date(l.expires_at) : null;
  const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / 86400000) : null;
  const [stats, setStats] = useState<{
    views: number;
    saves: number;
    chats: number;
    impressions: number;
    phone_clicks: number;
  } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<{ title: string; description: string; price: string }>({ title: l.title, description: "", price: "" });

  useEffect(() => {
    let cancel = false;

    supabase
      .rpc("owner_listing_stats_v2", {
        p_listing_id: l.id,
      })
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
          return;
        }

        if (!cancel && data?.length) {
          setStats(data[0]);
        }
      });

    return () => {
      cancel = true;
    };
  }, [l.id]);

  const renew = async () => {
    const wasExpired = (l as { status?: string }).status === "expired";
    const { error } = await supabase.rpc("renew_listing", { _listing_id: l.id });
    if (error) return toast.error(error.message);
    toast.success(wasExpired ? "Republished for 30 days (standard visibility)" : "Renewed for 30 days");
    onChange();
  };

  const remove = async () => {
    if (!confirm("Delete this ad permanently?")) return;
    const { error } = await supabase.from("listings").delete().eq("id", l.id);
    if (error) return toast.error(error.message);
    toast.success("Ad deleted");
    onChange();
  };

  const openEdit = async () => {
    const { data } = await supabase.from("listings").select("title,description,price").eq("id", l.id).maybeSingle();
    if (data) setEditForm({ title: data.title, description: data.description, price: data.price?.toString() ?? "" });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    const { error } = await supabase.from("listings").update({
      title: editForm.title,
      description: editForm.description,
      price: editForm.price ? Number(editForm.price) : null,
      status: "pending",
    }).eq("id", l.id);
    if (error) return toast.error(error.message);
    toast.success("Ad updated — pending re-review");
    setEditOpen(false); onChange();
  };

  const promote = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;

    if (!userId) {
      toast.error("User not authenticated");
      return;
    }

    const { error } = await (supabase.rpc as unknown as (fn: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }>)("promote_listing", {
      p_listing_id: l.id,
      p_user_id: userId,
    });

    if (error) {
      console.error(error);
      toast.error(error.message);
      return;
    }

    toast.success("Listing promoted successfully");
    onChange();
  };

  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link to="/listing/$id" params={{ id: l.id }} className="line-clamp-2 font-semibold text-slate-100 transition-colors hover:text-emerald-200">{l.title}</Link>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Badge variant={l.status === "approved" ? "default" : l.status === "rejected" ? "destructive" : "secondary"} className="capitalize">{l.status}</Badge>
          <Badge className="border border-emerald-300/15 bg-emerald-300/[0.08] text-emerald-100 capitalize">{l.type}</Badge>
          {l.status === "approved" && (
            <Button
              size="sm"
              variant={l.is_promoted ? "default" : "outline"}
              className="h-8 rounded-lg border-white/15 bg-white/[0.03] px-3 text-xs text-slate-100 hover:border-emerald-300/30 hover:bg-emerald-300/[0.08] hover:text-emerald-100"
              disabled={l.is_promoted}
              onClick={promote}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {l.is_promoted ? "Promoted" : "Promote"}
            </Button>
          )}
          <Button size="sm" variant="outline" aria-label={`Edit ${l.title}`} className="h-8 w-8 rounded-lg border-white/10 bg-white/[0.03] p-0 text-slate-300 hover:bg-white/[0.08] hover:text-white" onClick={openEdit}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button size="sm" variant="outline" aria-label={`Delete ${l.title}`} className="h-8 w-8 rounded-lg border-red-300/15 bg-red-300/[0.04] p-0 text-red-300 hover:bg-red-400/10 hover:text-red-200" onClick={remove}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
      {stats && (
  <details className="group mt-3 rounded-xl border border-white/[0.08] bg-[#07170f]/65 open:border-emerald-300/20">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3.5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
          Listing Performance
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {stats.views} unique view{stats.views === 1 ? "" : "s"} · {stats.chats} chat{stats.chats === 1 ? "" : "s"}
        </p>
      </div>

      <span className="text-xs text-slate-500 transition-transform group-open:rotate-180">
        ▼
      </span>
    </summary>

    <div className="border-t border-white/[0.07] p-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-white/[0.07] bg-[#0c2017] p-3">
          <div className="flex items-center gap-2 text-slate-500">
            <MousePointerClick className="h-4 w-4" />
            <span className="text-xs">Impressions</span>
          </div>
          <p className="mt-1 text-lg font-bold text-slate-100">
            {stats.impressions}
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-[#0c2017] p-3">
          <div className="flex items-center gap-2 text-slate-500">
            <Eye className="h-4 w-4" />
            <span className="text-xs">Views</span>
          </div>
          <p className="mt-1 text-lg font-bold text-slate-100">
            {stats.views}
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-[#0c2017] p-3">
          <div className="flex items-center gap-2 text-slate-500">
            <Heart className="h-4 w-4" />
            <span className="text-xs">Saves</span>
          </div>
          <p className="mt-1 text-lg font-bold text-slate-100">
            {stats.saves}
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-[#0c2017] p-3">
          <div className="flex items-center gap-2 text-slate-500">
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">Chats</span>
          </div>
          <p className="mt-1 text-lg font-bold text-slate-100">
            {stats.chats}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/[0.07] bg-[#0c2017] p-3">
          <p className="text-xs text-slate-500">
            View Rate
          </p>

          <p className="mt-1 text-lg font-bold">
            {stats.impressions > 0
              ? `${((stats.views / stats.impressions) * 100).toFixed(1)}%`
              : "0%"}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {stats.views} unique view{stats.views === 1 ? "" : "s"} from{" "}
            {stats.impressions} impression{stats.impressions === 1 ? "" : "s"}
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-[#0c2017] p-3">
          <p className="text-xs text-slate-500">
            Lead Engagement
          </p>

          <p className="mt-1 text-lg font-bold">
            {stats.views > 0
              ? `${(((stats.saves + stats.chats) / stats.views) * 100).toFixed(1)}%`
              : "0%"}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {stats.saves + stats.chats} actions from{" "}
            {stats.views} unique view{stats.views === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    </div>
  </details>
)}
      {daysLeft !== null && l.status === "approved" && daysLeft <= 3 && daysLeft > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-red-300/15 bg-red-400/[0.06] p-3 text-xs text-red-200">
          <AlertTriangle className="h-3 w-3" /> Expires in {daysLeft} day{daysLeft === 1 ? "" : "s"}.
          <Button size="sm" variant="outline" className="ml-auto h-8 rounded-lg border-red-200/20 bg-transparent text-red-100 hover:bg-red-400/10 hover:text-white" onClick={renew}><RefreshCw className="mr-1 h-3 w-3" />Renew 30 days</Button>
        </div>
      )}
      {l.status === "expired" && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs text-slate-300">
          <AlertTriangle className="h-3 w-3" /> Expired — hidden from buyers and deleted 30 days after expiry. Republished ads get standard (free) visibility.
          <Button size="sm" variant="outline" className="ml-auto h-8 rounded-lg border-white/15 bg-white/[0.03] text-slate-100 hover:bg-white/[0.08]" onClick={renew}><RefreshCw className="mr-1 h-3 w-3" />Republish</Button>
        </div>
      )}
      {daysLeft !== null && daysLeft > 3 && l.status === "approved" && (
        <p className="mt-2 text-xs text-slate-500">{daysLeft} days left</p>
      )}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit ad</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea rows={5} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></div>
            <div><Label>Price (₦)</Label><Input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} /></div>
            <p className="text-xs text-muted-foreground">Edits send the ad back to admin review.</p>
          </div>
          <DialogFooter><Button onClick={saveEdit} className="bg-accent text-accent-foreground">Save changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}
function ArtisanProfileCard({
  profile,
  onChange,
}: {
  profile: any;
  onChange: () => void;
}) {
  return (
    <Card className={`p-5 sm:p-6 ${DASHBOARD_CARD_CLASS}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-300"><Briefcase className="h-4 w-4" /></span>
            Artisan Profile
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            Manage your public artisan profile.
          </p>
        </div>

        <Button asChild variant="outline" className="rounded-xl border-white/15 bg-white/[0.03] text-slate-100 hover:bg-white/[0.08] hover:text-white">
          <Link to="/artisan/edit">
            <Pencil className="h-4 w-4 mr-2" />
            Edit Profile
          </Link>
        </Button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/[0.07] bg-[#07170f]/60 p-4">
          <p className="text-xs font-medium text-slate-400">Profession</p>
          <p className="mt-1 font-semibold text-slate-100">
            {profile.profession || "Not set"}
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-[#07170f]/60 p-4">
          <p className="text-xs font-medium text-slate-400">Experience</p>
          <p className="mt-1 font-semibold text-slate-100">
            {profile.years_experience ?? 0} years
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-[#07170f]/60 p-4">
          <p className="text-xs font-medium text-slate-400">Starting Price</p>
          <p className="mt-1 font-semibold text-slate-100">
            {profile.starting_price
              ? formatNaira(profile.starting_price)
              : "Not set"}
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-[#07170f]/60 p-4">
          <p className="text-xs font-medium text-slate-400">Rating</p>
          <p className="mt-1 font-semibold text-slate-100">
            ⭐ {profile.avg_rating ?? 0}
          </p>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <Button asChild variant="outline" className="rounded-xl border-white/15 bg-white/[0.03] text-slate-100 hover:bg-white/[0.08] hover:text-white">
          <Link to="/artisans/$id" params={{ id: profile.id }}>
            View Public Profile
          </Link>
        </Button>
      </div>
    </Card>
  );
}
