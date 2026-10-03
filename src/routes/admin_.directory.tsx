import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, Search, Crown, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { rpcUntyped } from "@/lib/waitlist-rpc";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/admin_/directory")({
  head: () => ({
    meta: [
      { title: "Admin Directory | Tile" },
      { name: "description", content: "Full directory of Tile users, ads and artisan profiles for admins." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin Directory | Tile" },
      { property: "og:description", content: "Full directory of Tile users, ads and artisan profiles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DirectoryPage,
});

type U = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function useAdminRpc(key: string, fn: string, enabled: boolean) {
  return useQuery({
    queryKey: ["admin-dir", key],
    enabled,
    queryFn: async () => {
      const { data, error } = await rpcUntyped(fn);
      if (error) throw error;
      return (data as unknown as U[]) ?? [];
    },
  });
}

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleString() : "—");
const match = (o: unknown, q: string) => !q || JSON.stringify(o).toLowerCase().includes(q.toLowerCase());

function Field({ k, v }: { k: string; v: unknown }) {
  if (v === null || v === undefined || v === "" || (Array.isArray(v) && !v.length)) return null;
  const isImgs = Array.isArray(v) && v.every((x) => typeof x === "string" && /^https?:/.test(x));
  return (
    <div className="text-xs">
      <span className="text-muted-foreground">{k.replace(/_/g, " ")}: </span>
      {isImgs ? (
        <div className="mt-1 flex flex-wrap gap-1">
          {(v as string[]).map((s) => <img key={s} src={s} alt="" className="h-16 w-16 rounded object-cover" loading="lazy" />)}
        </div>
      ) : (
        <span className="break-words">{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
      )}
    </div>
  );
}

function TierControl({ u }: { u: U }) {
  const qc = useQueryClient();
  const set = async (tier: string, months: number | null) => {
    const { error } = await rpcUntyped("admin_set_user_tier", { _user_id: u.id, _tier: tier, _months: months });
    if (error) return toast.error(error.message);
    toast.success("Plan updated");
    qc.invalidateQueries({ queryKey: ["admin-dir"] });
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      <Button size="sm" variant="secondary" onClick={() => set("vip", null)}><Crown className="mr-1 h-3 w-3" />Lock VIP</Button>
      <Button size="sm" variant="outline" onClick={() => set("pro", 6)}>PRO 6mo</Button>
      <Button size="sm" variant="outline" onClick={() => set("lite", 3)}>LITE 3mo</Button>
      <Button size="sm" variant="ghost" onClick={() => set("free", null)}>Remove plan</Button>
    </div>
  );
}

function DirectoryPage() {
  const { isAdmin, loading } = useAuth();
  const [q, setQ] = useState("");
  const users = useAdminRpc("users", "admin_users_full", isAdmin);
  const ads = useAdminRpc("ads", "admin_all_listings", isAdmin);
  const arts = useAdminRpc("artisans", "admin_all_artisans", isAdmin);

  const fu = useMemo(() => (users.data ?? []).filter((x) => match(x, q)), [users.data, q]);
  const fa = useMemo(() => (ads.data ?? []).filter((x) => match(x, q)), [ads.data, q]);
  const fr = useMemo(() => (arts.data ?? []).filter((x) => match(x, q)), [arts.data, q]);

  if (loading) return null;
  if (!isAdmin) {
    return (
      <div className="min-h-screen"><SiteHeader />
        <div className="mx-auto max-w-md p-10 text-center"><ShieldAlert className="mx-auto h-10 w-10 text-destructive" /><p className="mt-3">Admins only.</p></div>
      </div>
    );
  }
  const err = users.error || ads.error || arts.error;

  return (
    <div className="min-h-screen bg-background"><SiteHeader />
      <main className="mx-auto max-w-7xl space-y-5 p-4 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link to="/admin" className="inline-flex items-center text-sm text-muted-foreground"><ArrowLeft className="mr-1 h-4 w-4" />Admin</Link>
            <h1 className="text-2xl font-black">Full directory</h1>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search anything…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        {err && <Card className="p-4 text-sm text-destructive">{(err as Error).message} — run SQL file 006 first.</Card>}

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Users ({users.data?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="ads">All ads ({ads.data?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="artisans">Artisans ({arts.data?.length ?? 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="grid gap-3 md:grid-cols-2">
            {fu.map((u) => (
              <Card key={u.id} className="space-y-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold">{u.full_name || "Unnamed"}</p>
                  <Badge>{u.subscription_tier}{u.tier_locked ? " · locked" : ""}</Badge>
                  {u.founding_rank && <Badge variant="secondary">Founder #{u.founding_rank}</Badge>}
                  {u.roles?.filter((r: string) => r !== "user").map((r: string) => <Badge key={r} variant="outline">{r}</Badge>)}
                </div>
                <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  <Field k="email" v={u.email} /><Field k="phone" v={u.phone} /><Field k="whatsapp" v={u.whatsapp} />
                  <Field k="business" v={u.business_name} /><Field k="shop" v={u.shop_slug} />
                  <Field k="location" v={[u.lga, u.state].filter(Boolean).join(", ")} />
                  <Field k="profession" v={u.profession} /><Field k="kyc" v={u.kyc_status} />
                  <Field k="verified" v={String(u.is_verified)} /><Field k="email confirmed" v={String(u.email_confirmed)} />
                  <Field k="wallet" v={u.wallet_balance} />
                  <Field k="plan until" v={u.tier_locked ? "Until you remove it" : fmt(u.subscription_until)} />
                  <Field k="ads" v={`${u.listings_total} total · ${u.listings_live} live · ${u.listings_pending} pending`} />
                  <Field k="joined" v={fmt(u.created_at)} /><Field k="last sign in" v={fmt(u.last_sign_in_at)} />
                </div>
                <TierControl u={u} />
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="ads" className="grid gap-3 md:grid-cols-2">
            {fa.map((r) => {
              const l = r.listing as U;
              return (
                <Card key={l.id} className="space-y-2 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{l.title}</p><Badge>{l.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">By {r.owner_name || "—"} · {r.owner_email || "—"}</p>
                  {Object.entries(l).filter(([k]) => !["id", "title", "status", "user_id"].includes(k)).map(([k, v]) => <Field key={k} k={k} v={v} />)}
                  <Link to="/listing/$id" params={{ id: l.id }} className="text-xs underline">Open ad</Link>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="artisans" className="grid gap-3 md:grid-cols-2">
            {fr.map((r) => {
              const p = r.profile as U;
              return (
                <Card key={p.id} className="space-y-2 p-4">
                  <p className="font-bold">{p.full_name || "Unnamed"} <span className="text-xs text-muted-foreground">· {r.email}</span></p>
                  {Object.entries({ ...p, ...(r.artisan ?? {}) }).filter(([k]) => !["id", "full_name"].includes(k)).map(([k, v]) => <Field key={k} k={k} v={v} />)}
                  <Link to="/artisans/$id" params={{ id: p.id }} className="text-xs underline">Open profile</Link>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
