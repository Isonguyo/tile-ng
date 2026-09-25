import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Search,
  MapPin,
  ShieldCheck,
  Briefcase,
  Star,
  UserRound,
  Sparkles,
  BadgeCheck,
  Phone,
  MessageSquare,
  ArrowRight,
  Flame,
  CheckCircle2,
  Zap,
  Wrench,
  Scissors,
  Paintbrush,
  Hammer,
  Camera,
  Laptop,
  HelpCircle,
} from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/artisans/")({
  component: ArtisanDirectoryPage,
});

const POPULAR_CATEGORIES = [
  { name: "Electrician", icon: Zap, label: "Electricians" },
  { name: "Plumber", icon: Wrench, label: "Plumbers" },
  { name: "Mechanic", icon: Flame, label: "Mechanics" },
  { name: "Carpenter", icon: Hammer, label: "Carpenters" },
  { name: "Painter", icon: Paintbrush, label: "Painters" },
  { name: "Developer", icon: Laptop, label: "Tech Experts" },
  { name: "Photographer", icon: Camera, label: "Photography" },
  { name: "Tailor", icon: Scissors, label: "Fashion Designers" },
];

const normalize = (value?: string | null) =>
  (value ?? "").trim().toLowerCase();

const isPremiumTier = (tier?: string | null) =>
  ["pro", "vip"].includes(normalize(tier));

