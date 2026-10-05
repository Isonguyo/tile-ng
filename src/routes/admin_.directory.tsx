import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Clock3,
  Crown,
  Image as ImageIcon,
  LoaderCircle,
  MapPin,
  Package,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/categories";
import { useAuth } from "@/lib/auth-context";
import { rpcUntyped } from "@/lib/waitlist-rpc";

export const Route = createFileRoute("/admin_/directory")({
  head: () => ({
    meta: [
      { title: "Admin Directory | Tile" },
      {
        name: "description",
        content: "Full directory of Tile users, ads and artisan profiles for admins.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin Directory | Tile" },
      {
        property: "og:description",
        content: "Full directory of Tile users, ads and artisan profiles.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DirectoryPage,
});

type DirectoryRow = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const IMAGE_FIELD = /(avatar|profile.?photo|image|photo|picture|portfolio)/i;
const IMAGE_KEYS = ["profile_photo", "avatar_url", "photo_url", "image_url", "avatar"] as const;

function useAdminRpc(key: string, fn: string, enabled: boolean) {
  return useQuery({
    queryKey: ["admin-dir", key],
    enabled,
    queryFn: async () => {
      const { data, error } = await rpcUntyped(fn);
      if (error) throw error;
      return (data as unknown as DirectoryRow[]) ?? [];
    },
  });
}

function fmt(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function collectImageCandidates(value: unknown, field = ""): string[] {
  if (Array.isArray(value)) {
    return IMAGE_FIELD.test(field)
      ? value
          .filter((item): item is string => typeof item === "string" && !!item.trim())
          .map((item) => item.trim())
      : value.flatMap((item) => collectImageCandidates(item, field));
  }

  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) => collectImageCandidates(item, key));
  }

  return typeof value === "string" && IMAGE_FIELD.test(field) && value.trim() ? [value.trim()] : [];
}

function isDirectImageUrl(value: string) {
  return /^(https?:\/\/|data:image\/|blob:|\/\/)/i.test(value);
}

function imageList(value: unknown): string[] {
  if (Array.isArray(value))
    return value
      .filter((item): item is string => typeof item === "string" && !!item.trim())
      .map((item) => item.trim());
  return typeof value === "string" && value.trim() ? [value.trim()] : [];
}

function displayImage(value: unknown, resolved: Record<string, string>) {
  if (typeof value !== "string" || !value.trim()) return "";
  const source = value.trim();
  return resolved[source] ?? (isDirectImageUrl(source) ? source : "");
}

function useResolvedDirectoryImages(rows: unknown[]) {
  const candidates = useMemo(
    () => Array.from(new Set(rows.flatMap((row) => collectImageCandidates(row)))),
    [rows],
  );
  const [resolved, setResolved] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const direct = Object.fromEntries(
      candidates.filter(isDirectImageUrl).map((source) => [source, source]),
    );
    const paths = candidates.filter((source) => !isDirectImageUrl(source));
    setResolved(direct);

    const resolve = async () => {
      const next = { ...direct };
      const chunks: string[][] = [];
      for (let index = 0; index < paths.length; index += 100)
        chunks.push(paths.slice(index, index + 100));

      const signedChunks = await Promise.all(
        chunks.map(async (chunk) => {
          try {
            const { data, error } = await supabase.storage
              .from("listings")
              .createSignedUrls(chunk, 60 * 60);
            return { chunk, data, failed: !!error };
          } catch {
            return { chunk, data: null, failed: true };
          }
        }),
      );

      signedChunks.forEach(({ chunk, data, failed }) => {
        chunk.forEach((path, index) => {
          const signed = !failed
            ? (data?.find((item) => item.path === path)?.signedUrl ?? data?.[index]?.signedUrl)
            : null;
          if (signed) {
            next[path] = signed;
          } else {
            const { data: publicData } = supabase.storage.from("listings").getPublicUrl(path);
            next[path] = publicData.publicUrl;
          }
        });
      });

      if (!cancelled) setResolved(next);
    };

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [candidates]);

  return resolved;
}

function useDirectorySearch(rows: DirectoryRow[] | undefined, query: string) {
  const indexed = useMemo(
    () => (rows ?? []).map((row) => [JSON.stringify(row).toLowerCase(), row] as const),
    [rows],
  );
  const needle = query.trim().toLowerCase();
  return useMemo(
    () => indexed.filter(([searchText]) => searchText.includes(needle)).map(([, row]) => row),
    [indexed, needle],
  );
}

function DirectoryField({ label, value }: { label: string; value: unknown }) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && !value.length)
  )
    return null;
  const display = typeof value === "object" ? JSON.stringify(value) : String(value);
  return (
    <div className="min-w-0 rounded-xl border border-border/50 bg-background/45 px-3 py-2">
      <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-muted-foreground">
        {label.replace(/_/g, " ")}
      </p>
      <p className="mt-1 break-words text-xs font-medium leading-relaxed text-foreground/90">
        {display}
      </p>
    </div>
  );
}

