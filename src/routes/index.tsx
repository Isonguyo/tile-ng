import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { SiteHeader } from "@/components/site-header";
import { ListingCard, type ListingCardData } from "@/components/listing-card";

import { CATEGORIES, LOCATIONS } from "@/lib/categories";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import * as Icons from "lucide-react";

import { z } from "zod";
import type { ComponentType } from "react";

const searchSchema = z.object({
  q: z.string().optional(),
  loc: z.string().optional(),
  cat: z.string().optional(),
});

type Search = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Tile — Buy, Sell & Hire Across Nigeria",
      },
      {
        name: "description",
        content:
          "Nigeria's trusted marketplace for buying, selling and hiring. Discover verified shops, products and professional services near you.",
      },
      {
        property: "og:title",
        content: "Tile Marketplace",
      },
      {
        property: "og:description",
        content:
          "Find trusted products, services and verified merchants across Nigeria.",
      },
      {
        property: "og:type",
        content: "website",
      },
    ],
    links: [
      {
        rel: "icon",
        type: "image/png",
        href: "https://res.cloudinary.com/dbozz4sgv/image/upload/v1781367385/tile-logo_vv2c8v.jpg",
      },
      {
        rel: "apple-touch-icon",
        href: "https://res.cloudinary.com/dbozz4sgv/image/upload/v1781367385/tile-logo_vv2c8v.jpg",
      },
    ],
  }),

  validateSearch: searchSchema,

  component: Index,
});

type ProfileRow = {
  id: string;

  subscription_tier: string | null;

  is_verified: boolean | null;

  business_name: string | null;

  full_name: string | null;

  avatar_url?: string | null;

  shop_slug?: string | null;
};

function Index() {
  const navigate = useNavigate({ from: "/" });
  const { q, loc, cat } = Route.useSearch();

  // Search & Filters
  const [searchInput, setSearchInput] = useState(q ?? "");
  const [selectedLocation, setSelectedLocation] = useState(loc ?? "all");

  // Marketplace View
  const [activeTab, setActiveTab] = useState<
    "all" | "goods" | "service" | "featured"
  >("all");

  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "popular" | "price-low" | "price-high"
  >("newest");

  // Reserved for automatic location detection (future feature)
  const [detectedState, setDetectedState] = useState<string | null>(null);
}

  /// ==========================
// 1. LISTINGS QUERY
// ==========================
const { data: listings = [], isLoading } = useQuery({
  queryKey: ["listings", { q, loc, cat }],
  queryFn: async () => {
    let query = supabase
      .from("listings")
      .select(`
        id,
        title,
        price,
        type,
        category,
        description,
        location,
        images,
        is_promoted,
        views_count,
        clicks_count,
        user_id,
        created_at
      `)
      .eq("status", "approved")
      .limit(150);

    if (q) {
      query = query.or(
        `title.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`
      );
    }

    if (loc && loc !== "all") {
      query = query.eq("location", loc);
    }

    if (cat) {
      query = query.eq("category", cat);
    }

    const { data, error } = await query;

    if (error) throw error;

    const rows =
      (data as Array<
        ListingCardData & {
          user_id: string;
          created_at: string;
        }
      >) || [];

    const userIds = [...new Set(rows.map((r) => r.user_id))];

    if (!userIds.length) return rows;

    const { data: profiles } = await supabase
      .from("public_profiles")
      .select(`
        id,
        subscription_tier,
        is_verified,
        business_name,
        avatar_url,
        shop_slug
      `)
      .in("id", userIds);

    const profileMap = new Map(
      ((profiles || []) as ProfileRow[]).map((p) => [p.id, p])
    );

    return rows
      .map((listing) => ({
        ...listing,

        seller_tier:
          profileMap.get(listing.user_id)?.subscription_tier ?? null,

        seller_verified:
          profileMap.get(listing.user_id)?.is_verified ?? false,

        seller_shop:
          profileMap.get(listing.user_id)?.shop_slug ?? null,

        seller_name:
          profileMap.get(listing.user_id)?.business_name ?? null,
      }))
      .sort((a, b) => {
        // Sponsored ads always first
        if (a.is_promoted !== b.is_promoted) {
          return a.is_promoted ? -1 : 1;
        }

        // Verified sellers next
        if (a.seller_verified !== b.seller_verified) {
          return a.seller_verified ? -1 : 1;
        }

        // Newest afterwards
        return (
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
        );
      });
  },
});


