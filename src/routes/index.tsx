import { rpcUntyped } from "@/lib/waitlist-rpc";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { CATEGORIES, LOCATIONS, formatNaira } from "@/lib/categories";
import { getSignedUrl } from "@/lib/storage";
import { fromUntyped } from "@/lib/db-untyped";
import { HeroSearch } from "@/components/hero-search";
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

type SearchListingRow = ListingCardData & {
  user_id: string;
  created_at: string;
  trust_score: number | null;
  seller_tier?: string | null;
  seller_verified?: boolean | null;
  seller_name: string | null;
  seller_shop: string | null;
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
  const [featuredProductImage, setFeaturedProductImage] = useState<string | null>(null);

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
      // Ranking (plan tier → promotion → trust → relevance → recency) happens in the database.
      const { data, error } = await rpcUntyped("search_listings", {
        _q: q || null,
        _location: loc && loc !== "all" ? loc : null,
        _category: cat || null,
        _limit: 150,
      });
      if (error) throw new Error(error.message);
      return ((data as SearchListingRow[]) || []).map((r) => ({
        ...r,
        images: r.images ?? [],
        seller_trust: r.trust_score,
        seller_id: r.user_id,
      }));
    },
  });

  const { data: publicCatalog = [] } = useQuery({
    queryKey: ["public-marketplace-catalog"],
    enabled: !isFiltering,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await rpcUntyped("search_listings", {
        _q: null,
        _location: null,
        _category: null,
        _type: null,
        _limit: 300,
      });
      if (error) throw new Error(error.message);
      return ((data as SearchListingRow[]) ?? []).map((row) => ({
        ...row,
        images: row.images ?? [],
        seller_trust: row.trust_score,
        seller_id: row.user_id,
      }));
    },
  });

  // ==========================
  // 2. PLATFORM STATS
  // ==========================
  const { data: stats } = useQuery({
    queryKey: ["platform-stats"],
    enabled: !isFiltering,
    queryFn: async () => {
      const { data: flags, error: flagsError } = await rpcUntyped("get_public_platform_flags");
      if (flagsError) throw new Error(flagsError.message);
      let listingCountQuery = fromUntyped("listings")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved");
      if ((flags as { launch_mode?: string } | null)?.launch_mode !== "launched") {
        listingCountQuery = listingCountQuery.eq("is_prelaunch", false);
      }
      const [{ count: listingsCount, error: listingsError }, { count: shopsCount }, { count: sellersCount }] = await Promise.all([
        listingCountQuery,
        supabase.from("shops").select("*", { count: "exact", head: true }),
        supabase.from("public_profiles").select("*", { count: "exact", head: true }),
      ]);
      if (listingsError) throw new Error(listingsError.message);

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
  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    publicCatalog.forEach((item) => {
      if (item.category) counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return Object.entries(counts).map(([category, count]) => ({ category, count }));
  }, [publicCatalog]);

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
  const trendingListings = useMemo(
    () => [...publicCatalog]
      .sort((a, b) => (b.views_count ?? 0) - (a.views_count ?? 0))
      .slice(0, 8),
    [publicCatalog],
  );

  const featuredListing = trendingListings[0];
  const featuredImagePath = featuredListing?.images?.[0];
  useEffect(() => {
    if (!featuredImagePath) {
      setFeaturedProductImage(null);
      return;
    }
    let active = true;
    getSignedUrl(featuredImagePath).then((url) => {
      if (active) setFeaturedProductImage(url);
    });
    return () => { active = false; };
  }, [featuredImagePath]);

  // ==========================
  // 4.7 FEATURED ARTISANS QUERY (Trending/Top Professionals)
  // ==========================
  const { data: featuredArtisans = [] } = useQuery({
    queryKey: ["featured-artisans"],
    enabled: !isFiltering,
    queryFn: async () => {
      const { data, error } = await rpcUntyped("search_artisans", {
        _q: null,
        _state: null,
        _lga: null,
        _verified_only: false,
      });
      if (error) throw error;
      return ((data as unknown) as ArtisanRow[]).slice(0, 8);
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
  const featuredStore = verifiedMerchants[0];
  const featuredArtisan = featuredArtisans[0];

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
    <div className="flex min-h-screen flex-col justify-between bg-[#06120d] text-slate-100">
      <div>
        <SiteHeader />

        {/* 1. HERO SECTION */}
        {!isFiltering && (
          <section className="tile-market-hero relative isolate overflow-hidden text-white">
            <div className="tile-market-backdrop" aria-hidden="true" />
            <div className="container relative z-10 mx-auto px-4 py-12 sm:py-16 lg:py-20">
              <div className="grid min-w-0 grid-cols-1 items-center gap-10 lg:grid-cols-[1.14fr_.86fr] xl:gap-14">
                <div className="tile-market-copy min-w-0 w-full space-y-6">
                  <div className="tile-trust-pill"><Icons.BadgeCheck className="h-4 w-4 fill-emerald-400 text-emerald-400" /> Verified Businesses <span>&#8226;</span> Safe <span>&#8226;</span> Reliable</div>
                  <h1 className="max-w-3xl text-4xl font-black leading-[1.04] tracking-tight sm:text-5xl md:text-6xl xl:text-[4.4rem]">
                    Find Trusted Stores,<br /><span>Products &amp; Services</span><br />Near You
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
                    Shop from verified businesses, discover local services, compare prices and connect directly with trusted sellers across Nigeria.
                  </p>
                  <HeroSearch initialQ={q ?? ""} initialLoc={loc ?? "all"} />
                </div>

                <div className="tile-market-showcase min-w-0" role="group" aria-label="Featured local products, stores and artisans">
                  <div className="tile-map-glow" aria-hidden="true"><span /><span /><span /><i /></div>
                  <article className="tile-feature-product">
                    <div className="tile-card-ribbon">&#10024; {featuredListing ? "Trending" : "Popular Finds"}</div>
                    {featuredProductImage ? <img src={featuredProductImage} alt={featuredListing?.title || "Featured local product"} /> : <div className="tile-product-placeholder"><Icons.Package /></div>}
                    <div className="tile-product-info"><strong>{featuredListing?.title || "Find something local"}</strong><b>{featuredListing?.price != null ? formatNaira(featuredListing.price) : "Explore listings"}</b><span><Icons.MapPin /> {featuredListing?.location || "Across Nigeria"}</span></div>
                  </article>
                  <article className="tile-feature-store">
                    <img className="tile-store-photo" src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=85" alt="Modern local shop" />
                    <div className="tile-store-info"><div className="tile-store-mark">{featuredStore?.avatar_url ? <img src={featuredStore.avatar_url} alt="" /> : (featuredStore?.business_name || "Tile").slice(0, 2).toUpperCase()}</div><div><strong>{featuredStore?.business_name || featuredStore?.full_name || "Explore nearby shops"} {featuredStore && <Icons.BadgeCheck />}</strong><span>Local products &amp; services</span><small>Trusted businesses near you</small><em>{featuredStore ? "Verified Store" : "Across Nigeria"}</em></div></div>
                  </article>
                  <article className="tile-feature-artisan">
                    <img src={featuredArtisan?.avatar_url || "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=800&q=85"} alt={featuredArtisan?.full_name ? `Photo of ${featuredArtisan.full_name}` : "Skilled artisan at work"} />
                    <div className="tile-artisan-info"><em>{featuredArtisan ? "Featured Artisan" : "Skilled Professionals"}</em><strong>{featuredArtisan?.full_name || "Find a professional"}</strong><span>{featuredArtisan?.profession || "Trusted services near you"}</span><small><Icons.MapPin /> {featuredArtisan?.lga || featuredArtisan?.state || "Across Nigeria"}{featuredArtisan?.state ? `, ${featuredArtisan.state}` : ""} <Icons.ChevronRight /></small></div>
                  </article>
                  <div className="tile-real-people"><Icons.ShieldCheck /><span>Real People<br />Real Businesses<br />Across Nigeria</span></div>
                  <div className="tile-map-pin tile-map-pin-one"><Icons.MapPin /></div>
                  <div className="tile-map-pin tile-map-pin-two"><Icons.MapPin /></div>
                  <div className="tile-float-icon tile-float-bag"><Icons.ShoppingBag /></div>
                  <div className="tile-float-icon tile-float-tool"><Icons.Wrench /></div>
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
                { label: "Listings", val: stats?.total_listings ?? 0, icon: Icons.Package, color: "text-emerald-300 bg-emerald-300/10" },
                { label: "Verified Sellers", val: stats?.verified_vendors ?? 0, icon: Icons.BadgeCheck, color: "text-teal-300 bg-teal-300/10" },
                { label: "Active Shops", val: stats?.active_shops ?? 0, icon: Icons.Store, color: "text-amber-200 bg-amber-200/10" },
                { label: "Categories", val: quickCategories.length, icon: Icons.LayoutGrid, color: "text-lime-200 bg-lime-200/10" },
              ].map((s, i) => {
                const Ic = s.icon;
                return (
                  <Card key={i} className="group flex items-center gap-3 overflow-hidden rounded-2xl border-[#1b3b2a] bg-gradient-to-br from-[#10241a] to-[#0b1a13] p-3.5 shadow-[0_12px_35px_rgba(0,0,0,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#2c6944] hover:shadow-[0_18px_40px_rgba(0,0,0,0.24)] sm:gap-4 sm:p-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${s.color}`}><Ic className="h-5 w-5" /></div>
                    <div className="min-w-0">
                      <p className="text-xl font-extrabold tracking-tight text-white md:text-2xl">{Number(s.val).toLocaleString()}</p>
                      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 sm:text-[11px]">{s.label}</p>
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
                <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/15 bg-emerald-300/[0.08]"><Icons.Store className="h-5 w-5 text-emerald-300" /></span>
                  Featured Stores
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Discover trusted businesses with active listings across Nigeria.
                </p>
              </div>
              <Button asChild variant="outline" className="rounded-xl border-white/15 bg-white/[0.03] text-slate-200 hover:border-emerald-300/30 hover:bg-white/[0.07] hover:text-white">
                <Link to="/">View All</Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {verifiedMerchants.map((v) => (
                <Link
                  key={v.id}
                  to="/shop/$slug"
                  params={{ slug: v.shop_slug! }}
                  className="group overflow-hidden rounded-2xl border border-[#1b3b2a] bg-gradient-to-b from-[#10241a] to-[#0b1a13] shadow-[0_12px_35px_rgba(0,0,0,0.14)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/30 hover:shadow-[0_20px_45px_rgba(0,0,0,0.26)]"
                >
                  <div className="relative flex h-24 items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_50%_10%,rgba(52,211,153,0.18),transparent_70%),linear-gradient(145deg,#102b1e,#0a1b13)]">
                    <div aria-hidden="true" className="absolute h-20 w-20 rounded-full border border-emerald-300/10" />
                    {v.avatar_url ? (
                      <img src={v.avatar_url} alt={v.business_name || v.full_name || "Store owner"} className="relative h-14 w-14 rounded-2xl border border-emerald-200/30 object-cover shadow-lg transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-200/20 bg-emerald-300/10 text-emerald-200 shadow-lg">
                        <Icons.Store className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <h3 className="truncate text-sm font-bold text-slate-100 transition-colors group-hover:text-emerald-200">{v.business_name || v.full_name}</h3>
                      {v.is_verified && <Icons.BadgeCheck className="h-4 w-4 shrink-0 fill-emerald-300 text-emerald-300" />}
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">{v.location || "Nigeria"}</p>
                    <span className="mt-3 inline-flex items-center gap-1 rounded-full border border-emerald-300/15 bg-emerald-300/[0.06] px-2.5 py-1 text-[10px] font-semibold text-emerald-200"><Icons.BadgeCheck className="h-3 w-3" />Verified business</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 4. VERIFIED TRUST FLAGBANNER */}
        {!isFiltering && verifiedMerchants.length > 0 && (
          <section className="container mx-auto px-4 py-6">
            <div className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-emerald-300/15 bg-[radial-gradient(ellipse_at_0%_50%,rgba(52,211,153,0.13),transparent_55%),linear-gradient(120deg,#10271b,#0a1a12)] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)] md:flex-row md:p-8">
              <div className="space-y-2 max-w-xl text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/15 bg-emerald-300/[0.08] px-3 py-1 text-xs font-semibold text-emerald-200">
                  <Icons.BadgeCheck className="h-3.5 w-3.5" /> Trusted businesses
                </div>
                <h3 className="text-xl font-bold tracking-tight text-white">Trade with confidence</h3>
                <p className="text-sm leading-6 text-slate-400">
                  We review business credentials, historical fulfillment consistency, and identity markers so you can buy items or book trade services with absolute confidence.
                </p>
              </div>
              <Button asChild variant="default" className="h-11 shrink-0 rounded-xl bg-[#35d879] px-5 font-bold text-[#04120a] shadow-[0_8px_24px_rgba(53,216,121,0.18)] hover:bg-[#52e98f]">
                <Link to="/">Find Verified Sellers</Link>
              </Button>
            </div>
          </section>
        )}

        {/* 5. HOT TRENDING PRODUCTS STREAM */}
        {!isFiltering && trendingListings.length > 0 && (
          <section className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-300/15 bg-orange-300/[0.08]"><Icons.Flame className="h-5 w-5 text-orange-300" /></span>
                <h2 className="text-2xl font-bold tracking-tight text-white">Trending Products</h2>
              </div>
              <Link to="/" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
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
          <section className="container mx-auto px-4 py-12 sm:py-14">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <Badge className="mb-3 gap-1 rounded-full border border-emerald-300/15 bg-emerald-300/[0.07] px-3 text-emerald-200">
                  🔥 Trending Professionals
                </Badge>
                <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Find Skilled Artisans Near You
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  Hire verified electricians, plumbers, mechanics, fashion designers,
                  carpenters, photographers, cleaners, painters, welders,
                  technicians and hundreds of skilled professionals across Nigeria.
                </p>
              </div>
              <Button asChild variant="outline" className="self-start rounded-xl border-white/15 bg-white/[0.03] text-slate-200 hover:border-emerald-300/30 hover:bg-white/[0.07] hover:text-white sm:self-center">
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
                  className="group overflow-hidden rounded-3xl border border-[#1b3b2a] bg-gradient-to-b from-[#10241a] to-[#0a1912] shadow-[0_14px_38px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/30 hover:shadow-[0_22px_48px_rgba(0,0,0,0.3)]"
                >
                  <div className="relative flex h-28 items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_50%_15%,rgba(52,211,153,0.2),transparent_65%),linear-gradient(145deg,#102b1e,#0a1912)]">
                    {artisan.avatar_url ? (
                      <img
                        src={artisan.avatar_url}
                        alt={artisan.full_name ? `Photo of ${artisan.full_name}` : "Artisan profile"}
                        className="absolute -bottom-6 h-20 w-20 rounded-2xl border-4 border-[#0d2016] object-cover shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute -bottom-6 flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-[#0d2016] bg-emerald-300/10 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
                        <Icons.UserRound className="h-9 w-9 text-emerald-200" />
                      </div>
                    )}
                  </div>

                  <div className="pt-8 p-5 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-1.5">
                      <h3 className="truncate text-base font-bold text-white transition-colors group-hover:text-emerald-200">
                        {artisan.full_name}
                      </h3>
                    </div>

                    <p className="mt-1 text-sm font-semibold text-emerald-300">
                      {artisan.profession}
                    </p>

                    <p className="mt-2 flex items-center justify-center gap-1 text-xs text-slate-400 sm:justify-start">
                      📍 {[artisan.lga, artisan.state].filter(Boolean).join(", ") || "Nigeria"}
                    </p>

                    <div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-3">
                      <Badge variant="secondary" className="border border-emerald-300/10 bg-emerald-300/[0.06] text-xs font-semibold text-emerald-100">
                        Professional
                      </Badge>
                      <span className="text-xs font-medium text-slate-500 transition-colors group-hover:text-emerald-200">
                        View profile
                      </span>
                    </div>

                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 6.5 POPULAR SERVICES QUICK FILTER STRIP */}
        {!isFiltering && (
          <section className="container mx-auto mb-6 px-4 py-4">
            <div className="rounded-3xl border border-[#1b3b2a] bg-gradient-to-r from-[#0d2117] via-[#0b1a13] to-[#0d2117] px-4 py-5 sm:px-6">
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/80">Find your next hire</p>
                  <h3 className="mt-1 text-lg font-bold tracking-tight text-white">Popular services</h3>
                </div>
                <Icons.Sparkles className="mb-1 h-5 w-5 text-emerald-300/70" />
              </div>
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
                      className="h-10 shrink-0 snap-start rounded-full border border-white/10 bg-white/[0.025] px-5 text-sm font-medium text-slate-200 transition-all hover:-translate-y-0.5 hover:border-emerald-300/35 hover:bg-emerald-300/[0.07] hover:text-white"
                    >
                      <ServiceIcon className="h-4 w-4 text-emerald-300" />
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
          <section className="container mx-auto my-6 px-4 py-4 sm:py-6">
            <div className="rounded-3xl border border-[#1b3b2a] bg-[radial-gradient(ellipse_at_100%_0%,rgba(52,211,153,0.08),transparent_40%),linear-gradient(145deg,#0e2117,#091710)] p-5 sm:p-7">
            <div className="mb-6 max-w-4xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/80">Explore Tile</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">Browse by category</h2>
              <p className="mt-1 text-sm text-slate-400">
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
                    className={`group flex h-auto flex-col items-center justify-center whitespace-normal rounded-2xl border p-4 text-center normal-case transition-all duration-300 hover:-translate-y-0.5 sm:p-5 ${active
                      ? "border-emerald-300/50 bg-emerald-300/[0.1] ring-1 ring-emerald-300/25 hover:bg-emerald-300/[0.1]"
                      : "border-white/[0.07] bg-white/[0.025] hover:border-emerald-300/25 hover:bg-white/[0.05]"
                      }`}
                  >
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.07] transition-colors group-hover:bg-emerald-300/[0.12]">
                      <Ic className="h-6 w-6 text-emerald-300" />
                    </div>
                    <p className="max-w-[140px] truncate text-sm font-bold text-slate-100">{c.label}</p>
                    <p className="mt-1 rounded-full border border-white/[0.06] bg-black/15 px-2 py-0.5 text-xs font-medium text-slate-400">
                      {c.count.toLocaleString()}
                    </p>
                  </Button>
                );
              })}
            </div>
            </div>
          </section>
        )}

        {/* 8. ALL LISTINGS SECTION & SEARCH RESULTS VIEW CONTAINER */}
        <section ref={listingsRef} className="container mx-auto grid scroll-mt-16 grid-cols-1 gap-6 px-4 py-8 lg:grid-cols-4 lg:gap-8">
          {/* SEARCH FILTERS CONTROLS ASIDE */}
          <aside className="lg:col-span-1 space-y-6">
            {/* TRENDING TOP CATEGORIES */}
            {!isFiltering && trendingCategories.length > 0 && (
              <Card className="overflow-hidden rounded-2xl border-[#1b3b2a] bg-gradient-to-b from-[#10241a] to-[#0b1a13] shadow-[0_14px_38px_rgba(0,0,0,0.16)]">
                <div className="border-b border-white/[0.07] bg-white/[0.025] px-4 py-3">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-200">
                    <Icons.Flame className="h-4 w-4 text-emerald-300" /> Top categories
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
                        className="h-auto w-full justify-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-left transition-all hover:border-emerald-300/25 hover:bg-emerald-300/[0.05]"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-300/10 bg-emerald-300/[0.07]">
                          <Ic className="h-5 w-5 text-emerald-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-100">{tc.label}</p>
                          <p className="text-xs text-slate-500">{tc.count.toLocaleString()} active listings</p>
                        </div>
                        <Icons.ChevronRight className="ml-auto h-4 w-4 shrink-0 text-slate-500" />
                      </Button>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* FILTER FORM ASIDE BLOCK */}
            <Card className="space-y-4 rounded-2xl border-[#1b3b2a] bg-gradient-to-b from-[#10241a] to-[#0b1a13] p-4 shadow-[0_14px_38px_rgba(0,0,0,0.16)]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300/80">Narrow your search</p>
                <h3 className="mt-1 text-base font-bold text-white">Filter listings</h3>
              </div>
              <form onSubmit={executeSearch} className="space-y-3">
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">Keywords</label>
                  <div className="relative">
                    <Icons.Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search items..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#08150f] py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-300/50"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400">State location</label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="w-full rounded-xl border-white/10 bg-[#08150f] text-slate-100">
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

                <Button type="submit" className="w-full rounded-xl bg-[#35d879] font-bold text-[#04120a] hover:bg-[#52e98f]">
                  Apply Filters
                </Button>

                {isFiltering && (
                  <Button type="button" variant="ghost" onClick={clearAllFilters} className="w-full text-xs text-slate-400 hover:bg-white/[0.05] hover:text-white">
                    Clear Active Filters
                  </Button>
                )}
              </form>
            </Card>
          </aside>

          {/* MAIN LISTINGS GRID FEED */}
          <main id="market" className="lg:col-span-3 space-y-6">
            <div className="flex flex-col items-start justify-between gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-black tracking-tight text-white">
                  {isFiltering ? `Search Results ${activeCategoryLabel ? `in ${activeCategoryLabel}` : ""}` : "Explore Marketplace Feed"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Showing {processedListings.length} approved listings across chosen filters.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full sm:w-auto">
                  <TabsList className="grid w-full grid-cols-4 rounded-xl border border-white/[0.07] bg-[#0a1912] p-1 sm:w-auto">
                    <TabsTrigger value="all" className="rounded-lg text-xs font-bold text-slate-400 data-[state=active]:bg-emerald-300 data-[state=active]:text-[#06120d]">All</TabsTrigger>
                    <TabsTrigger value="goods" className="rounded-lg text-xs font-bold text-slate-400 data-[state=active]:bg-emerald-300 data-[state=active]:text-[#06120d]">Goods</TabsTrigger>
                    <TabsTrigger value="service" className="rounded-lg text-xs font-bold text-slate-400 data-[state=active]:bg-emerald-300 data-[state=active]:text-[#06120d]">Services</TabsTrigger>
                    <TabsTrigger value="featured" className="rounded-lg text-xs font-bold text-slate-400 data-[state=active]:bg-emerald-300 data-[state=active]:text-[#06120d]">Featured</TabsTrigger>
                  </TabsList>
                </Tabs>

                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-full rounded-xl border-white/10 bg-[#0a1912] text-slate-100 sm:w-[140px]">
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
                  <div key={i} className="h-[280px] animate-pulse rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#10241a] to-[#0a1912]" />
                ))}
              </div>
            ) : processedListings.length === 0 ? (
              <Card className="mx-auto max-w-md space-y-4 rounded-3xl border border-dashed border-white/15 bg-gradient-to-b from-[#10241a] to-[#0b1a13] p-8 text-center sm:p-12">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/10 bg-emerald-300/[0.07]">
                  <Icons.SearchX className="h-6 w-6 text-emerald-300" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-white">No items match your criteria</h4>
                  <p className="text-xs leading-5 text-slate-400">Try loosening search keywords, selecting standard categories, or switching states.</p>
                </div>
                <Button size="sm" onClick={clearAllFilters} className="rounded-xl bg-[#35d879] font-semibold text-[#04120a] hover:bg-[#52e98f]">Reset All View Filters</Button>
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
      <footer className="border-t border-white/[0.07] bg-[#050f0a] px-4 py-7 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} Tile Marketplace. Connecting trustworthy commercial hubs safely across Nigeria.</p>
      </footer>
    </div>
  );
}