function DirectoryAvatar({
  src,
  name,
  large = false,
}: {
  src: string;
  name: string;
  large?: boolean;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const dimensions = large ? "h-20 w-20" : "h-14 w-14";

  if (!src || failedSource === src) {
    return (
      <div
        className={`${dimensions} grid shrink-0 place-items-center rounded-2xl border border-emerald-300/15 bg-emerald-400/10 text-lg font-black text-emerald-300`}
      >
        {name.trim().slice(0, 1).toUpperCase() || <Users className="h-6 w-6" />}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`${name || "User"} profile`}
      loading="lazy"
      decoding="async"
      onError={() => setFailedSource(src)}
      className={`${dimensions} shrink-0 rounded-2xl border border-white/10 object-cover shadow-lg`}
    />
  );
}

function ImageGallery({
  values,
  resolved,
  label,
}: {
  values: string[];
  resolved: Record<string, string>;
  label: string;
}) {
  const sources = values.map((value) => displayImage(value, resolved)).filter(Boolean);
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const imageKey = values.join("|");
  useEffect(() => setFailed(new Set()), [imageKey]);
  const visible = sources.filter((source) => !failed.has(source));
  if (!visible.length) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {visible.slice(0, 6).map((source, index) => (
        <img
          key={`${source}-${index}`}
          src={source}
          alt={`${label} photo ${index + 1}`}
          loading="lazy"
          decoding="async"
          onError={() => setFailed((current) => new Set(current).add(source))}
          className="h-16 w-20 shrink-0 rounded-xl border border-border/60 object-cover sm:h-20 sm:w-24"
        />
      ))}
      {sources.length > 6 && (
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-border/60 bg-muted/40 text-xs font-bold text-muted-foreground sm:h-20 sm:w-20">
          +{sources.length - 6}
        </div>
      )}
    </div>
  );
}

function TierControl({ user }: { user: DirectoryRow }) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  const setTier = async (tier: string, months: number | null) => {
    const action = `${tier}-${months ?? "locked"}`;
    setBusy(action);
    try {
      const { error } = await rpcUntyped("admin_set_user_tier", {
        _user_id: user.id,
        _tier: tier,
        _months: months,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Subscription plan updated");
      void queryClient.invalidateQueries({ queryKey: ["admin-dir"] });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "We couldn't update this subscription. Please try again.",
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-2 border-t border-border/50 pt-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Subscription controls
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={!!busy}
          onClick={() => void setTier("vip", null)}
          className="h-8 rounded-lg"
        >
          {busy === "vip-locked" ? (
            <LoaderCircle className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Crown className="mr-1 h-3.5 w-3.5" />
          )}
          Lock VIP
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!!busy}
          onClick={() => void setTier("pro", 6)}
          className="h-8 rounded-lg"
        >
          Pro · 6 mo
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!!busy}
          onClick={() => void setTier("lite", 3)}
          className="h-8 rounded-lg"
        >
          Lite · 3 mo
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={!!busy}
          onClick={() => void setTier("free", null)}
          className="h-8 rounded-lg"
        >
          Remove plan
        </Button>
      </div>
    </div>
  );
}

