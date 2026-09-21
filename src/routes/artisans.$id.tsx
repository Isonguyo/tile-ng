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
} from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/artisans/$id")({
  head: ({ loaderData }) => {
    const name = (loaderData as { full_name?: string | null } | undefined)?.full_name;
    return {
      meta: [
        { title: name ? `${name} — Artisan on Tile` : "Artisan Profile — Tile" },
        { name: "description", content: name ? `View ${name}'s artisan profile on Tile.` : "View this artisan profile on Tile." },
        { property: "og:title", content: name ? `${name} — Artisan on Tile` : "Artisan Profile — Tile" },
        { property: "og:description", content: "View services, experience and portfolio details on Tile." },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, avatar_url, profile_photo, bio, profession, state, lga, years_experience, starting_price, portfolio_images, is_verified, is_artisan, subscription_tier, avg_rating, total_sales"
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
  // The loader throws a not-found error when no artisan matches, so the record is present here.
  const artisan = Route.useLoaderData()!;

  const [preview, setPreview] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const avatar = artisan.profile_photo || artisan.avatar_url;

  console.log("Avatar URL:", avatar);
  const gallery: string[] = ((artisan.portfolio_images ?? []) as string[]).filter(Boolean);
  const { data: contact } = useQuery({
    queryKey: ["artisan-contact", artisan.id, currentUser?.id],
    enabled: !!currentUser,
    queryFn: async () => {
      const { data } = await supabase.rpc("artisan_contact", { _id: artisan.id });
      return (data as unknown as Array<{ phone: string | null; whatsapp: string | null }>)?.[0] ?? null;
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

  const {
    data: profile,
  } = useQuery({
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

  const canReview =
    !!currentUser &&
    !isOwner &&
    profile?.is_artisan !== true;

  const {
    data: reviews = [],
    refetch: refetchReviews,
  } = useQuery({
    queryKey: ["artisan-reviews", artisan.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artisan_reviews")
        .select(`
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
      `)
        .eq("artisan_id", artisan.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data ?? [];
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
          .update({
            rating,
            comment: review,
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("artisan_reviews")
          .insert({
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

        const totalRating = allReviews.reduce(
          (sum, item) => sum + Number(item.rating),
          0
        );

        const averageRating =
          reviewCount > 0
            ? Number((totalRating / reviewCount).toFixed(1))
            : 0;

        const { error } = await supabase
          .from("profiles")
          .update({
            avg_rating: averageRating,
            review_count: reviewCount,
          })
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
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="container mx-auto max-w-6xl px-4 py-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/artisans"><ArrowLeft className="mr-2 h-4 w-4" /> Back to artisans</Link>
        </Button>

        {/* Cover / hero card */}
        <Card className="overflow-hidden rounded-3xl border-0 shadow-xl">
          <div className="relative h-56 sm:h-72">
            {gallery[0] ? (
              <img
                src={gallery[0]}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary via-primary/80 to-emerald-600" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

            <div className="absolute right-5 top-5 flex flex-wrap gap-2">
              {artisan.is_verified && (
                <Badge className="bg-emerald-500 text-white shadow-lg">
                  <BadgeCheck className="mr-1 h-4 w-4" />
                  Verified
                </Badge>
              )}

              {isPremium && (
                <Badge className="bg-amber-500 text-black shadow-lg">
                  <Sparkles className="mr-1 h-4 w-4" />
                  {tier.toUpperCase()}
                </Badge>
              )}
            </div>
          </div>

          <div className="relative px-6 pb-8 sm:px-8">
            <div className="-mt-16 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

              <div className="flex items-end gap-5">

                <div className="relative h-32 w-32 overflow-hidden rounded-3xl border-4 border-background bg-card shadow-2xl">

                  {avatar ? (
                    <img
                      src={avatar}
                      alt={artisan.full_name ?? "Artisan"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-muted">
                      <UserRound className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}

                  <span className="absolute bottom-2 right-2 h-5 w-5 rounded-full border-2 border-white bg-emerald-500" />

                </div>

                <div>

                  <h1 className="text-3xl font-extrabold tracking-tight">
                    {artisan.full_name || "Anonymous Artisan"}
                  </h1>

                  <p className="mt-1 text-lg font-semibold text-primary">
                    {artisan.profession || "Professional Artisan"}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">

                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {artisan.state || "Nigeria"}
                      {artisan.lga && ` • ${artisan.lga}`}
                    </span>

                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Available Today
                    </span>

                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                      Responds Quickly
                    </span>

                  </div>

                </div>

              </div>

              <div className="flex flex-wrap gap-3">

                {telPhone && (
                  <Button
                    size="lg"
                    asChild
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <a href={`tel:${telPhone}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      Call Now
                    </a>
                  </Button>
                )}

                {waPhone && (
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                  >
                    <a
                      href={`https://wa.me/${waPhone}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp
                    </a>
                  </Button>
                )}

              </div>

            </div>

            {/* Trust Statistics */}
            <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">

              <div className="rounded-2xl border bg-card p-5 transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold">
                  {artisan.years_experience ?? 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  Years Experience
                </p>
              </div>

              <div className="rounded-2xl border bg-card p-5 transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100">
                  <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                </div>
                <p className="text-2xl font-bold">
                  {(artisan.avg_rating ?? 0).toFixed(1)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Customer Rating
                </p>
              </div>

              <div className="rounded-2xl border bg-card p-5 transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold">
                  {artisan.total_sales ?? 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  Projects Completed
                </p>
              </div>

              <div className="rounded-2xl border bg-card p-5 transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <p className="text-xl font-bold text-primary">
                  {artisan.starting_price
                    ? `₦${Number(artisan.starting_price).toLocaleString()}`
                    : "Quote"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Starting Price
                </p>
              </div>

            </div>

          </div>
        </Card>

        <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">

          {/* Portfolio */}
          <Card className="rounded-3xl border-0 shadow-lg">
            <div className="flex items-center justify-between border-b px-6 py-5">
              <div>
                <h2 className="text-2xl font-bold">Portfolio</h2>
                <p className="text-sm text-muted-foreground">
                  Recent work by this artisan
                </p>
              </div>

              <Badge variant="secondary" className="rounded-full px-4 py-1">
                {gallery.length} {gallery.length === 1 ? "Photo" : "Photos"}
              </Badge>
            </div>

            {gallery.length === 0 ? (

              <div className="flex h-72 flex-col items-center justify-center rounded-b-3xl text-center">

                <Briefcase className="mb-4 h-12 w-12 text-muted-foreground" />

                <h3 className="text-lg font-semibold">
                  No Portfolio Yet
                </h3>

                <p className="mt-2 text-sm text-muted-foreground">
                  This artisan hasn't uploaded any project photos.
                </p>

              </div>

            ) : (

              <div className="grid grid-cols-2 gap-4 p-6 md:grid-cols-3">

                {gallery.map((src, i) => (

                  <button
                    key={`${src}-${i}`}
                    type="button"
                    onClick={() => setPreview(src)}
                    className="group relative aspect-square overflow-hidden rounded-2xl"
                  >

                    <img
                      src={src}
                      alt={`Portfolio ${i + 1}`}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                    />

                    <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/30" />

                    <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold opacity-0 transition group-hover:opacity-100">
                      View Image
                    </div>

                  </button>

                ))}

              </div>

            )}
          </Card>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Customer Reviews */}
            <Card className="rounded-3xl border-0 shadow-lg">
              <div className="border-b px-6 py-5">
                <h2 className="text-xl font-bold">Customer Reviews</h2>
                <p className="text-sm text-muted-foreground">
                  Ratings and feedback from customers.
                </p>
              </div>

              <div className="p-6">

                {canReview && (
                  <div className="mb-6 rounded-2xl border p-4">

                    <label className="mb-2 block font-medium">
                      Your Rating
                    </label>

                    <div className="mb-4 flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                        >
                          <Star
                            className={`h-7 w-7 ${star <= rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                              }`}
                          />
                        </button>
                      ))}
                    </div>

                    <textarea
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      rows={4}
                      placeholder="Share your experience with this artisan..."
                      className="w-full rounded-xl border p-3"
                    />

                    <Button
                      className="mt-4 w-full"
                      onClick={submitReview}
                      disabled={submitting}
                    >
                      {submitting ? "Submitting..." : "Submit Review"}
                    </Button>

                  </div>
                )}

                {!canReview && (
                  <div className="mb-6 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                    Only signed-in customers can leave reviews.
                  </div>
                )}

                <div className="space-y-5">
                  {reviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No reviews yet.
                    </p>
                  ) : (
                    reviews.map((item: any) => (
                      <div
                        key={item.id}
                        className="border-b pb-5 last:border-0"
                      >
                        <div className="flex items-center justify-between">

                          <div>

                            <p className="font-semibold">
                              {item.profiles?.full_name ?? "Anonymous"}
                            </p>

                            <div className="mt-1 flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${star <= item.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                    }`}
                                />
                              ))}
                            </div>

                          </div>

                          <span className="text-xs text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>

                        </div>

                        <p className="mt-3 text-sm text-muted-foreground">
                          {item.comment}
                        </p>

                      </div>
                    ))
                  )}
                </div>

              </div>
            </Card>

            {/* About */}
            <Card className="rounded-3xl border-0 shadow-lg">
              <div className="border-b px-6 py-5">
                <h2 className="text-xl font-bold">
                  About the Artisan
                </h2>
              </div>

              <div className="p-6">
                <p className="leading-8 text-muted-foreground whitespace-pre-line">
                  {artisan.bio?.trim() ||
                    "This artisan hasn't added a biography yet. Contact them to learn more about their services and experience."}
                </p>
              </div>
            </Card>

            {/* Contact Card */}
            <Card className="rounded-3xl border-0 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-xl">

              <div className="p-6">

                <h2 className="text-xl font-bold">
                  Contact Artisan
                </h2>

                <p className="mt-2 text-sm text-primary-foreground/80">
                  Ready to start your project? Reach out directly.
                </p>

                <div className="mt-6 space-y-4">

                  {telPhone && (
                    <Button
                      asChild
                      size="lg"
                      variant="secondary"
                      className="w-full justify-start rounded-xl"
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
                      className="w-full justify-start rounded-xl bg-emerald-600 hover:bg-emerald-700"
                    >
                      <a
                        href={`https://wa.me/${waPhone}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MessageCircle className="mr-3 h-5 w-5" />
                        Chat on WhatsApp
                      </a>
                    </Button>
                  )}

                </div>

                <div className="mt-6 rounded-2xl bg-white/10 p-4">

                  <p className="text-sm font-semibold">
                    Why hire through Tile?
                  </p>

                  <ul className="mt-3 space-y-2 text-sm text-primary-foreground/90">

                    <li className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      Verified professionals
                    </li>

                    <li className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Trusted by customers
                    </li>

                    <li className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Quality workmanship
                    </li>

                  </ul>

                </div>

              </div>

            </Card>

          </div>

        </div>

      </div>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-6xl border-0 bg-black/95 p-2">
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="absolute right-4 top-4 z-10 rounded-full bg-black/60 p-2 text-white backdrop-blur transition hover:bg-black/80"
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </button>

          {preview && (
            <img
              src={preview}
              alt="Portfolio preview"
              className="max-h-[90vh] w-full rounded-xl object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>

      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold">
        {value}
      </p>
    </div>
  );
}