function ArtisanDirectoryPage() {
  const [qProfession, setQProfession] = useState("");
  const [qState, setQState] = useState("");
  const [qLga, setQLga] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("rating");

  const {
    data: artisans = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["artisans-ranked"],
    queryFn: async () => {
      const { data, error } = await rpcUntyped("search_artisans", {});
      if (error) throw new Error(error.message);
      return (data ?? []) as Array<{
        id: string; full_name: string | null; profession: string | null;
        state: string | null; lga: string | null; bio: string | null;
        avatar_url: string | null; profile_photo: string | null;
        is_verified: boolean | null; subscription_tier: string | null;
        tier_rank: number; trust_score: number;
        years_experience: number | null; starting_price: number | null;
        avg_rating: number | null; review_count: number | null;
        is_available: boolean | null;
      }>;
    },
  });

  const filtered = useMemo(() => {
    const profession = normalize(qProfession);
    const state = normalize(qState);
    const lga = normalize(qLga);

    const result = artisans.filter((artisan) => {
      if (profession && !normalize(artisan.profession).includes(profession)) return false;
      if (state && !normalize(artisan.state).includes(state)) return false;
      if (lga && !normalize(artisan.lga).includes(lga)) return false;
      if (verifiedOnly && !artisan.is_verified) return false;
      return true;
    });

    // Tier always wins (VIP > PRO > LITE > Free), then trust; the chosen sort breaks ties.
    const tieBreak = (a: typeof result[number], b: typeof result[number]) => {
      switch (sortBy) {
        case "price_low": return Number(a.starting_price ?? 0) - Number(b.starting_price ?? 0);
        case "experience": return (b.years_experience ?? 0) - (a.years_experience ?? 0);
        default: return (b.avg_rating ?? 0) - (a.avg_rating ?? 0);
      }
    };
    return [...result].sort(
      (a, b) => b.tier_rank - a.tier_rank || b.trust_score - a.trust_score || tieBreak(a, b)
    );
  }, [artisans, qProfession, qState, qLga, verifiedOnly, sortBy]);

  const featuredArtisans = useMemo(() => {
    return artisans
      .filter((artisan) => isPremiumTier(artisan.subscription_tier))
      .slice(0, 3);
  }, [artisans]);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/10">
      <SiteHeader />

      {/* 1. Hero Landing Page Context */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/5 via-background to-emerald-500/5 py-16 md:py-24">
        {/* Background Glow */}
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="container relative mx-auto max-w-7xl px-4 text-center md:text-left">
          <div className="grid gap-12 md:grid-cols-12 md:items-center">
            <div className="space-y-8 md:col-span-7">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-700 border border-amber-300/40">
                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                <span>Trusted by Thousands Across Nigeria 🇳🇬</span>
              </div>

              {/* Heading */}
              <div className="space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl leading-tight">
                  Nigeria's Marketplace
                  <br />
                  <span className="bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
                    for Trusted Professionals
                  </span>
                </h1>

                <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                  Hire verified electricians, plumbers, mechanics, painters,
                  developers, photographers and hundreds of other skilled
                  professionals near you. Compare profiles, chat instantly and
                  hire with confidence.
                </p>
              </div>

              {/* Trust Features */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium shadow-sm">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Verified Professionals
                </div>

                <div className="flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium shadow-sm">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Secure Messaging
                </div>

                <div className="flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium shadow-sm">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Fast Response
                </div>

                <div className="flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium shadow-sm">
                  <MapPin className="h-4 w-4 text-red-500" />
                  Nationwide Coverage
                </div>
              </div>

              {/* Advanced Search */}
              <Card className="overflow-hidden rounded-2xl border bg-background/95 shadow-xl backdrop-blur">
                <div className="grid md:grid-cols-[2fr_1.2fr_auto]">
                  {/* Profession */}
                  <div className="relative border-b md:border-b-0 md:border-r">
                    <Briefcase className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={qProfession}
                      onChange={(e) => setQProfession(e.target.value)}
                      placeholder="What service do you need?"
                      className="h-16 border-0 bg-transparent pl-12 text-base focus-visible:ring-0"
                    />
                  </div>

                  {/* State */}
                  <div className="relative border-b md:border-b-0 md:border-r">
                    <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={qState}
                      onChange={(e) => setQState(e.target.value)}
                      placeholder="State"
                      className="h-16 border-0 bg-transparent pl-12 text-base focus-visible:ring-0"
                    />
                  </div>

                  {/* Search Button */}
                  <div className="flex items-center p-2">
                    <Button
                      size="lg"
                      className="h-12 w-full rounded-xl px-8 font-semibold"
                    >
                      <Search className="mr-2 h-5 w-5" />
                      Find Professionals
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-5 md:justify-start">
                <Button asChild size="lg">
                  <Link to="/artisan/create">
                    Become an Artisan
                  </Link>
                </Button>

                <Button asChild variant="outline" size="lg">
                  <Link to="/">
                    Browse Marketplace
                  </Link>
                </Button>

                <Badge
                  variant="secondary"
                  className="rounded-full px-4 py-2 text-sm"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                  Verified Professionals
                </Badge>

                <Badge
                  variant="secondary"
                  className="rounded-full px-4 py-2 text-sm"
                >
                  🇳🇬 Available Nationwide
                </Badge>
              </div>
            </div>

            {/* Live Marketplace Statistics */}
            <div className="md:col-span-5">
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    value: `${artisans.length}+`,
                    label: "Professionals",
                    icon: UserRound,
                  },
                  {
                    value: "36",
                    label: "States Covered",
                    icon: MapPin,
                  },
                  {
                    value: "24/7",
                    label: "Instant Hiring",
                    icon: Zap,
                  },
                  {
                    value: "100%",
                    label: "Verified Profiles",
                    icon: ShieldCheck,
                  },
                ].map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <Card
                      key={index}
                      className="group rounded-2xl border bg-background/70 p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
                    >
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-6 w-6" />
                      </div>

                      <div className="text-3xl font-black">
                        {item.value}
                      </div>

                      <p className="mt-2 text-sm font-medium text-muted-foreground">
                        {item.label}
                      </p>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="container mx-auto max-w-7xl px-4 py-14">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              Browse Popular Services
            </h2>

            <p className="mt-1 text-muted-foreground">
              Start with Nigeria's most requested professionals.
            </p>
          </div>

          <Badge variant="secondary">
            {POPULAR_CATEGORIES.length} Categories
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {POPULAR_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = qProfession === cat.name;

            return (
              <button
                key={cat.name}
                onClick={() => setQProfession(active ? "" : cat.name)}
                className={`group rounded-2xl border p-5 transition-all ${active
                    ? "border-primary bg-primary text-primary-foreground shadow-lg"
                    : "bg-card hover:border-primary hover:shadow-md"
                  }`}
              >
                <div
                  className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${active
                      ? "bg-white/20"
                      : "bg-primary/10 text-primary"
                    }`}
                >
                  <Icon className="h-6 w-6" />
                </div>

                <p className="text-sm font-semibold">
                  {cat.label}
                </p>

                <p className="mt-1 text-xs opacity-70">
                  Explore
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Available Right Now */}
      <section className="container mx-auto max-w-7xl px-4 pb-14">
        <Card className="overflow-hidden rounded-3xl border-0 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
          <div className="flex flex-col items-center justify-between gap-6 p-8 lg:flex-row">
            <div>
              <Badge className="mb-4 bg-white/20 text-white hover:bg-white/20">
                Available Now
              </Badge>

              <h3 className="text-3xl font-bold">
                Need someone today?
              </h3>

              <p className="mt-2 max-w-xl text-primary-foreground/80">
                Hire verified electricians, plumbers, mechanics, technicians and more in just a few minutes.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {[
                "Electrician",
                "Plumber",
                "Mechanic",
                "Cleaner",
              ].map((service) => (
                <Button
                  key={service}
                  variant="secondary"
                  onClick={() => setQProfession(service)}
                >
                  {service}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      </section>

      {/* Featured Professionals */}
      {featuredArtisans.length > 0 && !qProfession && !qState && (
        <section className="container mx-auto max-w-7xl px-4 py-16">
          <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <Badge className="mb-3 bg-amber-100 text-amber-700 hover:bg-amber-100">
                <Sparkles className="mr-2 h-4 w-4 fill-current" />
                Premium Directory
              </Badge>

              <h2 className="text-4xl font-black tracking-tight">
                Featured Professionals
              </h2>

              <p className="mt-2 max-w-2xl text-muted-foreground">
                Meet Tile's most trusted professionals with verified identities,
                premium profiles and outstanding customer satisfaction.
              </p>
            </div>

            <Button variant="outline" asChild>
              <Link to="/artisans">
                View All Professionals
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featuredArtisans.map((artisan) => (
              <Card
                key={artisan.id}
                className="group overflow-hidden rounded-3xl border-2 border-amber-300/40 transition-all hover:-translate-y-2 hover:border-amber-400 hover:shadow-2xl"
              >
                {/* Cover */}
                <div className="relative h-32 bg-gradient-to-r from-primary via-primary/80 to-amber-500">
                  <Badge className="absolute right-4 top-4 bg-white text-amber-600">
                    <Sparkles className="mr-1 h-3 w-3 fill-current" />
                    VIP
                  </Badge>
                </div>

                <div className="relative px-6 pb-6">
                  {/* Avatar */}
                  <div className="-mt-12 mb-4">
                    <img
                      src={
                        artisan.profile_photo ||
                        artisan.avatar_url ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
                      }
                      alt={artisan.full_name ?? ""}
                      className="h-24 w-24 rounded-full border-4 border-background object-cover shadow-lg"
                    />
                  </div>

                  {/* Name */}
                  <div className="space-y-1">
                    <h3 className="flex items-center gap-2 text-xl font-bold">
                      {artisan.full_name}
                      {artisan.is_verified && (
                        <BadgeCheck className="h-5 w-5 text-emerald-600" />
                      )}
                    </h3>

                    <p className="font-semibold text-primary">
                      {artisan.profession || "Premium Professional"}
                    </p>

                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {artisan.state}, {artisan.lga}
                    </p>
                  </div>

                  {/* Rating */}
                  <div className="mt-5 flex items-center justify-between rounded-xl bg-muted/50 p-3">
                    <div className="text-center">
                      <p className="text-lg font-bold">
                        ⭐ {artisan.avg_rating ?? "5.0"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Rating
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-lg font-bold">
                        {artisan.years_experience ?? 0}+
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Years
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-lg font-bold">
                        ₦{Number(artisan.starting_price ?? 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        From
                      </p>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="mt-5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {artisan.bio ||
                      "Trusted professional delivering high-quality services across Nigeria."}
                  </p>

                  {/* Professional Highlights */}
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border bg-muted/30 p-3 text-center">
                      <div className="text-lg font-bold text-primary">
                        {artisan.years_experience ?? 0}+
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Years Experience
                      </div>
                    </div>

                    <div className="rounded-xl border bg-muted/30 p-3 text-center">
                      <div className="text-lg font-bold text-primary">
                        ⭐ {artisan.avg_rating ?? "5.0"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Customer Rating
                      </div>
                    </div>
                  </div>

                  {/* Trust Badges */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    {artisan.is_verified && (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                        Verified
                      </Badge>
                    )}

                    <Badge variant="secondary">
                      Fast Response
                    </Badge>

                    {artisan.subscription_tier === "vip" && (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                        <Sparkles className="mr-1 h-3.5 w-3.5 fill-current" />
                        VIP Professional
                      </Badge>
                    )}

                    {artisan.subscription_tier === "pro" && (
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        PRO Partner
                      </Badge>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-6 flex items-center justify-between border-t pt-5">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Starting From
                      </p>
                      <p className="text-lg font-bold text-primary">
                        ₦{Number(artisan.starting_price ?? 0).toLocaleString()}
                      </p>
                    </div>

                    <Button asChild>
                      <Link
                        to="/artisans/$id"
                        params={{ id: artisan.id }}
                      >
                        View Profile
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* 5. Search Controls */}
      <section className="container mx-auto max-w-7xl px-4 pb-20">
        <div className="sticky top-20 z-20 mb-8 rounded-2xl border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 shadow-sm">
          <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
            {/* Left */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="verified"
                  checked={verifiedOnly}
                  onCheckedChange={(checked) => setVerifiedOnly(!!checked)}
                />
                <label
                  htmlFor="verified"
                  className="flex cursor-pointer items-center gap-2 text-sm font-medium"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Verified Only
                </label>
              </div>

              <div className="hidden h-5 w-px bg-border md:block" />

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="rating">⭐ Top Rated</option>
                <option value="experience">💼 Most Experienced</option>
                <option value="price_low">💰 Lowest Price</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQProfession("");
                  setQState("");
                  setQLga("");
                  setVerifiedOnly(false);
                  setSortBy("rating");
                }}
              >
                Reset Filters
              </Button>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="px-3 py-1 text-sm">
                {filtered.length} Professionals
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                {filtered.filter((a) => a.is_verified).length} Verified
              </Badge>
            </div>
          </div>
        </div>

        {/* Artisan Results */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border bg-card py-32">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <h3 className="mt-6 text-xl font-bold">Finding Professionals...</h3>
            <p className="mt-2 max-w-md text-center text-muted-foreground">
              We're searching thousands of verified artisans across Nigeria.
            </p>
          </div>
        ) : isError ? (
          <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-16 text-center">
            <HelpCircle className="mx-auto h-14 w-14 text-destructive" />
            <h2 className="mt-6 text-2xl font-bold">Something went wrong</h2>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              We couldn't load the artisan directory right now. Please refresh the page or try again later.
            </p>
            <Button className="mt-6" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed bg-card p-20 text-center">
            <Search className="mx-auto h-16 w-16 text-muted-foreground" />
            <h2 className="mt-6 text-2xl font-bold">No Professionals Found</h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
              We couldn't find any professionals matching your search. Try changing your service, location or filters.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setQProfession("");
                  setQState("");
                  setQLga("");
                  setVerifiedOnly(false);
                  setSortBy("rating");
                }}
              >
                Reset Filters
              </Button>
              <Button asChild>
                <Link to="/artisan/create">Become the First Artisan</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-3xl font-black">Available Professionals</h2>
                <p className="mt-1 text-muted-foreground">
                  Showing {filtered.length} artisan{filtered.length !== 1 && "s"} matching your search.
                </p>
              </div>
              <Badge className="w-fit px-4 py-2 text-sm">
                {filtered.filter((a) => a.is_verified).length} Verified
              </Badge>
            </div>

            {/* Results Grid */}
            <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((artisan) => {
                const tier = (artisan.subscription_tier ?? "free").toString().toLowerCase();
                const isPremium = tier === "pro" || tier === "vip";
                const isTopRated = (artisan.years_experience ?? 0) >= 5 || (artisan.avg_rating ?? 0) >= 4.5;

                return (
                  <Card
                    key={artisan.id}
                    className={
                      "group overflow-hidden rounded-3xl border bg-card transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl " +
                      (isPremium
                        ? "border-amber-300 ring-1 ring-amber-200"
                        : isTopRated
                          ? "border-primary/30"
                          : "")
                    }
                  >
                    {/* Top Accent */}
                    <div className="h-2 bg-gradient-to-r from-primary via-emerald-500 to-primary" />

                    <div className="p-6">

                      {/* Header */}
                      <div className="flex items-start gap-4">

                        <div className="relative h-16 w-16 flex-shrink-0">
                          {artisan.profile_photo || artisan.avatar_url ? (
                            <img
                              src={artisan.profile_photo || artisan.avatar_url || undefined}
                              alt={artisan.full_name || "Artisan"}
                              className="h-full w-full rounded-2xl object-cover border shadow-lg"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center rounded-2xl border bg-muted">
                              <UserRound className="h-7 w-7 text-muted-foreground" />
                            </div>
                          )}

                          <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background bg-emerald-500" />
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex items-center gap-2">

                            <h3 className="truncate text-lg font-bold">
                              {artisan.full_name || "Anonymous Professional"}
                            </h3>

                            {artisan.is_verified && (
                              <BadgeCheck className="h-5 w-5 text-sky-600" />
                            )}

                          </div>

                          <p className="text-sm font-semibold text-primary">
                            {artisan.profession || "General Contractor"}
                          </p>

                          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>
                              {artisan.state || "Nigeria"}
                              {artisan.lga && ` • ${artisan.lga}`}
                            </span>
                          </div>

                        </div>

                      </div>

                      {/* Premium Badges */}

                      <div className="mt-5 flex flex-wrap gap-2">

                        {artisan.is_verified && (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            ✔ Verified
                          </Badge>
                        )}

                        {isPremium && (
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                            👑 Premium
                          </Badge>
                        )}

                        {isTopRated && (
                          <Badge variant="secondary">
                            ⭐ Top Rated
                          </Badge>
                        )}

                      </div>

                      {/* Bio */}

                      <p className="mt-5 line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {artisan.bio ||
                          "Professional artisan ready to deliver quality workmanship at competitive prices."}
                      </p>

                      {/* Stats */}

                      <div className="mt-6 flex gap-3">

                        <div className="flex-1 rounded-2xl border bg-muted/30 p-4 text-center">

                          <p className="text-2xl font-bold text-primary">
                            {artisan.years_experience || 0}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            Years Experience
                          </p>

                        </div>

                        <div className="flex-1 rounded-2xl border bg-muted/30 p-4 text-center">

                          <p className="text-lg font-bold text-emerald-600">
                            {artisan.starting_price
                              ? `₦${Number(artisan.starting_price).toLocaleString()}`
                              : "Quote"}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            Starting From
                          </p>

                        </div>

                      </div>

                      {/* Footer */}

                      <div className="mt-6 grid grid-cols-3 gap-2 border-t pt-5">

                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          asChild
                        >
                          <Link to="/artisans/$id" params={{ id: artisan.id }}>
                            <Phone className="mr-1 h-4 w-4" />
                            Call
                          </Link>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                          asChild
                        >
                          <Link to="/artisans/$id" params={{ id: artisan.id }}>
                            <MessageSquare className="mr-1 h-4 w-4" />
                            Chat
                          </Link>
                        </Button>

                        <Button
                          size="sm"
                          className="rounded-xl font-semibold"
                          asChild
                        >
                          <Link
                            to="/artisans/$id"
                            params={{ id: artisan.id }}
                          >
                            Profile
                          </Link>
                        </Button>

                      </div>

                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}