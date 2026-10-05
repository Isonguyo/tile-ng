import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Users, Download, Search, ArrowLeft, ShieldAlert, TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  CartesianGrid,
} from "recharts";

import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { rpcUntyped } from "@/lib/waitlist-rpc";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/admin_/waitlist")({
  head: () => ({
    meta: [
      { title: "Waitlist Admin | Tile" },
      {
        name: "description",
        content: "Internal waitlist analytics for the Tile marketplace launch.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Waitlist Admin | Tile" },
      {
        property: "og:description",
        content: "Internal waitlist analytics for the Tile marketplace launch.",
      },
    ],
  }),
  component: AdminWaitlistPage,
});

type Row = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  state: string | null;
  city: string | null;
  user_type: string;
  referral_code: string | null;
  source: string | null;
  created_at: string;
};

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}

function AdminWaitlistPage() {
  const { isAdmin, loading } = useAuth();
  const [q, setQ] = useState("");

  const { data: stats } = useQuery({
    queryKey: ["waitlist-stats"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await rpcUntyped("admin_waitlist_stats");
      if (error) throw error;
      return (data as unknown as Array<Record<string, number>>)?.[0] ?? null;
    },
  });

  const { data: growth = [] } = useQuery({
    queryKey: ["waitlist-growth"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await rpcUntyped("admin_waitlist_growth", { _days: 30 });
      if (error) throw error;
      return (data as unknown as Array<{ day: string; signups: number }>) ?? [];
    },
  });

  const { data: rows = [] } = useQuery({
    queryKey: ["waitlist-rows"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("waitlist")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) =>
      [r.full_name, r.email, r.phone, r.state, r.city, r.referral_code].some((v) =>
        (v ?? "").toLowerCase().includes(needle),
      ),
    );
  }, [rows, q]);

  const exportCsv = () => {
    const head = [
      "Full name",
      "Email",
      "Phone",
      "State",
      "City",
      "Type",
      "Referral",
      "Source",
      "Joined",
    ];
    const body = filtered.map((r) => [
      r.full_name,
      r.email,
      r.phone ?? "",
      r.state ?? "",
      r.city ?? "",
      r.user_type,
      r.referral_code ?? "",
      r.source ?? "",
      new Date(r.created_at).toISOString(),
    ]);
    const csv = [head, ...body]
      .map((line) => line.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `tile-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto px-4 py-24 text-center text-muted-foreground">
          Loading…
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto max-w-lg px-4 py-24 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="mt-4 text-2xl font-bold">Admins only</h1>
          <p className="mt-2 text-muted-foreground">
            You don't have permission to view the waitlist.
          </p>
          <Button asChild className="mt-6">
            <Link to="/">Go home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const total = stats?.total ?? 0;
  const visits = stats?.visits ?? 0;
  const conversion = visits > 0 ? ((Number(stats?.signups ?? 0) / visits) * 100).toFixed(1) : "0.0";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to admin
        </Link>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="flex items-center gap-2 text-3xl font-black tracking-tight">
            <Users className="h-7 w-7 text-primary" /> Waitlist
          </h1>
          <Button onClick={exportCsv} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Stat
            label="Total members"
            value={total}
            hint={`${stats?.today ?? 0} today • ${stats?.week ?? 0} this week`}
          />
          <Stat label="Buyers" value={stats?.buyers ?? 0} />
          <Stat label="Sellers" value={stats?.sellers ?? 0} />
          <Stat
            label="Artisans"
            value={stats?.artisans ?? 0}
            hint={`${stats?.all_types ?? 0} chose all`}
          />
          <Stat
            label="Conversion"
            value={`${conversion}%`}
            hint={`${visits} visits • ${stats?.join_clicks ?? 0} clicks`}
          />
        </div>

        <Card className="mt-6 p-5">
          <h2 className="flex items-center gap-2 font-bold">
            <TrendingUp className="h-4 w-4 text-primary" /> Growth (30 days)
          </h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growth}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                <XAxis dataKey="day" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <RTooltip />
                <Area
                  type="monotone"
                  dataKey="signups"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="mt-6 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold">Latest signups</h2>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search name, email, state…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Referral</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.full_name}</TableCell>
                    <TableCell className="text-xs">{r.email}</TableCell>
                    <TableCell className="text-xs">{r.phone ?? "—"}</TableCell>
                    <TableCell className="text-xs">
                      {[r.city, r.state].filter(Boolean).join(", ") || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {r.user_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{r.referral_code ?? "—"}</TableCell>
                    <TableCell className="text-xs">
                      {new Date(r.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      No waitlist members yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
