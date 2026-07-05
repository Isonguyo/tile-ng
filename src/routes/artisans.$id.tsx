import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  MapPin,
  Phone,
  MessageCircle,
  ShieldCheck,
  Briefcase,
  Star,
  ArrowLeft,
  UserRound,
  BadgeCheck,
  Sparkles,
  X,
} from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/artisans/$id")({
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.full_name
          ? `${loaderData.full_name} — Artisan on Tile`
          : "Artisan Profile — Tile",
      },
    ],
  }),
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, avatar_url, profile_photo, bio, profession, state, lga, years_experience, starting_price, portfolio_images, phone, whatsapp, is_verified, is_artisan, subscription_tier, avg_rating, total_sales"
      )
      .eq("id", params.id)
      .maybeSingle();
    if (error) throw error;
    if (!data || !data.is_artisan) throw notFound();
    return data;
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Artisan not found</h1>
        <p className="mt-2 text-muted-foreground">This profile may have been removed.</p>
        <Button asChild className="mt-6"><Link to="/artisans">Browse artisans</Link></Button>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-muted-foreground">{error.message}</p>
      </div>
    </div>
  ),
  component: ArtisanDetailPage,
});

function sanitizePhone(v?: string | null): string | null {
  if (!v) return null;
  const digits = v.replace(/\D+/g, "");
  if (!digits) return null;
  // Normalize Nigerian numbers to E.164 for wa.me
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  return digits;
}

function ArtisanDetailPage() {
  const artisan = Route.useLoaderData();
  const [preview, setPreview] = useState<string | null>(null);

  const avatar = artisan.profile_photo || artisan.avatar_url;
  const gallery = (artisan.portfolio_images ?? []).filter(Boolean);
  const waPhone = sanitizePhone(artisan.whatsapp || artisan.phone);
  const telPhone = artisan.phone?.replace(/\s+/g, "") || null;

  const tier = (artisan.subscription_tier ?? "free").toString().toLowerCase();
  const isPremium = tier === "pro" || tier === "vip";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="container mx-auto max-w-6xl px-4 py-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/artisans"><ArrowLeft className="mr-2 h-4 w-4" /> Back to artisans</Link>
        </Button>

        {/* Cover / hero card */}
        <Card className="overflow-hidden border-border/70">
          <div className="relative h-40 bg-gradient-to-br from-primary/20 via-primary/10 to-emerald-500/10 sm:h-56">
            {gallery[0] ? (
              <img src={gallery[0]} alt="" className="h-full w-full object-cover opacity-60" />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
          </div>

          <div className="-mt-14 px-6 pb-6 sm:-mt-16 sm:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="h-28 w-28 overflow-hidden rounded-2xl border-4 border-background bg-muted shadow-xl sm:h-32 sm:w-32">
                  {avatar ? (
                    <img src={avatar} alt={artisan.full_name ?? "Artisan"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-muted-foreground">
                      <UserRound className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <div className="pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold sm:text-3xl">{artisan.full_name || "Anonymous Artisan"}</h1>
                    {artisan.is_verified && (
                      <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20"><BadgeCheck className="h-3.5 w-3.5" /> Verified</Badge>
                    )}
                    {isPremium && (
                      <Badge className="gap-1 bg-amber-500/15 text-amber-700 hover:bg-amber-500/20"><Sparkles className="h-3.5 w-3.5" /> {tier.toUpperCase()}</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-primary font-medium">{artisan.profession || "Specialist"}</p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {artisan.state || "Nigeria"}{artisan.lga ? ` • ${artisan.lga}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {telPhone && (
                  <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                    <a href={`tel:${telPhone}`}><Phone className="mr-2 h-4 w-4" /> Call now</a>
                  </Button>
                )}
                {waPhone && (
                  <Button asChild variant="outline" className="border-emerald-600/40 text-emerald-700 hover:bg-emerald-50">
                    <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noreferrer">
                      <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* Trust bar */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat icon={<Briefcase className="h-4 w-4" />} label="Experience" value={`${artisan.years_experience ?? 0} yrs`} />
              <Stat icon={<Star className="h-4 w-4 fill-amber-500 text-amber-500" />} label="Rating" value={(artisan.avg_rating ?? 0).toFixed(1)} />
              <Stat icon={<ShieldCheck className="h-4 w-4" />} label="Jobs done" value={String(artisan.total_sales ?? 0)} />
              <Stat
                icon={<Sparkles className="h-4 w-4" />}
                label="Starting price"
                value={artisan.starting_price ? `₦${Number(artisan.starting_price).toLocaleString()}` : "On request"}
              />
            </div>
          </div>
        </Card>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          {/* Portfolio gallery */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Portfolio</h2>
              <span className="text-sm text-muted-foreground">{gallery.length} {gallery.length === 1 ? "image" : "images"}</span>
            </div>
            {gallery.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed p-10 text-center text-muted-foreground">
                No portfolio images yet.
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {gallery.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    onClick={() => setPreview(src)}
                    className="group relative aspect-square overflow-hidden rounded-xl border bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <img src={src} alt={`Portfolio ${i + 1}`} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Bio + contact side */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold">About</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                {artisan.bio?.trim() || "This artisan hasn’t written a bio yet."}
              </p>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold">Contact</h2>
              <div className="mt-4 space-y-2 text-sm">
                {telPhone ? (
                  <a href={`tel:${telPhone}`} className="flex items-center gap-2 text-foreground hover:text-primary">
                    <Phone className="h-4 w-4" /> {telPhone}
                  </a>
                ) : (
                  <p className="text-muted-foreground">No phone number provided.</p>
                )}
                {waPhone && (
                  <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-emerald-700 hover:underline">
                    <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
                  </a>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-4xl border-0 bg-black/95 p-0">
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="absolute right-3 top-3 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </button>
          {preview && (
            <img src={preview} alt="Portfolio preview" className="h-auto max-h-[85vh] w-full object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background/60 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}