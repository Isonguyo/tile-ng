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
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import * as Icons from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().optional(),
  cat: z.string().optional(),
  stateId: z.string().optional(),
  cityId: z.string().optional(),
  lgaId: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  radius: z.string().optional(),
});
type Search = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Tile — Buy, Sell & Hire across Nigeria" }],
  }),
  validateSearch: searchSchema,
  component: Index,
});

function Index() {
  const navigate = useNavigate({ from: "/" });
  const { q, cat, stateId, cityId, lgaId, minPrice, maxPrice, radius } = Route.useSearch();

  const [searchInput, setSearchInput] = useState(q ?? "");
  const [activeTab, setActiveTab] = useState<"all" | "goods" | "service" | "featured" | "near_me">("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Geolocation State
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLon, setUserLon] = useState<number | null>(null);
  const [selectedRadius, setSelectedRadius] = useState<number>(radius ? Number(radius) : 20);

  // Dynamic Metadata Hooking
  const { data: states = [] } = useQuery({
    queryKey: ["database-states"],
    queryFn: async () => {
      const { data, error } = await supabase.from("states").select("id, name").order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 60,
  });

  const { data: cities = [] } = useQuery({
    queryKey: ["database-cities", stateId],
    queryFn: async () => {
      if (!stateId || stateId === "all") return [];
      const { data, error } = await supabase.from("cities").select("id, name").eq("state_id", stateId).order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!stateId && stateId !== "all",
  });

  const { data: lgas = [] } = useQuery({
    queryKey: ["database-lgas", cityId],
    queryFn: async () => {
      if (!cityId || cityId === "all") return [];
      const { data, error } = await supabase.from("lgas").select("id, name").eq("city_id", cityId).order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!cityId && cityId !== "all",
  });

  // Query Execution Block
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["listings", { q, cat, stateId, cityId, lgaId, minPrice, maxPrice }],
    queryFn: async () => {
      let qb = supabase.from("listings").select("*").eq("status", "approved").limit(120);

      if (q) qb = qb.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
      if (stateId && stateId !== "all") qb = qb.eq("state_id", stateId);
      if (cityId && cityId !== "all") qb = qb.eq("city_id", cityId);
      if (lgaId && lgaId !== "all") qb = qb.eq("lga_id", lgaId);
      if (cat && cat !== "all") qb = qb.eq("category", cat);

      const { data, error } = await qb;
      if (error) throw error;
      return data || [];
    },
  });

  const executeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      search: (prev) => ({ ...prev, q: searchInput || undefined }),
    });
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <SiteHeader />
      
      {/* HERO SECTION */}
      <section className="bg-primary text-primary-foreground py-16 text-center relative">
        <div className="container mx-auto px-4 max-w-4xl space-y-6">
          <h1 className="text-4xl font-extrabold tracking-tight">Buy, Sell & Hire Across Nigeria</h1>
          
          <form onSubmit={executeSearch} className="bg-background text-foreground p-2 rounded-2xl shadow-xl flex flex-col md:flex-row items-center gap-2 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 px-3 flex-1 w-full border-b md:border-b-0 md:border-r pb-2 md:pb-0">
              <Icons.Search className="h-5 w-5 text-muted-foreground" />
              <input 
                type="text" 
                value={searchInput} 
                onChange={(e) => setSearchInput(e.target.value)} 
                placeholder="What are you searching for..." 
                className="w-full text-sm bg-transparent outline-none py-2" 
              />
            </div>

            <div className="flex items-center gap-2 px-2 w-full md:w-52">
              <Icons.MapPin className="h-5 w-5 text-primary" />
              <select 
                value={stateId ?? "all"} 
                onChange={(e) => navigate({ search: (prev) => ({ ...prev, stateId: e.target.value !== "all" ? e.target.value : undefined, cityId: undefined, lgaId: undefined }) })}
                className="w-full bg-transparent text-sm font-medium outline-none cursor-pointer py-2"
              >
                <option value="all">All States (36 States)</option>
                {states.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <Button type="submit" className="w-full md:w-auto bg-accent text-accent-foreground px-6 rounded-xl">Search</Button>
          </form>
        </div>
      </section>

      {/* RENDER BODY */}
      <section className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="space-y-4">
          <Card className="p-4 bg-background border space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Location Filter Hierarchy</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">CITY</label>
                <select 
                  disabled={!stateId || stateId === "all"}
                  value={cityId ?? "all"} 
                  onChange={(e) => navigate({ search: (prev) => ({ ...prev, cityId: e.target.value !== "all" ? e.target.value : undefined, lgaId: undefined }) })}
                  className="w-full bg-muted/40 text-xs rounded-lg p-2 border outline-none disabled:opacity-50"
                >
                  <option value="all">All Cities</option>
                  {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-muted-foreground block mb-1">LGA</label>
                <select 
                  disabled={!cityId || cityId === "all"}
                  value={lgaId ?? "all"} 
                  onChange={(e) => navigate({ search: (prev) => ({ ...prev, lgaId: e.target.value !== "all" ? e.target.value : undefined }) })}
                  className="w-full bg-muted/40 text-xs rounded-lg p-2 border outline-none disabled:opacity-50"
                >
                  <option value="all">All LGAs</option>
                  {lgas.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            </div>
          </Card>
        </aside>

        <div className="lg:col-span-3 space-y-6">
          {isLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : listings.length === 0 ? (
            <div className="p-12 text-center border rounded-xl bg-background text-sm text-muted-foreground">
              No matching listings found for this location profile.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {listings.map((item: any) => (
                <ListingCard key={item.id} l={item} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
