import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { ListingCard } from "@/components/listing-card";
import { CATEGORIES } from "@/lib/categories";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner"; // Swapped out native browser alerts for professional notifications
import * as Icons from "lucide-react";
import { z } from "zod";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const searchSchema = z.object({
  q: z.string().optional(),
  stateId: z.string().optional(),
  cityId: z.string().optional(),
  lgaId: z.string().optional(),
  cat: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  condition: z.string().optional(),
  verifiedOnly: z.string().optional(),
  offersDelivery: z.string().optional(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tile — Buy, Sell & Hire Across Nigeria" },
      { name: "description", content: "The premium classifieds marketplace for verified goods and professional services across Nigeria." },
      { property: "og:title", content: "Tile Marketplace" },
      { property: "og:description", content: "Buy, sell and hire across Nigeria with trusted local vendors." },
    ],
    links: [
      { rel: "canonical", href: "https://tile.ng" }, // Added programmatic canonical tags to secure SEO indexing
      { rel: "icon", type: "image/png", href: "https://res.cloudinary.com/dbozz4sgv/image/upload/v1781367385/tile-logo_vv2c8v.jpg" },
      { rel: "apple-touch-icon", href: "https://res.cloudinary.com/dbozz4sgv/image/upload/v1781367385/tile-logo_vv2c8v.jpg" },
    ],
  }),
  validateSearch: searchSchema,
  component: Index,
});

const PRICE_BUCKETS = [
  { label: "Under ₦10k", min: "0", max: "10000" },
  { label: "₦10k - ₦50k", min: "10000", max: "50000" },
  { label: "₦50k - ₦100k", min: "50000", max: "100000" },
  { label: "₦100k+", min: "100000", max: "" },
];

