import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { CATEGORIES, LOCATIONS } from "@/lib/categories";
import { HeroSearch } from "@/components/hero-search";
import { LiveActivityFeed } from "@/components/live-activity-feed";
import { AnimatedCounter } from "@/components/animated-counter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  id: string | null;
  subscription_tier: string | null;
  is_verified: boolean | null;
  business_name: string | null;
  full_name: string | null;
  avatar_url?: string | null;
  shop_slug?: string | null;
  location?: string | null;
  active_listings?: number;
};

type ArtisanRow = {
  id: string | null;
  full_name: string | null;
  profession: string | null;
  avatar_url: string | null;
  state: string | null;
  lga: string | null;
};

const POPULAR_SERVICES = [
  { label: "Electricians", slug: "electrician", icon: "Plug" },
  { label: "Plumbers", slug: "plumber", icon: "Droplet" },
  { label: "Mechanics", slug: "mechanic", icon: "Wrench" },
  { label: "Cleaners", slug: "cleaner", icon: "Sparkles" },
  { label: "Painters", slug: "painter", icon: "Paintbrush" },
  { label: "Carpenters", slug: "carpenter", icon: "Hammer" },
  { label: "Hair Stylists", slug: "hair-stylist", icon: "Scissors" },
  { label: "Photographers", slug: "photographer", icon: "Camera" },
  { label: "Fashion Designers", slug: "fashion-designer", icon: "Shirt" },
  { label: "Web Developers", slug: "web-developer", icon: "Laptop" },
];

