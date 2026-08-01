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
  KeyRound,
  Crown,
  AlertTriangle,
  RefreshCw,
  Pencil,
  Trash2,
  Eye,
  MousePointerClick,
  Copy as CopyIcon,
  Image,
  ExternalLink,
  Save,
  Hammer,
  Briefcase,
  MessageCircle,
  Star,
  ArrowRight,
} from "lucide-react";
import { useEffect, useState } from "react";
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

  if (!loading && !user) { nav({ to: "/auth" }); return null; }
  if (loading || !profile) return <div className="min-h-screen bg-background"><SiteHeader /><div className="container py-12">Loading…</div></div>;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-baseline justify-between mb-4">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Welcome, {profile.full_name}
            <TierBadge tier={profile.subscription_tier} />
          </h1>
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/post-ad"><Plus className="h-4 w-4 mr-1" />Post Ad</Link></Button>
        </div>

        <Tabs defaultValue="buyer">
          <TabsList className="bg-primary text-primary-foreground">
            <TabsTrigger
              value="buyer"
              className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            >
              Buyer Hub
            </TabsTrigger>

            <TabsTrigger
              value="merchant"
              className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            >
              Merchant Hub
            </TabsTrigger>

            {profile.is_artisan && (
              <TabsTrigger
                value="artisan"
                className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
              >
                Artisan Hub
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="buyer" className="space-y-6 mt-4">
            <Card className="p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-3"><Heart className="h-5 w-5 text-accent" /> Favorited items</h3>
              {favorites.length === 0 ? <p className="text-sm text-muted-foreground">Tap the heart on a listing to save it here.</p> : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {favorites.map((f) => (
                    <Link key={f.id} to="/listing/$id" params={{ id: f.id }} className="border rounded p-3 hover:border-accent">
                      <p className="font-medium">{f.title}</p>
                      <p className="text-accent font-bold">{formatNaira(f.price)}</p>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-3"><MessageSquare className="h-5 w-5 text-accent" /> Active chats</h3>
              {chats.length === 0 ? <p className="text-sm text-muted-foreground">No conversations yet.</p> : (
                <ul className="divide-y">
                  {chats.map((c) => (
                    <li key={c.id} className="py-2 flex justify-between">
                      <span>{(c.listings as { title: string } | null)?.title ?? "Chat"}</span>
                      <Link to="/listing/$id" params={{ id: c.listing_id }} className="text-accent">Open</Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="merchant" className="space-y-6 mt-4">
            {!profile.is_merchant && <MerchantOnboarding onDone={refreshProfile} />}
            {profile.is_merchant && profile.shop_slug && <ShopLinkCard slug={profile.shop_slug} />}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-5 col-span-2">
                <h3 className="font-semibold flex items-center gap-2 mb-3"><Package className="h-5 w-5 text-accent" /> Your listings</h3>
                {myListings.length === 0 ? <p className="text-muted-foreground text-sm">You haven't posted anything yet.</p> : (
                  <ul className="divide-y">
                    {myListings.map((l) => (
                      <ListingRow key={l.id} l={l} onChange={() => qc.invalidateQueries({ queryKey: ["my-listings", user?.id] })} />
                    ))}
                  </ul>
                )}
              </Card>
              <WalletCard balance={profile.wallet_balance} onTopup={() => { refreshProfile(); qc.invalidateQueries(); }} />
            </div>

            <BillingCard
              tier={profile.subscription_tier ?? "free"}
              until={profile.subscription_until}
              onChange={refreshProfile}
            />

            {profile.is_artisan && (
              <ArtisanProfileCard
                profile={profile}
                onChange={refreshProfile}
              />
            )}

            <KycCard status={profile.kyc_status} onUpload={refreshProfile} />

            <AdminCodeCard onRedeemed={refreshProfile} />
          </TabsContent>

          <TabsContent value="artisan" className="space-y-6 mt-4">

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    Artisan Dashboard
                  </h2>

                  <p className="text-muted-foreground">
                    Manage your artisan profile and portfolio.
                  </p>
                </div>

                <Button asChild>
                  <Link to={`/artisans/${profile.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Public Profile
                  </Link>
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">
                  Artisan Profile
                </h3>

                <Button asChild>
                  <Link to="/artisan/edit">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Link>
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">

                <div>
                  <p className="text-sm text-muted-foreground">
                    Profession
                  </p>

                  <p className="font-medium">
                    {profile.profession || "Not set"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Experience
                  </p>

                  <p className="font-medium">
                    {profile.years_experience ?? 0} Years
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Starting Price
                  </p>

                  <p className="font-medium">
                    {profile.starting_price
                      ? formatNaira(profile.starting_price)
                      : "Not set"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Rating
                  </p>

                  <p className="font-medium">
                    ⭐ {(profile.avg_rating ?? 0).toFixed(1)}
                  </p>
                </div>

              </div>
            </Card>

          </TabsContent>
        </Tabs>
      </div>
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
    <Card className="p-5 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
      <h3 className="font-semibold flex items-center gap-2"><Wallet className="h-5 w-5" /> Wallet</h3>
      <p className="text-3xl font-extrabold mt-2">{formatNaira(balance)}</p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full mt-4 bg-accent text-accent-foreground hover:bg-accent/90">Top up</Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <div className="grid sm:grid-cols-[180px_1fr]">
            <div className="bg-muted/40 border-r p-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Payment Method</p>
              {([
                { id: "transfer", label: "Bank Transfer" },
                { id: "opay", label: "Opay" },
                { id: "card", label: "Card" },
              ] as const).map((m) => (
                <button key={m.id} onClick={() => setMethod(m.id)} className={`w-full text-left text-sm px-3 py-2 rounded ${method === m.id ? "bg-card text-foreground border" : "text-muted-foreground hover:bg-card/50"}`}>
                  {m.label}
                </button>
              ))}
            </div>
            <div className="p-5 bg-card text-foreground space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Pay</p>
                <p className="text-2xl font-bold text-primary">{formatNaira(Number(amount))}</p>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-2" />
                <div className="flex gap-2 mt-2">{[1000, 5000, 10000, 25000].map((v) => (
                  <Button key={v} size="sm" variant="outline" onClick={() => setAmount(String(v))}>{formatNaira(v)}</Button>
                ))}</div>
              </div>
              {method === "transfer" && (
                <>
                  <p className="text-sm text-center text-muted-foreground">Transfer <b className="text-foreground">{formatNaira(Number(amount))}</b> from your bank to <b className="text-foreground">{account.name}</b></p>
                  <div className="bg-muted/40 rounded-lg p-4 space-y-3">
                    <Row label="Bank Name" value={account.bank} />
                    <Row label="Account Number" value={account.number} copyable />
                    <Row label="Amount" value={`${formatNaira(Number(amount))}`} copyable />
                  </div>
                  <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded p-3 text-xs">
                    Ensure you send the amount indicated only once.<br />
                    This account will expire in <b>{mins} minutes {secs.toString().padStart(2, "0")} seconds</b>. Do not save for future use.
                  </div>
                  <Button onClick={submit} disabled={loading || expiry === 0} className="w-full bg-primary text-primary-foreground">
                    {confirming ? "Verifying transfer…" : "I've sent the transfer — confirm"}
                  </Button>
                </>
              )}
              {method === "opay" && (
                <div className="text-center py-8 space-y-3">
                  <p className="text-sm text-muted-foreground">Pay with Opay — scan QR in your Opay app</p>
                  <Button onClick={submit} disabled={loading} className="bg-primary text-primary-foreground">Simulate Opay payment</Button>
                </div>
              )}
              {method === "card" && (
                <div className="space-y-3">
                  <Input placeholder="Card number" /><Input placeholder="MM / YY" /><Input placeholder="CVV" />
                  <Button onClick={submit} disabled={loading} className="w-full bg-primary text-primary-foreground">Pay {formatNaira(Number(amount))}</Button>
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
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
      {copyable && (
        <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(value.replace(/[^\d.]/g, "")); toast.success("Copied"); }}>
          <CopyIcon className="h-3 w-3 mr-1" />Copy
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
    <Card className="p-5">
      <h3 className="font-semibold flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-accent" /> KYC verification</h3>
      <p className="text-sm text-muted-foreground mt-1">Current status: <Badge className="capitalize ml-1">{status}</Badge></p>
      {status === "verified" ? (
        <p className="mt-3 text-accent font-medium">You are a verified vendor.</p>
      ) : (
        <label className="mt-3 inline-flex">
          <input type="file" accept="image/*,.pdf" className="hidden" onChange={handle} disabled={busy} />
          <Button asChild variant="outline"><span>{busy ? "Uploading…" : "Upload government ID"}</span></Button>
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
    <Card className="p-5 border-accent/40 bg-accent/5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold flex items-center gap-2"><Store className="h-5 w-5 text-accent" /> Open your personal shop</h3>
          <p className="text-sm text-muted-foreground mt-1">Get a shareable shop URL, QR code, WhatsApp button, and Paystack-verified payouts.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-accent text-accent-foreground">Become a merchant</Button></DialogTrigger>
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
  const url = typeof window !== "undefined" ? `${window.location.origin}/shop/${slug}` : `/shop/${slug}`;
  const copy = async () => { await navigator.clipboard.writeText(url); toast.success("Link copied"); };
  return (
    <Card className="p-5">
      <h3 className="font-semibold flex items-center gap-2 mb-3"><Store className="h-5 w-5 text-accent" /> Your shop</h3>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="bg-white p-2 rounded"><QRCodeSVG value={url} size={120} /></div>
        <div className="flex-1 w-full">
          <p className="text-sm text-muted-foreground">Public URL</p>
          <code className="block text-accent break-all text-sm mt-1">{url}</code>
          <div className="flex gap-2 mt-3">
            <Button onClick={copy} variant="outline" size="sm"><Share2 className="h-3 w-3 mr-1" />Copy link</Button>
            <Button asChild size="sm" className="bg-accent text-accent-foreground"><Link to="/shop/$slug" params={{ slug }}>Visit shop</Link></Button>
          </div>
        </div>
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
    <Card className="p-5">
      <h3 className="font-semibold flex items-center gap-2 mb-1"><Crown className="h-5 w-5 text-accent" /> Subscriptions & billing</h3>
      <p className="text-sm text-muted-foreground">
        Current plan: <Badge className="capitalize ml-1">{tier}</Badge>
        {until && tier !== "free" && <span className="ml-2">renews {new Date(until).toLocaleDateString()}</span>}
      </p>
      <div className="grid md:grid-cols-3 gap-3 mt-4">
        {PLANS.map((p) => (
          <div key={p.tier} className={`p-4 rounded-lg border-2 ${tier === p.tier ? "border-accent" : "border-border"}`}>
            <p className="font-semibold uppercase">{p.tier}</p>
            <p className="text-2xl font-extrabold text-accent">{formatNaira(p.price)}<span className="text-xs text-muted-foreground">/mo</span></p>
            <ul className="text-xs mt-2 space-y-1 text-muted-foreground">{p.perks.map((x) => <li key={x}>• {x}</li>)}</ul>
            <Button size="sm" disabled={busy === p.tier || tier === p.tier} onClick={() => activate(p.tier)} className="w-full mt-3 bg-accent text-accent-foreground">
              {tier === p.tier ? "Active" : busy === p.tier ? "Activating…" : "Activate"}
            </Button>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-3">Paid from your Tile wallet. Top up first if balance is low.</p>
    </Card>
  );
}

function AdminCodeCard({ onRedeemed }: { onRedeemed: () => void }) {
  const { isAdmin } = useAuth();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  if (isAdmin) return null;
  const submit = async () => {
    if (!code) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("redeem_admin_code", { _code: code.trim() });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (data) { toast.success("Admin access granted"); onRedeemed(); }
    else toast.error("Invalid or used code");
  };
  return (
    <Card className="p-5">
      <h3 className="font-semibold flex items-center gap-2"><KeyRound className="h-5 w-5 text-accent" /> Admin invite code</h3>
      <p className="text-sm text-muted-foreground mt-1">Have a one-time admin code? Redeem it here to unlock the Admin Cabin.</p>
      <div className="flex gap-2 mt-3">
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="TILE-ADMIN-XXXXXX" />
        <Button disabled={busy} onClick={submit} className="bg-accent text-accent-foreground">Redeem</Button>
      </div>
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
    const { error } = await supabase.rpc("renew_listing", { _listing_id: l.id });
    if (error) return toast.error(error.message);
    toast.success("Renewed for 30 days");
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
    <li className="py-2">
      <div className="flex justify-between items-center">
        <Link to="/listing/$id" params={{ id: l.id }} className="font-medium hover:text-accent">{l.title}</Link>
        <div className="flex items-center gap-2">
          <Badge variant={l.status === "approved" ? "default" : l.status === "rejected" ? "destructive" : "secondary"} className="capitalize">{l.status}</Badge>
          <Badge className="bg-primary text-primary-foreground capitalize">{l.type}</Badge>
          {l.status === "approved" && (
            <Button
              size="sm"
              variant={l.is_promoted ? "default" : "outline"}
              className="h-7"
              disabled={l.is_promoted}
              onClick={promote}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {l.is_promoted ? "Promoted" : "Promote"}
            </Button>
          )}
          <Button size="sm" variant="outline" className="h-7 px-2" onClick={openEdit}><Pencil className="h-3 w-3" /></Button>
          <Button size="sm" variant="outline" className="h-7 px-2 text-destructive" onClick={remove}><Trash2 className="h-3 w-3" /></Button>
        </div>
      </div>
      {stats && (
  <details className="mt-3 rounded-lg border bg-muted/20 group">
    <summary className="flex cursor-pointer list-none items-center justify-between p-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Listing Performance
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {stats.views} unique view{stats.views === 1 ? "" : "s"} · {stats.chats} chat{stats.chats === 1 ? "" : "s"}
        </p>
      </div>

      <span className="text-sm text-muted-foreground transition-transform group-open:rotate-180">
        ▼
      </span>
    </summary>

    <div className="border-t p-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded-md border bg-background p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MousePointerClick className="h-4 w-4" />
            <span className="text-xs">Impressions</span>
          </div>
          <p className="mt-1 text-lg font-bold text-foreground">
            {stats.impressions}
          </p>
        </div>

        <div className="rounded-md border bg-background p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span className="text-xs">Views</span>
          </div>
          <p className="mt-1 text-lg font-bold text-foreground">
            {stats.views}
          </p>
        </div>

        <div className="rounded-md border bg-background p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Heart className="h-4 w-4" />
            <span className="text-xs">Saves</span>
          </div>
          <p className="mt-1 text-lg font-bold text-foreground">
            {stats.saves}
          </p>
        </div>

        <div className="rounded-md border bg-background p-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">Chats</span>
          </div>
          <p className="mt-1 text-lg font-bold text-foreground">
            {stats.chats}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-md border bg-background p-3">
          <p className="text-xs text-muted-foreground">
            View Rate
          </p>

          <p className="mt-1 text-lg font-bold">
            {stats.impressions > 0
              ? `${((stats.views / stats.impressions) * 100).toFixed(1)}%`
              : "0%"}
          </p>

          <p className="text-xs text-muted-foreground mt-1">
            {stats.views} unique view{stats.views === 1 ? "" : "s"} from{" "}
            {stats.impressions} impression{stats.impressions === 1 ? "" : "s"}
          </p>
        </div>

        <div className="rounded-md border bg-background p-3">
          <p className="text-xs text-muted-foreground">
            Lead Engagement
          </p>

          <p className="mt-1 text-lg font-bold">
            {stats.views > 0
              ? `${(((stats.saves + stats.chats) / stats.views) * 100).toFixed(1)}%`
              : "0%"}
          </p>

          <p className="text-xs text-muted-foreground mt-1">
            {stats.saves + stats.chats} actions from{" "}
            {stats.views} unique view{stats.views === 1 ? "" : "s"}
          </p>
        </div>
      </div>
    </div>
  </details>
)}
      {daysLeft !== null && l.status === "approved" && daysLeft <= 3 && daysLeft > 0 && (
        <div className="mt-2 flex items-center gap-2 text-xs bg-destructive/10 text-destructive p-2 rounded">
          <AlertTriangle className="h-3 w-3" /> Expires in {daysLeft} day{daysLeft === 1 ? "" : "s"}.
          <Button size="sm" variant="outline" className="ml-auto h-7" onClick={renew}><RefreshCw className="h-3 w-3 mr-1" />Renew 30 days</Button>
        </div>
      )}
      {l.status === "expired" && (
        <div className="mt-2 flex items-center gap-2 text-xs bg-muted p-2 rounded">
          <AlertTriangle className="h-3 w-3" /> Expired.
          <Button size="sm" variant="outline" className="ml-auto h-7" onClick={renew}><RefreshCw className="h-3 w-3 mr-1" />Reactivate</Button>
        </div>
      )}
      {daysLeft !== null && daysLeft > 3 && l.status === "approved" && (
        <p className="text-xs text-muted-foreground mt-1">{daysLeft} days left</p>
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
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-accent" />
            Artisan Profile
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your public artisan profile.
          </p>
        </div>

        <Button asChild>
          <Link to="/become-artisan">
            <Pencil className="h-4 w-4 mr-2" />
            Edit Profile
          </Link>
        </Button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">Profession</p>
          <p className="font-medium">
            {profile.profession || "Not set"}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Experience</p>
          <p className="font-medium">
            {profile.years_experience ?? 0} years
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Starting Price</p>
          <p className="font-medium">
            {profile.starting_price
              ? formatNaira(profile.starting_price)
              : "Not set"}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Rating</p>
          <p className="font-medium">
            ⭐ {profile.avg_rating ?? 0}
          </p>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <Button asChild variant="outline">
          <Link to="/artisans/$id" params={{ id: profile.id }}>
            View Public Profile
          </Link>
        </Button>
      </div>
    </Card>
  );
}