// ==========================
// 2. PLATFORM STATS
// ==========================
const { data: stats } = useQuery({
  queryKey: ["platform-stats"],
  queryFn: async () => {
    const [
      { count: listingsCount },
      { count: shopsCount },
      { count: sellersCount },
    ] = await Promise.all([
      supabase
        .from("listings")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved"),

      supabase
        .from("shops")
        .select("*", { count: "exact", head: true }),

      supabase
        .from("public_profiles")
        .select("*", { count: "exact", head: true }),
    ]);

    return {
      total_listings: listingsCount ?? 0,
      active_shops: shopsCount ?? 0,
      verified_vendors: sellersCount ?? 0,
      active_categories: CATEGORIES.length,
    };
  },
});


// ==========================
// 3. CATEGORY COUNTS
// ==========================
const { data: catCounts = [] } = useQuery({
  queryKey: ["category-counts"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("listings")
      .select("category")
      .eq("status", "approved");

    if (error) throw error;

    const counts: Record<string, number> = {};

    data?.forEach((item) => {
      if (item.category) {
        counts[item.category] =
          (counts[item.category] || 0) + 1;
      }
    });

    return Object.entries(counts).map(([category, count]) => ({
      category,
      count,
    }));
  },
});


// ==========================
// 4. FEATURED SHOPS
// ==========================
const { data: vendors = [] } = useQuery({
  queryKey: ["featured-shops"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("public_profiles")
      .select(`
        id,
        business_name,
        full_name,
        avatar_url,
        shop_slug,
        is_verified,
        subscription_tier
      `)
      .not("shop_slug", "is", null)
      .neq("shop_slug", "")
      .limit(6);

    if (error) throw error;

    return data || [];
  },
});
// ==========================
// 5. DERIVED VALUES & MEMOS
// ==========================

// Use all locations already defined in your app
const states = useMemo(
  () => LOCATIONS.map((name) => ({ name })),
  []
);

// Quick Categories
const quickCategories = useMemo(() => {
  return CATEGORIES.map((category) => {
    const match = catCounts.find(
      (c) => c.category === category.slug
    );

    return {
      ...category,
      count: match?.count ?? 0,
    };
  });
}, [catCounts]);

// Trending Categories
const trendingCategories = useMemo(() => {
  return [...quickCategories]
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}, [quickCategories]);

// Process Listings
const processedListings = useMemo(() => {
  let result = [...listings];

  // Filter by selected tab
  switch (activeTab) {
    case "goods":
      result = result.filter((l) => l.type === "goods");
      break;

    case "service":
      result = result.filter((l) => l.type === "service");
      break;

    case "featured":
      result = result.filter((l) => l.is_promoted);
      break;

    default:
      break;
  }

  // Sort listings
  switch (sortBy) {
    case "price-low":
      result.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      break;

    case "price-high":
      result.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
      break;

    case "popular":
      result.sort(
        (a, b) =>
          ((b.views_count ?? 0) + (b.clicks_count ?? 0)) -
          ((a.views_count ?? 0) + (a.clicks_count ?? 0))
      );
      break;

    case "oldest":
      result.sort(
        (a, b) =>
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
      );
      break;

    case "newest":
    default:
      result.sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );
      break;
  }

  // Keep promoted listings at the top
  result.sort((a, b) => {
    if (a.is_promoted === b.is_promoted) return 0;
    return a.is_promoted ? -1 : 1;
  });

  return result;
}, [listings, activeTab, sortBy]);