function Index() {
  const navigate = useNavigate({ from: "/" });
  const { q, loc, cat } = Route.useSearch();
  const listingsRef = useRef<HTMLDivElement>(null);

  // Derived filter state flag
  const isFiltering = Boolean(q) || Boolean(cat) || (loc && loc !== "all");

  // Search & Filters local input state
  const [searchInput, setSearchInput] = useState(q ?? "");
  const [selectedLocation, setSelectedLocation] = useState(loc ?? "all");

  // Marketplace Feed state
  const [activeTab, setActiveTab] = useState<"all" | "goods" | "service" | "featured">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "popular" | "price-low" | "price-high">("newest");

  // Smooth scroll to listings container when search params update
  useEffect(() => {
    if (!isFiltering) return;

    listingsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [q, cat, loc, isFiltering]);

  // Synchronize inputs when query properties reset or change elsewhere
  useEffect(() => {
    setSearchInput(q ?? "");
    setSelectedLocation(loc ?? "all");
  }, [q, loc]);

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
        .from("shops")
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
    enabled: !isFiltering,
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
    enabled: !isFiltering,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shops")
        .select("id, subscription_tier, is_verified, business_name, full_name, avatar_url, shop_slug, location, created_at")
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
    enabled: !isFiltering,
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
        .from("shops")
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
  // 4.7 FEATURED ARTISANS QUERY (Trending/Top Professionals)
  // ==========================
  const { data: featuredArtisans = [] } = useQuery({
    queryKey: ["featured-artisans"],
    enabled: !isFiltering,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_profiles")
        .select(`
          id,
          full_name,
          profession,
          avatar_url,
          state,
          lga
        `)
        .not("profession", "is", null)
        .order("full_name")
        .limit(8);

      if (error) throw error;
      return ((data as unknown) as ArtisanRow[]) ?? [];
    },
  });

  // ==========================
  // 5. DERIVED VALUES & MEMOS
  // ==========================
  const quickCategories = useMemo(() => {
    return CATEGORIES.map((category) => {
      const match = catCounts.find((c) => c.category === category.slug);
      return { ...category, count: match?.count ?? 0 };
    }).filter((category) => category.count > 0);
  }, [catCounts]);

  const trendingCategories = useMemo(() => {
    return [...quickCategories]
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [quickCategories]);

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

  const handleCategoryFilter = (slug: string) => {
    const isCurrentCat = cat === slug;
    navigate({
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        cat: isCurrentCat ? undefined : slug,
      }),
    });
  };

  const clearAllFilters = () => {
    setSearchInput("");
    setSelectedLocation("all");
    navigate({ search: {} });
  };

  const activeCategoryLabel = useMemo(() => {
    if (!cat) return "";
    return CATEGORIES.find((c) => c.slug === cat)?.label ?? cat;
  }, [cat]);

  return (
    <div className="min-h-screen bg-muted/20 text-foreground flex flex-col justify-between">
      <div>
        <SiteHeader />

        {/* 1. HERO SECTION */}
        {!isFiltering && (
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
                <div className="pt-4">
                  <HeroSearch initialQ={q ?? ""} initialLoc={loc ?? "all"} />
                </div>
                <p className="mt-8 mb-4 text-xs uppercase tracking-[0.2em] text-primary-foreground/70 font-semibold">
                  Choose Your Experience
                </p>
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">

                  {/* Marketplace Card */}
                  <Link
                    to="/#market"
                    className="group rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-5 hover:bg-white/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                        <Icons.Store className="h-6 w-6 text-white" />
                      </div>

                      <div className="flex-1">
                        <h3 className="font-bold text-lg">
                          Marketplace
                        </h3>

                        <p className="text-sm text-primary-foreground/80 mt-1">
                          Buy & sell products from trusted shops across Nigeria.
                        </p>

                        <div className="mt-4 flex items-center text-sm font-semibold">
                          Explore Marketplace
                          <Icons.ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Services Card */}
                  <Link
                    to="/artisans"
                    className="group rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-5 hover:bg-white/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                        <Icons.Hammer className="h-6 w-6 text-white" />
                      </div>

                      <div className="flex-1">
                        <h3 className="font-bold text-lg">
                          Hire Professionals
                        </h3>

                        <p className="text-sm text-primary-foreground/80 mt-1">
                          Find verified artisans and skilled professionals near you.
                        </p>

                        <div className="mt-4 flex items-center text-sm font-semibold">
                          Browse Artisans
                          <Icons.ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </div>
                  </Link>

                </div>
                

                <div className="flex flex-wrap justify-center gap-6 pt-8 text-sm">
                  <div className="flex items-center gap-2">
                    <Icons.Package className="h-5 w-5" />
                    <span>Explore <strong><AnimatedCounter value={stats?.total_listings ?? 0} /></strong> Listings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icons.Store className="h-5 w-5" />
                    <span><strong><AnimatedCounter value={stats?.active_shops ?? 0} /></strong> Shops</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icons.BadgeCheck className="h-5 w-5" />
                    <span><strong><AnimatedCounter value={stats?.verified_vendors ?? 0} /></strong> Verified Sellers</span>
                  </div>
                </div>
                <div className="pt-6 max-w-2xl mx-auto text-left">
                  <LiveActivityFeed />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 2. STATS ROW SUMMARY CARD */}
        {!isFiltering && (
          <section className="container mx-auto px-4 -mt-8 relative z-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Listings", val: stats?.total_listings ?? 0, icon: Icons.Package, color: "text-blue-500 bg-blue-500/10" },
                { label: "Verified Sellers", val: stats?.verified_vendors ?? 0, icon: Icons.BadgeCheck, color: "text-emerald-500 bg-emerald-500/10" },
                { label: "Active Shops", val: stats?.active_shops ?? 0, icon: Icons.Store, color: "text-amber-500 bg-amber-500/10" },
                { label: "Categories", val: quickCategories.length, icon: Icons.LayoutGrid, color: "text-purple-500 bg-purple-500/10" },
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
        )}

        {/* 3. FEATURED STORES */}
        {!isFiltering && verifiedMerchants.length > 0 && (
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

        {/* 4. VERIFIED TRUST FLAGBANNER */}
        {!isFiltering && verifiedMerchants.length > 0 && (
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

        {/* 5. HOT TRENDING PRODUCTS STREAM */}
        {!isFiltering && trendingListings.length > 0 && (
          <section className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Icons.Flame className="h-6 w-6 text-orange-500 animate-pulse" />
                <h2 className="text-2xl font-bold tracking-tight">Trending Products</h2>
              </div>
              <Link to="/" search={{ sortBy: "popular" }} className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
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

        {/* 6. FEATURED PROFESSIONALS & ARTISANS (Trending Professionals) */}
        {!isFiltering && featuredArtisans.length > 0 && (
          <section className="container mx-auto px-4 py-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <Badge className="mb-3 bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 gap-1">
                  🔥 Trending Professionals
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                  Find Skilled Artisans Near You
                </h2>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                  Hire verified electricians, plumbers, mechanics, fashion designers,
                  carpenters, photographers, cleaners, painters, welders,
                  technicians and hundreds of skilled professionals across Nigeria.
                </p>
              </div>
              <Button asChild variant="outline" className="self-start sm:self-center">
                <Link to="/artisans">
                  Browse All Artisans
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredArtisans.map((artisan) => (
                <Link
                  key={artisan.id}
                  to="/artisans/$id"
                  params={{ id: artisan.id ?? "" }}
                  className="group rounded-3xl border bg-card overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="h-28 bg-gradient-to-r from-primary/10 to-primary/5 flex items-center justify-center relative">
                    {artisan.avatar_url ? (
                      <img
                        src={artisan.avatar_url}
                        className="h-20 w-20 rounded-full object-cover border-4 border-background absolute -bottom-6 shadow-sm"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-background border-4 border-background flex items-center justify-center absolute -bottom-6 shadow-sm">
                        <Icons.UserRound className="h-10 w-10 text-primary" />
                      </div>
                    )}
                  </div>

                  <div className="pt-8 p-5 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-1.5">
                      <h3 className="font-bold truncate text-base">
                        {artisan.full_name}
                      </h3>
                    </div>

                    <p className="text-sm font-medium text-primary mt-1">
                      {artisan.profession}
                    </p>

                    <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center sm:justify-start gap-1">
                      📍 {[artisan.lga, artisan.state].filter(Boolean).join(", ") || "Nigeria"}
                    </p>

                    <div className="flex items-center justify-between mt-5 pt-3 border-t border-muted">
                      <Badge variant="secondary" className="font-bold text-xs">
                        Professional
                      </Badge>
                      <span className="text-xs font-medium text-muted-foreground">
                        View profile
                      </span>
                    </div>

                    <div className="text-xs text-primary font-bold mt-4 text-right opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-0.5">
                      View Profile <Icons.ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 6.5 POPULAR SERVICES QUICK FILTER STRIP */}
        {!isFiltering && (
          <section className="container mx-auto px-4 py-4 mb-6">
            <div className="border-t border-b border-muted py-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                Popular Services
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
                {POPULAR_SERVICES.map((service) => {
                  const ServiceIcon = (Icons as unknown as Record<string, ComponentType<{ className?: string }>>)[service.icon] ?? Icons.Wrench;
                  return (
                    <Button
                      key={service.slug}
                      variant="outline"
                      onClick={() => {
                        navigate({
                          search: (prev: Record<string, unknown>) => ({
                            ...prev,
                            q: service.label,
                          }),
                        });
                      }}
                      className="rounded-full flex items-center gap-2 h-10 px-5 shrink-0 hover:border-primary hover:bg-primary/5 transition-all text-sm font-medium snap-start"
                    >
                      <ServiceIcon className="h-4 w-4 text-primary" />
                      {service.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* 7. BROWSE BY CATEGORY GRID */}
        {!isFiltering && quickCategories.length > 0 && (
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
                  <Button
                    key={c.slug}
                    variant="ghost"
                    onClick={() => handleCategoryFilter(c.slug)}
                    className={`h-auto flex flex-col items-center justify-center text-center rounded-2xl border p-5 transition-all group normal-case whitespace-normal ${active
                      ? "border-accent bg-accent/10 ring-2 ring-accent hover:bg-accent/10"
                      : "bg-background hover:border-primary hover:shadow-md hover:bg-background"
                      }`}
                  >
                    <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                      <Ic className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm font-bold truncate max-w-[140px] text-foreground">{c.label}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium bg-muted px-2 py-0.5 rounded-full">
                      {c.count.toLocaleString()}
                    </p>
                  </Button>
                );
              })}
            </div>
          </section>
        )}

        {/* 8. ALL LISTINGS SECTION & SEARCH RESULTS VIEW CONTAINER */}
        <section ref={listingsRef} className="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-8 scroll-mt-16">
          {/* SEARCH FILTERS CONTROLS ASIDE */}
          <aside className="lg:col-span-1 space-y-6">
            {/* TRENDING TOP CATEGORIES */}
            {!isFiltering && trendingCategories.length > 0 && (
              <Card className="border shadow-sm overflow-hidden">
                <div className="bg-primary text-primary-foreground px-4 py-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                    <Icons.Flame className="h-4 w-4 text-orange-300" /> Top Categories
                  </h3>
                </div>
                <div className="p-3 space-y-2">
                  {trendingCategories.map((tc) => {
                    const Ic = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[tc.icon] ?? Icons.Tag;
                    return (
                      <Button
                        key={tc.slug}
                        variant="ghost"
                        onClick={() => handleCategoryFilter(tc.slug)}
                        className="w-full h-auto justify-start flex items-center gap-3 rounded-xl border p-3 text-left transition-all hover:border-primary hover:bg-primary/5"
                      >
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Ic className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate text-foreground">{tc.label}</p>
                          <p className="text-xs text-muted-foreground">{tc.count.toLocaleString()} active listings</p>
                        </div>
                        <Icons.ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-auto" />
                      </Button>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* FILTER FORM ASIDE BLOCK */}
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
                      {LOCATIONS.map((l) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full font-bold">
                  Apply Filters
                </Button>

                {isFiltering && (
                  <Button type="button" variant="ghost" onClick={clearAllFilters} className="w-full text-xs">
                    Clear Active Filters
                  </Button>
                )}
              </form>
            </Card>
          </aside>

          {/* MAIN LISTINGS GRID FEED */}
          <main id="market" className="lg:col-span-3 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
              <div>
                <h2 className="text-xl font-black tracking-tight">
                  {isFiltering ? `Search Results ${activeCategoryLabel ? `in ${activeCategoryLabel}` : ""}` : "Explore Marketplace Feed"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Showing {processedListings.length} approved listings across chosen filters.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full sm:w-auto">
                  <TabsList className="grid grid-cols-4 w-full sm:w-auto">
                    <TabsTrigger value="all" className="text-xs font-bold">All</TabsTrigger>
                    <TabsTrigger value="goods" className="text-xs font-bold">Goods</TabsTrigger>
                    <TabsTrigger value="service" className="text-xs font-bold">Services</TabsTrigger>
                    <TabsTrigger value="featured" className="text-xs font-bold">Featured</TabsTrigger>
                  </TabsList>
                </Tabs>

                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-full sm:w-[140px] bg-background">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="popular">Popularity</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 py-12">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-[280px] bg-muted animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : processedListings.length === 0 ? (
              <Card className="p-12 text-center max-w-md mx-auto space-y-4 border border-dashed rounded-2xl">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Icons.SearchX className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold">No items match your criteria</h4>
                  <p className="text-xs text-muted-foreground">Try loosening search keywords, selecting standard categories, or switching states.</p>
                </div>
                <Button size="sm" onClick={clearAllFilters}>Reset All View Filters</Button>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {processedListings.map((l) => (
                  <ListingCard key={l.id} l={l} />
                ))}
              </div>
            )}
          </main>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="bg-muted/40 border-t py-6 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Tile Marketplace. Connecting trustworthy commercial hubs safely across Nigeria.</p>
      </footer>
    </div>
  );
}
