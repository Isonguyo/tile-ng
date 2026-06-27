import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { CATEGORIES } from "@/lib/categories";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ComponentType } from "react";
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

const searchSchema = z.object({
  q: z.string().optional(),
  loc: z.string().optional(),
  cat: z.string().optional(),
});

type Search = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tile — Buy, Sell & Hire across Nigeria" },
      {
        name: "description",
        content: "The premium classifieds marketplace for verified goods and professional services across Nigeria.",
      },
      { property: "og:title", content: "Tile Marketplace" },
      {
        property: "og:description",
        content: "Buy, sell, and hire across Nigeria with trusted local vendors.",
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
};

function Index() {
  const navigate = useNavigate({ from: "/" });
  const { q, loc, cat } = Route.useSearch();

  const [searchInput, setSearchInput] = useState(q ?? "");
  const [selectedLocation, setSelectedLocation] = useState(loc ?? "all");
  const [activeTab, setActiveTab] = useState<"all" | "goods" | "service" | "featured">("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // 1. LISTINGS QUERY
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
          location,
          images,
          is_promoted,
          category,
          description,
          views_count,
          clicks_count,
          user_id,
          created_at
        `)
        .eq("status", "approved")
        .limit(120);

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
      const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];

      if (!userIds.length) return rows;

      const { data: profiles } = await supabase
        .from("public_profiles")
        .select("id, subscription_tier, is_verified")
        .in("id", userIds);

      const profileMap = new Map(((profiles || []) as ProfileRow[]).map((p) => [p.id, p]));

      return rows.map((row) => ({
        ...row,
        seller_tier: profileMap.get(row.user_id)?.subscription_tier ?? null,
        seller_verified: profileMap.get(row.user_id)?.is_verified ?? false,
      }));
    },
  });

  // 2. PLATFORM STATS QUERY
  const { data: stats } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      const [{ count: listingsCount }, { count: shopsCount }, { count: sellersCount }] =
        await Promise.all([
          supabase.from("listings").select("*", { count: "exact", head: true }),
          supabase.from("shops").select("*", { count: "exact", head: true }),
          supabase.from("profiles").select("*", { count: "exact", head: true }),
        ]);

      return {
        total_listings: listingsCount || 0,
        active_shops: shopsCount || 0,
        verified_vendors: sellersCount || 0,
        active_categories: CATEGORIES.length,
      };
    },
  });

  // 3. CATEGORY COUNTS QUERY
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
        if (!item.category) return;
        counts[item.category] = (counts[item.category] || 0) + 1;
      });

      return Object.entries(counts).map(([category, count]) => ({
        category,
        count,
      }));
    },
  });

  // 4. TOP VENDORS QUERY
  const { data: vendors = [] } = useQuery({
    queryKey: ["top-vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_profiles")
        .select("*")
        .limit(6);

      if (error) throw error;
      return data || [];
    },
  });

  // 5. DERIVED VALUES & MEMOS FOR THE JSX
  const states = useMemo(() => [
    { name: "Lagos" }, { name: "Abuja" }, { name: "Oyo" }, { name: "Rivers" }, { name: "Kano" }
  ], []);

  const quickCategories = useMemo(() => {
    return CATEGORIES.map(cat => {
      const match = catCounts.find(c => c.category === cat.slug);
      return { ...cat, count: match ? match.count : 0 };
    });
  }, [catCounts]);

  const trendingCategories = useMemo(() => {
    return quickCategories.filter(c => c.count > 0).slice(0, 5);
  }, [quickCategories]);

  const processedListings = useMemo(() => {
    let result = [...listings];
    
    if (activeTab !== "all") {
      result = result.filter(l => l.type === activeTab);
    }

    if (sortBy === "price-low") result.sort((a, b) => a.price - b.price);
    else if (sortBy === "price-high") result.sort((a, b) => b.price - a.price);
    else result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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
            {trendingCategories.length > 0 && (
              <Card className="p-4 bg-background border shadow-sm space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Icons.Flame className="h-4 w-4 text-orange-500" />
                  Trending Categories
                </h3>

                <div className="space-y-2">
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
                        className="flex items-center gap-3 p-2 rounded-lg bg-muted/40 border border-transparent hover:border-border transition"
                      >
                        <Ic className="h-4 w-4 text-primary" />
                        <div className="flex-1">
                          <p className="text-xs font-bold">{tc.label}</p>
                          <p className="text-[10px] text-muted-foreground font-semibold">
                            {tc.count} active
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* PLATFORM SUMMARY */}
            <Card className="p-4 bg-background border shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Platform Summary
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Listings</span>
                  <span className="font-bold">{stats?.total_listings ?? 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shops</span>
                  <span className="font-bold">{stats?.active_shops ?? 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Sellers</span>
                  <span className="font-bold">{stats?.verified_vendors ?? 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Categories</span>
                  <span className="font-bold">{stats?.active_categories ?? 0}</span>
                </div>
              </div>
            </Card>
          </aside>

          {/* MAIN CONTENT */}
          <div className="lg:col-span-3 space-y-8">
            {/* TOP SHOPS */}
            {vendors.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Icons.Store className="h-4 w-4 text-primary" />
                  Featured Shops
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vendors.map((v) => (
                    <Link
                      key={v.id}
                      to="/shop/$slug"
                      params={{ slug: v.shop_slug ?? "" }}
                      className="p-4 bg-background border rounded-xl shadow-sm hover:shadow-md transition flex items-center gap-4"
                    >
                      <div className="h-12 w-12 rounded-xl bg-primary/10 grid place-items-center overflow-hidden">
                        {v.avatar_url ? (
                          <img src={v.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Icons.Store className="h-5 w-5 text-primary" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">
                          {v.business_name || v.full_name || "Shop"}
                        </p>
                        <div className="flex items-center justify-between mt-1 text-[11px] text-muted-foreground">
                          <span>
                            {v.active_listings} listing
                            {v.active_listings !== 1 ? "s" : ""}
                          </span>
                          {v.is_verified && <Icons.BadgeCheck className="h-4 w-4 text-green-500" />}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* CONTROL BAR */}
            <div className="bg-background p-3 rounded-xl border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full sm:w-auto">
                <TabsList className="grid grid-cols-4 bg-muted/60 p-1 rounded-lg h-auto">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="goods">Products</TabsTrigger>
                  <TabsTrigger value="service">Services</TabsTrigger>
                  <TabsTrigger value="featured">Featured</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-muted-foreground">Sort:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="popular">Most Viewed</SelectItem>
                    <SelectItem value="price-low">Price Low → High</SelectItem>
                    <SelectItem value="price-high">Price High → Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* LISTINGS GRID */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Icons.Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground mt-2">Loading listings...</p>
              </div>
            ) : processedListings.length === 0 ? (
              <Card className="p-10 text-center">
                <Icons.PackageX className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-bold">No listings found</h3>
                <p className="text-sm text-muted-foreground mt-2">Try changing your search filters.</p>
                <Button
                  className="mt-4"
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {processedListings.map((l) => (
                  <ListingCard key={l.id} l={l} />
                ))}
              </div>
            )}
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
