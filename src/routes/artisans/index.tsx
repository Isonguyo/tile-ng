import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, MapPin, ShieldCheck, Briefcase, Star, UserRound, Sparkles, BadgeCheck } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/artisans/")({
  component: ArtisanDirectoryPage,
});

function ArtisanDirectoryPage() {
  const [qProfession, setQProfession] = useState("");
  const [qState, setQState] = useState("");
  const [qLga, setQLga] = useState("");

  const { data: artisans = [], isLoading, isError } = useQuery({
    queryKey: ["public-artisans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_artisan", true) // Only show verified artisans
        .order("full_name");

      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const p = qProfession.trim().toLowerCase();
    const s = qState.trim().toLowerCase();
    const l = qLga.trim().toLowerCase();
    return artisans.filter((a) => {
      if (p && !(a.profession ?? "").toLowerCase().includes(p)) return false;
      if (s && !(a.state ?? "").toLowerCase().includes(s)) return false;
      if (l && !(a.lga ?? "").toLowerCase().includes(l)) return false;
      return true;
    });
  }, [artisans, qProfession, qState, qLga]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="border-b bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4 py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Find Trusted Artisans Near You
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Discover experienced artisans across Nigeria. Browse professional profiles, view previous projects and contact artisans directly.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <ShieldCheck className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-semibold">Verified Pros</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Every professional profile highlights real experience and verified records.
            </p>
          </Card>
          <Card className="p-6">
            <Search className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-semibold">Easy Search</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Search by profession, state and local government areas instantly.
            </p>
          </Card>
          <Card className="p-6">
            <MapPin className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-semibold">Near You</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Find trusted professionals close to your building or construction location.
            </p>
          </Card>
        </div>
      </section>

      {/* Artisan Cards Grid Listing Section */}
      <section className="container mx-auto max-w-7xl px-4 pb-20">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-2xl font-bold text-foreground">Available Tile Professionals</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} of {artisans.length} artisans</p>
        </div>

        {/* Filters */}
        <Card className="mb-6 grid gap-3 border-border/70 p-4 sm:grid-cols-3">
          <div className="relative">
            <Briefcase className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={qProfession} onChange={(e) => setQProfession(e.target.value)} placeholder="Profession (e.g. Tiler)" className="pl-9" />
          </div>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={qState} onChange={(e) => setQState(e.target.value)} placeholder="State" className="pl-9" />
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={qLga} onChange={(e) => setQLga(e.target.value)} placeholder="LGA" className="pl-9" />
          </div>
        </Card>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading artisans...</div>
        ) : isError ? (
          <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">Couldn’t load artisans. Please retry.</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed p-16 text-center">
            <Search className="mx-auto h-14 w-14 text-muted-foreground" />
            <h2 className="mt-6 text-2xl font-semibold">No Artisans Found</h2>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              Try clearing your filters or expanding your search area.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((artisan) => {
              const tier = (artisan.subscription_tier ?? "free").toString().toLowerCase();
              const isPremium = tier === "pro" || tier === "vip";
              const isTopRated = (artisan.years_experience ?? 0) >= 5 || (artisan.avg_rating ?? 0) >= 4.5;
              return (
              <Card
                key={artisan.id}
                className={
                  "overflow-hidden border shadow-sm hover:shadow-lg transition-all flex flex-col justify-between " +
                  (isPremium ? "border-amber-400/50 ring-1 ring-amber-400/30" : isTopRated ? "border-primary/40" : "")
                }
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Avatar Display */}
                    <div className="h-16 w-16 rounded-full overflow-hidden bg-muted flex-shrink-0 border">
                      {artisan.profile_photo || artisan.avatar_url ? (
                        <img 
                          src={artisan.profile_photo || artisan.avatar_url || undefined} 
                          alt={artisan.full_name || "Artisan"} 
                          className="h-full w-full object-cover" 
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-muted">
                          <UserRound className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-foreground line-clamp-1">{artisan.full_name || "Anonymous Artisan"}</h3>
                        {artisan.is_verified ? <BadgeCheck className="h-4 w-4 text-emerald-600" /> : null}
                      </div>
                      <p className="text-sm font-medium text-primary">{artisan.profession || "Specialist Installer"}</p>
                      
                      <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{artisan.state || "Nigeria"}{artisan.lga ? ` • ${artisan.lga}` : ""}</span>
                      </div>
                    </div>
                  </div>

                  {(isPremium || isTopRated) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {isPremium && (
                        <Badge className="gap-1 bg-amber-500/15 text-amber-700 hover:bg-amber-500/20"><Sparkles className="h-3 w-3" /> {tier.toUpperCase()}</Badge>
                      )}
                      {isTopRated && (
                        <Badge variant="secondary" className="gap-1"><ShieldCheck className="h-3 w-3" /> Top rated</Badge>
                      )}
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground mt-4 line-clamp-3 italic">
                    "{artisan.bio || "No biography provided yet."}"
                  </p>

                  <div className="flex flex-wrap gap-2 mt-4 text-xs font-medium text-muted-foreground">
                    <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
                      <Briefcase className="h-3.5 w-3.5" /> {artisan.years_experience || 0} Yrs Exp
                    </span>
                    {artisan.starting_price && (
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded-md font-semibold">
                        Starting: ₦{Number(artisan.starting_price).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-muted/40 border-t flex items-center justify-between">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    ))}
                  </div>
                  <Button size="sm" asChild>
                    <Link to="/artisans/$id" params={{ id: artisan.id }}>View Profile</Link>
                  </Button>
                </div>
              </Card>
            );})}
          </div>
        )}
      </section>
    </div>
  );
}