function UserDirectoryCard({
  user,
  resolved,
}: {
  user: DirectoryRow;
  resolved: Record<string, string>;
}) {
  const name = user.full_name || "Unnamed user";
  const avatarValue = IMAGE_KEYS.map((key) => user[key]).find(
    (value) => typeof value === "string" && value.trim(),
  );
  const photo = displayImage(avatarValue, resolved);
  const roles = Array.isArray(user.roles)
    ? user.roles.filter((role: string) => role !== "user")
    : [];
  const location = [user.lga, user.state].filter(Boolean).join(", ");

  return (
    <Card className="group overflow-hidden rounded-2xl border-border/60 bg-card/75 p-0 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-emerald-500/35 hover:shadow-xl hover:shadow-emerald-950/5">
      <div className="h-1 bg-gradient-to-r from-emerald-500/70 via-primary/50 to-transparent" />
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <DirectoryAvatar src={photo} name={name} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h2 className="break-words font-bold tracking-tight">{name}</h2>
              <Badge className="capitalize">
                {user.subscription_tier || "free"}
                {user.tier_locked ? " · locked" : ""}
              </Badge>
              {user.founding_rank && (
                <Badge variant="secondary">Founder #{user.founding_rank}</Badge>
              )}
              {user.is_verified && (
                <Badge variant="outline" className="gap-1 border-emerald-500/30 text-emerald-600">
                  <BadgeCheck className="h-3 w-3" />
                  Verified
                </Badge>
              )}
              {roles.map((role: string) => (
                <Badge key={role} variant="outline" className="capitalize">
                  {role}
                </Badge>
              ))}
            </div>
            <p className="mt-1 break-all text-xs text-muted-foreground">
              {user.email || "No email on file"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              {location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {location}
                </span>
              )}
              {user.created_at && (
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="h-3 w-3" />
                  Joined {new Date(user.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <DirectoryField label="Phone" value={user.phone} />
          <DirectoryField label="WhatsApp" value={user.whatsapp} />
          <DirectoryField label="Business" value={user.business_name} />
          <DirectoryField label="Shop" value={user.shop_slug} />
          <DirectoryField label="Profession" value={user.profession} />
          <DirectoryField label="KYC" value={user.kyc_status} />
          <DirectoryField
            label="Email confirmed"
            value={user.email_confirmed === undefined ? null : String(user.email_confirmed)}
          />
          <DirectoryField
            label="Wallet"
            value={user.wallet_balance == null ? null : formatNaira(Number(user.wallet_balance))}
          />
          <DirectoryField
            label="Plan until"
            value={user.tier_locked ? "Until removed" : fmt(user.subscription_until)}
          />
          <DirectoryField
            label="Listings"
            value={
              user.listings_total == null
                ? null
                : `${user.listings_total} total · ${user.listings_live ?? 0} live · ${user.listings_pending ?? 0} pending`
            }
          />
          <DirectoryField label="Last sign in" value={fmt(user.last_sign_in_at)} />
        </div>

        <TierControl user={user} />
      </div>
    </Card>
  );
}

function ListingDirectoryCard({
  row,
  resolved,
}: {
  row: DirectoryRow;
  resolved: Record<string, string>;
}) {
  const listing = (row.listing ?? {}) as DirectoryRow;
  if (!listing.id) return null;
  const images = [...imageList(listing.images), ...imageList(listing.image_url)];
  const primaryImage = displayImage(images[0], resolved);
  const details = Object.entries(listing).filter(
    ([key, value]) =>
      !["id", "title", "status", "user_id", "images"].includes(key) &&
      !IMAGE_FIELD.test(key) &&
      value !== null &&
      value !== undefined &&
      value !== "",
  );

  return (
    <Card className="group overflow-hidden rounded-2xl border-border/60 bg-card/75 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-emerald-500/35 hover:shadow-xl hover:shadow-emerald-950/5">
      <div className="relative aspect-[16/8] overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-800">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={listing.title || "Listing"}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full place-items-center text-emerald-100/70">
            <div className="text-center">
              <Package className="mx-auto h-9 w-9" />
              <p className="mt-2 text-xs">No listing photo</p>
            </div>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-4 pt-12 text-white">
          <div className="min-w-0">
            <p className="line-clamp-2 font-bold tracking-tight">
              {listing.title || "Untitled listing"}
            </p>
            <p className="mt-1 text-xs text-white/75">
              {row.owner_name || "Unknown seller"}
              {row.owner_email ? ` · ${row.owner_email}` : ""}
            </p>
          </div>
          <Badge className="shrink-0 capitalize bg-white/15 text-white backdrop-blur">
            {listing.status || "unknown"}
          </Badge>
        </div>
        {images.length > 1 && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">
            <ImageIcon className="h-3 w-3" />
            {images.length} photos
          </span>
        )}
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {listing.category && (
            <Badge variant="outline" className="capitalize">
              {listing.category}
            </Badge>
          )}
          {listing.price !== undefined && listing.price !== null && (
            <p className="text-lg font-black text-primary">{formatNaira(Number(listing.price))}</p>
          )}
        </div>
        {images.length > 1 && (
          <ImageGallery
            values={images.slice(1)}
            resolved={resolved}
            label={listing.title || "Listing"}
          />
        )}
        {details.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {details.slice(0, 8).map(([key, value]) => (
              <DirectoryField key={key} label={key} value={value} />
            ))}
          </div>
        )}
        <Button asChild variant="outline" className="w-full rounded-xl">
          <Link to="/listing/$id" params={{ id: listing.id }}>
            Inspect listing <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}

function ArtisanDirectoryCard({
  row,
  resolved,
}: {
  row: DirectoryRow;
  resolved: Record<string, string>;
}) {
  const profile = (row.profile ?? {}) as DirectoryRow;
  const artisan = (row.artisan ?? {}) as DirectoryRow;
  const id = profile.id || artisan.user_id || artisan.id;
  if (!id) return null;
  const name = profile.full_name || artisan.full_name || "Unnamed artisan";
  const photoValue = [
    ...IMAGE_KEYS.map((key) => profile[key]),
    ...IMAGE_KEYS.map((key) => artisan[key]),
  ].find((value) => typeof value === "string" && value.trim());
  const photo = displayImage(photoValue, resolved);
  const gallery = Array.from(
    new Set([
      ...imageList(profile.portfolio_images),
      ...imageList(artisan.portfolio_images),
      ...imageList(artisan.images),
    ]),
  );
  const merged = { ...profile, ...artisan };
  const details = Object.entries(merged).filter(
    ([key, value]) =>
      !["id", "user_id", "full_name", "email", "phone", "artisan", "profile"].includes(key) &&
      !IMAGE_FIELD.test(key) &&
      value !== null &&
      value !== undefined &&
      value !== "",
  );
  const profession = profile.profession || artisan.profession;
  const location = [profile.lga || artisan.lga, profile.state || artisan.state]
    .filter(Boolean)
    .join(", ");

  return (
    <Card className="group overflow-hidden rounded-2xl border-border/60 bg-card/75 p-0 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-emerald-500/35 hover:shadow-xl hover:shadow-emerald-950/5">
      <div className="h-1 bg-gradient-to-r from-emerald-400 via-primary/70 to-transparent" />
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <DirectoryAvatar src={photo} name={name} large />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="break-words font-bold tracking-tight">{name}</h2>
              {profession && (
                <Badge variant="secondary" className="max-w-full truncate">
                  {profession}
                </Badge>
              )}
              {(profile.is_verified || artisan.is_verified) && (
                <Badge variant="outline" className="gap-1 border-emerald-500/30 text-emerald-600">
                  <BadgeCheck className="h-3 w-3" />
                  Verified
                </Badge>
              )}
            </div>
            <p className="mt-1 break-all text-xs text-muted-foreground">
              {row.email || profile.email || artisan.email || "No email on file"}
            </p>
            {location && (
              <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {location}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-lg border border-border/50 bg-background/45 px-2.5 py-1">
                {profile.years_experience ?? artisan.years_experience ?? 0} years experience
              </span>
              {(profile.starting_price ?? artisan.starting_price) != null && (
                <span className="rounded-lg border border-border/50 bg-background/45 px-2.5 py-1">
                  From {formatNaira(Number(profile.starting_price ?? artisan.starting_price))}
                </span>
              )}
            </div>
          </div>
        </div>

        {gallery.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Portfolio photos
            </p>
            <ImageGallery values={gallery} resolved={resolved} label={`${name} portfolio`} />
          </div>
        )}
        {details.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {details.slice(0, 10).map(([key, value]) => (
              <DirectoryField key={key} label={key} value={value} />
            ))}
          </div>
        )}
        <Button asChild variant="outline" className="w-full rounded-xl">
          <Link to="/artisans/$id" params={{ id }}>
            View artisan profile <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}

function DirectoryPage() {
  const { isAdmin, loading } = useAuth();
  const [query, setQuery] = useState("");
  const users = useAdminRpc("users", "admin_users_full", isAdmin);
  const ads = useAdminRpc("ads", "admin_all_listings", isAdmin);
  const artisans = useAdminRpc("artisans", "admin_all_artisans", isAdmin);
  const allRows = useMemo(
    () => [users.data ?? [], ads.data ?? [], artisans.data ?? []].flat(),
    [users.data, ads.data, artisans.data],
  );
  const resolvedImages = useResolvedDirectoryImages(allRows);
  const filteredUsers = useDirectorySearch(users.data, query);
  const filteredAds = useDirectorySearch(ads.data, query);
  const filteredArtisans = useDirectorySearch(artisans.data, query);
  const queryClient = useQueryClient();
  const errors = [users.error, ads.error, artisans.error].filter(Boolean);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="grid min-h-[60vh] place-items-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-2xl font-black">Admins only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You don’t have permission to view the platform directory.
          </p>
          <Button asChild className="mt-6 rounded-xl">
            <Link to="/">Go home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,hsl(var(--primary)/0.07),transparent_24rem)]">
      <SiteHeader />
      <main className="mx-auto max-w-[1440px] space-y-6 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <section className="relative isolate overflow-hidden rounded-3xl border border-emerald-300/10 bg-slate-950 text-white shadow-2xl shadow-emerald-950/10">
          <div className="pointer-events-none absolute -right-20 -top-28 -z-10 h-80 w-80 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-36 left-1/3 -z-10 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl" />
          <div className="flex flex-col gap-6 p-5 sm:p-8 lg:flex-row lg:items-end lg:justify-between lg:p-10">
            <div className="max-w-2xl">
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-100/70 transition hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Admin control room
              </Link>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200">
                <Sparkles className="h-3.5 w-3.5" /> Platform intelligence
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Full directory
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                Search user accounts, marketplace listings, and artisan profiles from one place.
                Review the submitted details, photos, and subscription status.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:min-w-[420px]">
              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.05] p-3 sm:p-4">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Users
                </p>
                <p className="mt-1 truncate text-lg font-black sm:text-2xl">
                  {(users.data?.length ?? 0).toLocaleString()}
                </p>
              </div>
              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.05] p-3 sm:p-4">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Listings
                </p>
                <p className="mt-1 truncate text-lg font-black sm:text-2xl">
                  {(ads.data?.length ?? 0).toLocaleString()}
                </p>
              </div>
              <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.05] p-3 sm:p-4">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Artisans
                </p>
                <p className="mt-1 truncate text-lg font-black sm:text-2xl">
                  {(artisans.data?.length ?? 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </section>

        <Card className="rounded-2xl border-border/60 bg-card/75 p-3 shadow-sm backdrop-blur sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-bold">Search the directory</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Search names, contact details, locations, listing fields, and profile information.
              </p>
            </div>
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 rounded-xl border-border/60 bg-background/70 pl-9 pr-10"
                placeholder="Search anything…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              {query && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuery("")}
                  className="absolute right-1 top-1/2 h-8 -translate-y-1/2 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </Card>

        {errors.length > 0 && (
          <Card className="flex flex-col gap-3 rounded-2xl border-destructive/25 bg-destructive/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div>
                <p className="font-semibold">Some directory data could not be loaded.</p>
                <p className="mt-1 break-words text-xs text-muted-foreground">
                  {(errors[0] as Error).message} Check that the admin directory database functions
                  are installed and available.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 rounded-lg"
              onClick={() => void queryClient.invalidateQueries({ queryKey: ["admin-dir"] })}
            >
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
              Retry
            </Button>
          </Card>
        )}

        <Tabs defaultValue="users" className="space-y-4">
          <div className="overflow-x-auto pb-1">
            <TabsList className="h-11 min-w-max rounded-xl border border-border/60 bg-card/70 p-1 shadow-sm">
              <TabsTrigger
                value="users"
                className="rounded-lg px-3 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Users <span className="ml-1.5 opacity-75">{users.data?.length ?? 0}</span>
              </TabsTrigger>
              <TabsTrigger
                value="ads"
                className="rounded-lg px-3 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                All ads <span className="ml-1.5 opacity-75">{ads.data?.length ?? 0}</span>
              </TabsTrigger>
              <TabsTrigger
                value="artisans"
                className="rounded-lg px-3 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Artisans <span className="ml-1.5 opacity-75">{artisans.data?.length ?? 0}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="users" className="mt-0">
            <ResultHeading label="Member accounts" count={filteredUsers.length} query={query} />
            {users.isLoading ? (
              <LoadingDirectory />
            ) : filteredUsers.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredUsers.map((user) => (
                  <UserDirectoryCard key={user.id} user={user} resolved={resolvedImages} />
                ))}
              </div>
            ) : (
              <EmptyDirectory query={query} label="users" />
            )}
          </TabsContent>

          <TabsContent value="ads" className="mt-0">
            <ResultHeading label="Marketplace listings" count={filteredAds.length} query={query} />
            {ads.isLoading ? (
              <LoadingDirectory />
            ) : filteredAds.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredAds.map((row, index) => (
                  <ListingDirectoryCard
                    key={row.listing?.id ?? index}
                    row={row}
                    resolved={resolvedImages}
                  />
                ))}
              </div>
            ) : (
              <EmptyDirectory query={query} label="listings" />
            )}
          </TabsContent>

          <TabsContent value="artisans" className="mt-0">
            <ResultHeading label="Artisan profiles" count={filteredArtisans.length} query={query} />
            {artisans.isLoading ? (
              <LoadingDirectory />
            ) : filteredArtisans.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredArtisans.map((row, index) => (
                  <ArtisanDirectoryCard
                    key={row.profile?.id ?? row.artisan?.id ?? index}
                    row={row}
                    resolved={resolvedImages}
                  />
                ))}
              </div>
            ) : (
              <EmptyDirectory query={query} label="artisan profiles" />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function ResultHeading({ label, count, query }: { label: string; count: number; query: string }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 className="text-lg font-bold tracking-tight">{label}</h2>
        <p className="text-xs text-muted-foreground">
          {query ? "Matching search results" : "Latest platform records"}
        </p>
      </div>
      <Badge variant="outline" className="rounded-full px-3 py-1">
        {count.toLocaleString()} shown
      </Badge>
    </div>
  );
}

function LoadingDirectory() {
  return (
    <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-border/70 bg-card/30">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
        Loading directory records…
      </div>
    </div>
  );
}

function EmptyDirectory({ query, label }: { query: string; label: string }) {
  return (
    <div className="grid min-h-56 place-items-center rounded-2xl border border-dashed border-border/70 bg-card/30 px-5 text-center">
      <div>
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
          <Building2 className="h-5 w-5" />
        </div>
        <p className="mt-3 font-semibold">{query ? "No matching records" : `No ${label} found`}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {query
            ? "Try a different name, email, or search term."
            : "New records will appear here when they are available."}
        </p>
      </div>
    </div>
  );
}
