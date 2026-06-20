import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { ListingCard } from "@/components/listing-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
type Search = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tile — Buy, Sell & Hire Across Nigeria" },
      { name: "description", content: "The premium classifieds marketplace for verified goods and professional services across Nigeria." },
      { property: "og:title", content: "Tile Marketplace" },
      { property: "og:description", content: "Buy, sell and hire across Nigeria with trusted local vendors." },
    ],
    links: [
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
  { label: "₦50k - ₦100k", min: "100000", max: "100000" },
  { label: "₦100k+", min: "100000", max: "" },
];

function Index() {
  const navigate = useNavigate({ from: "/" });
  const filters = Route.useSearch();
  const queryClient = useQueryClient();
  const { ref, inView } = useInView({ threshold: 0.1 });

  const [searchInput, setSearchInput] = useState(filters.q ?? "");
  const [selectedState, setSelectedState] = useState(filters.stateId ?? "all");
  const [selectedCity, setSelectedCity] = useState(filters.cityId ?? "all");
  const [selectedLga, setSelectedLga] = useState(filters.lgaId ?? "all");
  const [minPrice, setMinPrice] = useState(filters.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice ?? "");
  const [condition, setCondition] = useState(filters.condition ?? "all");
  const [verifiedOnly, setVerifiedOnly] = useState(filters.verifiedOnly ?? "false");
  const [offersDelivery, setOffersDelivery] = useState(filters.offersDelivery ?? "false");

  const [activeTab, setActiveTab] = useState<"all" | "goods" | "service">("all");
  const [sortBy, setSortBy] = useState<string>("recommended");
  const [isLocating, setIsLocating] = useState(false);

  const debouncedSearch = useDebounce(searchInput, 400);
  const debouncedMinPrice = useDebounce(minPrice, 400);
  const debouncedMaxPrice = useDebounce(maxPrice, 400);

  // 1. Real-time Subscription Sync
  useEffect(() => {
    const channel = supabase
      .channel("live-listings-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "listings" }, () => {
        queryClient.invalidateQueries({ queryKey: ["listings-infinite"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // 2. Pre-fetching Cascading Data Handlers
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

  // URL Query Sync Hook
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

  // 3. Infinite Feed Single Database Request Execution
  const PAGE_SIZE = 20;
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["listings-infinite", filters, activeTab, sortBy],
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    getNextPageParam: (lastPage, allPages) => (lastPage.length === PAGE_SIZE ? allPages.length : undefined),
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
      if (activeTab !== "all") qb = qb.eq("type", activeTab);

      if (filters.verifiedOnly === "true") {
        qb = qb.eq("public_profiles.is_verified", true);
      }

      // Marketplace Monetization Ranking Order Logic
      qb = qb.order("is_promoted", { ascending: false });
      
      if (sortBy === "recommended") qb = qb.order("ranking_score", { ascending: false });
      else if (sortBy === "price-low") qb = qb.order("price", { ascending: true });
      else if (sortBy === "price-high") qb = qb.order("price", { ascending: false });
      else qb = qb.order("created_at", { ascending: false });

      const from = pageParam * PAGE_SIZE;
      qb = qb.range(from, from + PAGE_SIZE - 1);

      const { data: rows, error } = await qb;
      if (error) throw error;

      return (rows ?? []).map((r: any) => ({
        ...r,
        seller_tier: r.public_profiles?.subscription_tier ?? null,
        seller_verified: r.public_profiles?.is_verified ?? null,
      }));
    },
  });

  // Intersection Observer Infinite Scroll Trigger
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage]);

  const processedListings = useMemo(() => data?.pages.flat() ?? [], [data]);
  const totalCount = useMemo(() => (data?.pages[0] as any)?.count ?? processedListings.length, [data, processedListings]);

  const handleNearMe = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { data: geoData, error } = await supabase.rpc("find_nearest_city", {
        user_lat: pos.coords.latitude,
        user_lng: pos.coords.longitude,
      });
      setIsLocating(false);
      if (error || !geoData?.[0]) return alert("Nearest service vector unmappable.");
      setSelectedState(geoData[0].state_id);
      setTimeout(() => setSelectedCity(geoData[0].city_id), 150);
    }, () => setIsLocating(false));
  };

  return (
    <div className="min-h-screen bg-muted/20 text-foreground flex flex-col justify-between">
      <div>
        <SiteHeader />

        {/* HERO */}
        <section className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-primary-foreground py-14 md:py-20">
          <div className="container mx-auto px-4 text-center max-w-5xl space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">Buy, Sell &amp; Hire Across Nigeria</h1>
            
            <div className="bg-background text-foreground p-3 rounded-2xl shadow-xl border space-y-3 max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row items-center gap-2">
                <div className="flex items-center gap-2 px-3 flex-1 w-full border-b md:border-b-0 md:border-r pb-2 md:pb-0">
                  <Icons.Search className="h-5 w-5 text-muted-foreground shrink-0" />
                  <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search verified listings across Nigeria..." className="w-full text-sm bg-transparent outline-none py-2 text-black" />
                </div>
                
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <select value={selectedState} onMouseEnter={() => prefetchCities(selectedState)} onChange={(e) => setSelectedState(e.target.value)} className="bg-muted/50 text-sm font-medium p-2 rounded-md text-black">
                    <option value="all">All States</option>
                    {states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>

                  {selectedState !== "all" && cities.length > 0 && (
                    <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="bg-muted/50 text-sm font-medium p-2 rounded-md text-black animate-in fade-in">
                      <option value="all">All Cities</option>
                      {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}

                  {selectedCity !== "all" && lgas.length > 0 && (
                    <select value={selectedLga} onChange={(e) => setSelectedLga(e.target.value)} className="bg-muted/50 text-sm font-medium p-2 rounded-md text-black animate-in fade-in">
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
          </div>
        </section>

        {/* FEED AND FILTERS MATRIX */}
        <section className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="space-y-5 bg-background p-4 rounded-xl border shadow-sm h-fit">
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Marketplace Filters</h3>
              <hr className="mt-2" />
            </div>
            
            {/* Price Range & Quick Buckets */}
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
          </aside>

          {/* MAIN VIEWPORT */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-background p-3 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex flex-col sm:flex-row items-baseline sm:gap-3 w-full sm:w-auto">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full sm:w-auto">
                  <TabsList className="bg-muted/60 p-1 rounded-lg">
                    <TabsTrigger value="all" className="text-xs font-bold">All Feeds</TabsTrigger>
                    <TabsTrigger value="goods" className="text-xs font-bold">Products</TabsTrigger>
                    <TabsTrigger value="service" className="text-xs font-bold">Services</TabsTrigger>
                  </TabsList>
                </Tabs>
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
              <div className="flex flex-col items-center justify-center py-20">
                <Icons.Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : processedListings.length === 0 ? (
              <div className="text-center py-16 border border-dashed rounded-xl bg-background">
                <p className="text-sm font-medium text-muted-foreground">No matches found for current search metrics.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {processedListings.map((l: any) => <ListingCard key={l.id} l={l} />)}
                </div>
                
                {/* Intersection Scroll Anchor Row Element */}
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
    </div>
  );
}