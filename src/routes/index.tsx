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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tile — Buy, Sell & Hire Across Nigeria" },
      {
        name: "description",
        content:
          "Nigeria's trusted marketplace for buying, selling and hiring. Discover verified shops, products and professional services near you.",
      },
      { property: "og:title", content: "Tile Marketplace" },
      {
        property: "og:description",
        content: "Find trusted products, services and verified merchants across Nigeria.",
      },
      { property: "og:type", content: "website" },
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
  location?: string | null;
  active_listings?: number;
};

function Index() {
  const navigate = useNavigate({ from: "/" });
  const { q, loc, cat } = Route.useSearch();

  // Search & Filters state
  const [searchInput, setSearchInput] = useState(q ?? "");
  const [selectedLocation, setSelectedLocation] = useState(loc ?? "all");

  // Marketplace View state
  const [activeTab, setActiveTab] = useState<"all" | "goods" | "service" | "featured">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "popular" | "price-low" | "price-high">("newest");

  // ==========================
  // 1. LISTINGS QUERY
  // ==========================
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["listings", { q, loc, cat }],
    queryFn: async () => {
      let query = supabase
        .from("listings")
        .select(`
          id, title, price, type, category, description, location, images, is_promoted, views_count, clicks_count, user_id, created_at
        `)
        .eq("status", "approved")
        .limit(150);

      if (q) {
        query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`);
      }
      if (loc && loc !== "all") {
        query = query.eq("location", loc);
      }
      if (cat) {
        query = query.eq("category", cat);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data as Array<ListingCardData & { user_id: string; created_at: string }>) || [];
      const userIds = [...new Set(rows.map((r) => r.user_id))];

      if (!userIds.length) return rows;

      const { data: profiles } = await supabase
        .from("public_profiles")
        .select(`id, subscription_tier, is_verified, business_name, avatar_url, shop_slug`)
        .in("id", userIds);

      const profileMap = new Map(((profiles || []) as ProfileRow[]).map((p) => [p.id, p]));

      return rows
        .map((listing) => ({
          ...listing,
          seller_tier: profileMap.get(listing.user_id)?.subscription_tier ?? null,
          seller_verified: profileMap.get(listing.user_id)?.is_verified ?? false,
          seller_shop: profileMap.get(listing.user_id)?.shop_slug ?? null,
          seller_name: profileMap.get(listing.user_id)?.business_name ?? null,
        }))
        .sort((a, b) => {
          if (a.is_promoted !== b.is_promoted) return a.is_promoted ? -1 : 1;
          if (a.seller_verified !== b.seller_verified) return a.seller_verified ? -1 : 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    },
  });

  // ==========================
  // 2. PLATFORM STATS
  // ==========================
  const { data: stats } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      const [{ count: listingsCount }, { count: shopsCount }, { count: sellersCount }] = await Promise.all([
        supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("shops").select("*", { count: "exact", head: true }),
        supabase.from("public_profiles").select("*", { count: "exact", head: true }),
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
      const { data, error } = await supabase.from("listings").select("category").eq("status", "approved");
      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((item) => {
        if (item.category) {
          counts[item.category] = (counts[item.category] || 0) + 1;
        }
      });

      return Object.entries(counts).map(([category, count]) => ({ category, count }));
    },
  });

  // ==========================
  // 4. FEATURED SHOPS QUERY
  // ==========================
  const { data: vendors = [] } = useQuery({
    queryKey: ["featured-shops"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_profiles")
        .select("*")
        .not("shop_slug", "is", null)
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;

      return (data as ProfileRow[]) ?? [];
    },
  });

  // ==========================
  // 4.5 TRENDING LISTINGS QUERY
  // ==========================
  const { data: trendingListings = [] } = useQuery({
    queryKey: ["trending-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          id, title, price, type, location, images, is_promoted, category, description, views_count, clicks_count, user_id, created_at
        `)
        .eq("status", "approved")
        .order("views_count", { ascending: false })
        .limit(8);

      if (error) throw error;

      const rows = (data as Array<ListingCardData & { user_id: string; created_at: string }>) || [];
      const userIds = [...new Set(rows.map((r) => r.user_id))];

      if (!userIds.length) return rows;

      const { data: profiles } = await supabase
        .from("public_profiles")
        .select(`id, subscription_tier, is_verified, business_name, shop_slug`)
        .in("id", userIds);

      const profileMap = new Map(((profiles || []) as ProfileRow[]).map((p) => [p.id, p]));

      return rows.map((listing) => ({
        ...listing,
        seller_tier: profileMap.get(listing.user_id)?.subscription_tier ?? null,
        seller_verified: profileMap.get(listing.user_id)?.is_verified ?? false,
        seller_shop: profileMap.get(listing.user_id)?.shop_slug ?? null,
        seller_name: profileMap.get(listing.user_id)?.business_name ?? null,
      }));
    },
  });

  // ==========================
  // 5. DERIVED VALUES & MEMOS
  // ==========================
  const quickCategories = useMemo(() => {
    return CATEGORIES.map((category) => {
      const match = catCounts.find((c) => c.category === category.slug);
      return { ...category, count: match?.count ?? 0 };
    });
  }, [catCounts]);

  const processedListings = useMemo(() => {
    let result = [...listings];

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
    }

    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case "price-high":
        result.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case "popular":
        result.sort((a, b) => ((b.views_count ?? 0) + (b.clicks_count ?? 0)) - ((a.views_count ?? 0) + (a.clicks_count ?? 0)));
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "newest":
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    result.sort((a, b) => {
      if (a.is_promoted === b.is_promoted) return 0;
      return a.is_promoted ? -1 : 1;
    });

    return result;
  }, [listings, activeTab, sortBy]);

  const verifiedMerchants = useMemo(
    () => vendors.filter((v) => v.is_verified),
    [vendors]
  );

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
                Find Trusted Stores,<br />Products & Services Near You
              </h1>
              <p className="max-w-2xl mx-auto text-primary-foreground/90 text-base md:text-lg leading-relaxed">
                Shop from verified businesses, discover local services, compare prices and connect directly with trusted sellers across Nigeria.
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-3">
                <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-8">
                  <Link to="/">Browse Listings</Link>
                </Button>
                <Button asChild size="lg" variant="secondary" className="font-bold">
                  <Link to="/dashboard">Open Your Shop</Link>
                </Button>
              </div>

              <div className="flex flex-wrap justify-center gap-6 pt-8 text-sm">
                <div className="flex items-center gap-2">
                  <Icons.Package className="h-5 w-5" />
                  <span><strong>{Number(stats?.total_listings ?? 0).toLocaleString()}</strong> Listings</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icons.Store className="h-5 w-5" />
                  <span><strong>{Number(stats?.active_shops ?? 0).toLocaleString()}</strong> Shops</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icons.BadgeCheck className="h-5 w-5" />
                  <span><strong>{Number(stats?.verified_vendors ?? 0).toLocaleString()}</strong> Verified Sellers</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS ROW */}
        <section className="container mx-auto px-4 -mt-8 relative z-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Listings", val: stats?.total_listings ?? 0, icon: Icons.Package, color: "text-blue-500 bg-blue-500/10" },
              { label: "Verified Sellers", val: stats?.verified_vendors ?? 0, icon: Icons.BadgeCheck, color: "text-emerald-500 bg-emerald-500/10" },
              { label: "Active Shops", val: stats?.active_shops ?? 0, icon: Icons.Store, color: "text-amber-500 bg-amber-500/10" },
              { label: "Categories", val: stats?.active_categories ?? 0, icon: Icons.LayoutGrid, color: "text-purple-500 bg-purple-500/10" },
            ].map((s, i) => {
              const Ic = s.icon;
              return (
                <Card key={i} className="p-4 rounded-xl bg-background shadow-md border flex items-center gap-4">
                  <div className={`hidden sm:flex p-3 rounded-lg ${s.color}`}><Ic className="h-5 w-5" /></div>
                  <div>
                    <p className="text-xl md:text-2xl font-extrabold">{Number(s.val).toLocaleString()}</p>
                    <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">{s.label}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* FEATURED STORES */}
        {verifiedMerchants.length > 0 && (
          <section className="container mx-auto px-4 pt-12 pb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Icons.Store className="h-6 w-6 text-primary" />
                  Featured Stores
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Discover trusted businesses with active listings across Nigeria.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link to="/shops">View All</Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {verifiedMerchants.map((v) => (
                <Link
                  key={v.id}
                  to="/shop/$slug"
                  params={{ slug: v.shop_slug! }}
                  className="group rounded-2xl border bg-background overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="h-24 bg-gradient-to-br from-primary/10 via-primary/5 to-background flex items-center justify-center">
                    {v.avatar_url ? (
                      <img src={v.avatar_url} className="h-14 w-14 rounded-full object-cover border-2 border-background" />
                    ) : (
                      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icons.Store className="h-6 w-6 text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <h3 className="font-bold truncate text-sm">{v.business_name || v.full_name}</h3>
                      {v.is_verified && <Icons.BadgeCheck className="h-4 w-4 text-green-500 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{v.location || "Nigeria"}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* VERIFIED MERCHANTS */}
        {verifiedMerchants.length > 0 && (
          <section className="container mx-auto px-4 py-6">
            <div className="bg-gradient-to-r from-emerald-500/10 via-background to-background border border-emerald-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <Icons.BadgeCheck className="h-3.5 w-3.5" /> Verified Merchants Only
                </div>
                <h3 className="text-xl font-bold tracking-tight">Trade Safely with Verified Merchants</h3>
                <p className="text-sm text-muted-foreground">
                  We review business credentials, historical fulfillment consistency, and identity markers so you can buy items or book trade services with absolute confidence.
                </p>
              </div>
              <Button asChild variant="default" className="bg-emerald-600 hover:bg-emerald-700 font-bold shrink-0">
                <Link to="/shops" search={{ verified: true }}>Find Verified Sellers</Link>
              </Button>
            </div>
          </section>
        )}

        {/* 🔥 TRENDING PRODUCTS */}
        {trendingListings.length > 0 && (
          <section className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Icons.Flame className="h-6 w-6 text-orange-500 animate-pulse" />
                <h2 className="text-2xl font-bold tracking-tight">Trending Products</h2>
              </div>
              <Link to="/" search={{ popular: true }} className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                View All <Icons.ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x">
              {trendingListings.map((l) => (
                <div key={l.id} className="snap-start shrink-0 w-[220px]">
                  <ListingCard l={l} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* BROWSE BY CATEGORY GRID */}
        {quickCategories.length > 0 && (
          <section className="container mx-auto px-4 py-8 bg-muted/30 border-y border-muted-foreground/10 my-6">
            <div className="max-w-4xl mb-6">
              <h2 className="text-2xl font-bold tracking-tight">Browse by Category</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Explore thousands of verified products and services organized explicitly by trade class.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {quickCategories.map((c) => {
                const Ic = (Icons as unknown as Record<string, ComponentType<{ className?: string }>>)[c.icon] ?? Icons.Tag;
                const active = cat === c.slug;
                return (
                  <Link
                    key={c.slug}
                    to="/"
                    search={{ cat: active ? undefined : c.slug }}
                    className={`flex flex-col items-center justify-center text-center rounded-2xl border p-5 transition-all group ${
                      active 
                        ? "border-accent bg-accent/10 ring-2 ring-accent" 
                        : "bg-background hover:border-primary hover:shadow-md hover:-translate-y-0.5"
                    }`}
                  >
                    <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                      <Ic className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm font-bold truncate max-w-[140px] text-foreground">{c.label}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium bg-muted px-2 py-0.5 rounded-full">
                      {c.count.toLocaleString()}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ALL LISTINGS SECTION */}
        <section className="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* SEARCH FILTERS CONTROLS ASIDE */}
          <aside className="lg:col-span-1 space-y-6">
            <Card className="p-4 border shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Filter Listings</h3>
              <form onSubmit={executeSearch} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Keywords</label>
                  <div className="relative">
                    <Icons.Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search items..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="w-full bg-background border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">State Location</label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="w-full bg-background">
                      <SelectValue placeholder="Select Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Nigeria</SelectItem>
                      {LOCATIONS.map((locName) => (
                        <SelectItem key={locName} value={locName}>{locName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full font-bold">Apply Filter</Button>
                { (q || loc || cat) && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full text-xs"
                    onClick={() => {
                      setSearchInput("");
                      setSelectedLocation("all");
                      navigate({ search: {} });
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </form>
            </Card>
          </aside>

          {/* GRID STREAM MAIN FEED CONTAINER */}
          <div className="lg:col-span-3 space-y-6">
            {/* CONTROL BAR */}
            <div className="bg-background border rounded-2xl shadow-sm p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">All Listings</h2>
                  <p className="text-sm text-muted-foreground">
                    {processedListings.length.toLocaleString()} listing{processedListings.length !== 1 ? "s" : ""} available
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                    <TabsList className="grid grid-cols-4">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="goods">Products</TabsTrigger>
                      <TabsTrigger value="service">Services</TabsTrigger>
                      <TabsTrigger value="featured">Featured</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                    <SelectTrigger className="w-full sm:w-[170px]">
                      <SelectValue placeholder="Sort listings" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="popular">Most Viewed</SelectItem>
                      <SelectItem value="price-low">Price: Low → High</SelectItem>
                      <SelectItem value="price-high">Price: High → Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* SPONSORED ADS ROW */}
            {processedListings.some((l) => l.is_promoted) && !cat && !q && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Icons.BadgeDollarSign className="h-4 w-4 text-amber-500" /> Sponsored Listings
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
                  {processedListings.filter((l) => l.is_promoted).slice(0, 4).map((l) => (
                    <ListingCard key={l.id} l={l} />
                  ))}
                </div>
              </section>
            )}

            {/* STANDARD GRID FEED CONTAINER */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Icons.Clock3 className="h-4 w-4 text-primary" /> Regular Feed Stream
                </h2>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <Icons.Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="mt-4 text-muted-foreground">Loading listings...</p>
                </div>
              ) : processedListings.length === 0 ? (
                <Card className="p-12 text-center">
                  <Icons.PackageX className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-bold">No listings found</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                    We couldn't find anything matching your filters. Try modifying your configuration parameters.
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
                  {processedListings.filter((l) => !l.is_promoted).map((l) => (
                    <ListingCard key={l.id} l={l} />
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="bg-primary text-primary-foreground/80 mt-16 border-t border-primary-foreground/10">
        <div className="container mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div className="space-y-3 col-span-2 md:col-span-1">
            <span className="text-base font-extrabold text-primary-foreground tracking-wider uppercase">Tile Marketplace</span>
            <p className="text-xs text-primary-foreground/70 max-w-xs leading-relaxed">
              Nigeria's marketplace for verified goods and trusted local services.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary-foreground border-b border-primary-foreground/10 pb-1">Marketplace</h4>
            <div className="flex flex-col gap-1.5 text-xs">
              <Link to="/" className="hover:text-white">Browse Listings</Link>
              <Link to="/post-ad" className="hover:text-white">Post an Ad</Link>
              <Link to="/dashboard" className="hover:text-white">Merchant Hub</Link>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary-foreground border-b border-primary-foreground/10 pb-1">Company</h4>
            <div className="flex flex-col gap-1.5 text-xs">
              <span className="hover:text-white cursor-pointer">About</span>
              <span className="hover:text-white cursor-pointer">Contact</span>
              <span className="hover:text-white cursor-pointer">Privacy Policy</span>
              <span className="hover:text-white cursor-pointer">Terms of Service</span>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary-foreground border-b border-primary-foreground/10 pb-1">Follow Us</h4>
            <div className="flex gap-3 text-primary-foreground/70">
              <Icons.Facebook className="h-5 w-5 hover:text-white cursor-pointer" />
              <Icons.Instagram className="h-5 w-5 hover:text-white cursor-pointer" />
              <Icons.Twitter className="h-5 w-5 hover:text-white cursor-pointer" />
              <Icons.Linkedin className="h-5 w-5 hover:text-white cursor-pointer" />
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-4 border-t border-primary-foreground/10 text-xs flex justify-between text-primary-foreground/60">
          <span>© {new Date().getFullYear()} Tile. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
