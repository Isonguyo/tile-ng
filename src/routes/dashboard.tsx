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
import { useAuth } from "@/lib/auth-context";
import { formatNaira } from "@/lib/categories";
import { Heart, Package, Wallet, Plus, MessageSquare, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { uploadKyc } from "@/lib/storage";

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
          <h1 className="text-3xl font-bold">Welcome, {profile.full_name}</h1>
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
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-5 col-span-2">
                <h3 className="font-semibold flex items-center gap-2 mb-3"><Package className="h-5 w-5 text-accent" /> Your listings</h3>
                {myListings.length === 0 ? <p className="text-muted-foreground text-sm">You haven't posted anything yet.</p> : (
                  <ul className="divide-y">
                    {myListings.map((l) => (
                      <li key={l.id} className="py-2 flex justify-between items-center">
                        <Link to="/listing/$id" params={{ id: l.id }} className="font-medium hover:text-accent">{l.title}</Link>
                        <div className="flex items-center gap-2">
                          <Badge variant={l.status === "approved" ? "default" : l.status === "rejected" ? "destructive" : "secondary"} className="capitalize">{l.status}</Badge>
                          <Badge className="bg-primary text-primary-foreground capitalize">{l.type}</Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
              <WalletCard balance={profile.wallet_balance} onTopup={() => { refreshProfile(); qc.invalidateQueries(); }} />
            </div>
            <KycCard status={profile.kyc_status} onUpload={refreshProfile} />
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