const executeSearch = (e: React.FormEvent) => {
  e.preventDefault();

  navigate({
    search: {
      q: searchInput || undefined,
      loc: selectedLocation !== "all" ? selectedLocation : undefined,
      cat: cat || undefined,
    },
  });
};
  return (
  <div className="min-h-screen bg-muted/20 text-foreground flex flex-col justify-between">
    <div>
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-primary-foreground">

        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:26px_26px]" />

        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">

          <div className="max-w-4xl mx-auto text-center space-y-6">

            <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide backdrop-blur">
              🇳🇬 Nigeria's Marketplace for Goods & Services
            </span>

            <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight">
              Find Trusted Stores,
              <br />
              Products & Services Near You
            </h1>

            <p className="max-w-2xl mx-auto text-primary-foreground/90 text-base md:text-lg leading-relaxed">
              Shop from verified businesses, discover local services,
              compare prices and connect directly with trusted sellers
              across Nigeria.
            </p>

            <div className="flex flex-wrap justify-center gap-4 pt-3">

              <Button
                asChild
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-8"
              >
                <Link to="/">
                  Browse Listings
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="secondary"
                className="font-bold"
              >
                <Link to="/dashboard">
                  Open Your Shop
                </Link>
              </Button>

            </div>

            <div className="flex flex-wrap justify-center gap-6 pt-8 text-sm">

              <div className="flex items-center gap-2">
                <Icons.Package className="h-5 w-5" />
                <span>
                  <strong>{Number(stats?.total_listings ?? 0).toLocaleString()}</strong> Listings
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Icons.Store className="h-5 w-5" />
                <span>
                  <strong>{Number(stats?.active_shops ?? 0).toLocaleString()}</strong> Shops
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Icons.BadgeCheck className="h-5 w-5" />
                <span>
                  <strong>{Number(stats?.verified_vendors ?? 0).toLocaleString()}</strong> Verified Sellers
                </span>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* STATS */}
      <section className="container mx-auto px-4 -mt-8 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          {[
            {
              label: "Listings",
              val: stats?.total_listings ?? 0,
              icon: Icons.Package,
              color: "text-blue-500 bg-blue-500/10",
            },
            {
              label: "Verified Sellers",
              val: stats?.verified_vendors ?? 0,
              icon: Icons.BadgeCheck,
              color: "text-emerald-500 bg-emerald-500/10",
            },
            {
              label: "Active Shops",
              val: stats?.active_shops ?? 0,
              icon: Icons.Store,
              color: "text-amber-500 bg-amber-500/10",
            },
            {
              label: "Categories",
              val: stats?.active_categories ?? 0,
              icon: Icons.LayoutGrid,
              color: "text-purple-500 bg-purple-500/10",
            },
          ].map((s, i) => {
            const Ic = s.icon;

            return (
              <Card
                key={i}
                className="p-4 rounded-xl bg-background shadow-md border flex items-center gap-4"
              >
                <div className={`hidden sm:flex p-3 rounded-lg ${s.color}`}>
                  <Ic className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xl md:text-2xl font-extrabold">
                    {Number(s.val).toLocaleString()}
                  </p>

                  <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                    {s.label}
                  </p>
                </div>
              </Card>
            );
          })}

        </div>
      </section>

      {/* QUICK CATEGORIES */}
      {quickCategories.length > 0 && (
        <section className="container mx-auto px-4 py-8">

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold uppercase tracking-wide text-muted-foreground">
              Browse Categories
            </h2>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-none snap-x">

            {quickCategories.map((c) => {
              const Ic =
                (Icons as unknown as Record<
                  string,
                  ComponentType<{ className?: string }>
                >)[c.icon] ?? Icons.Tag;

              const active = cat === c.slug;

              return (
                <Link
                  key={c.slug}
                  to="/"
                  search={{ cat: active ? undefined : c.slug }}
                  className={`snap-start shrink-0 flex items-center gap-3 rounded-xl border px-4 py-3 transition-all min-w-[170px]
                  ${
                    active
                      ? "border-accent bg-accent/10"
                      : "bg-background hover:border-primary/50"
                  }`}
                >
                  <Ic className="h-5 w-5 text-primary" />

                  <div>

                    <p className="text-xs font-bold truncate max-w-[120px]">
                      {c.label}
                    </p>

                    <p className="text-[10px] text-muted-foreground">
                      {c.count.toLocaleString()}{" "}
                      {c.count === 1 ? "listing" : "listings"}
                    </p>

                  </div>
                </Link>
              );
            })}

          </div>

        </section>
      )}

        <section className="container mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-4 gap-8">
  {/* SIDEBAR */}
  <aside className="lg:col-span-1 space-y-6">

    {/* TRENDING CATEGORIES */}
    {trendingCategories.length > 0 && (
      <Card className="border shadow-sm overflow-hidden">
        <div className="bg-primary text-primary-foreground px-4 py-3">
          <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Icons.Flame className="h-4 w-4 text-orange-300" />
            Trending Categories
          </h3>
        </div>

        <div className="p-3 space-y-2">
          {trendingCategories.map((tc) => {
            const Ic =
              (Icons as unknown as Record<
                string,
                React.ComponentType<{ className?: string }>
              >)[tc.icon] ?? Icons.Tag;

            return (
              <Link
                key={tc.slug}
                to="/"
                search={{ cat: tc.slug }}
                className="flex items-center gap-3 rounded-xl border p-3 transition-all hover:border-primary hover:bg-primary/5"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Ic className="h-5 w-5 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {tc.label}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {tc.count.toLocaleString()} active listings
                  </p>
                </div>

                <Icons.ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            );
          })}
        </div>
      </Card>
    )}

      

           {/* PLATFORM SUMMARY */}
