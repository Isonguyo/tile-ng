import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { CATEGORIES, LOCATIONS } from "@/lib/categories";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

type ArtisanRow = {
  id: string;
  full_name: string | null;
  business_name: string | null;
  avatar_url: string | null;
  location: string | null;
  shop_slug: string | null;
  is_verified: boolean | null;
  artisan_profiles: {
    profession: string | null;
    rating: number | null;
    completed_jobs: number | null;
    years_experience: number | null;
  } | null;
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

  const isFiltering = Boolean(q) || Boolean(cat) || (loc && loc !== "all");

  const [searchInput, setSearchInput] = useState(q ?? "");
  const [selectedLocation, setSelectedLocation] = useState(loc ?? "all");

  // Local state for the dedicated artisan search bar
  const [artisanQuery, setArtisanQuery] = useState("");
  const [artisanState, setArtisanState] = useState("all");

  const [activeTab, setActiveTab] = useState<"all" | "goods" | "service" | "featured">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "popular" | "price-low" | "price-high">("newest");

  useEffect(() => {
    if (!isFiltering) return;

    listingsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [q, cat, loc, isFiltering]);

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
  // 4.7 FEATURED ARTISANS QUERY (Cleaned Join & Scalable Limit)
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
          business_name,
          avatar_url,
          location,
          shop_slug,
          is_verified,
          artisan_profiles(
            profession,
            rating,
            completed_jobs,
            years_experience
          )
        `)
        .eq("account_type", "artisan")
        .not("shop_slug", "is", null)
        .limit(8);

      if (error) throw error;
      return (data as unknown as ArtisanRow[]) ?? [];
    },
  });

  const quickCategories = useMemo(() => {
    return CATEGORIES.map((category) => {
      const match = catCounts.find((c) => c.category === category.slug);
      return { ...category, count: match?.count ?? 0 };
    }).filter((category) => category.count > 0);
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

  const handleArtisanSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      to: "/artisans",
      search: {
        profession: artisanQuery || undefined,
        location: artisanState !== "all" ? artisanState : undefined,
      },
    });
  };

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
                
                {/* 9. DEDICATED ARTISAN QUICK SEARCH BAR */}
                <Card className="p-2 max-w-2xl mx-auto bg-background/95 backdrop-blur shadow-xl border-none mt-8 text-foreground">
                  <form onSubmit={handleArtisanSearch} className="flex flex-col sm:flex-row items-center gap-2">
                    <div className="flex items-center flex-1 w-full px-2 gap-2">
                      <Icons.Search className="h-5 w-5 text-muted-foreground shrink-0" />
                      <Input
                        type="text"
                        placeholder="What service do you need? (e.g. Plumber)"
                        value={artisanQuery}
                        onChange={(e) => setArtisanQuery(e.target.value)}
                        className="border-none focus-visible:ring-0 shadow-none text-base"
                      />
                    </div>
                    <div className="w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-muted py-1 sm:py-0 px-2">
                      <Select value={artisanState} onValueChange={setArtisanState}>
                        <SelectTrigger className="border-none bg-transparent focus:ring-0 shadow-none w-full sm:w-[150px]">
                          <SelectValue placeholder="Select State" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Nigeria</SelectItem>
                          {LOCATIONS.map((l) => (
                            <SelectItem key={l.slug} value={l.slug}>{l.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit" className="w-full sm:w-auto font-bold bg-accent hover:bg-accent/90 text-accent-foreground px-6">
                      Find Artisan
                    </Button>
                  </form>
                </Card>

                <div className="flex flex-wrap justify-center gap-6 pt-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Icons.Package className="h-5 w-5" />
                    <span>Explore <strong>{Number(stats?.total_listings ?? 0).toLocaleString()}</strong> Listings</span>
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

        {/* 6. FEATURED PROFESSIONALS & ARTISANS */}
        {!isFiltering && featuredArtisans.length > 0 && (
          <section className="container mx-auto px-4 py-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <Badge className="mb-3 bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 gap-1">
                  🔥 Top Rated Artisans
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                  Find Skilled Artisans Near You
                </h2>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                  Hire verified professionals with credentials checked for identity markers and historical fulfillment.
                </p>
              </div>
              <Button asChild variant="outline" className="self-start sm:self-center">
                <Link to="/artisans">
                  View All →
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredArtisans.map((artisan) => (
                <Link
                  key={artisan.id}
                  to="/artisan/$slug"
                  params={{ slug: artisan.shop_slug! }}
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
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                      <h3 className="font-bold truncate text-base">
                        {artisan.business_name || artisan.full_name}
                      </h3>
                      {artisan.is_verified && (
                        <Badge variant="secondary" className="bg-green-500/10 text-green-700 font-bold text-[10px] px-1.5 py-0">
                          ✓ Verified
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm font-medium text-primary mt-1 capitalize">
                      {artisan.artisan_profiles?.profession || "Handyman"}
                    </p>

                    <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center sm:justify-start gap-1">
                      📍 {artisan.location || "Nigeria"}
                    </p>

                    {/* 7. REFACTORED FEATURED BADGES */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-muted text-left">
                      <div className="text-xs font-semibold text-muted-foreground">
                        ⭐ {artisan.artisan_profiles?.rating ? `${artisan.artisan_profiles.rating.toFixed(1)} Rating` : "New Profile"}
                      </div>
                      <div className="text-xs font-semibold text-muted-foreground text-right">
                        💼 {artisan.artisan_profiles?.completed_jobs ?? 0} Jobs Completed
                      </div>
                      <div className="text-[11px] text-muted-foreground col-span-2">
                        ⏳ {artisan.artisan_profiles?.years_experience ?? 0} Years Experience
                      </div>
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
                      asChild
                      className="rounded-full snap-start shrink-0"
                    >
                      <Link to="/artisans" search={{ profession: service.slug }}>
                        <ServiceIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        {service.label}
                      </Link>
                    </Button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* 8. BECOME AN ARTISAN CALL-TO-ACTION */}
        {!isFiltering && (
          <section className="container mx-auto px-4 py-12">
            <Card className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground p-8 md:p-12 rounded-3xl relative overflow-hidden shadow-lg">
              <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
                <Icons.Wrench className="w-64 h-64" />
              </div>
              <div className="max-w-2xl space-y-4 relative z-10 text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-black">Are you a skilled professional?</h3>
                <p className="text-primary-foreground/80 text-sm md:text-base">
                  Join thousands of electricians, mechanics, photographers, and artisans finding premium customers daily on Tile. Get verified badges to earn trust immediately.
                </p>
                <div className="pt-2">
                  <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-8 rounded-xl">
                    <Link to="/register" search={{ type: "artisan" }}>Become an Artisan</Link>
                  </Button>
                </div>
              </div>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
