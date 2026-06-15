import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { formatNaira } from "@/lib/categories";
import { Users, Tag, Banknote, ShieldAlert, Check, X, Flag, BadgeCheck, KeyRound, AlertTriangle, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getSignedUrls } from "@/lib/storage";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Cabin — Tile" }] }),
  component: Admin,
});

function Admin() {
  const { isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    enabled: isAdmin,
    queryFn: async () => {
      const [u, a, rev] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("wallet_transactions").select("amount").eq("tx_type", "subscription"),
      ]);
      // Subscription tx are stored as negatives (debits from user wallet); platform revenue = sum of absolute values
      const total = (rev.data ?? []).reduce((s, r) => s + Math.abs(Number(r.amount)), 0);
      return { users: u.count ?? 0, ads: a.count ?? 0, revenue: total };
    },
  });

  const { data: pending = [] } = useQuery({
    queryKey: ["pending"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await supabase.rpc("admin_pending_listings");
      return (data ?? []) as Array<{ id: string; title: string; price: number | null; category: string; type: string; images: string[]; created_at: string; seller_id: string; seller_name: string | null; seller_phone: string | null }>;
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

  const { data: codes = [] } = useQuery({
    queryKey: ["admin-codes"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await supabase.rpc("admin_list_invite_codes");
      return (data ?? []) as Array<{ code: string; created_at: string; expires_at: string; used_by: string | null; used_at: string | null; status: string }>;
    },
  });

  const generateCode = async () => {
    const { data, error } = await supabase.rpc("admin_generate_invite_code");
    if (error) return toast.error(error.message);
    toast.success(`New admin code: ${data}`);
    qc.invalidateQueries({ queryKey: ["admin-codes"] });
  };

  if (!loading && !isAdmin) { nav({ to: "/" }); return null; }

  const approve = async (id: string) => {
    const { error } = await supabase.rpc("admin_approve_listing", { _id: id });
    if (error) return toast.error(error.message);
    toast.success("Approved"); qc.invalidateQueries({ queryKey: ["pending"] });
  };
  const reject = async (id: string, reason: string) => {
    const { error } = await supabase.rpc("admin_reject_listing", { _id: id, _reason: reason });
    if (error) return toast.error(error.message);
    toast.success("Rejected"); qc.invalidateQueries({ queryKey: ["pending"] });
  };
  const flag = async (id: string) => {
    const { error } = await supabase.rpc("admin_flag_seller", { _listing_id: id });
    if (error) return toast.error(error.message);
    toast.success("Seller flagged & listing removed");
    qc.invalidateQueries({ queryKey: ["pending"] });
  };
  const grantVerified = async (id: string) => {
    await supabase.from("profiles").update({ kyc_status: "verified", is_verified: true }).eq("id", id);
    toast.success("Verified badge granted");
    qc.invalidateQueries({ queryKey: ["kyc-pending"] });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold flex items-center gap-2"><ShieldAlert className="text-accent" /> Admin Cabin</h1>
        <p className="text-muted-foreground">Global platform command console</p>

        <div className="grid sm:grid-cols-3 gap-4 my-6">
          <StatCard label="Users" value={stats?.users ?? 0} icon={Users} />
          <StatCard label="Active Ads" value={stats?.ads ?? 0} icon={Tag} />
          <StatCard label="System Revenue" value={formatNaira(stats?.revenue ?? 0)} icon={Banknote} />
        </div>

        <Tabs defaultValue="moderation">
          <TabsList>
            <TabsTrigger value="moderation">Ad Moderation</TabsTrigger>
            <TabsTrigger value="kyc">KYC Audit</TabsTrigger>
            <TabsTrigger value="money">Monetization</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="codes">Admin Codes</TabsTrigger>
          </TabsList>

          <TabsContent value="moderation" className="mt-4">
            <Card className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Title</TableHead><TableHead>Seller</TableHead><TableHead>Type</TableHead><TableHead>Price</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {pending.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No pending ads</TableCell></TableRow>}
                  {pending.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">
                        <PendingTitle l={l} />
                      </TableCell>
                      <TableCell className="text-sm">{l.seller_name ?? "—"}<br/><span className="text-xs text-muted-foreground">{l.seller_phone ?? ""}</span></TableCell>
                      <TableCell><Badge className="capitalize">{l.type}</Badge></TableCell>
                      <TableCell>{formatNaira(l.price)}</TableCell>
                      <TableCell className="text-xs">{l.category}</TableCell>
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

          <TabsContent value="kyc" className="mt-4">
            <Card className="p-0 overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Phone</TableHead><TableHead>Status</TableHead><TableHead>Document</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                <TableBody>
                  {kycPending.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No pending KYC</TableCell></TableRow>}
                  {kycPending.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.full_name}</TableCell>
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
              <div className="p-4 text-xs text-muted-foreground border-t">Plan prices: Lite ₦5,000 · Pro ₦15,000 · VIP ₦40,000 (edit in <code>activate_subscription</code> SQL function).</div>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            <Card className="p-0 overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Tier</TableHead><TableHead>KYC</TableHead><TableHead className="text-right">Active Ads</TableHead></TableRow></TableHeader>
                <TableBody>
                  {users.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No users</TableCell></TableRow>}
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name ?? "—"}</TableCell>
                      <TableCell className="text-xs">{u.email ?? "—"}</TableCell>
                      <TableCell><Badge className="capitalize">{u.subscription_tier}</Badge>{u.is_verified && <BadgeCheck className="inline h-4 w-4 text-accent ml-1" />}</TableCell>
                      <TableCell className="text-xs capitalize">{(u as { kyc_status?: string }).kyc_status ?? "—"}</TableCell>
                      <TableCell className="text-right font-mono">{u.active_ads}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="codes" className="mt-4 space-y-4">
            <Card className="p-4 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="font-semibold flex items-center gap-2"><KeyRound className="h-4 w-4" />One-Time Admin Authorization</p>
                <p className="text-sm text-muted-foreground">Generates an 8-char code (e.g. TILE-ADMIN-XXXXXXXX). Single-use, expires 30 minutes after creation.</p>
              </div>
              <Button onClick={generateCode} className="bg-accent text-accent-foreground"><KeyRound className="h-4 w-4 mr-1" />Generate code</Button>
            </Card>
            <Card className="p-0 overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Created</TableHead><TableHead>Expires</TableHead><TableHead>Used At</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {codes.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No codes yet</TableCell></TableRow>}
                  {codes.map((c) => (
                    <TableRow key={c.code}>
                      <TableCell className="font-mono text-xs">{c.code}</TableCell>
                      <TableCell className="text-xs">{new Date(c.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{new Date(c.expires_at).toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{c.used_at ? new Date(c.used_at).toLocaleString() : "—"}</TableCell>
                      <TableCell>
                        <Badge className={c.status === "active" ? "bg-emerald-600 text-white" : c.status === "used" ? "bg-muted text-muted-foreground" : "bg-destructive text-destructive-foreground"}>{c.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {c.status === "active" && (
                          <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(c.code); toast.success("Code copied"); }}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
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

function PendingTitle({ l }: { l: { id: string; title: string; type: string; images: string[] } }) {
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