import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { CATEGORIES, LOCATIONS } from "@/lib/categories";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  id: string;
  subscription_tier: string | null;
  is_verified: boolean | null;

  business_name: string | null;
  full_name: string | null;

  avatar_url?: string | null;
  profile_photo?: string | null;

  shop_slug?: string | null;

  location?: string | null;
  state?: string | null;
  lga?: string | null;

  profession?: string | null;
  avg_rating?: number | null;
  total_sales?: number | null;

  active_listings?: number;
};

function Index() {
  const navigate = useNavigate({ from: "/" });
  const { q, loc, cat } = Route.useSearch();

  // Reference used when jumping to listings after searching
  const listingsRef = useRef<HTMLDivElement>(null);

  // -----------------------------------------
  // PAGE MODE
  // -----------------------------------------
  const isFiltering =
    Boolean(q) ||
    Boolean(cat) ||
    (loc !== undefined && loc !== "all");

  // -----------------------------------------
  // SEARCH STATE
  // -----------------------------------------
  const [searchInput, setSearchInput] = useState(q ?? "");
  const [selectedLocation, setSelectedLocation] = useState(loc ?? "all");

  // Future-ready (we'll later add category search here if needed)
  const [activeTab, setActiveTab] = useState<
    "all" | "goods" | "service" | "featured"
  >("all");

  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "popular" | "price-low" | "price-high"
  >("newest");

  // -----------------------------------------
  // AUTO SCROLL TO RESULTS
  // -----------------------------------------
  useEffect(() => {
    if (!isFiltering) return;

    listingsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [isFiltering, q, loc, cat]);

  // -----------------------------------------
  // KEEP INPUTS IN SYNC WITH URL
  // -----------------------------------------
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
    enabled: !isFiltering, // Only fetch if user is on default homepage
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
      search: (prev) => ({
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

  // Find explicit display text for the active category filter header
  const activeCategoryLabel = useMemo(() => {
    if (!cat) return "";
    return CATEGORIES.find((c) => c.slug === cat)?.label ?? cat;
  }, [cat]);

  return (
  <div className="min-h-screen bg-background flex flex-col">
    <div>
      <SiteHeader />

      {/* ================= HERO ================= */}
      {!isFiltering && (
        <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white">

          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] opacity-10 [background-size:28px_28px]" />

          <div className="container mx-auto px-4 py-20 relative z-10">

            <div className="max-w-5xl mx-auto text-center">

              <span className="inline-flex items-center rounded-full bg-white/15 px-5 py-2 text-sm font-semibold backdrop-blur">
                🇳🇬 Nigeria's Marketplace for Products, Services & Artisans
              </span>

              <h1 className="mt-6 text-5xl md:text-7xl font-black tracking-tight leading-tight">
                Buy.
                <span className="text-accent"> Sell.</span>
                <br />
                Hire Trusted Professionals.
              </h1>

              <p className="mt-6 text-lg md:text-xl max-w-3xl mx-auto text-white/90">
                Find products, verified stores, skilled artisans and local
                professionals across Nigeria — all in one trusted marketplace.
              </p>

              {/* BIG SEARCH BAR */}

              <Card className="mt-10 p-4 bg-white shadow-2xl rounded-2xl">

                <form
                  onSubmit={executeSearch}
                  className="grid lg:grid-cols-[1fr_220px_180px] gap-3"
                >

                  <div className="relative">

                    <Icons.Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />

                    <input
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search products, services or artisans..."
                      className="w-full h-14 rounded-xl border pl-12 pr-4 text-base"
                    />

                  </div>

                  <Select
                    value={selectedLocation}
                    onValueChange={setSelectedLocation}
                  >
                    <SelectTrigger className="h-14 rounded-xl">
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>

                    <SelectContent>

                      <SelectItem value="all">
                        All Nigeria
                      </SelectItem>

                      {LOCATIONS.map((state) => (
                        <SelectItem
                          key={state}
                          value={state}
                        >
                          {state}
                        </SelectItem>
                      ))}

                    </SelectContent>
                  </Select>

                  <Button
                    type="submit"
                    size="lg"
                    className="h-14 font-bold text-base"
                  >
                    Search Marketplace
                  </Button>

                </form>

              </Card>

              {/* QUICK STATS */}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-12">

                <Card className="bg-white/10 border-white/20 backdrop-blur text-white p-5">
                  <p className="text-3xl font-black">
                    {Number(stats?.total_listings ?? 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-white/80">
                    Listings
                  </p>
                </Card>

                <Card className="bg-white/10 border-white/20 backdrop-blur text-white p-5">
                  <p className="text-3xl font-black">
                    {Number(stats?.active_shops ?? 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-white/80">
                    Shops
                  </p>
                </Card>

                <Card className="bg-white/10 border-white/20 backdrop-blur text-white p-5">
                  <p className="text-3xl font-black">
                    {Number(stats?.verified_vendors ?? 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-white/80">
                    Verified Sellers
                  </p>
                </Card>

                <Card className="bg-white/10 border-white/20 backdrop-blur text-white p-5">
                  <p className="text-3xl font-black">
                    {quickCategories.length}
                  </p>
                  <p className="text-sm text-white/80">
                    Categories
                  </p>
                </Card>

              </div>

            </div>

          </div>

        </section>
      )}

      {/* ================= FEATURED STORES ================= */}

      {!isFiltering && verifiedMerchants.length > 0 && (

        <section className="container mx-auto px-4 py-14">

          <div className="flex items-center justify-between mb-8">

            <div>

              <h2 className="text-3xl font-bold">
                Featured Stores
              </h2>

              <p className="text-muted-foreground mt-1">
                Trusted businesses recommended by Tile.
              </p>

            </div>

            <Button asChild variant="outline">
              <Link to="/shops">
                View All Stores
              </Link>
            </Button>

          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

            {verifiedMerchants.map((v) => (

              <Link
                key={v.id}
                to="/shop/$slug"
                params={{ slug: v.shop_slug! }}
                className="group overflow-hidden rounded-2xl border bg-card transition hover:-translate-y-1 hover:shadow-xl"
              >

                <div className="h-28 bg-gradient-to-r from-primary/10 to-primary/5 flex items-center justify-center">

                  {v.avatar_url ? (

                    <img
                      src={v.avatar_url}
                      className="h-20 w-20 rounded-full object-cover border-4 border-white"
                    />

                  ) : (

                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">

                      <Icons.Store className="h-8 w-8 text-primary" />

                    </div>

                  )}

                </div>

                <div className="p-5 text-center">

                  <div className="flex justify-center items-center gap-1">

                    <h3 className="font-bold truncate">
                      {v.business_name || v.full_name}
                    </h3>

                    {v.is_verified && (
                      <Icons.BadgeCheck className="h-4 w-4 text-green-500" />
                    )}

                  </div>

                  <p className="text-xs text-muted-foreground mt-2">
                    {v.location || "Nigeria"}
                  </p>

                </div>

              </Link>

            ))}

          </div>

        </section>

      )}
       {/* ========================================================= */}
{/* 4. POPULAR CATEGORIES */}
{/* ========================================================= */}
{!isFiltering && quickCategories.length > 0 && (
  <section className="container mx-auto px-4 py-10">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold">
          Browse Categories
        </h2>
        <p className="text-muted-foreground text-sm">
          Explore products and services across Nigeria.
        </p>
      </div>

      <Button asChild variant="ghost">
        <Link to="/">View All</Link>
      </Button>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {quickCategories.map((c) => {
        const Ic =
          (Icons as Record<
            string,
            ComponentType<{ className?: string }>
          >)[c.icon] ?? Icons.Tag;

        return (
          <Button
            key={c.slug}
            variant="ghost"
            onClick={() => handleCategoryFilter(c.slug)}
            className="h-auto rounded-2xl border bg-background p-5 flex flex-col gap-3 hover:border-primary hover:shadow-md"
          >
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Ic className="h-6 w-6 text-primary" />
            </div>

            <div>
              <p className="font-semibold">{c.label}</p>
              <p className="text-xs text-muted-foreground">
                {c.count.toLocaleString()} listings
              </p>
            </div>
          </Button>
        );
      })}
    </div>
  </section>
)}

{/* ========================================================= */}
{/* 5. FEATURED STORES */}
{/* ========================================================= */}
{!isFiltering && verifiedMerchants.length > 0 && (
  <section className="container mx-auto px-4 py-10">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold">
          Featured Stores
        </h2>

        <p className="text-muted-foreground text-sm">
          Trusted businesses with active shops.
        </p>
      </div>

      <Button asChild variant="outline">
        <Link to="/shops">
          View All
        </Link>
      </Button>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {verifiedMerchants.map((v) => (
        <Link
          key={v.id}
          to="/shop/$slug"
          params={{ slug: v.shop_slug! }}
          className="rounded-2xl border bg-background hover:shadow-lg transition"
        >
          <div className="h-24 bg-primary/5 flex items-center justify-center">
            {v.avatar_url ? (
              <img
                src={v.avatar_url}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <Icons.Store className="h-10 w-10 text-primary" />
            )}
          </div>

          <div className="p-4 text-center">
            <p className="font-semibold truncate">
              {v.business_name || v.full_name}
            </p>

            <p className="text-xs text-muted-foreground">
              {v.location || "Nigeria"}
            </p>
          </div>
        </Link>
      ))}
    </div>
  </section>
)}

{/* ========================================================= */}
{/* 6. TRENDING PRODUCTS */}
{/* ========================================================= */}
{!isFiltering && trendingListings.length > 0 && (
  <section className="container mx-auto px-4 py-10">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <Icons.Flame className="h-6 w-6 text-orange-500" />
        <h2 className="text-2xl font-bold">
          Trending Listings
        </h2>
      </div>

      <Button asChild variant="ghost">
        <Link to="/">
          View All
        </Link>
      </Button>
    </div>

    <div className="flex gap-4 overflow-x-auto pb-3">
      {trendingListings.map((listing) => (
        <div
          key={listing.id}
          className="w-[230px] shrink-0"
        >
          <ListingCard l={listing} />
        </div>
      ))}
    </div>
  </section>
)}

{/* ========================================================= */}
{/* 7. WHY TILE */}
{/* ========================================================= */}
{!isFiltering && (
  <section className="container mx-auto px-4 py-12">
    <Card className="rounded-3xl border bg-gradient-to-r from-primary/5 to-primary/10 p-8">
      <div className="grid md:grid-cols-3 gap-8 text-center">

        <div>
          <Icons.BadgeCheck className="mx-auto h-10 w-10 text-green-600 mb-3" />
          <h3 className="font-bold">
            Verified Sellers
          </h3>

          <p className="text-sm text-muted-foreground mt-2">
            Trade with merchants that have completed identity verification.
          </p>
        </div>

        <div>
          <Icons.MapPin className="mx-auto h-10 w-10 text-primary mb-3" />
          <h3 className="font-bold">
            Find Nearby
          </h3>

          <p className="text-sm text-muted-foreground mt-2">
            Discover artisans, products and businesses around your location.
          </p>
        </div>

        <div>
          <Icons.Store className="mx-auto h-10 w-10 text-orange-500 mb-3" />
          <h3 className="font-bold">
            Thousands of Listings
          </h3>

          <p className="text-sm text-muted-foreground mt-2">
            Browse products and services from every state in Nigeria.
          </p>
        </div>

      </div>
    </Card>
  </section>
)}

        {/* 7. ALL LISTINGS SECTION & SEARCH RESULTS VIEW CONTAINER */}
<section
  ref={listingsRef}
  className="container mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-8 scroll-mt-16"
>
  {/* SEARCH FILTERS CONTROLS ASIDE */}
  <aside className="lg:col-span-1">
    <div className="lg:sticky lg:top-24 space-y-6">

      {/* TRENDING TOP CATEGORIES */}
      {!isFiltering && trendingCategories.length > 0 && (
        <Card className="border shadow-sm overflow-hidden">
          <div className="bg-primary text-primary-foreground px-4 py-3">
            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Icons.Flame className="h-4 w-4 text-orange-300" />
              Top Categories
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
                    <p className="text-sm font-semibold truncate text-foreground">
                      {tc.label}
                    </p>

                    <div className="inline-flex mt-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                      {tc.count.toLocaleString()} Listings
                    </div>
                  </div>

                  <Icons.ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-auto" />
                </Button>
              );
            })}
          </div>
        </Card>
      )}

      {/* FILTER FORM */}
      <Card className="p-4 border shadow-sm space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Filter Listings
        </h3>

        <form onSubmit={executeSearch} className="space-y-4">

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">
              Keywords
            </label>

            <div className="relative">
              <Icons.Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />

              <input
                type="text"
                placeholder="Search products or services..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-background border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">
              State
            </label>

            <Select
              value={selectedLocation}
              onValueChange={setSelectedLocation}
            >
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder="Select State" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All Nigeria</SelectItem>

                {LOCATIONS.map((locName) => (
                  <SelectItem key={locName} value={locName}>
                    {locName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* QUICK FILTERS */}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">
              Quick Filters
            </label>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={activeTab === "goods" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("goods")}
              >
                Products
              </Button>

              <Button
                type="button"
                variant={activeTab === "service" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("service")}
              >
                Services
              </Button>

              <Button
                type="button"
                variant={activeTab === "featured" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("featured")}
              >
                Featured
              </Button>

              <Button
                type="button"
                variant={activeTab === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("all")}
              >
                All
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full font-bold">
            Apply Filters
          </Button>

          {isFiltering && (
            <Button
              type="button"
              variant="ghost"
              className="w-full text-xs border border-dashed"
              onClick={clearAllFilters}
            >
              Clear Filters
            </Button>
          )}
        </form>
      </Card>

      {/* MARKETPLACE STATS */}

      {!isFiltering && (
        <Card className="p-4 border shadow-sm">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Icons.BarChart3 className="h-5 w-5 text-primary" />
            Marketplace Stats
          </h3>

          <div className="space-y-3 text-sm">

            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Listings
              </span>

              <span className="font-semibold">
                {Number(stats?.total_listings ?? 0).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Shops
              </span>

              <span className="font-semibold">
                {Number(stats?.active_shops ?? 0).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Verified Sellers
              </span>

              <span className="font-semibold text-emerald-600">
                {Number(stats?.verified_vendors ?? 0).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Categories
              </span>

              <span className="font-semibold">
                {quickCategories.length}
              </span>
            </div>

          </div>
        </Card>
      )}

    </div>
  </aside>
          {/* GRID STREAM MAIN FEED CONTAINER */}
          <div className="lg:col-span-3 space-y-6">
            {/* SEARCH RESULTS MODE BREADCRUMB / CONTROLS */}
            <div className="bg-background border rounded-2xl shadow-sm p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  {isFiltering ? (
                    <div className="space-y-1">
                      <Button
                        variant="link"
                        onClick={clearAllFilters}
                        className="h-auto p-0 text-muted-foreground text-xs font-semibold hover:no-underline flex items-center gap-1"
                      >
                        <Icons.ArrowLeft className="h-3 w-3" /> Back to Homepage
                      </Button>
                      <h2 className="text-xl font-black tracking-tight text-foreground">
                        Results for:{" "}
                        <span className="text-primary font-bold">
                          {q ? `"${q}"` : activeCategoryLabel || loc || "Filtered Listings"}
                        </span>
                      </h2>
                    </div>
                  ) : (
                    <h2 className="text-xl font-bold">All Listings</h2>
                  )}
                  
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {processedListings.length.toLocaleString()} listing{processedListings.length !== 1 ? "s" : ""} found
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

            {/* SPONSORED ADS ROW (Landing Mode Only) */}
            {!isFiltering && processedListings.some((l) => l.is_promoted) && (
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
      <Icons.Clock3 className="h-4 w-4 text-primary" />
      Latest Listings
    </h2>

    {!isLoading && (
      <span className="text-xs text-muted-foreground">
        {processedListings.length.toLocaleString()} listing
        {processedListings.length !== 1 ? "s" : ""}
      </span>
    )}
  </div>

  {isLoading ? (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card
          key={i}
          className="h-72 animate-pulse"
        />
      ))}
    </div>
  ) : processedListings.length === 0 ? (
    <Card className="py-14 text-center">
      <Icons.SearchX className="mx-auto h-12 w-12 text-muted-foreground mb-4" />

      <h3 className="text-lg font-bold">
        No listings found
      </h3>

      <p className="text-sm text-muted-foreground mt-2">
        Try changing your search keywords, location or category.
      </p>

      <Button
        className="mt-6"
        onClick={clearAllFilters}
      >
        Browse All Listings
      </Button>
    </Card>
  ) : (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
      {processedListings.map((l) => (
        <ListingCard
          key={l.id}
          l={l}
        />
      ))}
    </div>
  )}
</section>
          </div>
        </section>
      </div>

      <footer className="bg-card border-t py-6 mt-12 text-center text-xs text-muted-foreground">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} Tile Marketplace Nigeria. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
