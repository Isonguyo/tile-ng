import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, ShieldCheck, Briefcase, Star, UserRound } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/artisans/")({
  component: ArtisanDirectoryPage,
});

function ArtisanDirectoryPage() {
  // ✨ Fetch real artisan profiles from your Supabase table
  const { data: artisans = [], isLoading } = useQuery({
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
        <h2 className="text-2xl font-bold mb-6 text-foreground">Available Tile Professionals</h2>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading artisans...</div>
        ) : artisans.length === 0 ? (
          <div className="rounded-xl border border-dashed p-16 text-center">
            <Search className="mx-auto h-14 w-14 text-muted-foreground" />
            <h2 className="mt-6 text-2xl font-semibold">No Artisans Found</h2>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              Be the first to join the network! Create an artisan profile to start appearing in search results here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {artisans.map((artisan) => (
              <Card key={artisan.id} className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Avatar Display */}
                    <div className="h-16 w-16 rounded-full overflow-hidden bg-muted flex-shrink-0 border">
                      {artisan.profile_photo || artisan.avatar_url ? (
                        <img 
                          src={artisan.profile_photo || artisan.avatar_url} 
                          alt={artisan.full_name} 
                          className="h-full w-full object-cover" 
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-muted">
                          <UserRound className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-bold text-lg text-foreground line-clamp-1">{artisan.full_name || "Anonymous Artisan"}</h3>
                      <p className="text-sm font-medium text-primary">{artisan.profession || "Specialist Installer"}</p>
                      
                      <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{artisan.state || "Nigeria"}{artisan.lga ? ` • ${artisan.lga}` : ""}</span>
                      </div>
                    </div>
                  </div>

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
                    <Link to={`/artisans/${artisan.id}`}>View Profile</Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
