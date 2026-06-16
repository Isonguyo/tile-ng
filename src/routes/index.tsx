import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { CATEGORIES, formatNaira } from "@/lib/categories";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as Icons from "lucide-react";
import { z } from "zod";

// Comprehensive state definitions across Nigeria for the Hero selector
const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", 
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", 
  "Taraba", "Yobe", "Zamfara"
];

const searchSchema = z.object({
  q: z.string().optional(),
  loc: z.string().optional(),
  cat: z.string().optional(),
});

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
      { rel: "apple-touch-icon", href: "https://res.cloudinary.com/dbozz4sgv/image/upload/v1781367385/tile-logo_vv2c8v.jpg" }
    ],
  }),
  validateSearch: searchSchema,
  component: Index,
});

function Index() {
  const navigate = Route.useNavigate();
  const { q, loc, cat } = Route.useSearch();
  
  // Localized query field states for the enhanced internal search inputs
  const [searchInput, setSearchInput] = useState(q ?? "");
  const [selectedLocation, setSelectedLocation] = useState(loc ?? "all");
  
  // Custom Tab Filters and Sorting Configuration states
  const [activeTab, setActiveTab] = useState<"all" | "goods" | "service" | "featured">("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Fetch Database Listings mapping metadata alongside profile data elements
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["listings", { q, loc, cat }],
    queryFn: async () => {
      let qb = supabase.from("listings")
        .select("id,title,price,type,location,images,is_promoted,category,description,views_count,clicks_count,user_id,created_at")
        .eq("status", "approved")
        .limit(100);

      if (q) qb = qb.ilike("title", `%${q}%`);
      if (loc && loc !== "all") qb = qb.eq("location", loc);
      if (cat) qb = qb.eq("category", cat);

      const { data, error } = await qb;
      if (error) throw error;

      const rows = (data ?? []) as Array<ListingCardData & { user_id: string; created_at: string }>;
      const ids = Array.from(new Set(rows.map((r) => r.user_id))).filter(Boolean);

      if (ids.length) {
        const { data: profs } = await (supabase.from("public_profiles") as unknown as { select: (c: string) => { in: (k: string, v: string[]) => Promise<{ data: { id: string; subscription_tier?: string | null; is_verified?: boolean | null }[] | null }> } })
          .select("id,subscription_tier,is_verified").in("id", ids);
        const map = new Map((profs ?? []).map((p) => [p.id, p]));
        return rows.map((r) => ({ 
          ...r, 
          seller_tier: map.get(r.user_id)?.subscription_tier ?? null, 
          seller_verified: map.get(r.user_id)?.is_verified ?? null 
        }));
      }
      return rows;
    },
  });

  // Calculate dynamic items mapping counts from listings arrays natively
  const dynamicCounts = useMemo(() => {
    const map = new Map<string, number>();
    listings.forEach((l) => {
      if (l.category) map.set(l.category, (map.get(l.category) || 0) + 1);
    });
    return map;
  }, [listings]);

  // Handle Search execution parameter updates down to TanStack route tree structures
  const executeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      search: (prev) => ({
        ...prev,
        q: searchInput || undefined,
        loc: selectedLocation !== "all" ? selectedLocation : undefined,
      }),
    });
  };

  // Client-side filtering logic based on multi-tab types and verification criteria
  const processedListings = useMemo(() => {
    let result = [...listings];

    if (activeTab === "goods") result = result.filter(l => l.type === "goods");
    if (activeTab === "service") result = result.filter(l => l.type === "service");
    if (activeTab === "featured") result = result.filter(l => l.is_promoted);

    return result.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime();
      if (sortBy === "price-low") return (a.price ?? 0) - (b.price ?? 0);
      if (sortBy === "price-high") return (b.price ?? 0) - (a.price ?? 0);
      if (sortBy === "popular") return (b.clicks_count ?? 0) - (a.clicks_count ?? 0);
      return 0;
    });
  }, [listings, activeTab, sortBy]);

  // Hardcoded structure grouping categories matching the required structure 
  const segmentedCategories = [
    {
      group: "Shop Products",
      items: ["phones", "electronics", "fashion", "home-furniture", "beauty"]
    },
    {
      group: "Services",
      items: ["design", "photography", "plumbing", "repairs", "programming"]
    },
    {
      group: "Property & Vehicles",
      items: ["land", "houses", "cars", "motorcycles"]
    }
  ];

  // Sample static data structures simulating trending metrics and top recommended items 
  const trendingCategories = CATEGORIES.slice(0, 4);
  const featuredVendors = [
    { id: "v1", name: "Alaba Electronics Hub", slug: "alaba-hub", verified: true, tier: "premium", rating: 4.9, count: 142, logo: "💻" },
    { id: "v2", name: "Chidi Auto Masters", slug: "chidi-autos", verified: true, tier: "vip", rating: 4.8, count: 89, logo: "🚗" },
    { id: "v3", name: "Rivers Design Studio", slug: "rivers-design", verified: true, tier: "pro", rating: 4.7, count: 54, logo: "🛠" },
  ];

  return (
    <div className="min-h-screen bg-muted/20 text-foreground flex flex-col justify-between">
      <div>
        <SiteHeader />

        {/* HERO SECTION WITH LARGE SEARCH INPUT */}
        <section className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-primary-foreground overflow-hidden py-14 md:py-20">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
          <div className="container mx-auto px-4 text-center max-w-4xl relative z-10 space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Buy, Sell & Hire Across Nigeria
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-primary-foreground/90 font-medium max-w-2xl mx-auto">
              Find physical products, local services, and verified top-tier vendors instantly near you.
            </p>

            <form onSubmit={executeSearch} className="bg-background text-foreground p-2 rounded-2xl shadow-xl border flex flex-col md:flex-row items-center gap-2 max-w-3xl mx-auto w-full">
              <div className="flex items-center gap-2 px-3 flex-1 w-full border-b md:border-b-0 md:border-r pb-2 md:pb-0">
                <Icons.Search className="h-5 w-5 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search products, services or vendors..."
                  className="w-full text-sm bg-transparent outline-none focus:ring-0 py-2"
                />
              </div>

              <div className="flex items-center gap-2 px-2 w-full md:w-48 border-b md:border-b-0 md:border-r pb-2 md:pb-0">
                <Icons.MapPin className="h-5 w-5 text-primary shrink-0" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium outline-none cursor-pointer py-2"
                >
                  <option value="all" className="text-foreground">All States</option>
                  {NIGERIAN_STATES.map(state => (
                    <option key={state} value={state} className="text-foreground">{state}</option>
                  ))}
                </select>
              </div>

              <Button type="submit" className="w-full md:w-auto bg-accent text-accent-foreground font-bold px-6 py-2 rounded-xl transition hover:opacity-90 shrink-0">
                Search
              </Button>
            </form>
          </div>
        </section>

        {/* MARKETPLACE TRUST STATS SECTION */}
        <section className="container mx-auto px-4 -mt-6 relative z-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Active Listings", val: "500K+", icon: Icons.Package, color: "text-blue-500 bg-blue-500/10" },
              { label: "Verified Vendors", val: "20K+", icon: Icons.BadgeCheck, color: "text-emerald-500 bg-emerald-500/10" },
              { label: "States Covered", val: "36 States", icon: Icons.Map, color: "text-amber-500 bg-amber-500/10" },
              { label: "Monthly Visits", val: "1M+", icon: Icons.Eye, color: "text-purple-500 bg-purple-500/10" },
            ].map((stat, i) => {
              const IconComp = stat.icon;
              return (
                <Card key={i} className="p-4 bg-background shadow-md flex items-center gap-4 rounded-xl border border-border">
                  <div className={`p-3 rounded-lg hidden sm:block ${stat.color}`}><IconComp className="h-5 w-5" /></div>
                  <div>
                    <p className="text-xl md:text-2xl font-extrabold tracking-tight">{stat.val}</p>
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{stat.label}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* FEATURED CAROUSEL/SCROLL CATEGORIES WITH COUNTS */}
        <section className="container mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-4 border-b pb-2">
            <div>
              <h2 className="text-base font-bold tracking-tight uppercase text-muted-foreground">Quick Browse</h2>
              <p className="text-xs text-muted-foreground font-medium">Explore immediate volume trends right now.</p>
            </div>
            <button onClick={() => setShowAllCategories(!showAllCategories)} className="text-xs font-bold text-primary hover:underline">
              {showAllCategories ? "Show Compact Layout" : "View Global Directory"}
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x mask-gradient">
            {CATEGORIES.map((c) => {
              const IconComp = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[c.icon] ?? Icons.Tag;
              const active = cat === c.slug;
              const listingCount = dynamicCounts.get(c.slug) || 0;

              return (
                <Link
                  key={c.slug}
                  to="/"
                  search={(p) => ({ ...p, cat: active ? undefined : c.slug })}
                  className={`snap-start shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all min-w-[150px] ${
                    active ? "border-accent bg-accent/10 shadow-sm" : "border-border bg-background hover:border-primary/50"
                  }`}
                >
                  <IconComp className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-foreground leading-tight truncate max-w-[120px]">{c.label}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold">{listingCount} listings</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* DEDICATED ORGANISED BROWSE SECTIONS & FEATURED VENDORS ROW */}
        <section className="container mx-auto px-4 py-4 grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* CATEGORY BLOCK MAP (LEFT COLUMN CONTAINER) */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-4 bg-background border shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Icons.Sliders className="h-4 w-4" /> Categorized Channels
              </h3>
              <div className="space-y-4">
                {segmentedCategories.map((group, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <h4 className="text-xs font-extrabold text-foreground border-b pb-1">{group.group}</h4>
                    <div className="grid grid-cols-1 gap-1">
                      {group.items.map((itemSlug) => {
                        const target = CATEGORIES.find(c => c.slug === itemSlug) || { label: itemSlug, slug: itemSlug };
                        return (
                          <Link key={itemSlug} to="/" search={(p) => ({ ...p, cat: itemSlug })} className="text-xs text-muted-foreground hover:text-primary transition flex justify-between items-center py-0.5 font-medium">
                            <span>• {target.label}</span>
                            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full font-bold">{dynamicCounts.get(itemSlug) || 0}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 🔥 TRENDING VOLUME CHANNELS MAP */}
            <Card className="p-4 bg-background border shadow-sm space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Icons.Flame className="h-4 w-4 text-orange-500 fill-orange-500/10" /> Trending Now
              </h3>
              <div className="space-y-2">
                {trendingCategories.map((tc) => (
                  <Link key={tc.slug} to="/" search={(p) => ({ ...p, cat: tc.slug })} className="flex items-center gap-3 p-2 rounded-lg bg-muted/40 border border-transparent hover:border-border transition">
                    <span className="text-lg">📦</span>
                    <div>
                      <p className="text-xs font-bold capitalize">{tc.label}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold">{dynamicCounts.get(tc.slug) || 12} volume inputs</p>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </div>

          {/* MAIN GRID BLOCK AND DISCOVERY PIPELINES CONTAINER */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* FEATURED TOP-RATED VENDORS ROW */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Icons.Award className="h-4 w-4 text-accent" /> Premium Top Rated Stores
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {featuredVendors.map((vendor) => (
                  <Link key={vendor.id} to={`/shop/${vendor.slug}`} className="p-4 bg-background border rounded-xl shadow-sm hover:shadow-md transition flex items-center gap-4 group">
                    <div className="h-12 w-12 bg-primary/10 rounded-xl grid place-items-center text-xl shadow-inner group-hover:scale-105 transition-transform">{vendor.logo}</div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-bold text-foreground truncate">{vendor.name}</p>
                        <Icons.BadgeCheck className="h-3.5 w-3.5 text-accent shrink-0" />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
                        <span className="flex items-center gap-0.5 text-amber-500"><Icons.Star className="h-3 w-3 fill-amber-500" /> {vendor.rating}</span>
                        <span>{vendor.count} Products</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* CONTROL BAR: FILTER TABS & SORT DROP-DOWN MENU CONTAINER */}
            <div className="bg-background p-3 rounded-xl border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as never)} className="w-full sm:w-auto">
                <TabsList className="grid grid-cols-4 bg-muted/60 p-1 rounded-lg h-auto">
                  <TabsTrigger value="all" className="text-xs font-bold py-1.5 rounded-md">All</TabsTrigger>
                  <TabsTrigger value="goods" className="text-xs font-bold py-1.5 rounded-md">Products</TabsTrigger>
                  <TabsTrigger value="service" className="text-xs font-bold py-1.5 rounded-md">Services</TabsTrigger>
                  <TabsTrigger value="featured" className="text-xs font-bold py-1.5 rounded-md">Promoted</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">Sort By:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[160px] h-9 text-xs bg-muted/30">
                    <SelectValue placeholder="Ordering parameters" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest" className="text-xs font-medium">Newest Submissions</SelectItem>
                    <SelectItem value="popular" className="text-xs font-medium">Most Visited / Popular</SelectItem>
                    <SelectItem value="price-low" className="text-xs font-medium">Price: Low to High</SelectItem>
                    <SelectItem value="price-high" className="text-xs font-medium">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* UNIFORM PRODUCT ENTITIES GRID WITH SPECIFIC GRID TRACK CODES */}
            <div>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-2">
                  <Icons.Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground font-medium">Syncing live Nigerian marketplace listings...</p>
                </div>
              ) : processedListings.length === 0 ? (
                
                /* COMPREHENSIVE EMPTY STATE CONTROLS WRAPPER */
                <div className="rounded-xl border border-dashed border-border bg-background p-12 text-center max-w-xl mx-auto space-y-4 shadow-inner">
                  <div className="h-12 w-12 bg-muted rounded-full grid place-items-center mx-auto text-muted-foreground"><Icons.PackageX className="h-6 w-6" /></div>
                  <div>
                    <h3 className="text-sm font-bold">No Matchable Listings Found</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                      Try adapting your filter settings, modifying the query text, or expanding parameters across the 36 states.
                    </p>
                  </div>
                  <Button onClick={() => { setSearchInput(""); setSelectedLocation("all"); navigate({ search: {} }); }} size="sm" className="bg-primary text-primary-foreground font-semibold">
                    Browse All Listings
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {processedListings.map((l) => (
                    <div key={l.id} className="group relative rounded-xl border border-border bg-background overflow-hidden transition-all duration-200 hover:shadow-md flex flex-col justify-between">
                      <div>
                        {/* Image Frame node container wrapper with dynamic badge overlays */}
                        <div className="aspect-square bg-muted relative overflow-hidden">
                          {l.images && l.images[0] ? (
                            <img src={l.images[0]} alt={l.title} className="object-cover w-full h-full transition group-hover:scale-105" loading="lazy" />
                          ) : (
                            <div className="w-full h-full bg-muted/50 flex items-center justify-center text-muted-foreground/40 text-xs">No Preview Image</div>
                          )}

                          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                            {l.is_promoted && <Badge className="bg-accent text-accent-foreground text-[9px] font-extrabold uppercase px-1.5 py-0.5 shadow">Promoted</Badge>}
                            {l.seller_tier && l.seller_tier !== "free" && <Badge className="bg-amber-500 text-white text-[9px] font-extrabold uppercase px-1.5 py-0.5 shadow">Premium Vendor</Badge>}
                          </div>

                          <button aria-label="Save to bookmarks" className="absolute top-2 right-2 p-1.5 rounded-full bg-background/90 backdrop-blur-sm text-muted-foreground hover:text-destructive transition shadow-sm">
                            <Icons.Heart className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Title and location tracking blocks */}
                        <div className="p-3 space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                            <span>{l.category || "Inventory"}</span>
                            {l.seller_verified && <Icons.BadgeCheck className="h-3 w-3 text-accent fill-accent/10" />}
                          </div>
                          <h4 className="text-xs font-bold text-foreground line-clamp-2 min-h-[32px] group-hover:text-primary transition-colors leading-tight">
                            {l.title}
                          </h4>
                          <p className="text-[11px] text-muted-foreground font-semibold flex items-center gap-0.5 truncate"><Icons.MapPin className="h-3 w-3 text-muted-foreground shrink-0" /> {l.location}</p>
                        </div>
                      </div>

                      {/* Explicitly flat-heighted structural footer section */}
                      <div className="p-3 pt-0 border-t bg-muted/10 flex items-center justify-between mt-2">
                        <p className="text-sm font-extrabold text-foreground tracking-tight">{formatNaira(l.price ?? 0)}</p>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                          <Icons.Eye className="h-3 w-3" /> {l.views_count ?? 18}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* COMPREHENSIVE MULTI-COLUMN PREMIUM RE-DESIGNED FOOTER */}
      <footer className="bg-primary text-primary-foreground/80 mt-16 border-t border-primary-foreground/10">
        <div className="container mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div className="space-y-3 col-span-2 md:col-span-1">
            <span className="text-base font-extrabold text-primary-foreground tracking-wider uppercase">Tile Marketplace</span>
            <p className="text-xs text-primary-foreground/70 max-w-xs leading-relaxed font-medium">
              Nigeria's hyper-secure classification hub matching authenticated goods and local expertise across all 36 states seamlessly.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary-foreground border-b border-primary-foreground/10 pb-1">Marketplace Channels</h4>
            <div className="flex flex-col gap-1.5 text-xs font-medium text-primary-foreground/80">
              <Link to="/" className="hover:text-white transition">Browse All Listings</Link>
              <Link to="/" search={{ cat: "phones" }} className="hover:text-white transition">Mobile Smart Devices</Link>
              <Link to="/" search={{ cat: "electronics" }} className="hover:text-white transition">Home Appliance Portals</Link>
              <Link to="/" search={{ cat: "programming" }} className="hover:text-white transition">Technical Freelancers</Link>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary-foreground border-b border-primary-foreground/10 pb-1">Company Profile</h4>
            <div className="flex flex-col gap-1.5 text-xs font-medium text-primary-foreground/80">
              <span className="cursor-pointer hover:text-white transition">About Corporate Hub</span>
              <span className="cursor-pointer hover:text-white transition">Customer Support Portal</span>
              <span className="cursor-pointer hover:text-white transition">Strategic Media & Blog</span>
              <span className="cursor-pointer hover:text-white transition">Privacy Management Policy</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary-foreground border-b border-primary-foreground/10 pb-1">Connect Ecosystem</h4>
            <div className="flex gap-3 text-primary-foreground/70">
              <Icons.Facebook className="h-5 w-5 hover:text-white cursor-pointer transition" />
              <Icons.Instagram className="h-5 w-5 hover:text-white cursor-pointer transition" />
              <Icons.Twitter className="h-5 w-5 hover:text-white cursor-pointer transition" />
              <Icons.Linkedin className="h-5 w-5 hover:text-white cursor-pointer transition" />
            </div>
            <p className="text-[11px] text-primary-foreground/50 font-mono">System running modern TanStack & Supabase engine pipelines securely.</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-4 border-t border-primary-foreground/10 text-xs font-medium flex flex-col sm:flex-row justify-between items-center gap-2 text-primary-foreground/60">
          <span>© {new Date().getFullYear()} Tile Marketplace Inc. All rights reserved across regions.</span>
          <span>Designed with high performance criteria for local connectivity models.</span>
        </div>
      </footer>
    </div>
  );
}
