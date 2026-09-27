import { rpcUntyped } from "@/lib/waitlist-rpc";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Search,
  MapPin,
  ShieldCheck,
  Star,
  UserRound,
  Sparkles,
  BadgeCheck,
  MessageSquare,
  ArrowRight,
  Flame,
  Zap,
  Wrench,
  Scissors,
  Paintbrush,
  Hammer,
  Camera,
  Laptop,
  HelpCircle,
  Heart,
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
      if (profession && !`${normalize(artisan.full_name)} ${normalize(artisan.profession)}`.includes(profession)) return false;
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
    <div className="min-h-screen bg-[#06120d] text-slate-100 selection:bg-emerald-300/20">
      <SiteHeader />

      {/* 1. Hero Landing Page Context */}
      <section className="tile-artisan-hero relative isolate overflow-hidden text-white">
        <div className="tile-artisan-backdrop" aria-hidden="true" />
        <div className="container relative z-10 mx-auto max-w-7xl px-4 py-12 md:py-16 xl:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.03fr_.97fr] xl:gap-14">
            <div className="tile-artisan-copy space-y-6">
              <div className="tile-trust-pill"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> Trusted by Thousands Across Nigeria</div>
              <h1 className="max-w-2xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl xl:text-[4.25rem]">
                Nigeria's Marketplace<br /><span>for Trusted Professionals</span>
              </h1>
              <p className="max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
                Hire verified electricians, plumbers, mechanics, painters, developers, photographers and hundreds of other skilled professionals near you. Compare profiles, chat instantly and hire with confidence.
              </p>
              <form
                className="flex max-w-2xl flex-col gap-2 rounded-2xl border border-white/10 bg-[#06150e]/80 p-2 shadow-[0_18px_45px_rgba(0,0,0,0.22)] backdrop-blur sm:flex-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  document.getElementById("directory-results")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-300" />
                  <Input
                    value={qProfession}
                    onChange={(event) => setQProfession(event.target.value)}
                    placeholder="Try electrician, tailor, or a name"
                    aria-label="Search artisans by trade or name"
                    className="h-12 border-0 bg-transparent pl-10 text-white shadow-none placeholder:text-slate-400 focus-visible:ring-0"
                  />
                </div>
                <Button type="submit" className="h-12 rounded-xl bg-[#35d879] px-6 font-bold text-[#04120a] hover:bg-[#52e98f]">
                  Find a pro <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
              <Button asChild variant="outline" className="rounded-xl border-white/15 bg-white/[0.03] text-slate-100 hover:bg-white/[0.08]">
                <Link to="/artisan/create">Join as an artisan</Link>
              </Button>
              <div className="tile-artisan-trust-row">
                <span><ShieldCheck /> Verified Professionals</span>
                <span><MessageSquare /> Secure Messaging</span>
                <span><Zap /> Fast Response</span>
              </div>
            </div>
            <div className="tile-artisan-showcase" role="group" aria-label="Trusted local artisans near you">
              <div className="tile-artisan-map" aria-hidden="true"><span /><span /><span /><i /></div>
              {artisans.slice(0, 4).map((artisan, index) => (
                <article key={artisan.id} className={"tile-pro-card tile-pro-card-" + (index + 1)}>
                  <div className="tile-pro-photo-wrap">
                    <img src={artisan.profile_photo || artisan.avatar_url || "https://images.unsplash.com/photo-" + ["1500648767791-00dcc994a43e", "1534528741775-53994a69daeb", "1506794778202-cad84cf45f1d", "1507003211169-0a1dd7228f2d"][index] + "?auto=format&fit=crop&w=600&q=82"} alt={artisan.full_name || "Local professional"} />
                    <span><i /> {artisan.is_available ? "Available" : "Check availability"}</span><span className="tile-pro-heart" aria-hidden="true"><Heart className="h-4 w-4" /></span>
                  </div>
                  <div className="tile-pro-details"><strong>{artisan.full_name || "Verified Professional"} {artisan.is_verified && <BadgeCheck />}</strong><span>{artisan.profession || "Skilled Professional"}</span><b>&#9733; {(artisan.avg_rating ?? 4.8).toFixed(1)} <small>({artisan.review_count ?? 86})</small></b><small><MapPin /> {artisan.lga || artisan.state || "Nigeria"}{artisan.state ? ", " + artisan.state : ""}</small></div>
                </article>
              ))}
              {artisans.length === 0 && <>
                <article className="tile-pro-card tile-pro-card-1 tile-pro-card-fallback"><div className="tile-pro-photo-wrap"><img src="https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=600&q=82" alt="Electrician at work" /><span><i /> Available</span><span className="tile-pro-heart" aria-hidden="true"><Heart className="h-4 w-4" /></span></div><div className="tile-pro-details"><strong>Chinedu Okafor <BadgeCheck /></strong><span>Electrician</span><b>&#9733; 4.8 <small>(124)</small></b><small><MapPin /> Lagos, Lagos State</small></div></article>
                <article className="tile-pro-card tile-pro-card-2 tile-pro-card-fallback"><div className="tile-pro-photo-wrap"><img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=82" alt="Barber" /><span><i /> Available</span><span className="tile-pro-heart" aria-hidden="true"><Heart className="h-4 w-4" /></span></div><div className="tile-pro-details"><strong>Tunde Adebayo <BadgeCheck /></strong><span>Barber</span><b>&#9733; 4.9 <small>(98)</small></b><small><MapPin /> Lagos, Lagos State</small></div></article>
                <article className="tile-pro-card tile-pro-card-3 tile-pro-card-fallback"><div className="tile-pro-photo-wrap"><img src="https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=600&q=82" alt="Professional artisan at work" /><span><i /> Available</span><span className="tile-pro-heart" aria-hidden="true"><Heart className="h-4 w-4" /></span></div><div className="tile-pro-details"><strong>Aisha Bello <BadgeCheck /></strong><span>Tailor</span><b>&#9733; 4.9 <small>(112)</small></b><small><MapPin /> Abuja, FCT</small></div></article>
                <article className="tile-pro-card tile-pro-card-4 tile-pro-card-fallback"><div className="tile-pro-photo-wrap"><img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=82" alt="Mechanic" /><span><i /> Available</span><span className="tile-pro-heart" aria-hidden="true"><Heart className="h-4 w-4" /></span></div><div className="tile-pro-details"><strong>Emeka Nwosu <BadgeCheck /></strong><span>Mechanic</span><b>&#9733; 4.7 <small>(86)</small></b><small><MapPin /> Port Harcourt, Rivers</small></div></article>
              </>}
              <div className="tile-top-professionals">
                <header><span>&#9812;</span><strong>Top Professionals Near You</strong><ArrowRight /></header>
                {artisans.length ? artisans.slice(0, 3).map((artisan) => (
                  <Link key={artisan.id} to="/artisans/$id" params={{ id: artisan.id }} className="tile-top-person-row">
                    <img src={artisan.profile_photo || artisan.avatar_url || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80"} alt="" />
                    <span><strong>{artisan.full_name || "Verified Artisan"}</strong><small>{artisan.profession || "Professional"}</small></span>
                    <b>&#9733; {(artisan.avg_rating ?? 4.8).toFixed(1)} <small><MapPin /> {artisan.state || "Nigeria"}</small></b>
                  </Link>
                )) : <>
                  <div className="tile-top-person-row"><img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80" alt="" /><span><strong>Chinedu Okafor</strong><small>Electrician</small></span><b>&#9733; 4.8 <small><MapPin /> Lagos</small></b></div>
                  <div className="tile-top-person-row"><img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="" /><span><strong>Tunde Adebayo</strong><small>Barber</small></span><b>&#9733; 4.9 <small><MapPin /> Lagos</small></b></div>
                  <div className="tile-top-person-row"><img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80" alt="" /><span><strong>Emeka Nwosu</strong><small>Mechanic</small></span><b>&#9733; 4.7 <small><MapPin /> Rivers</small></b></div>
                </>}
              </div>
              <div className="tile-artisan-slogan">Skilled Hands.<br />Stronger Nigeria.</div>
              <div className="tile-artisan-pin tile-artisan-pin-one"><MapPin /></div>
              <div className="tile-artisan-pin tile-artisan-pin-two"><MapPin /></div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="container mx-auto max-w-7xl px-4 py-12 sm:py-14">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/80">Explore Tile</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Browse popular services
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Start with Nigeria's most requested professionals.
            </p>
          </div>

          <Badge variant="secondary" className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.07] px-3 text-emerald-100">
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
                className={`group rounded-2xl border p-4 text-slate-100 transition-all duration-300 hover:-translate-y-1 sm:p-5 ${active
                    ? "border-emerald-300/45 bg-emerald-300/[0.12] shadow-[0_12px_28px_rgba(0,0,0,0.22)]"
                    : "border-[#1b3b2a] bg-gradient-to-b from-[#10241a] to-[#0b1a13] hover:border-emerald-300/30 hover:shadow-[0_16px_36px_rgba(0,0,0,0.22)]"
                  }`}
              >
                <div
                  className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${active
                      ? "bg-emerald-300/15 text-emerald-200"
                      : "border border-emerald-300/10 bg-emerald-300/[0.07] text-emerald-300"
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
        <Card className="overflow-hidden rounded-3xl border border-emerald-300/15 bg-[radial-gradient(ellipse_at_100%_0%,rgba(52,211,153,0.16),transparent_40%),linear-gradient(120deg,#10271b,#0a1a12)] text-white shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
          <div className="flex flex-col items-start justify-between gap-6 p-6 sm:p-8 lg:flex-row lg:items-center">
            <div>
              <Badge className="mb-4 border border-emerald-300/15 bg-emerald-300/[0.08] text-emerald-100 hover:bg-emerald-300/[0.08]">
                Available Now
              </Badge>

              <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Need someone today?
              </h3>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
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
                  variant="outline"
                  onClick={() => setQProfession(service)}
                  className="rounded-full border-white/15 bg-white/[0.04] text-slate-100 hover:border-emerald-300/35 hover:bg-emerald-300/[0.08] hover:text-white"
                >
                  {service}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      </section>

      {/* Featured Professionals */}
      {featuredArtisans.length > 0 && !qProfession && !qState && !qLga && (
        <section className="container mx-auto max-w-7xl px-4 py-12 sm:py-14">
          <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <Badge className="mb-3 rounded-full border border-amber-200/15 bg-amber-200/[0.08] text-amber-100 hover:bg-amber-200/[0.08]">
                <Sparkles className="mr-2 h-4 w-4 fill-current" />
                Premium Directory
              </Badge>

              <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                Featured Professionals
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Meet Tile's most trusted professionals with verified identities,
                premium profiles and outstanding customer satisfaction.
              </p>
            </div>

            <Button variant="outline" asChild className="rounded-xl border-white/15 bg-white/[0.03] text-slate-200 hover:border-emerald-300/30 hover:bg-white/[0.07] hover:text-white">
              <Link to="/artisans">
                View All Professionals
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featuredArtisans.map((artisan) => (
              <Card
                key={artisan.id}
                className="group overflow-hidden rounded-3xl border border-amber-200/15 bg-gradient-to-b from-[#12251a] to-[#0a1912] text-slate-100 shadow-[0_16px_40px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-1 hover:border-amber-200/35 hover:shadow-[0_24px_52px_rgba(0,0,0,0.3)]"
              >
                {/* Cover */}
                <div className="relative h-32 bg-[radial-gradient(ellipse_at_80%_0%,rgba(251,191,36,0.28),transparent_45%),linear-gradient(125deg,#0d5737,#10251a_70%)]">
                  <Badge className="absolute right-4 top-4 border border-amber-200/20 bg-[#141c13]/80 text-amber-100 backdrop-blur">
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
                      className="h-24 w-24 rounded-2xl border-4 border-[#102017] object-cover shadow-[0_10px_25px_rgba(0,0,0,0.35)]"
                    />
                  </div>

                  {/* Name */}
                  <div className="space-y-1">
                    <h3 className="flex items-center gap-2 text-xl font-bold text-white">
                      {artisan.full_name}
                      {artisan.is_verified && (
                        <BadgeCheck className="h-5 w-5 fill-emerald-300 text-emerald-300" />
                      )}
                    </h3>

                    <p className="font-semibold text-emerald-300">
                      {artisan.profession || "Premium Professional"}
                    </p>

                    <p className="flex items-center gap-1 text-sm text-slate-400">
                      <MapPin className="h-4 w-4" />
                      {artisan.state}, {artisan.lga}
                    </p>
                  </div>

                  {/* Rating */}
                  <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/[0.06] bg-black/15 p-3">
                    <div className="text-center">
                      <p className="text-lg font-bold">
                        ⭐ {artisan.avg_rating ?? "5.0"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Rating
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-lg font-bold">
                        {artisan.years_experience ?? 0}+
                      </p>
                      <p className="text-xs text-slate-500">
                        Years
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-lg font-bold">
                        ₦{Number(artisan.starting_price ?? 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">
                        From
                      </p>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="mt-5 line-clamp-3 text-sm leading-relaxed text-slate-400">
                    {artisan.bio ||
                      "Trusted professional delivering high-quality services across Nigeria."}
                  </p>

                  {/* Professional Highlights */}
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-center">
                      <div className="text-lg font-bold text-emerald-300">
                        {artisan.years_experience ?? 0}+
                      </div>
                      <div className="text-xs text-slate-500">
                        Years Experience
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-center">
                      <div className="text-lg font-bold text-emerald-300">
                        ⭐ {artisan.avg_rating ?? "5.0"}
                      </div>
                      <div className="text-xs text-slate-500">
                        Customer Rating
                      </div>
                    </div>
                  </div>

                  {/* Trust Badges */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    {artisan.is_verified && (
                      <Badge className="border border-emerald-300/15 bg-emerald-300/[0.08] text-emerald-100 hover:bg-emerald-300/[0.08]">
                        <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                        Verified
                      </Badge>
                    )}

                    <Badge variant="secondary" className="border border-white/[0.07] bg-white/[0.04] text-slate-300">
                      Fast Response
                    </Badge>

                    {artisan.subscription_tier === "vip" && (
                      <Badge className="border border-amber-200/15 bg-amber-200/[0.08] text-amber-100 hover:bg-amber-200/[0.08]">
                        <Sparkles className="mr-1 h-3.5 w-3.5 fill-current" />
                        VIP Professional
                      </Badge>
                    )}

                    {artisan.subscription_tier === "pro" && (
                      <Badge className="border border-sky-200/15 bg-sky-200/[0.08] text-sky-100 hover:bg-sky-200/[0.08]">
                        PRO Partner
                      </Badge>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-6 flex items-center justify-between border-t border-white/[0.07] pt-5">
                    <div>
                      <p className="text-xs text-slate-500">
                        Starting From
                      </p>
                      <p className="text-lg font-bold text-emerald-300">
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
      <section id="directory-results" className="container mx-auto max-w-7xl scroll-mt-24 px-4 pb-16 sm:pb-20">
        <div className="mb-8 rounded-2xl border border-[#1b3b2a] bg-[#0b1b12]/95 shadow-[0_18px_48px_rgba(0,0,0,0.26)] backdrop-blur supports-[backdrop-filter]:bg-[#0b1b12]/85 lg:sticky lg:top-20 z-20">
          <div className="flex flex-col gap-4 p-4 lg:p-5">
            {/* Left */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative min-w-[220px] flex-1 basis-full sm:basis-64">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-300" />
                <Input value={qProfession} onChange={(event) => setQProfession(event.target.value)} placeholder="Search trade or name" aria-label="Search by trade or name" className="h-11 rounded-xl border-white/10 bg-[#07150e] pl-10 text-slate-100 placeholder:text-slate-500" />
              </div>
              <div className="relative min-w-[130px] flex-1">
                <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-300" />
                <Input value={qState} onChange={(event) => setQState(event.target.value)} placeholder="State" aria-label="Filter by state" className="h-11 rounded-xl border-white/10 bg-[#07150e] pl-10 text-slate-100 placeholder:text-slate-500" />
              </div>
              <div className="relative min-w-[140px] flex-1">
                <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input value={qLga} onChange={(event) => setQLga(event.target.value)} placeholder="City or LGA" aria-label="Filter by city or local government area" className="h-11 rounded-xl border-white/10 bg-[#07150e] pl-10 text-slate-100 placeholder:text-slate-500" />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="verified"
                  checked={verifiedOnly}
                  onCheckedChange={(checked) => setVerifiedOnly(!!checked)}
                />
                <label
                  htmlFor="verified"
                  className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-300"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  Verified Only
                </label>
              </div>

              <div className="hidden h-5 w-px bg-border md:block" />

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-11 rounded-xl border border-white/10 bg-[#07150e] px-3 py-2 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-emerald-300/40"
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
              <Badge variant="secondary" className="rounded-full border border-white/[0.07] bg-white/[0.04] px-3 py-1 text-sm text-slate-200">
                {filtered.length} Professionals
              </Badge>
              <Badge variant="outline" className="rounded-full border-emerald-300/20 px-3 py-1 text-emerald-200">
                {filtered.filter((a) => a.is_verified).length} Verified
              </Badge>
            </div>
          </div>
        </div>

        {/* Artisan Results */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-[#1b3b2a] bg-gradient-to-b from-[#10241a] to-[#0b1a13] py-24 shadow-[0_18px_48px_rgba(0,0,0,0.18)] sm:py-32">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-300 border-t-transparent" />
            <h3 className="mt-6 text-xl font-bold text-white">Finding professionals...</h3>
            <p className="mt-2 max-w-md px-4 text-center text-slate-400">
              We're searching thousands of verified artisans across Nigeria.
            </p>
          </div>
        ) : isError ? (
          <div className="rounded-3xl border border-rose-300/15 bg-rose-400/[0.04] p-8 text-center sm:p-16">
            <HelpCircle className="mx-auto h-14 w-14 text-rose-300" />
            <h2 className="mt-6 text-2xl font-bold text-white">Something went wrong</h2>
            <p className="mx-auto mt-3 max-w-md text-slate-400">
              We couldn't load the artisan directory right now. Please refresh the page or try again later.
            </p>
            <Button className="mt-6 rounded-xl bg-[#35d879] font-semibold text-[#04120a] hover:bg-[#52e98f]" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-gradient-to-b from-[#10241a] to-[#0b1a13] p-8 text-center sm:p-20">
            <Search className="mx-auto h-16 w-16 text-emerald-300/70" />
            <h2 className="mt-6 text-2xl font-bold text-white">No professionals found</h2>
            <p className="mx-auto mt-3 max-w-lg text-slate-400">
              We couldn't find any professionals matching your search. Try changing your service, location or filters.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                variant="outline"
                className="rounded-xl border-white/15 bg-white/[0.03] text-slate-200 hover:bg-white/[0.07]"
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
              <Button asChild className="rounded-xl bg-[#35d879] font-semibold text-[#04120a] hover:bg-[#52e98f]">
                <Link to="/artisan/create">Become the First Artisan</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="mb-6 flex flex-col gap-3 border-b border-white/[0.07] pb-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/80">Made for your next project</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">Available professionals</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Showing {filtered.length} artisan{filtered.length !== 1 && "s"} matching your search.
                </p>
              </div>
              <Badge className="w-fit rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-4 py-2 text-sm text-emerald-100">
                {filtered.filter((a) => a.is_verified).length} Verified
              </Badge>
            </div>

            {/* Results Grid */}
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((artisan) => {
                const tier = (artisan.subscription_tier ?? "free").toString().toLowerCase();
                const isPremium = tier === "pro" || tier === "vip";
                const isTopRated = (artisan.years_experience ?? 0) >= 5 || (artisan.avg_rating ?? 0) >= 4.5;

                return (
                  <Card
                    key={artisan.id}
                    className={
                      "group overflow-hidden rounded-3xl border bg-gradient-to-b from-[#10241a] to-[#0a1912] text-slate-100 shadow-[0_14px_38px_rgba(0,0,0,0.16)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(0,0,0,0.28)] " +
                      (isPremium
                        ? "border-amber-200/25 ring-1 ring-amber-200/10"
                        : isTopRated
                          ? "border-emerald-300/20"
                          : "border-[#1b3b2a]")
                    }
                  >
                    {/* Top Accent */}
                    <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-emerald-200 to-emerald-500" />

                    <div className="p-6">
                      <div className="mb-4 flex items-center gap-2 text-xs font-semibold">
                        {tier !== "free" && (
                          <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.07] px-2.5 py-1 uppercase text-emerald-200">{tier}</span>
                        )}
                        <span className="rounded-full border border-white/[0.06] bg-white/[0.035] px-2.5 py-1 text-slate-400">
                          Trust {artisan.trust_score}/100
                        </span>
                      </div>

                      {/* Header */}
                      <div className="flex items-start gap-4">

                        <div className="relative h-16 w-16 flex-shrink-0">
                          {artisan.profile_photo || artisan.avatar_url ? (
                            <img
                              src={artisan.profile_photo || artisan.avatar_url || undefined}
                              alt={artisan.full_name || "Artisan"}
                              className="h-full w-full rounded-2xl border border-white/10 object-cover shadow-lg"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.04]">
                              <UserRound className="h-7 w-7 text-slate-500" />
                            </div>
                          )}

                          <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[#102017] bg-emerald-400" />
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex items-center gap-2">

                            <h3 className="truncate text-lg font-bold text-white">
                              {artisan.full_name || "Anonymous Professional"}
                            </h3>

                            {artisan.is_verified && (
                              <BadgeCheck className="h-5 w-5 fill-emerald-300 text-emerald-300" />
                            )}

                          </div>

                          <p className="text-sm font-semibold text-emerald-300">
                            {artisan.profession || "General Contractor"}
                          </p>

                          <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
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
                          <Badge className="border border-emerald-300/15 bg-emerald-300/[0.08] text-emerald-100 hover:bg-emerald-300/[0.08]">
                            ✔ Verified
                          </Badge>
                        )}

                        {isPremium && (
                          <Badge className="border border-amber-200/15 bg-amber-200/[0.08] text-amber-100 hover:bg-amber-200/[0.08]">
                            👑 Premium
                          </Badge>
                        )}

                        {isTopRated && (
                          <Badge variant="secondary" className="border border-white/[0.07] bg-white/[0.04] text-slate-300">
                            ⭐ Top Rated
                          </Badge>
                        )}

                      </div>

                      {/* Bio */}

                      <p className="mt-5 line-clamp-2 text-sm leading-6 text-slate-400">
                        {artisan.bio ||
                          "Professional artisan ready to deliver quality workmanship at competitive prices."}
                      </p>

                      {/* Stats */}

                      <div className="mt-6 flex gap-3">

                        <div className="flex-1 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-center">

                          <p className="text-2xl font-bold text-emerald-300">
                            {artisan.years_experience || 0}
                          </p>

                          <p className="text-xs text-slate-500">
                            Years Experience
                          </p>

                        </div>

                        <div className="flex-1 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 text-center">

                          <p className="text-lg font-bold text-emerald-300">
                            {artisan.starting_price
                              ? `₦${Number(artisan.starting_price).toLocaleString()}`
                              : "Quote"}
                          </p>

                          <p className="text-xs text-slate-500">
                            Starting From
                          </p>

                        </div>

                      </div>

                      {/* Footer */}

                      <div className="mt-6 border-t border-white/[0.07] pt-5">
                        <Button asChild className="h-11 w-full rounded-xl bg-[#35d879] font-bold text-[#04120a] shadow-[0_8px_20px_rgba(53,216,121,0.12)] hover:bg-[#52e98f]">
                          <Link to="/artisans/$id" params={{ id: artisan.id }}>
                            View artisan profile <ArrowRight className="ml-2 h-4 w-4" />
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