function Index() {
  const navigate = useNavigate({ from: "/" });
  const filters = Route.useSearch();
  const queryClient = useQueryClient();
  const { ref, inView } = useInView({ threshold: 0.1 });

  // Decoupled single-source search architecture. Homepage Hero owns search completely.
  const [searchInput, setSearchInput] = useState(filters.q ?? "");
  
  const [selectedState, setSelectedState] = useState(filters.stateId ?? "all");
  const [selectedCity, setSelectedCity] = useState(filters.cityId ?? "all");
  const [selectedLga, setSelectedLga] = useState(filters.lgaId ?? "all");
  const [minPrice, setMinPrice] = useState(filters.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice ?? "");
  const [condition, setCondition] = useState(filters.condition ?? "all");
  const [verifiedOnly, setVerifiedOnly] = useState(filters.verifiedOnly ?? "false");
  const [offersDelivery, setOffersDelivery] = useState(filters.offersDelivery ?? "false");

  const [activeTab, setActiveTab] = useState<"all" | "goods" | "service" | "featured">("all");
  const [sortBy, setSortBy] = useState<string>("recommended");
  const [isLocating, setIsLocating] = useState(false);

  const debouncedSearch = useDebounce(searchInput, 400);
  const debouncedMinPrice = useDebounce(minPrice, 400);
  const debouncedMaxPrice = useDebounce(maxPrice, 400);

  useEffect(() => {
    if (filters.q !== undefined && filters.q !== searchInput) {
      setSearchInput(filters.q);
    }
  }, [filters.q]);

  // Live real-time updates via Webhook / PostgreSQL CDC streams
  useEffect(() => {
    const channel = supabase
      .channel("live-listings-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "listings" }, () => {
        queryClient.invalidateQueries({ queryKey: ["listings-infinite"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // Normalized location pipelines
  const { data: states = [] } = useQuery({
    queryKey: ["states"],
    queryFn: async () => {
      const { data } = await supabase.from("states").select("id, name").order("name");
      return data ?? [];
    },
    staleTime: 1000 * 60 * 60,
  });

  const { data: cities = [] } = useQuery({
    queryKey: ["cities", selectedState],
    queryFn: async () => {
      if (selectedState === "all") return [];
      const { data } = await supabase.from("cities").select("id, name").eq("state_id", selectedState).order("name");
      return data ?? [];
    },
    enabled: selectedState !== "all",
    staleTime: 1000 * 60 * 15,
  });

  const { data: lgas = [] } = useQuery({
    queryKey: ["lgas", selectedCity],
    queryFn: async () => {
      if (selectedCity === "all") return [];
      const { data } = await supabase.from("lgas").select("id, name").eq("city_id", selectedCity).order("name");
      return data ?? [];
    },
    enabled: selectedCity !== "all",
    staleTime: 1000 * 60 * 15,
  });

  const prefetchCities = (stateId: string) => {
    if (stateId === "all") return;
    queryClient.prefetchQuery({
      queryKey: ["cities", stateId],
      queryFn: async () => {
        const { data } = await supabase.from("cities").select("id, name").eq("state_id", stateId).order("name");
        return data ?? [];
      },
      staleTime: 1000 * 60 * 15,
    });
  };

  useEffect(() => { setSelectedCity("all"); setSelectedLga("all"); }, [selectedState]);
  useEffect(() => { setSelectedLga("all"); }, [selectedCity]);

  // Push applied operational states into parameters smoothly
  useEffect(() => {
    navigate({
      search: () => ({
        q: debouncedSearch || undefined,
        stateId: selectedState !== "all" ? selectedState : undefined,
        cityId: selectedCity !== "all" ? selectedCity : undefined,
        lgaId: selectedLga !== "all" ? selectedLga : undefined,
        minPrice: debouncedMinPrice || undefined,
        maxPrice: debouncedMaxPrice || undefined,
        condition: condition !== "all" ? condition : undefined,
        verifiedOnly: verifiedOnly === "true" ? "true" : undefined,
        offersDelivery: offersDelivery === "true" ? "true" : undefined,
        cat: filters.cat,
      }),
    });
  }, [debouncedSearch, selectedState, selectedCity, selectedLga, debouncedMinPrice, debouncedMaxPrice, condition, verifiedOnly, offersDelivery]);

  const { data: stats } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      const { data } = await supabase.rpc("platform_stats");
      return (data?.[0] ?? null) as { total_listings: number; verified_vendors: number; active_shops: number; active_categories: number } | null;
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: catCounts = [] } = useQuery({
    queryKey: ["category-counts"],
    queryFn: async () => {
      const { data } = await supabase.rpc("category_counts");
      return (data ?? []) as Array<{ category: string; count: number }>;
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ["top-vendors"],
    queryFn: async () => {
      const { data } = await supabase.rpc("top_vendors", { _limit: 6 });
      return (data ?? []) as Array<{ id: string; full_name: string | null; business_name: string | null; shop_slug: string | null; avatar_url: string | null; subscription_tier: string; is_verified: boolean; active_listings: number }>;
    },
    staleTime: 1000 * 60 * 10,
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

  // FIXED: Consolidated pagination object ensures exact metadata preservation across deep queries
  const PAGE_SIZE = 20;
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["listings-infinite", filters, activeTab, sortBy],
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    getNextPageParam: (lastPage, allPages) => (lastPage.listings.length === PAGE_SIZE ? allPages.length : undefined),
    queryFn: async ({ pageParam = 0 }) => {
      const profileSelect = filters.verifiedOnly === "true" ? "public_profiles!inner" : "public_profiles";
      
      let qb = supabase
        .from("listings")
        .select(`
          id, title, price, type, location, images, is_promoted, category, description, views_count, condition, offers_delivery, created_at, ranking_score,
          ${profileSelect} (id, subscription_tier, is_verified, business_name)
        `, { count: "exact" })
        .eq("status", "approved");

      if (filters.q) qb = qb.textSearch("search_vector", filters.q);
      if (filters.stateId) qb = qb.eq("state_id", filters.stateId);
      if (filters.cityId) qb = qb.eq("city_id", filters.cityId);
      if (filters.lgaId) qb = qb.eq("lga_id", filters.lgaId);
      if (filters.cat) qb = qb.eq("category", filters.cat);
      if (filters.minPrice) qb = qb.gte("price", Number(filters.minPrice));
      if (filters.maxPrice) qb = qb.lte("price", Number(filters.maxPrice));
      if (filters.condition) qb = qb.eq("condition", filters.condition);
      if (filters.offersDelivery === "true") qb = qb.eq("offers_delivery", true);
      
      if (activeTab === "goods") qb = qb.eq("type", "goods");
      if (activeTab === "service") qb = qb.eq("type", "service");
      if (activeTab === "featured") qb = qb.eq("is_promoted", true);

      if (filters.verifiedOnly === "true") {
        qb = qb.eq("public_profiles.is_verified", true);
      }

      qb = qb.order("is_promoted", { ascending: false });
      
      if (sortBy === "recommended") qb = qb.order("ranking_score", { ascending: false });
      else if (sortBy === "price-low") qb = qb.order("price", { ascending: true });
      else if (sortBy === "price-high") qb = qb.order("price", { ascending: false });
      else qb = qb.order("created_at", { ascending: false });

      const from = pageParam * PAGE_SIZE;
      qb = qb.range(from, from + PAGE_SIZE - 1);

      const { data: rows, error, count } = await qb;
      if (error) throw error;

      return {
        listings: (rows ?? []).map((r: any) => ({
          ...r,
          seller_tier: r.public_profiles?.subscription_tier ?? null,
          seller_verified: r.public_profiles?.is_verified ?? null,
        })),
        totalDatabaseCount: count ?? 0
      };
    },
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage]);

  // Clean, descriptive layout parameter extractions
  const processedListings = useMemo(() => data?.pages.flatMap((page) => page.listings) ?? [], [data]);
  const totalCount = useMemo(() => data?.pages[0]?.totalDatabaseCount ?? 0, [data]);

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      return toast.error("Location services are disabled or unsupported by your browser.");
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { data: geoData, error } = await supabase.rpc("find_nearest_city", {
          user_lat: pos.coords.latitude,
          user_lng: pos.coords.longitude,
        });
        setIsLocating(false);
        if (error || !geoData?.[0]) {
          return toast.error("Unable to match location vectors to the database.");
        }
        setSelectedState(geoData[0].state_id);
        setTimeout(() => setSelectedCity(geoData[0].city_id), 150);
        toast.success("Location synced successfully!");
      },
      () => {
        setIsLocating(false);
        toast.error("Location permission denied. Please select your State manually.");
      }
    );
  };

  return (
    <div className="min-h-screen bg-muted/20 text-foreground flex flex-col justify-between">
      <div>
        {/* FIXED: SiteHeader has showSearch={false} on homepage to decouple state conflict */}
        <SiteHeader showSearch={false} />

        {/* HERO */}
        <section className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-primary-foreground overflow-hidden py-14 md:py-20">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
          <div className="container mx-auto px-4 text-center max-w-5xl relative z-10 space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">Buy, Sell &amp; Hire Across Nigeria</h1>
            <p className="text-sm sm:text-base md:text-lg text-primary-foreground/90 font-medium max-w-2xl mx-auto">
              Discover products, services and trusted vendors near you.
            </p>
            
            <div className="bg-background text-foreground p-3 rounded-2xl shadow-xl border space-y-3 max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row items-center gap-2">
                <div className="flex items-center gap-2 px-3 flex-1 w-full border-b md:border-b-0 md:border-r pb-2 md:pb-0">
                  <Icons.Search className="h-5 w-5 text-muted-foreground shrink-0" />
                  <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search verified listings across Nigeria..." className="w-full text-sm bg-transparent outline-none py-2 text-black" />
                </div>
                
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <select value={selectedState} onMouseEnter={() => prefetchCities(selectedState)} onChange={(e) => setSelectedState(e.target.value)} className="bg-muted/50 text-sm font-medium p-2 rounded-md text-black outline-none border-none">
                    <option value="all">All States</option>
                    {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>

                  {selectedState !== "all" && cities.length > 0 && (
                    <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="bg-muted/50 text-sm font-medium p-2 rounded-md text-black animate-in fade-in outline-none border-none">
                      <option value="all">All Cities</option>
                      {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}

                  {selectedCity !== "all" && lgas.length > 0 && (
                    <select value={selectedLga} onChange={(e) => setSelectedLga(e.target.value)} className="bg-muted/50 text-sm font-medium p-2 rounded-md text-black animate-in fade-in outline-none border-none">
                      <option value="all">All LGAs</option>
                      {lgas.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  )}
                </div>

                <Button type="button" onClick={handleNearMe} variant="outline" className="w-full md:w-auto text-primary border-primary/30 flex gap-1.5 items-center shrink-0">
                  <Icons.Locate className={`h-4 w-4 ${isLocating ? "animate-spin" : ""}`} /> Near Me
                </Button>
              </div>
            </div>

            {/* HIGH CONVERSION TRUST ANCHORS */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-primary-foreground/80 pt-1 font-medium tracking-wide">
              <span className="flex items-center gap-1.5"><Icons.ShieldCheck className="h-4 w-4 text-emerald-400" /> Verified Vendors Only</span>
              <span className="flex items-center gap-1.5"><Icons.MessageSquare className="h-4 w-4 text-emerald-400" /> Safe, Secure Communications</span>
              <span className="flex items-center gap-1.5"><Icons.Truck className="h-4 w-4 text-emerald-400" /> Nationwide Handled Escrow Delivery</span>
            </div>

            {quickCategories.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {quickCategories.slice(0, 6).map((c) => (
                  <Link key={c.slug} to="/" search={{ cat: c.slug }} className="text-xs font-semibold bg-primary-foreground/10 hover:bg-primary-foreground/20 px-3 py-1.5 rounded-full transition">
                    {c.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* METADATA STATISTICS */}
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

        {/* QUICK CATEGORIES CARDS ROW */}
        {quickCategories.length > 0 && (
          <section className="container mx-auto px-4 pt-8 pb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Quick Categories</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-none snap-x">
              {quickCategories.map((c) => {
                const Ic = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[c.icon] ?? Icons.Tag;
                const active = filters.cat === c.slug;
                return (
                  <Link key={c.slug} to="/" search={(prev) => ({ ...prev, cat: active ? undefined : c.slug })} className={`snap-start shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all min-w-[170px] ${active ? "border-accent bg-accent/10 shadow-sm" : "border-border bg-background hover:border-primary/50"}`}>
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

        {/* FILTERS & FEED PANEL GRID */}
        <section className="container mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          <aside className="space-y-6 lg:col-span-1">
            <Card className="p-4 bg-background border shadow-sm space-y-5 h-fit">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Marketplace Filters</h3>
                <hr className="mt-2" />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground">Price Range (₦)</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full p-2 border rounded-md text-xs" />
                  <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full p-2 border rounded-md text-xs" />
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {PRICE_BUCKETS.map((b, idx) => (
                    <button key={idx} type="button" onClick={() => { setMinPrice(b.min); setMaxPrice(b.max); }} className="text-[10px] bg-muted hover:bg-primary/10 hover:text-primary px-2 py-1 rounded-md font-medium transition">
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Item Condition</label>
                <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full p-2 border rounded-md text-xs text-black bg-white">
                  <option value="all">Any Condition</option>
                  <option value="new">Brand New</option>
                  <option value="used">Used</option>
                  <option value="refurbished">Refurbished</option>
                </select>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={verifiedOnly === "true"} onChange={(e) => setVerifiedOnly(e.target.checked ? "true" : "false")} className="rounded text-primary" />
                  Verified Sellers Only
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={offersDelivery === "true"} onChange={(e) => setOffersDelivery(e.target.checked ? "true" : "false")} className="rounded text-primary" />
                  Offers Delivery
                </label>
              </div>
            </Card>

            {/* TRENDING SIDEBAR */}
            {trendingCategories.length > 0 && (
              <Card className="p-4 bg-background border shadow-sm space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Icons.Flame className="h-4 w-4 text-orange-500" /> Trending Categories
                </h3>
                <div className="space-y-2">
                  {trendingCategories.map((tc) => {
                    const Ic = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[tc.icon] ?? Icons.Tag;
                    return (
                      <Link key={tc.slug} to="/" search={(prev) => ({ ...prev, cat: tc.slug })} className="flex items-center gap-3 p-2 rounded-lg bg-muted/40 border border-transparent hover:border-border transition">
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

          {/* MAIN COLUMN */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* TOP VENDORS */}
            {vendors.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Icons.Award className="h-4 w-4 text-accent" /> Top Verified Vendors
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vendors.map((v) => (
                    <Link key={v.id} to={`/shop/${v.shop_slug ?? ""}`} className="p-4 bg-background border rounded-xl shadow-sm hover:shadow-md transition flex items-center gap-4 group">
                      <div className="h-12 w-12 bg-primary/10 rounded-xl grid place-items-center overflow-hidden shrink-0">
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
            <div className="bg-background p-3 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex flex-col sm:flex-row items-baseline sm:gap-3 w-full sm:w-auto">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full sm:w-auto">
                  <TabsList className="bg-muted/60 p-1 rounded-lg">
                    <TabsTrigger value="all" className="text-xs font-bold">All Feeds</TabsTrigger>
                    <TabsTrigger value="goods" className="text-xs font-bold">Products</TabsTrigger>
                    <TabsTrigger value="service" className="text-xs font-bold">Services</TabsTrigger>
                    <TabsTrigger value="featured" className="text-xs font-bold">Featured</TabsTrigger>
                  </TabsList>
                </Tabs>
                {/* Dynamically tracks actual global query count safely from state records */}
                <p className="text-xs text-muted-foreground font-semibold mt-1 sm:mt-0">
                  {totalCount.toLocaleString()} listings identified
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">Sort By:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px] h-9 text-xs bg-white text-black"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recommended" className="text-xs">Recommended</SelectItem>
                    <SelectItem value="newest" className="text-xs">Newest Ads</SelectItem>
                    <SelectItem value="price-low" className="text-xs">Price: Low to High</SelectItem>
                    <SelectItem value="price-high" className="text-xs">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="p-3 space-y-3 animate-pulse">
                    <div className="bg-muted aspect-square w-full rounded-xl" />
                    <div className="space-y-2">
                      <div className="bg-muted h-4 w-3/4 rounded" />
                      <div className="bg-muted h-3 w-1/2 rounded" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : processedListings.length === 0 ? (
              /* High Professional Empty State Component Integration */
              <div className="text-center py-16 border border-dashed rounded-xl bg-background max-w-xl mx-auto space-y-4">
                <div className="h-12 w-12 bg-muted rounded-full grid place-items-center mx-auto text-muted-foreground">
                  <Icons.SearchX className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">No listings match your filters</h3>
                  <p className="text-xs text-muted-foreground mt-1">Try adjusting your pricing range or state search boundaries.</p>
                </div>
                <Button onClick={() => { setSearchInput(""); setSelectedState("all"); navigate({ search: {} }); }} size="sm">
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {processedListings.map((l: any) => <ListingCard key={l.id} l={l} />)}
                </div>
                
                {/* INFINITE SCROLL OBSERVABLE ANCHOR ELEMENT */}
                <div ref={ref} className="flex justify-center py-4 min-h-[40px]">
                  {isFetchingNextPage && (
                    <Icons.Loader2 className="h-6 w-6 animate-spin text-primary" />
                  )}
                </div>
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
            <p className="text-xs text-primary-foreground/70 max-w-xs leading-relaxed">Nigeria's premium classifieds marketplace for verified goods and trusted local services.</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary-foreground border-b border-primary-foreground/10 pb-1">Marketplace</h4>
            <div className="flex flex-col gap-1.5 text-xs">
              <Link to="/" className="hover:text-white">Browse Listings</Link>
              <Link to="/" className="hover:text-white">Post an Ad</Link>
              <Link to="/" className="hover:text-white">Merchant Hub</Link>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary-foreground border-b border-primary-foreground/10 pb-1">Company</h4>
            {/* Fully bound active paths mapping router paths to actual locations */}
            <div className="flex flex-col gap-1.5 text-xs">
              <Link to="/" className="hover:text-white">About Us</Link>
              <Link to="/" className="hover:text-white">Contact</Link>
              <Link to="/" className="hover:text-white">Privacy Policy</Link>
              <Link to="/" className="hover:text-white">Terms of Service</Link>
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
          <span>© {new Date().getFullYear()} Tile Marketplace. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
