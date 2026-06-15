import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { formatNaira, LOCATIONS } from "@/lib/categories";
import { Heart, Package, Wallet, Plus, MessageSquare, ShieldCheck, Store, Share2, KeyRound, Crown, AlertTriangle, RefreshCw, Pencil, Trash2, Eye, MousePointerClick, Copy as CopyIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { uploadKyc } from "@/lib/storage";
import { TierBadge } from "@/components/tier-badge";
import { QRCodeSVG } from "qrcode.react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Tile" }] }),
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
            <TabsTrigger value="buyer" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">Buyer Hub</TabsTrigger>
            <TabsTrigger value="merchant" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">Merchant Hub</TabsTrigger>
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
            <BillingCard tier={profile.subscription_tier ?? "free"} until={profile.subscription_until} onChange={refreshProfile} />
            <KycCard status={profile.kyc_status} onUpload={refreshProfile} />
            <AdminCodeCard onRedeemed={refreshProfile} />
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

  const submit = async () => {
    setLoading(true);
    const { error } = await supabase.rpc("topup_wallet", { _amount: Number(amount), _reference: `paystack-mock-${Date.now()}` });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Wallet topped up");
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
        <DialogContent>
          <DialogHeader><DialogTitle>Top up wallet (Paystack — mock)</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Choose an amount in ₦. This demo simulates a Paystack charge.</p>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <div className="flex gap-2">{[1000, 5000, 10000, 25000].map((v) => (
              <Button key={v} variant="outline" onClick={() => setAmount(String(v))}>{formatNaira(v)}</Button>
            ))}</div>
          </div>
          <DialogFooter>
            <Button onClick={submit} disabled={loading} className="bg-accent text-accent-foreground">Pay {formatNaira(Number(amount))}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
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
  { tier: "lite", price: 5000, perks: ["1 'Top Ad' pin per week", "Verified Vendor green tag", "+20% chat priority"] },
  { tier: "pro", price: 15000, perks: ["5 Top Ads pinned", "Custom shop link", "PRO banner on profile"] },
  { tier: "vip", price: 40000, perks: ["Unlimited listings", "15 continuous Top Ads", "Google/Meta cross-posting", "Analytics dashboard"] },
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
function ListingRow({ l, onChange }: { l: { id: string; title: string; type: string; status: string; expires_at?: string | null }; onChange: () => void }) {
  const expiresAt = l.expires_at ? new Date(l.expires_at) : null;
  const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / 86400000) : null;
  const [stats, setStats] = useState<{ views_count: number; clicks_count: number; favorites_count: number } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<{ title: string; description: string; price: string }>({ title: l.title, description: "", price: "" });
  const loadStats = async () => {
    const { data } = await supabase.rpc("owner_listing_stats", { _id: l.id });
    const r = (data ?? [])[0] as { views_count: number; clicks_count: number; favorites_count: number } | undefined;
    if (r) setStats({ views_count: r.views_count, clicks_count: r.clicks_count, favorites_count: Number(r.favorites_count) });
  };
  // load stats once
  if (stats === null && typeof window !== "undefined") {
    // fire and forget
    void loadStats();
  }
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
  return (
    <li className="py-2">
      <div className="flex justify-between items-center">
        <Link to="/listing/$id" params={{ id: l.id }} className="font-medium hover:text-accent">{l.title}</Link>
        <div className="flex items-center gap-2">
          <Badge variant={l.status === "approved" ? "default" : l.status === "rejected" ? "destructive" : "secondary"} className="capitalize">{l.status}</Badge>
          <Badge className="bg-primary text-primary-foreground capitalize">{l.type}</Badge>
          <Button size="sm" variant="outline" className="h-7 px-2" onClick={openEdit}><Pencil className="h-3 w-3" /></Button>
          <Button size="sm" variant="outline" className="h-7 px-2 text-destructive" onClick={remove}><Trash2 className="h-3 w-3" /></Button>
        </div>
      </div>
      {stats && (
        <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{stats.views_count} views</span>
          <span className="flex items-center gap-1"><MousePointerClick className="h-3 w-3" />{stats.clicks_count} clicks</span>
          <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{stats.favorites_count} saves</span>
        </div>
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
