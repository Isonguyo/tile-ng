import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Search, MapPin, ShieldCheck } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/artisans/")({
  component: ArtisanDirectoryPage,
});

function ArtisanDirectoryPage() {
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
              Discover experienced artisans across Nigeria. Browse
              professional profiles, view previous projects and contact
              artisans directly.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">

              <Button size="lg">
                <Search className="mr-2 h-5 w-5" />
                Find an Artisan
              </Button>

              <Button
                variant="outline"
                size="lg"
                asChild
              >
                <Link to="/artisan/create">
                  Become an Artisan
                </Link>
              </Button>

            </div>

          </div>

        </div>
      </section>

      {/* Quick Stats */}

      <section className="container mx-auto max-w-7xl px-4 py-10">

        <div className="grid gap-6 md:grid-cols-3">

          <Card className="p-6">

            <ShieldCheck className="h-8 w-8 text-primary mb-4" />

            <h3 className="font-semibold">
              Verified Professionals
            </h3>

            <p className="text-sm text-muted-foreground mt-2">
              Every artisan profile is reviewed before appearing in the
              directory.
            </p>

          </Card>

          <Card className="p-6">

            <Search className="h-8 w-8 text-primary mb-4" />

            <h3 className="font-semibold">
              Easy Search
            </h3>

            <p className="text-sm text-muted-foreground mt-2">
              Search by profession, state and local government.
            </p>

          </Card>

          <Card className="p-6">

            <MapPin className="h-8 w-8 text-primary mb-4" />

            <h3 className="font-semibold">
              Near You
            </h3>

            <p className="text-sm text-muted-foreground mt-2">
              Find trusted professionals close to your location.
            </p>

          </Card>

        </div>

      </section>

      {/* Placeholder */}

      <section className="container mx-auto max-w-7xl px-4 pb-20">

        <div className="rounded-xl border border-dashed p-16 text-center">

          <Search className="mx-auto h-14 w-14 text-muted-foreground" />

          <h2 className="mt-6 text-2xl font-semibold">
            Artisan Directory Coming Up
          </h2>

          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            In the next step we'll connect this page to Supabase,
            add powerful filters and display professional artisan cards.
          </p>

        </div>

      </section>

    </div>
  );
}
