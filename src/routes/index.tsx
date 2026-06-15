import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
    links: [
      { rel: "icon", type: "image/png", href: "https://res.cloudinary.com/dbozz4sgv/image/upload/v1781367385/tile-logo_vv2c8v.jpg" },
      { rel: "apple-touch-icon", href: "https://res.cloudinary.com/dbozz4sgv/image/upload/v1781367385/tile-logo_vv2c8v.jpg" }
    ],

  }),
  validateSearch: searchSchema,
  component: Index,
});

function Index() {
  const { q, loc, cat } = Route.useSearch();
  const [showAllCategories, setShowAllCategories] = useState(false);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["listings", { q, loc, cat }],
    queryFn: async () => {
      let qb = supabase.from("listings").select("id,title,price,type,location,images,is_promoted,category,description,views_count,clicks_count,user_id")
        .eq("status", "approved")
        .order("is_promoted", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(60);
      if (q) qb = qb.ilike("title", `%${q}%`);
      if (loc && loc !== "all") qb = qb.eq("location", loc);
      if (cat) qb = qb.eq("category", cat);
      const { data, error } = await qb;
      if (error) throw error;
      const rows = (data ?? []) as Array<ListingCardData & { user_id: string }>;
      const ids = Array.from(new Set(rows.map((r) => r.user_id))).filter(Boolean);
      if (ids.length) {
        const { data: profs } = await (supabase.from("public_profiles") as unknown as { select: (c: string) => { in: (k: string, v: string[]) => Promise<{ data: { id: string; subscription_tier?: string | null; is_verified?: boolean | null }[] | null }> } })
          .select("id,subscription_tier,is_verified").in("id", ids);
        const map = new Map((profs ?? []).map((p) => [p.id, p]));
        return rows.map((r) => ({ ...r, seller_tier: map.get(r.user_id)?.subscription_tier ?? null, seller_verified: map.get(r.user_id)?.is_verified ?? null }));
      }
      return rows;
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
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-semibold">Browse Categories</h2>

    <button
      onClick={() => setShowAllCategories(!showAllCategories)}
      className="text-sm font-medium text-primary hover:underline"
    >
      {showAllCategories ? "Show Less" : "View All"}
    </button>
  </div>

  <div
    className={`grid gap-3 ${
      showAllCategories
        ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
        : "grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8"
    }`}
  >
    {(showAllCategories ? CATEGORIES : CATEGORIES.slice(0, 8)).map((c) => {
      const Icon =
        (
          Icons as unknown as Record<
            string,
            React.ComponentType<{ className?: string }>
          >
        )[c.icon] ?? Icons.Tag;

      const active = cat === c.slug;

      return (
        <Link
          key={c.slug}
          to="/"
          search={(p: {
            q?: string;
            loc?: string;
            cat?: string;
          }) => ({
            ...p,
            cat: active ? undefined : c.slug,
          })}
          className={`group flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all duration-200 ${
            active
              ? "border-accent bg-accent/10"
              : "border-border bg-card hover:border-primary hover:shadow-md"
          }`}
        >
          <Icon className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />

          <span className="text-xs text-center font-medium leading-tight">
            {c.label}
          </span>
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
