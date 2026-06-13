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
import { Users, Tag, Banknote, ShieldAlert, Check, X, Flag, BadgeCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
        supabase.from("wallet_transactions").select("amount"),
      ]);
      const total = (rev.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
      return { users: u.count ?? 0, ads: a.count ?? 0, revenue: total };
    },
  });

  const { data: pending = [] } = useQuery({
    queryKey: ["pending"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await supabase.from("listings").select("*").eq("status", "pending").order("created_at", { ascending: false });
      return data ?? [];
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

  if (!loading && !isAdmin) { nav({ to: "/" }); return null; }

  const approve = async (id: string) => {
    const { error } = await supabase.from("listings").update({ status: "approved" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Approved"); qc.invalidateQueries({ queryKey: ["pending"] });
  };
  const reject = async (id: string, reason: string) => {
    const { error } = await supabase.from("listings").update({ status: "rejected", rejection_reason: reason }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Rejected"); qc.invalidateQueries({ queryKey: ["pending"] });
  };
  const flag = async (id: string, userId: string) => {
    await supabase.from("listings").update({ status: "flagged" }).eq("id", id);
    await supabase.from("profiles").update({ is_verified: false }).eq("id", userId);
    toast.success("User flagged & listing removed");
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
          </TabsList>

          <TabsContent value="moderation" className="mt-4">
            <Card className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Price</TableHead><TableHead>Location</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {pending.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No pending ads</TableCell></TableRow>}
                  {pending.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.title}</TableCell>
                      <TableCell><Badge className="capitalize">{l.type}</Badge></TableCell>
                      <TableCell>{formatNaira(l.price)}</TableCell>
                      <TableCell>{l.location}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" onClick={() => approve(l.id)} className="bg-accent text-accent-foreground"><Check className="h-3 w-3 mr-1" />Approve</Button>
                        <RejectModal onConfirm={(r) => reject(l.id, r)} />
                        <Button size="sm" variant="destructive" onClick={() => flag(l.id, l.user_id)}><Flag className="h-3 w-3 mr-1" />Flag</Button>
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