<Card className="overflow-hidden border shadow-sm">
  <div className="bg-primary text-primary-foreground px-4 py-3">
    <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
      <Icons.BarChart3 className="h-4 w-4" />
      Marketplace Overview
    </h3>
  </div>

  <div className="p-4 space-y-3">

    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Icons.Package className="h-5 w-5 text-blue-600" />
        </div>

        <div>
          <p className="text-sm font-semibold">Listings</p>
          <p className="text-xs text-muted-foreground">
            Active marketplace ads
          </p>
        </div>
      </div>

      <span className="text-lg font-bold">
        {(stats?.total_listings ?? 0).toLocaleString()}
      </span>
    </div>

    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <Icons.Store className="h-5 w-5 text-emerald-600" />
        </div>

        <div>
          <p className="text-sm font-semibold">Shops</p>
          <p className="text-xs text-muted-foreground">
            Active merchant stores
          </p>
        </div>
      </div>

      <span className="text-lg font-bold">
        {(stats?.active_shops ?? 0).toLocaleString()}
      </span>
    </div>

    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <Icons.Users className="h-5 w-5 text-amber-600" />
        </div>

        <div>
          <p className="text-sm font-semibold">Sellers</p>
          <p className="text-xs text-muted-foreground">
            Registered merchants
          </p>
        </div>
      </div>

      <span className="text-lg font-bold">
        {(stats?.verified_vendors ?? 0).toLocaleString()}
      </span>
    </div>

    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
          <Icons.LayoutGrid className="h-5 w-5 text-purple-600" />
        </div>

        <div>
          <p className="text-sm font-semibold">Categories</p>
          <p className="text-xs text-muted-foreground">
            Browse by interest
          </p>
        </div>
      </div>

      <span className="text-lg font-bold">
        {(stats?.active_categories ?? 0).toLocaleString()}
      </span>
    </div>

  </div>
</Card>
</aside>
          // 4. FEATURED SHOPS QUERY
const { data: vendors = [] } = useQuery({
  queryKey: ["featured-shops"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("public_profiles")
      .select("*")
      .not("shop_slug", "is", null) // only users that created a shop
      .neq("shop_slug", "")
      .order("subscription_tier", { ascending: false }) // Premium first
      .order("is_verified", { ascending: false })
      .limit(6);

    if (error) throw error;

    return data ?? [];
  },
});

            {/* CONTROL BAR */}
<div className="bg-background border rounded-2xl shadow-sm p-4">

  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

    <div>
      <h2 className="text-xl font-bold">
        Browse Listings
      </h2>

      <p className="text-sm text-muted-foreground">
        {processedListings.length.toLocaleString()} listing
        {processedListings.length !== 1 ? "s" : ""} available
      </p>
    </div>

    <div className="flex flex-col sm:flex-row gap-3">

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as any)}
      >
        <TabsList className="grid grid-cols-4">

          <TabsTrigger value="all">
            All
          </TabsTrigger>

          <TabsTrigger value="goods">
            Products
          </TabsTrigger>

          <TabsTrigger value="service">
            Services
          </TabsTrigger>

          <TabsTrigger value="featured">
            Featured
          </TabsTrigger>

        </TabsList>
      </Tabs>

      <Select value={sortBy} onValueChange={setSortBy}>
        <SelectTrigger className="w-full sm:w-[190px]">
          <SelectValue placeholder="Sort listings" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="newest">Newest First</SelectItem>
          <SelectItem value="oldest">Oldest First</SelectItem>
          <SelectItem value="popular">Most Viewed</SelectItem>
          <SelectItem value="price-low">
            Price: Low → High
          </SelectItem>
          <SelectItem value="price-high">
            Price: High → Low
          </SelectItem>
        </SelectContent>
      </Select>

    </div>

  </div>

