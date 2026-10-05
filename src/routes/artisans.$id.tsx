import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
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
  Clock,
  Zap,
} from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { friendlyErrorMessage } from "@/lib/user-feedback";
import { rpcUntyped } from "@/lib/waitlist-rpc";

type ArtisanProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  profile_photo: string | null;
  bio: string | null;
  profession: string | null;
  state: string | null;
  lga: string | null;
  years_experience: number | null;
  starting_price: number | null;
  portfolio_images: string[] | null;
  is_verified: boolean;
  is_artisan: boolean | null;
  subscription_tier: string;
  avg_rating: number;
  total_sales: number;
  is_prelaunch?: boolean | null;
  artisan_status?: string | null;
};

export const Route = createFileRoute("/artisans/$id")({
  head: ({ loaderData }) => {
    const name = (loaderData as { full_name?: string | null } | undefined)?.full_name;
    return {
      meta: [
        { title: name ? `${name} — Artisan on Tile` : "Artisan Profile — Tile" },
        {
          name: "description",
          content: name
            ? `View ${name}'s artisan profile on Tile.`
            : "View this artisan profile on Tile.",
        },
        {
          property: "og:title",
          content: name ? `${name} — Artisan on Tile` : "Artisan Profile — Tile",
        },
        {
          property: "og:description",
          content: "View services, experience and portfolio details on Tile.",
        },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  loader: async ({ params }) => {
    const { data, error } = await rpcUntyped("get_artisan_profile", {
      _id: params.id,
    });

    if (error) throw new Error(error.message);

    // The RPC is the authorization boundary for public, owner, and admin access.
    // It returns one profile; normalize set-returning RPC responses as a single row too.
    const profile = (Array.isArray(data) ? data[0] : data) as ArtisanProfile | null;
    if (!profile) throw notFound();

    return profile;
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto max-w-2xl px-4 py-32 text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
          <UserRound className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-black tracking-tight">Profile Not Found</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          This artisan profile may have been removed or is currently unavailable.
        </p>
        <Button asChild size="lg" className="mt-8 rounded-full">
          <Link to="/artisans">Explore Other Artisans</Link>
        </Button>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto max-w-2xl px-4 py-32 text-center">
        <h1 className="text-3xl font-black tracking-tight text-destructive">
          Something went wrong
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {friendlyErrorMessage(error, "We couldn't load this artisan profile. Please try again.")}
        </p>
      </div>
    </div>
  ),
  component: ArtisanDetailPage,
});

function sanitizePhone(v?: string | null): string | null {
  if (!v) return null;
  const digits = v.replace(/\D+/g, "");
  if (!digits) return null;
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  return digits;
}

function ArtisanDetailPage() {
  const artisan = Route.useLoaderData() as unknown as ArtisanProfile;

  const [preview, setPreview] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const avatar = artisan.profile_photo || artisan.avatar_url;
  const gallery: string[] = ((artisan.portfolio_images ?? []) as string[]).filter(Boolean);

  const { data: contact } = useQuery({
    queryKey: ["artisan-contact", artisan.id, currentUser?.id],
    enabled: !!currentUser,
    queryFn: async () => {
      const { data } = await supabase.rpc("artisan_contact", { _id: artisan.id });
      return (
        (data as unknown as Array<{ phone: string | null; whatsapp: string | null }>)?.[0] ?? null
      );
    },
  });

  const waPhone = sanitizePhone(contact?.whatsapp || contact?.phone);
  const telPhone = contact?.phone?.replace(/\s+/g, "") || null;

  const tier = (artisan.subscription_tier ?? "free").toString().toLowerCase();
  const isPremium = tier === "pro" || tier === "vip";

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data.user);
    });
  }, []);

  const isOwner = currentUser?.id === artisan.id;

  const { data: profile } = useQuery({
    queryKey: ["my-profile", currentUser?.id],
    enabled: !!currentUser,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("is_artisan")
        .eq("id", currentUser!.id)
        .single();
      return data;
    },
  });

  const canReview = !!currentUser && !isOwner && profile?.is_artisan !== true;

  type ReviewRow = {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string | null;
    profiles?: { full_name?: string | null } | null;
  };

  const { data: reviews = [], refetch: refetchReviews } = useQuery<ReviewRow[]>({
    queryKey: ["artisan-reviews", artisan.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artisan_reviews")
        .select(
          `
        id,
        rating,
        comment,
        created_at,
        reviewer_id,
        profiles!reviewer_id(
          full_name,
          avatar_url,
          profile_photo
        )
      `,
        )
        .eq("artisan_id", artisan.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return ((data ?? []) as ReviewRow[]) ?? [];
    },
  });

  const submitReview = async () => {
    if (!canReview) return;
    setSubmitting(true);

    try {
      const { data: existing } = await supabase
        .from("artisan_reviews")
        .select("id")
        .eq("artisan_id", artisan.id)
        .eq("reviewer_id", currentUser.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("artisan_reviews")
          .update({ rating, comment: review })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("artisan_reviews").insert({
          artisan_id: artisan.id,
          reviewer_id: currentUser.id,
          rating,
          comment: review,
        });
        if (error) throw error;
      }

      const { data: allReviews } = await supabase
        .from("artisan_reviews")
        .select("rating")
        .eq("artisan_id", artisan.id);

      if (allReviews) {
        const reviewCount = allReviews.length;
        const totalRating = allReviews.reduce((sum, item) => sum + Number(item.rating), 0);
        const averageRating = reviewCount > 0 ? Number((totalRating / reviewCount).toFixed(1)) : 0;

        const { error } = await supabase
          .from("profiles")
          .update({ avg_rating: averageRating, review_count: reviewCount })
          .eq("id", artisan.id);

        if (error) throw error;
      }

      await refetchReviews();
      setReview("");
      setRating(5);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <SiteHeader />

      <div className="container mx-auto max-w-6xl px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-6 rounded-full hover:bg-background">
          <Link to="/artisans">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Directory
          </Link>
        </Button>

        {/* Hero Section */}
        <Card className="relative overflow-hidden rounded-[2.5rem] border-0 bg-background shadow-2xl shadow-primary/5 ring-1 ring-border/50">
          <div className="relative h-64 sm:h-80">
            {gallery[0] ? (
              <img src={gallery[0]} alt="Cover" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-tr from-primary/90 via-primary/60 to-emerald-400" />
            )}

            {/* Premium Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

            {/* Badges */}
            <div className="absolute right-6 top-6 flex flex-wrap gap-3">
              {artisan.is_verified && (
                <Badge className="border-0 bg-white/90 px-3 py-1.5 text-emerald-700 shadow-xl backdrop-blur-md">
                  <BadgeCheck className="mr-1.5 h-4 w-4" />
                  Verified Pro
                </Badge>
              )}
              {isPremium && (
                <Badge className="border-0 bg-amber-500/90 px-3 py-1.5 text-white shadow-xl backdrop-blur-md">
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  {tier.toUpperCase()}
                </Badge>
              )}
            </div>
          </div>

          <div className="relative px-6 pb-10 sm:px-10">
            <div className="-mt-20 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col sm:flex-row sm:items-end gap-6">
                {/* Avatar */}
                <div className="relative h-36 w-36 shrink-0 overflow-hidden rounded-full ring-8 ring-background bg-card shadow-xl">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={artisan.full_name ?? "Artisan"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-muted">
                      <UserRound className="h-16 w-16 text-muted-foreground/50" />
                    </div>
                  )}
                  {artisan.is_verified && (
                    <span className="absolute bottom-3 right-3 h-6 w-6 rounded-full border-4 border-background bg-emerald-500" />
                  )}
                </div>

                {/* Info */}
                <div className="pb-2">
                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                    {artisan.full_name || "Anonymous Artisan"}
                  </h1>
                  <p className="mt-2 text-xl font-medium text-primary">
                    {artisan.profession || "Professional Artisan"}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-medium text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {artisan.state || "Nigeria"}
                      {artisan.lga && `, ${artisan.lga}`}
                    </span>
                    <div className="h-1.5 w-1.5 rounded-full bg-border" />
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <Clock className="h-4 w-4" /> Available Today
                    </span>
                    <div className="h-1.5 w-1.5 rounded-full bg-border" />
                    <span className="flex items-center gap-1.5 text-blue-600">
                      <Zap className="h-4 w-4" /> Fast Responder
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex w-full flex-col gap-3 pb-2 sm:w-auto sm:flex-row">
                {telPhone && (
                  <Button
                    size="lg"
                    asChild
                    className="rounded-full bg-emerald-600 px-8 text-base shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
                  >
                    <a href={`tel:${telPhone}`}>
                      <Phone className="mr-2.5 h-5 w-5" />
                      Call Now
                    </a>
                  </Button>
                )}
                {waPhone && (
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="rounded-full border-border/50 px-8 text-base shadow-sm hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noreferrer">
                      <MessageCircle className="mr-2.5 h-5 w-5" />
                      WhatsApp
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* Trust Statistics (Using integrated Stat component) */}
            <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Stat
                icon={<Briefcase className="h-5 w-5" />}
                iconBg="bg-blue-50 text-blue-600"
                label="Experience"
                value={`${artisan.years_experience ?? 0} Years`}
              />
              <Stat
                icon={<Star className="h-5 w-5 fill-amber-500" />}
                iconBg="bg-amber-50 text-amber-500"
                label="Rating"
                value={(artisan.avg_rating ?? 0).toFixed(1)}
              />
              <Stat
                icon={<ShieldCheck className="h-5 w-5" />}
                iconBg="bg-emerald-50 text-emerald-600"
                label="Projects Completed"
                value={`${artisan.total_sales ?? 0}+`}
              />
              <Stat
                icon={<Sparkles className="h-5 w-5" />}
                iconBg="bg-primary/10 text-primary"
                label="Starting Price"
                value={
                  artisan.starting_price
                    ? `₦${Number(artisan.starting_price).toLocaleString()}`
                    : "Custom Quote"
                }
              />
            </div>
          </div>
        </Card>

        <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
          {/* Main Left Column */}
          <div className="space-y-8">
            {/* Portfolio */}
            <Card className="overflow-hidden rounded-[2rem] border border-border/50 bg-background shadow-sm">
              <div className="flex items-center justify-between border-b border-border/50 bg-muted/10 px-8 py-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Portfolio</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Recent work and completed projects
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="rounded-full bg-background px-4 py-1.5 text-sm font-medium shadow-sm"
                >
                  {gallery.length} {gallery.length === 1 ? "Photo" : "Photos"}
                </Badge>
              </div>

              {gallery.length === 0 ? (
                <div className="flex h-72 flex-col items-center justify-center text-center px-6">
                  <div className="mb-4 rounded-full bg-muted p-4">
                    <Briefcase className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-semibold">No Portfolio Yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                    This artisan hasn't uploaded any project photos. Reach out to request examples
                    of their past work.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 p-8 md:grid-cols-3">
                  {gallery.map((src, i) => (
                    <button
                      key={`${src}-${i}`}
                      type="button"
                      onClick={() => setPreview(src)}
                      className="group relative aspect-square overflow-hidden rounded-2xl bg-muted outline-none ring-primary transition-all focus-visible:ring-2"
                    >
                      <img
                        src={src}
                        alt={`Portfolio ${i + 1}`}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/30" />
                      <div className="absolute bottom-4 left-4 translate-y-4 rounded-full bg-white/95 px-4 py-1.5 text-xs font-bold tracking-wide opacity-0 shadow-lg backdrop-blur-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 text-black">
                        View Image
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* About */}
            <Card className="overflow-hidden rounded-[2rem] border border-border/50 bg-background shadow-sm">
              <div className="border-b border-border/50 bg-muted/10 px-8 py-6">
                <h2 className="text-2xl font-bold tracking-tight">About the Artisan</h2>
              </div>
              <div className="p-8">
                <p className="whitespace-pre-line text-lg leading-relaxed text-muted-foreground">
                  {artisan.bio?.trim() ||
                    "This artisan hasn't added a biography yet. Contact them directly to learn more about their specific services, background, and expertise."}
                </p>
              </div>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            {/* Contact Card */}
            <Card className="overflow-hidden rounded-[2rem] border border-emerald-900/10 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 text-white shadow-xl">
              <div className="p-8">
                <h2 className="text-2xl font-bold tracking-tight">
                  Hire {artisan.full_name?.split(" ")[0] || "Artisan"}
                </h2>
                <p className="mt-2 text-emerald-100/80">
                  Ready to start your project? Reach out to discuss details and get a quote.
                </p>

                <div className="mt-8 space-y-3">
                  {telPhone && (
                    <Button
                      asChild
                      size="lg"
                      variant="secondary"
                      className="w-full justify-start rounded-xl border-0 bg-white/10 text-white hover:bg-white/20"
                    >
                      <a href={`tel:${telPhone}`}>
                        <Phone className="mr-3 h-5 w-5" />
                        {telPhone}
                      </a>
                    </Button>
                  )}
                  {waPhone && (
                    <Button
                      asChild
                      size="lg"
                      className="w-full justify-start rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-400"
                    >
                      <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noreferrer">
                        <MessageCircle className="mr-3 h-5 w-5" />
                        Chat on WhatsApp
                      </a>
                    </Button>
                  )}
                </div>

                <div className="mt-8 rounded-2xl bg-black/20 p-5 backdrop-blur-md">
                  <p className="text-sm font-semibold text-emerald-50">The Tile Guarantee</p>
                  <ul className="mt-4 space-y-3 text-sm text-emerald-100/90">
                    <li className="flex items-center gap-3">
                      <div className="rounded-full bg-emerald-500/20 p-1">
                        <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      </div>
                      Verified professionals
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="rounded-full bg-emerald-500/20 p-1">
                        <Star className="h-4 w-4 text-emerald-400" />
                      </div>
                      Community trusted
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="rounded-full bg-emerald-500/20 p-1">
                        <Briefcase className="h-4 w-4 text-emerald-400" />
                      </div>
                      Quality workmanship
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Customer Reviews */}
            <Card className="overflow-hidden rounded-[2rem] border border-border/50 bg-background shadow-sm">
              <div className="border-b border-border/50 bg-muted/10 px-8 py-6">
                <h2 className="text-2xl font-bold tracking-tight">Reviews</h2>
                <p className="mt-1 text-sm text-muted-foreground">Feedback from past clients</p>
              </div>

              <div className="p-8">
                {canReview && (
                  <div className="mb-8 rounded-2xl border border-border/50 bg-muted/20 p-6">
                    <label className="mb-3 block text-sm font-semibold">Leave a Rating</label>
                    <div className="mb-5 flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="transition-transform hover:scale-110 focus:outline-none"
                        >
                          <Star
                            className={`h-8 w-8 ${
                              star <= rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      rows={4}
                      placeholder="Share your experience working with this artisan..."
                      className="w-full resize-none rounded-xl border border-border/50 bg-background p-4 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    <Button
                      className="mt-4 w-full rounded-xl shadow-sm"
                      onClick={submitReview}
                      disabled={submitting || !review.trim()}
                    >
                      {submitting ? "Submitting..." : "Submit Review"}
                    </Button>
                  </div>
                )}

                {!canReview && (
                  <div className="mb-8 rounded-xl bg-primary/5 p-4 text-center text-sm font-medium text-primary">
                    Only signed-in customers can leave reviews.
                  </div>
                )}

                <div className="space-y-6">
                  {reviews.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">No reviews yet.</p>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        Be the first to share your experience!
                      </p>
                    </div>
                  ) : (
                    reviews.map((item) => (
                      <div
                        key={item.id}
                        className="border-b border-border/50 pb-6 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-foreground">
                              {item.profiles?.full_name ?? "Anonymous User"}
                            </p>
                            <div className="mt-1.5 flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= item.rating
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-muted-foreground/30"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-xs font-medium text-muted-foreground">
                            {new Date(item.created_at ?? Date.now()).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                          "{item.comment}"
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-6xl border-0 bg-transparent p-0 shadow-none">
          <div className="relative flex min-h-[50vh] items-center justify-center">
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="absolute -right-4 -top-12 z-50 rounded-full bg-white/10 p-2 text-white backdrop-blur-md transition-colors hover:bg-white/20 sm:-right-12 sm:-top-0"
              aria-label="Close preview"
            >
              <X className="h-6 w-6" />
            </button>
            {preview && (
              <img
                src={preview}
                alt="Portfolio preview high-res"
                className="max-h-[85vh] w-full rounded-2xl object-contain shadow-2xl ring-1 ring-white/10"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Integrated and upgraded Stat component
function Stat({
  icon,
  iconBg,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="group rounded-[1.5rem] border border-border/50 bg-muted/20 p-5 transition-all duration-300 hover:border-primary/20 hover:bg-background hover:shadow-xl hover:shadow-primary/5">
      <div
        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg} transition-transform duration-300 group-hover:scale-110`}
      >
        {icon}
      </div>
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-2xl font-black tracking-tight text-foreground">{value}</p>
    </div>
  );
}
