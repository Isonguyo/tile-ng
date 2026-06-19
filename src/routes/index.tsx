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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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
    ],
    links: [
      { rel: "icon", type: "image/png", href: "https://res.cloudinary.com/dbozz4sgv/image/upload/v1781367385/tile-logo_vv2c8v.jpg" },
    ],
  }),
  validateSearch: searchSchema,
  component: Index,
});

type ProfileRow = { id: string; subscription_tier: string | null; is_verified: boolean | null };

function Index() {
  const navigate = useNavigate({ from: "/" });
  const { q, state, city, lga, cat } = Route.useSearch();

  const [searchInput, setSearchInput] = useState(q ?? "");
  const [selectedState, setSelectedState] = useState(state ?? "all");
  const [selectedCity, setSelectedCity] = useState(city ?? "all");
  const [selectedLga, setSelectedLga] = useState(lga ?? "all");
  const [activeTab, setActiveTab] = useState<"all" | "goods" | "service" | "featured">("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [limit, setLimit] = useState<number>(12);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);

  // 1. Fetch Dynamic States from Database (No Static Arrays)
  const { data: dbStates = [] } = useQuery({
    queryKey: ["db-states"],
    queryFn: async () => {
      const { data } = await supabase.from("states").select("*").order("name");
      return data ?? [];
    },
  });

  // 2. Proximity GPS Capture Handler
  const findNearMe = () => {
    if (!navigator.geolocation) {
      return toast.error("Geolocation is not supported by your device");
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        toast.success("Location coordinates loaded successfully!");
      },
      () => {
        toast.error("Unable to access your device location settings");
      }
    );
  };

  // 3. Primary Server-Side Unified Filter Query
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["listings", { q, state, city, lga, cat, userCoords }],
    queryFn: async () => {
      if (userCoords) {
        const { data, error } = await supabase.rpc("nearby_listings", {
          lat: userCoords.lat,
          lon: userCoords.lon,
          max_dist_km: 50,
        });
        if (error) throw error;
        return data ?? [];
      }

      let qb = supabase
        .from("listings")
        .select("id,title,price,type,state,city,lga,latitude,longitude,images,is_promoted,category,description,views_count,clicks_count,user_id,created_at")
        .eq("status", "approved");

      if (q) qb = qb.or(`title.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`);
      if (state && state !== "all") qb = qb.eq("state", state);
      if (city && city !== "all") qb = qb.eq("city", city);
      if (lga && lga !== "all") qb = qb.eq("lga", lga);
      if (cat) qb = qb.eq("category", cat);

      const { data, error } = await qb;
      if (error) throw error;

      const rows = (data ?? []) as any[];
      const ids = Array.from(new Set(rows.map((r) => r.user_id))).filter(Boolean);
      if (!ids.length) return rows;

      const { data: profs } = await supabase
        .from("public_profiles")
        .select("id,subscription_tier,is_verified")
        .in("id", ids);
      const map = new Map(((profs ?? []) as ProfileRow[]).map((p) => [p.id, p]));
      return rows.map((r) => ({
        ...r,
        seller_tier: map.get(r.user_id)?.subscription_tier ?? null,
        seller_verified: map.get(r.user_id)?.is_verified ?? null,
      }));
    },
  });

  // Real Real-time metrics
  const { data: stats } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      const { data } = await supabase.rpc("platform_stats");
      return (data?.[0] ?? null) as any;
    },
  });

  const { data: catCounts = [] } = useQuery({
    queryKey: ["category-counts"],
    queryFn: async () => {
      const { data } = await supabase.rpc("category_counts");
      return (data ?? []) as any[];
    },
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ["top-vendors"],
    queryFn: async () => {
      const { data } = await supabase.rpc("top_vendors", { _limit: 8 });
      return (data ?? []) as any[];
    },
  });

  const countMap = useMemo(() => new Map(catCounts.map((c) => [c.category, Number(c.count)])), [catCounts]);
  const quickCategories = useMemo(() =>
    CATEGORIES
      .map((c) => ({ ...c, count: countMap.get(c.slug) ?? 0 }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count),
    [countMap]
  );
  const trendingCategories = quickCategories.slice(0, 6);

  const executeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setUserCoords(null); // Clear coordinates override on formal manual input execution
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

  const limitedListings = useMemo(() => processedListings.slice(0, limit), [processedListings, limit]);

  return (
    <div className="min-h-screen bg-muted/20 text-foreground flex flex-col justify-between">
      <div>
        <SiteHeader />

        {/* HERO (Mobile Friendly py-6 to Desktop py-20 layout shift mitigation) */}
        <section className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-primary-foreground overflow-hidden py-6 md:py-20">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
          <div className="container mx-auto px-4 text-center max-w-4xl relative z-10 space-y-4 md:space-y-6">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">Buy, Sell &amp; Hire Across Nigeria</h1>
            
            <form onSubmit={executeSearch} className="bg-background text-foreground p-2 rounded-2xl shadow-xl border flex flex-col md:flex-row items-center gap-2 max-w-3xl mx-auto w-full">
              <div className="flex items-center gap-2 px-3 flex-1 w-full border-b md:border-b-0 md:border-r pb-2 md:pb-0">
                <Icons.Search className="h-5 w-5 text-muted-foreground shrink-0" />
                <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search tiles, materials, or vendors..." className="w-full text-sm bg-transparent outline-none focus:ring-0 py-2" />
              </div>
              
              <div className="flex items-center gap-2 px-2 w-full md:w-48 border-b md:border-b-0 md:border-r pb-2 md:pb-0">
                <Icons.MapPin className="h-5 w-5 text-primary shrink-0" />
                <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} className="w-full bg-transparent text-sm font-medium outline-none cursor-pointer py-2">
                  <option value="all">All States</option>
                  {dbStates.map((s: any) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>

              <div className="flex w-full md:w-auto gap-2 shrink-0">
                <Button type="button" variant="outline" onClick={findNearMe} className="flex-1 md:flex-initial gap-1.5 text-xs font-bold border-primary/20">
                  <Icons.Navigation className="h-3.5 w-3.5 text-primary fill-primary" /> Near Me
                </Button>
                <Button type="submit" className="flex-1 md:flex-initial bg-accent text-accent-foreground font-bold px-6 rounded-xl">Search</Button>
              </div>
            </form>
          </div>
        </section>

        {/* METRICS STATS */}
        <section className="container mx-auto px-4 -mt-4 md:-mt-6 relative z-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              { label: "Total Listings", val: stats?.total_listings ?? 0, icon: Icons.Package, color: "text-blue-500 bg-blue-500/10" },
              { label: "Verified Vendors", val: stats?.verified_vendors ?? 0, icon: Icons.BadgeCheck, color: "text-emerald-500 bg-emerald-500/10" },
              { label: "Active Shops", val: stats?.active_shops ?? 0, icon: Icons.Store, color: "text-amber-500 bg-amber-500/10" },
              { label: "Active Categories", val: stats?.active_categories ?? 0, icon: Icons.LayoutGrid, color: "text-purple-500 bg-purple-500/10" },
            ].map((s, i) => {
              const Ic = s.icon;
              return (
                <Card key={i} className="p-3 md:p-4 bg-background shadow-md flex items-center gap-3 md:gap-4 rounded-xl border">
                  <div className={`p-3 rounded-lg hidden sm:block ${s.color}`}><Ic className="h-5 w-5" /></div>
                  <div>
                    <p className="text-base md:text-2xl font-extrabold tracking-tight">{Number(s.val).toLocaleString()}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground font-semibold uppercase tracking-wider">{s.label}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* QUICK CATEGORIES (Touch Carousel Transformation) */}
        {quickCategories.length > 0 && (
          <section className="container mx-auto px-4 pt-6 md:pt-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs md:text-sm font-bold tracking-tight uppercase text-muted-foreground">Quick Categories</h2>
              
              {/* Responsive Drawer Trigger for Mobile Categories + Trending Sheet */}
              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs font-bold text-primary gap-1">
                      <Icons.Menu className="h-3.5 w-3.5" /> View All
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80">
                    <SheetHeader>
                      <SheetTitle>Marketplace Explorer</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-6 overflow-y-auto max-h-[85vh] pr-2">
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Trending Searches</h4>
                        {trendingCategories.map((tc) => (
                          <Link key={tc.slug} to="/" search={{ cat: tc.slug }} className="flex items-center justify-between p-2 rounded-lg bg-muted text-xs font-bold">
                            <span>{tc.label}</span>
                            <Icons.ChevronRight className="h-3 w-3" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-none snap-x touch-pan-x">
              {quickCategories.map((c) => {
                const Ic = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[c.icon] ?? Icons.Tag;
                const active = cat === c.slug;
                return (
                  <Link key={c.slug} to="/" search={{ cat: active ? undefined : c.slug }} className={`snap-start shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all min-w-[150px] md:min-w-[180px] ${active ? "border-accent bg-accent/10 shadow-sm" : "border-border bg-background hover:border-primary/50"}`}>
                    <Ic className="h-5 w-5 text-primary" />
                    <div className="text-left min-w-0">
                      <p className="text-xs font-bold leading-tight truncate">{c.label}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold">{c.count} ads</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section className="container mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* SIDEBAR DESKTOP */}
          <aside className="hidden lg:block lg:col-span-1 space-y-6">
            {trendingCategories.length > 0 && (
              <Card className="p-4 bg-background border shadow-sm space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Icons.Flame className="h-4 w-4 text-orange-500" /> Trending Categories
                </h3>
                <div className="space-y-2">
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

          {/* MAIN CATALOG FEED */}
          <div className="lg:col-span-3 space-y-6">
            {/* TOP PREMIUM MERCHANTS (Horizontal Swipe Mobile Interface) */}
            {vendors.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Icons.Award className="h-4 w-4 text-accent" /> Top Verified Stores
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-3 md:grid md:grid-cols-2 lg:grid-cols-3 scrollbar-none snap-x touch-pan-x">
                  {vendors.map((v) => (
                    <Link key={v.id} to="/shop/$slug" params={{ slug: v.shop_slug ?? "" }} className="snap-start shrink-0 w-64 md:w-auto p-4 bg-background border rounded-xl shadow-sm flex items-center gap-4 group">
                      <div className="h-11 w-11 bg-primary/10 rounded-xl grid place-items-center overflow-hidden shrink-0">
                        {v.avatar_url ? <img src={v.avatar_url} alt="" className="w-full h-full object-cover" /> : <Icons.Store className="h-5 w-5 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-bold truncate">{v.business_name || v.full_name || "Merchant Store"}</p>
                          {v.is_verified && <Icons.BadgeCheck className="h-3.5 w-3.5 text-accent shrink-0" />}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold mt-0.5">
                          {v.subscription_tier && v.subscription_tier !== "free" ? (
                            <Badge className="bg-amber-500 text-white text-[9px] uppercase px-1.5 py-0">{v.subscription_tier}</Badge>
                          ) : <span />}
                          <span>{v.active_listings} ads</span>
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
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[160px] h-9 text-xs bg-muted/30"><SelectValue /></SelectTrigger>
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

            {/* RESULTS MATRIX */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-2">
                <Icons.Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground font-medium">Querying marketplace matrix...</p>
              </div>
            ) : limitedListings.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-background p-12 text-center max-w-xl mx-auto space-y-4">
                <div className="h-10 w-10 bg-muted rounded-full grid place-items-center mx-auto text-muted-foreground"><Icons.PackageX className="h-5 w-5" /></div>
                <p className="text-xs text-muted-foreground">No listings found matching these specifications.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                  {limitedListings.map((l) => (
                    <ListingCard key={l.id} l={l} distanceKm={l.distance_km} />
                  ))}
                </div>
                
                {processedListings.length > limit && (
                  <div className="flex justify-center pt-4">
                    <Button size="sm" onClick={() => setLimit((prev) => prev + 12)} variant="outline" className="text-xs font-bold px-8">
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
            <p className="text-xs text-primary-foreground/70 max-w-xs leading-relaxed">Nigeria's premium marketplace for verified materials and logistics telemetry.</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary-foreground border-b border-primary-foreground/10 pb-1">Marketplace</h4>
            <div className="flex flex-col gap-1.5 text-xs">
              <Link to="/" className="hover:text-white">Browse Listings</Link>
              <Link to="/dashboard" className="hover:text-white">Merchant Hub</Link>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary-foreground border-b border-primary-foreground/10 pb-1">Company</h4>
            <div className="flex flex-col gap-1.5 text-xs">
              <span className="hover:text-white cursor-pointer">Privacy Policy</span>
              <span className="hover:text-white cursor-pointer">Terms of Service</span>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary-foreground border-b border-primary-foreground/10 pb-1">Follow Us</h4>
            <div className="flex gap-3 text-primary-foreground/70">
              <Icons.Facebook className="h-4 w-4 hover:text-white cursor-pointer" />
              <Icons.Instagram className="h-4 w-4 hover:text-white cursor-pointer" />
              <Icons.Twitter className="h-4 w-4 hover:text-white cursor-pointer" />
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-4 border-t border-primary-foreground/10 text-xs flex justify-between text-primary-foreground/60">
          <span>© {new Date().getFullYear()} Tile Marketplace. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