</div>

{/* SPONSORED LISTINGS */}
{processedListings.some((l) => l.is_promoted) && (
  <section className="space-y-4">

    <div className="flex items-center justify-between">

      <h2 className="text-lg font-bold flex items-center gap-2">
        <Icons.BadgeDollarSign className="h-5 w-5 text-amber-500" />
        Sponsored Listings
      </h2>

      <span className="text-xs text-muted-foreground">
        Promoted by sellers
      </span>

    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">

      {processedListings
        .filter((l) => l.is_promoted)
        .slice(0, 10)
        .map((l) => (
          <ListingCard
            key={l.id}
            l={l}
          />
        ))}

    </div>

  </section>
)}

{/* LATEST LISTINGS */}

<section className="space-y-4">

  <div className="flex items-center justify-between">

    <h2 className="text-lg font-bold flex items-center gap-2">
      <Icons.Clock3 className="h-5 w-5 text-primary" />
      Latest Listings
    </h2>

    <span className="text-sm text-muted-foreground">
      Updated regularly
    </span>

  </div>

  {isLoading ? (

    <div className="flex flex-col items-center justify-center py-24">

      <Icons.Loader2 className="h-10 w-10 animate-spin text-primary" />

      <p className="mt-4 text-muted-foreground">
        Loading listings...
      </p>

    </div>

  ) : processedListings.length === 0 ? (

    <Card className="p-12 text-center">

      <Icons.PackageX className="mx-auto h-12 w-12 text-muted-foreground" />

      <h3 className="mt-4 text-lg font-bold">
        No listings found
      </h3>

      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
        We couldn't find anything matching your current filters.
        Try another category, location or browse all listings.
      </p>

      <Button
        className="mt-6"
        onClick={() => {
          setSearchInput("");
          setSelectedLocation("all");
          navigate({ search: {} });
        }}
      >
        Browse All Listings
      </Button>

    </Card>

  ) : (

    <>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">

        {processedListings
          .filter((l) => !l.is_promoted)
          .map((l) => (
            <ListingCard
              key={l.id}
              l={l}
            />
          ))}

      </div>

    </>

  )}

</section>

</div>
</section>
</div>
      {/* FOOTER */}
      <footer className="bg-primary text-primary-foreground/80 mt-16 border-t border-primary-foreground/10">
        <div className="container mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div className="space-y-3 col-span-2 md:col-span-1">
            <span className="text-base font-extrabold text-primary-foreground tracking-wider uppercase">
              Tile Marketplace
            </span>
            <p className="text-xs text-primary-foreground/70 max-w-xs leading-relaxed">
              Nigeria's marketplace for verified goods and trusted local services.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary-foreground border-b border-primary-foreground/10 pb-1">
              Marketplace
            </h4>
            <div className="flex flex-col gap-1.5 text-xs">
              <Link to="/" className="hover:text-white">Browse Listings</Link>
              <Link to="/post-ad" className="hover:text-white">Post an Ad</Link>
              <Link to="/dashboard" className="hover:text-white">Merchant Hub</Link>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary-foreground border-b border-primary-foreground/10 pb-1">
              Company
            </h4>
            <div className="flex flex-col gap-1.5 text-xs">
              <span className="hover:text-white cursor-pointer">About</span>
              <span className="hover:text-white cursor-pointer">Contact</span>
              <span className="hover:text-white cursor-pointer">Privacy Policy</span>
              <span className="hover:text-white cursor-pointer">Terms of Service</span>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary-foreground border-b border-primary-foreground/10 pb-1">
              Follow Us
            </h4>
            <div className="flex gap-3 text-primary-foreground/70">
              <Icons.Facebook className="h-5 w-5 hover:text-white cursor-pointer" />
              <Icons.Instagram className="h-5 w-5 hover:text-white cursor-pointer" />
              <Icons.Twitter className="h-5 w-5 hover:text-white cursor-pointer" />
              <Icons.Linkedin className="h-5 w-5 hover:text-white cursor-pointer" />
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-4 border-t border-primary-foreground/10 text-xs flex justify-between text-primary-foreground/60">
          <span>© {new Date().getFullYear()} Tile Marketplace.</span>
        </div>
      </footer>
    </div>
  );
}
