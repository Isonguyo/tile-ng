import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { CATEGORIES } from "@/lib/categories";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as Icons from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

const searchSchema = z.object({
  q: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  lga: z.string().optional(),
  cat: z.string().optional(),
});
type Search = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tile — Buy, Sell & Hire across Nigeria" },
      { name: "description", content: "The premium classifieds marketplace for verified goods and professional services across Nigeria." },
      { property: "og:title", content: "Tile Marketplace" },
      { property: "og:description", content: "Buy, sell, and hire across Nigeria with trusted local vendors." },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "https://res.cloudinary.com/dbozz4sgv/image/upload/v1781367385/tile-logo_vv2c8v.jpg" },
      { rel: "apple-touch-icon", href: "https://res.cloudinary.com/dbozz4sgv/image/upload/v1781367385/tile-logo_vv2c8v.jpg" },
    ],
  }),
  validateSearch: searchSchema,
  component: Index,
});

type ProfileRow = { id: string; subscription_tier: string | null; is_verified: boolean | null; business_name: string | null; full_name: string | null };

function Index() {
  const navigate = useNavigate({ from: "/" });
  const { q, state, city, lga, cat } = Route.useSearch();

  const [searchInput, setSearchInput] = useState(q ?? "");
  const [selectedState, setSelectedState] = useState(state ?? "all");
  const [selectedCity, setSelectedCity] = useState(city ?? "all");
  const [selectedLga, setSelectedLga] = useState(lga ?? "all");
  
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const [activeTab, setActiveTab] = useState<"all" | "goods" | "service" | "featured">("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [visibleCount, setVisibleCount] = useState(12);

  // Dynamic States Selection
  const { data: dbStates = [] } = useQuery({
    queryKey: ["states-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("states").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    }
  });

  // Dynamic Cities Selection based on State
  const { data: dbCities = [] } = useQuery({
    queryKey: ["cities-list", selectedState],
    enabled: selectedState !== "all",
    queryFn: async () => {
      const { data, error } = await supabase.from("cities").select("*").eq("state_id", selectedState).order("name");
      if (error) throw error;
      return data ?? [];
    }
  });

  // Find Nearest Coordinates Function
  const findNearMe = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setUserCoords({ lat, lon });
        setIsLocating(false);
        toast.success("Location acquired! Displaying nearby listings.");
      },
      () => {
        setIsLocating(false);
        toast.error("Unable to access your current location.");
      }
    );
  };

  // Main Listings Query incorporating direct Spatial RPC or typical filters
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["listings", { q, state, city, lga, cat, userCoords }],
    queryFn: async () => {
      if (userCoords) {
        const { data, error } = await supabase.rpc("nearby_listings", {
          lat: userCoords.lat,
          lon: userCoords.lon,
          max_dist_km: 50
        });
        if (error) throw error;

        const rows = (data ?? []) as Array<ListingCardData & { user_id: string; created_at: string; distance_km?: number }>;
        const ids = Array.from(new Set(rows.map((r) => r.user_id))).filter(Boolean);
        if (!ids.length) return rows;

        const { data: profs } = await supabase.from("public_profiles").select("id,subscription_tier,is_verified").in("id", ids);
        const map = new Map(((profs ?? []) as ProfileRow[]).map((p) => [p.id, p]));
        return rows.map((r) => ({
          ...r,
          seller_tier: map.get(r.user_id)?.subscription_tier ?? null,
          seller_verified: map.get(r.user_id)?.is_verified ?? null,
        }));
      }

      let qb = supabase
        .from("listings")
        .select("id,title,price,type,location,state,city,lga,images,is_promoted,category,description,views_count,clicks_count,user_id,created_at")
        .eq("status", "approved")
        .limit(120);

      if (q) qb = qb.or(`title.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`);
      if (state && state !== "all") qb = qb.eq("state", state);
      if (city && city !== "all") qb = qb.eq("city", city);
      if (lga && lga !== "all") qb = qb.eq("lga", lga);
      if (cat) qb = qb.eq("category", cat);

      const { data, error } = await qb;
      if (error) throw error;

      const rows = (data ?? []) as Array<ListingCardData & { user_id: string; created_at: string }>;
      const ids = Array.from(new Set(rows.map((r) => r.user_id))).filter(Boolean);
      if (!ids.length) return rows;

      const { data: profs } = await supabase.from("public_profiles").select("id,subscription_tier,is_verified").in("id", ids);
      const map = new Map(((profs ?? []) as ProfileRow[]).map((p) => [p.id, p]));
      return rows.map((r) => ({
        ...r,
        seller_tier: map.get(r.user_id)?.subscription_tier ?? null,
        seller_verified: map.get(r.user_id)?.is_verified ?? null,
      }));
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      const { data } = await supabase.rpc("platform_stats");
      return (data?.[0] ?? null) as { total_listings: number; verified_vendors: number; active_shops: number; active_categories: number } | null;
    },
  });

  const { data: catCounts = [] } = useQuery({
    queryKey: ["category-counts"],
    queryFn: async () => {
      const { data } = await supabase.rpc("category_counts");
      return (data ?? []) as Array<{ category: string; count: number }>;
    },
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ["top-vendors"],
    queryFn: async () => {
      const { data } = await supabase.rpc("top_vendors", { _limit: 6 });
      return (data ?? []) as Array<{ id: string; full_name: string | null; business_name: string | null; shop_slug: string | null; avatar_url: string | null; subscription_tier: string; is_verified: boolean; active_listings: number }>;
    },
  });

  const countMap = useMemo(() => new Map(catCounts.map((c) => [c.category, Number(c.count)])), [catCounts]);
  const quickCategories = useMemo(() =>
    CATEGORIES
      .map((c) => ({ ...c, count: countMap.get(c.slug) ?? 0 }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 12),
    [countMap]
  );
  const trendingCategories = quickCategories.slice(0, 6);

  const executeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setUserCoords(null); // Clear proximity overrides upon custom searching
    navigate({
      search: (prev: Search) => ({
        ...prev,
        q: searchInput || undefined,
        state: selectedState !== "all" ? selectedState : undefined,
        city: selectedCity !== "all" ? selectedCity : undefined,
        lga: selectedLga !== "all" ? selectedLga : undefined,
      }),
    });
  };

  const processedListings = useMemo(() => {
    let result = [...listings];
    if (activeTab === "goods") result = result.filter((l) => l.type === "goods");
    if (activeTab === "service") result = result.filter((l) => l.type === "service");
    if (activeTab === "featured") result = result.filter((l) => l.is_promoted);
    return result.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime();
      if (sortBy === "oldest") return new Date(a.created_at || "").getTime() - new Date(b.created_at || "").getTime();
      if (sortBy === "price-low") return (a.price ?? 0) - (b.price ?? 0);
      if (sortBy === "price-high") return (b.price ?? 0) - (a.price ?? 0);
      if (sortBy === "popular") return (b.views_count ?? 0) - (a.views_count ?? 0);
      return 0;
    });
  }, [listings, activeTab, sortBy]);

  const pagedListings = useMemo(() => {
    return processedListings.slice(0, visibleCount);
  }, [processedListings, visibleCount]);

  return (
    <div className="min-h-screen bg-muted/20 text-foreground flex flex-col justify-between">
      <div>
        <SiteHeader />

        {/* HERO */}
        <section className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-primary-foreground overflow-hidden py-6 md:py-20">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
          <div className="container mx-auto px-4 text-center max-w-4xl relative z-10 space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">Buy, Sell &amp; Hire Across Nigeria</h1>
            <p className="text-sm sm:text-base md:text-lg text-primary-foreground/90 font-medium max-w-2xl mx-auto">
              Discover products, services and trusted vendors near you.
            </p>

            <form onSubmit={executeSearch} className="bg-background text-foreground p-2 rounded-2xl shadow-xl border flex flex-col md:flex-row items-center gap-2 max-w-3xl mx-auto w-full">
              <div className="flex items-center gap-2 px-3 flex-1 w-full border-b md:border-b-0 md:border-r pb-2 md:pb-0">
                <Icons.Search className="h-5 w-5 text-muted-foreground shrink-0" />
                <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search title, description or category…" className="w-full text-sm bg-transparent outline-none focus:ring-0 py-2" />
              </div>
              <div className="flex items-center gap-2 px-2 w-full md:w-48 border-b md:border-b-0 md:border-r pb-2 md:pb-0">
                <Icons.MapPin className="h-5 w-5 text-primary shrink-0" />
                <select value={selectedState} onChange={(e) => { setSelectedState(e.target.value); setSelectedCity("all"); setSelectedLga("all"); }} className="w-full bg-transparent text-sm font-medium outline-none cursor-pointer py-2">
                  <option value="all">All States</option>
                  {dbStates.map((s: any) => <option key={s.id || s.name} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex w-full md:w-auto gap-2">
                <Button type="button" variant="secondary" onClick={findNearMe} disabled={isLocating} className="shrink-0 font-bold">
                  {isLocating ? <Icons.Loader2 className="h-4 w-4 animate-spin" /> : "📍 Near Me"}
                </Button>
                <Button type="submit" className="w-full md:w-auto bg-accent text-accent-foreground font-bold px-6 py-2 rounded-xl shrink-0">Search</Button>
              </div>
            </form>

            {quickCategories.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 overflow-x-auto pb-2 scrollbar-none snap-x md:overflow-visible md:pb-0">
                {quickCategories.slice(0, 6).map((c) => (
                  <Link key={c.slug} to="/" search={{ cat: c.slug }} className="snap-start shrink-0 text-xs font-semibold bg-primary-foreground/10 hover:bg-primary-foreground/20 px-3 py-1.5 rounded-full transition whitespace-nowrap">
                    {c.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* STATS */}
        <section className="container mx-auto px-4 -mt-6 relative z-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Approved Listings", val: stats?.total_listings ?? 0, icon: Icons.Package, color: "text-blue-500 bg-blue-500/10" },
              { label: "Verified Vendors", val: stats?.verified_vendors ?? 0, icon: Icons.BadgeCheck, color: "text-emerald-500 bg-emerald-500/10" },
              { label: "Active Shops", val: stats?.active_shops ?? 0, icon: Icons.Store, color: "text-amber-500 bg-amber-500/10" },
              { label: "Active Categories", val: stats?.active_categories ?? 0, icon: Icons.LayoutGrid, color: "text-purple-500 bg-purple-500/10" },
            ].map((s, i) => {
              const Ic = s.icon;
              return (
                <Card key={i} className="p-4 bg-background shadow-md flex items-center gap-4 rounded-xl border">
                  <div className={`p-3 rounded-lg hidden sm:block ${s.color}`}><Ic className="h-5 w-5" /></div>
                  <div>
                    <p className="text-xl md:text-2xl font-extrabold tracking-tight">{Number(s.val).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{s.label}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* QUICK CATEGORIES Swipe Layout */}
        {quickCategories.length > 0 && (
          <section className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold tracking-tight uppercase text-muted-foreground">Quick Categories</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-none snap-x">
              {quickCategories.map((c) => {
                const Ic = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[c.icon] ?? Icons.Tag;
                const active = cat === c.slug;
                return (
                  <Link key={c.slug} to="/" search={{ cat: active ? undefined : c.slug }} className={`snap-start shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all min-w-[160px] ${active ? "border-accent bg-accent/10 shadow-sm" : "border-border bg-background hover:border-primary/50"}`}>
                    <Ic className="h-5 w-5 text-primary" />
                    <div className="text-left">
                      <p className="text-xs font-bold leading-tight truncate max-w-[120px]">{c.label}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold">{c.count} {c.count === 1 ? "listing" : "listings"}</p>
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
                  <Icons.Flame className="h-4 w-4 text-orange-500" /> Trending Categories
                </h3>
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {trendingCategories.map((tc) => {
                    const Ic = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[tc.icon] ?? Icons.Tag;
                    return (
                      <Link key={tc.slug} to="/" search={{ cat: tc.slug }} className="flex items-center gap-3 p-2 rounded-lg bg-muted/40 border border-transparent hover:border-border transition">
                        <Ic className="h-4 w-4 text-primary" />
                        <div className="flex-1">
                          <p className="text-xs font-bold">{tc.label}</p>
                          <p className="text-[10px] text-muted-foreground font-semibold">{tc.count} active</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </Card>
            )}
          </aside>

          {/* MAIN */}
          <div className="lg:col-span-3 space-y-8">
            {vendors.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Icons.Award className="h-4 w-4 text-accent" /> Top Verified Vendors
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-3 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-x-visible snap-x">
                  {vendors.map((v) => (
                    <Link key={v.id} to="/shop/$slug" params={{ slug: v.shop_slug ?? "" }} className="snap-start shrink-0 min-w-[240px] sm:min-w-0 p-4 bg-background border rounded-xl shadow-sm hover:shadow-md transition flex items-center gap-4 group">
                      <div className="h-12 w-12 bg-primary/10 rounded-xl grid place-items-center overflow-hidden">
                        {v.avatar_url ? <img src={v.avatar_url} alt="" className="w-full h-full object-cover" /> : <Icons.Store className="h-5 w-5 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-bold truncate">{v.business_name || v.full_name || "Vendor"}</p>
                          {v.is_verified && <Icons.BadgeCheck className="h-3.5 w-3.5 text-accent shrink-0" />}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold mt-0.5">
                          {v.subscription_tier && v.subscription_tier !== "free" ? (
                            <Badge className="bg-amber-500 text-white text-[9px] uppercase px-1.5 py-0">{v.subscription_tier}</Badge>
                          ) : <span />}
                          <span>{v.active_listings} {v.active_listings === 1 ? "listing" : "listings"}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* CONTROL BAR */}
            <div className="bg-background p-3 rounded-xl border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as never)} className="w-full sm:w-auto">
                <TabsList className="grid grid-cols-4 bg-muted/60 p-1 rounded-lg h-auto">
                  <TabsTrigger value="all" className="text-xs font-bold py-1.5 rounded-md">All</TabsTrigger>
                  <TabsTrigger value="goods" className="text-xs font-bold py-1.5 rounded-md">Products</TabsTrigger>
                  <TabsTrigger value="service" className="text-xs font-bold py-1.5 rounded-md">Services</TabsTrigger>
                  <TabsTrigger value="featured" className="text-xs font-bold py-1.5 rounded-md">Featured</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">Sort By:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs bg-muted/30"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest" className="text-xs">Newest</SelectItem>
                    <SelectItem value="oldest" className="text-xs">Oldest</SelectItem>
                    <SelectItem value="popular" className="text-xs">Most viewed</SelectItem>
                    <SelectItem value="price-low" className="text-xs">Price: Low to High</SelectItem>
                    <SelectItem value="price-high" className="text-xs">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* GRID */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-2">
                <Icons.Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground font-medium">Loading listings…</p>
              </div>
            ) : pagedListings.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-background p-12 text-center max-w-xl mx-auto space-y-4 shadow-inner">
                <div className="h-12 w-12 bg-muted rounded-full grid place-items-center mx-auto text-muted-foreground"><Icons.PackageX className="h-6 w-6" /></div>
                <div>
                  <h3 className="text-sm font-bold">No listings match your filters</h3>
                  <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or browse all categories.</p>
                </div>
                <Button onClick={() => { setSearchInput(""); setSelectedState("all"); setSelectedCity("all"); setSelectedLga("all"); setUserCoords(null); navigate({ search: {} }); }} size="sm">Browse all listings</Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {pagedListings.map((l: any) => (
                    <div key={l.id} className="relative">
                      <ListingCard l={l} />
                      {l.distance_km !== undefined && (
                        <div className="absolute top-2 left-2 z-10">
                          <Badge variant="secondary" className="text-[10px] font-bold bg-background/90 backdrop-blur-xs shadow-xs text-foreground">
                            📍 {l.distance_km.toFixed(1)} km away
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {processedListings.length > visibleCount && (
                  <div className="flex justify-center pt-2">
                    <Button variant="outline" size="sm" onClick={() => setVisibleCount((prev) => prev + 12)} className="font-bold px-6">
                      Load More Listings
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="bg-primary text-primary-foreground/80 mt-16 border-t border-primary-foreground/10">
        <div className="container mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div className="space-y-3 col-span-2 md:col-span-1">
            <span className="text-base font-extrabold text-primary-foreground tracking-wider uppercase">Tile Marketplace</span>
            <p className="text-xs text-primary-foreground/70 max-w-xs leading-relaxed">Nigeria's marketplace for verified goods and trusted local services.</p>
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
          <span>© {new Date().getFullYear()} Tile Marketplace.</span>
        </div>
      </footer>
    </div>
  );
}
