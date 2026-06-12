import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { CATEGORIES } from "@/lib/categories";
import * as Icons from "lucide-react";
import { Link } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().optional(),
  loc: z.string().optional(),
  cat: z.string().optional(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tile — Buy, Sell & Hire in Nigeria" },
      { name: "description", content: "The classifieds marketplace for goods and services across Nigeria." },
      { property: "og:title", content: "Tile Marketplace" },
      { property: "og:description", content: "Buy, sell, and hire across Nigeria — all in one place." },
    ],
  }),
  validateSearch: searchSchema,
  component: Index,
});

function Index() {
  const { q, loc, cat } = Route.useSearch();

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["listings", { q, loc, cat }],
    queryFn: async () => {
      let qb = supabase.from("listings").select("id,title,price,type,location,images,is_promoted,category")
        .eq("status", "approved")
        .order("is_promoted", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(60);
      if (q) qb = qb.ilike("title", `%${q}%`);
      if (loc && loc !== "all") qb = qb.eq("location", loc);
      if (cat) qb = qb.eq("category", cat);
      const { data, error } = await qb;
      if (error) throw error;
      return (data ?? []) as ListingCardData[];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 py-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">The marketplace for everything.</h1>
          <p className="mt-2 text-primary-foreground/80 max-w-2xl mx-auto">
            From phones to plumbers — discover thousands of listings and trusted vendors across Nigeria.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-lg font-semibold mb-4">Browse categories</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {CATEGORIES.map((c) => {
            const Icon = (Icons as never as Record<string, React.ComponentType<{ className?: string }>>)[c.icon] ?? Icons.Tag;
            const active = cat === c.slug;
            return (
              <Link key={c.slug} to="/" search={(p: { q?: string; loc?: string; cat?: string }) => ({ ...p, cat: active ? undefined : c.slug })}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition ${active ? "border-accent bg-accent/10" : "border-border bg-card hover:border-accent/50"}`}>
                <Icon className="h-6 w-6 text-primary" />
                <span className="text-xs text-center font-medium">{c.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Listings masonry */}
      <section className="container mx-auto px-4 pb-12">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg font-semibold">{cat ? `Listings — ${cat}` : "Latest listings"}</h2>
          <span className="text-sm text-muted-foreground">{listings.length} results</span>
        </div>
        {isLoading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : listings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
            No listings yet. Be the first — <Link to="/post-ad" className="text-accent font-semibold">post an ad</Link>.
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 [column-fill:_balance]">
            {listings.map((l) => (
              <div key={l.id} className="mb-4 break-inside-avoid">
                <ListingCard l={l} />
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="bg-primary text-primary-foreground/70 mt-12">
        <div className="container mx-auto px-4 py-6 text-sm flex justify-between">
          <span>© Tile Marketplace</span>
          <span>Built with Lovable</span>
        </div>
      </footer>
    </div>
  );
}
