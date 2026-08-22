import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight, BadgeCheck, Crown, Facebook, Gift, Loader2, Rocket, Search, Share2, Sparkles, Target, Users,
} from "lucide-react";
import { toast } from "sonner";

import { WaitlistForm } from "@/components/waitlist-form";
import { WaitlistProfile } from "@/components/waitlist-profile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useCountdown, useCountUp } from "@/hooks/use-countdown";
import {
  FOUNDING_REWARDS,
  ICONS,
  WAITLIST_ASSETS,
  WAITLIST_SEO,
  WAITLIST_STATUS_KEY,
  clearPendingReferral,
  fieldErrorsFromZod,
  formatRewardRange,
  getContentValue,
  getFoundingReward,
  getRememberedReferralCode,
  parseWaitlistPageData,
  parseWaitlistStatus,
  persistWaitlistStatusLocal,
  rememberReferralCode,
  saveWaitlistAccountContext,
  scrollElementIntoView,
  waitlistContentSchemas,
  waitlistJoinSchema,
  type WaitlistFormValues,
  type WaitlistStatus,
} from "@/lib/waitlist-utils";

export const Route = createFileRoute("/wait-list")({
  head: () => ({
    meta: [
      { title: WAITLIST_SEO.title },
      { name: "description", content: WAITLIST_SEO.description },
      { property: "og:title", content: WAITLIST_SEO.title },
      { property: "og:description", content: WAITLIST_SEO.description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: WAITLIST_SEO.url },
      { property: "og:image", content: WAITLIST_SEO.image },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: WAITLIST_SEO.title },
      { name: "twitter:description", content: WAITLIST_SEO.description },
      { name: "twitter:image", content: WAITLIST_SEO.image },
    ],
    links: [
      { rel: "icon", href: WAITLIST_ASSETS.logo },
      { rel: "canonical", href: WAITLIST_SEO.url },
    ],
  }),
  component: WaitListPage,
});

type ProfileTab = "overview" | "referrals" | "rewards";

function WaitListPage() {
  const qc = useQueryClient();
  const formRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState<null | "joined" | "exists">(null);
  const [statusEmail, setStatusEmail] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [statusData, setStatusData] = useState<WaitlistStatus | null>(null);
  const [form, setForm] = useState<WaitlistFormValues>({
    full_name: "", email: "", phone: "", state: "", city: "",
    user_type: "buyer", referral_code: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [referralStatus, setReferralStatus] = useState<{ valid: boolean; value: string }>({ valid: false, value: "" });
  const [joinedProfile, setJoinedProfile] = useState<WaitlistStatus | null>(null);
  const [statusHydrated, setStatusHydrated] = useState(false);
  const [profileTab, setProfileTab] = useState<ProfileTab>("overview");

  const { data: pageData } = useQuery({
    queryKey: ["waitlist-page-data"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_waitlist_page_data");
      if (error) throw error;
      return parseWaitlistPageData(data);
    },
  });

  const count = Number(pageData?.stats?.count ?? 0);
  const animated = useCountUp(count);
  const heroContent = getContentValue(pageData?.content, "hero", waitlistContentSchemas.hero, {});
  const communityContent = getContentValue(pageData?.content, "community", waitlistContentSchemas.community, {});
  const launchContent = getContentValue(pageData?.content, "launch", waitlistContentSchemas.launch, {});
  const benefits = getContentValue(pageData?.content, "benefits", waitlistContentSchemas.benefits, []);
  const features = getContentValue(pageData?.content, "features", waitlistContentSchemas.features, []);
  const faqs = getContentValue(pageData?.content, "faqs", waitlistContentSchemas.faqs, []);
  const socials = getContentValue(pageData?.content, "socials", waitlistContentSchemas.socials, []);
  const progressContent = getContentValue(pageData?.content, "progress", waitlistContentSchemas.progress, {});
  const footerContent = getContentValue(pageData?.content, "footer", waitlistContentSchemas.footer, {});
  const sectionsContent = getContentValue(pageData?.content, "sections", waitlistContentSchemas.sections, {});
  const formContent = getContentValue(sectionsContent, "form", waitlistContentSchemas.form, {});
  const benefitsSection = getContentValue(sectionsContent, "benefits", waitlistContentSchemas.section, {});
  const featuresSection = getContentValue(sectionsContent, "features", waitlistContentSchemas.section, {});
  const faqSection = getContentValue(sectionsContent, "faqs", waitlistContentSchemas.section, {});
  const countdown = useCountdown(launchContent.deadline);

  useEffect(() => {
    void supabase.rpc("track_waitlist_event", { _event_type: "visit" });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref")?.trim();
    const rememberedRef = ref || getRememberedReferralCode();

    if (rememberedRef) {
      rememberReferralCode(rememberedRef);
      setForm((current) => ({ ...current, referral_code: rememberedRef }));
      setReferralStatus({ valid: true, value: rememberedRef });
    }

    try {
      const raw = window.localStorage.getItem(WAITLIST_STATUS_KEY);
      if (raw) {
        const saved = parseWaitlistStatus(JSON.parse(raw));
        if (saved?.email) {
          setJoinedProfile(saved);
          setStatusData(saved);
          setDone("exists");
          setForm((current) => ({
            ...current,
            full_name: saved.full_name ?? current.full_name,
            email: saved.email ?? current.email,
            user_type: (saved.user_type as WaitlistFormValues["user_type"]) ?? current.user_type,
          }));
        }
      }
    } catch {
      // Ignore stale or malformed local status.
    } finally {
      setStatusHydrated(true);
    }
  }, []);

  const persistWaitlistStatus = (status: WaitlistStatus) => {
    setJoinedProfile(status);
    persistWaitlistStatusLocal(status);
  };

  const checkWaitlistStatus = async () => {
    const email = statusEmail.trim().toLowerCase();
    setStatusError("");

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setStatusError("Enter the email address you used to join the wait-list.");
      return;
    }

    setStatusLoading(true);

    try {
      const { data, error } = await supabase.rpc("get_my_waitlist_status", {
        _email: email,
      });

      if (error) throw error;

      const result = parseWaitlistStatus(data);

      if (result?.status !== "found") {
        setStatusData(null);
        setStatusError("We couldn't find that email on the Tile wait-list.");
        return;
      }

      setStatusData(result);
      persistWaitlistStatus(result);
      setDone("exists");
      setForm((current) => ({
        ...current,
        full_name: result.full_name ?? current.full_name,
        email: result.email ?? email,
        user_type: (result.user_type as WaitlistFormValues["user_type"]) ?? current.user_type,
      }));
      toast.success("Wait-list status found.");
    } catch (error) {
      console.error("WAITLIST STATUS ERROR:", error);
      setStatusError(error instanceof Error ? error.message : "Unable to check your status right now.");
    } finally {
      setStatusLoading(false);
    }
  };

  const currentPosition =
    joinedProfile?.queue_position ??
    statusData?.queue_position ??
    count + 1;

  const currentReward =
    joinedProfile?.reward ??
    statusData?.reward ??
    getFoundingReward(currentPosition);

  const referralCount =
    joinedProfile?.referrals_count ??
    statusData?.referrals_count ??
    0;

  const continueToAccountSetup = () => {
    saveWaitlistAccountContext(form.email, form.user_type);
    window.location.href = "/signup?from=waitlist";
  };

  const scrollToForm = useCallback(() => {
    void supabase.rpc("track_waitlist_event", { _event_type: "join_click" });
    scrollElementIntoView(formRef.current, { block: "center" });
  }, []);

  const scrollToProfile = useCallback((tab: ProfileTab = "overview") => {
    setProfileTab(tab);
    window.requestAnimationFrame(() => {
      scrollElementIntoView(profileRef.current, { block: "start" });
    });
  }, []);

  const join = useMutation({
    mutationFn: async (values: WaitlistFormValues) => {
      const { data, error } = await supabase.rpc("join_waitlist_with_profile", {
        _full_name: values.full_name,
        _email: values.email,
        _phone: values.phone || undefined,
        _state: values.state || undefined,
        _city: values.city || undefined,
        _user_type: values.user_type,
        _referral_code: values.referral_code || undefined,
        _source: "wait-list",
      });
      if (error) throw error;
      return parseWaitlistStatus(data);
    },
    onSuccess: (result) => {
      const status = result?.status;
      if (status === "invalid_email") {
        setErrors({ email: "Enter a valid email address" });
        return;
      }
      if (status === "invalid_name") {
        setErrors({ full_name: "Enter your full name" });
        return;
      }
      if (!result) {
        toast.error("Unable to confirm wait-list status. Please try again.");
        return;
      }
      if (status === "exists") {
        setDone("exists");
        setStatusData(result);
        persistWaitlistStatus(result);
        toast.success("You're already on the wait-list 🎉");
        return;
      }

      setDone("joined");
      persistWaitlistStatus(result);
      clearPendingReferral();
      toast.success("You're in! Your founding-member reward is locked in. 🎉");
      void qc.invalidateQueries({ queryKey: ["waitlist-page-data"] });
    },
    onError: (e: Error) => toast.error(e.message || "Something went wrong. Please try again."),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (join.isPending) return;

    const parsed = waitlistJoinSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(fieldErrorsFromZod(parsed.error));
      return;
    }

    setErrors({});
    join.mutate(parsed.data);
  };

  const onFormChange = (key: keyof WaitlistFormValues, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (key === "referral_code") {
      if (value.trim()) {
        rememberReferralCode(value);
        setReferralStatus({ valid: true, value });
      } else {
        setReferralStatus({ valid: false, value: "" });
      }
    }
  };

  const isReturningMember = Boolean(joinedProfile || done === "exists");
  const showReturningHero = statusHydrated && isReturningMember;
  const showGuestHero = statusHydrated && !isReturningMember;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg transition-transform duration-300 group-hover:scale-105">
              <img
                src={WAITLIST_ASSETS.logo}
                alt="Tile Logo"
                className="h-full w-full object-cover"
                loading="eager"
              />
            </div>
            <span className="text-lg font-black tracking-tight">Tile</span>
          </div>
          {statusHydrated && isReturningMember ? (
            <Button size="sm" onClick={() => scrollToProfile("overview")}>
              Profile
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button size="sm" onClick={scrollToForm}>Join the Waitlist</Button>
          )}
        </div>
      </header>

      <section className={cn("relative overflow-hidden", !statusHydrated && "min-h-[18rem] sm:min-h-[20rem]")}>
        <div
          className={cn(
            "container mx-auto max-w-6xl px-4 py-10 sm:py-14 transition-opacity duration-500",
            statusHydrated ? "pointer-events-none absolute inset-x-0 top-0 opacity-0" : "opacity-100",
          )}
          aria-hidden={statusHydrated}
        >
          <div className="mx-auto max-w-3xl animate-pulse space-y-5">
            <div className="h-7 w-44 rounded-full bg-muted" />
            <div className="h-16 w-full rounded-2xl bg-muted" />
            <div className="h-6 w-4/5 rounded-xl bg-muted" />
            <div className="h-12 w-48 rounded-xl bg-muted" />
          </div>
        </div>

        <div
          className={cn(
            "border-b border-border/60 bg-primary/[0.03] transition-opacity duration-500",
            showReturningHero ? "relative opacity-100" : "pointer-events-none absolute inset-x-0 top-0 opacity-0",
          )}
          aria-hidden={!showReturningHero}
        >
          <div className="container mx-auto max-w-6xl px-4 py-10 sm:py-14">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Badge variant="secondary" className="mb-3 rounded-full px-3 py-1">
                  <BadgeCheck className="mr-1.5 h-3.5 w-3.5" /> Founding member
                </Badge>
                <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
                  Welcome back{joinedProfile?.full_name ? `, ${joinedProfile.full_name.split(" ")[0]}` : ""}.
                </h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">
                  Your Tile wait-list spot is safe. Check your position, rewards or referral activity below.
                </p>
              </div>
              <Button size="lg" onClick={() => scrollToProfile("referrals")}>
                Open Referrals
                <Share2 className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "transition-opacity duration-500",
            showGuestHero ? "relative opacity-100" : "pointer-events-none absolute inset-x-0 top-0 opacity-0",
          )}
          aria-hidden={!showGuestHero}
        >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,hsl(var(--primary)/0.22),transparent_45%),radial-gradient(circle_at_85%_10%,hsl(var(--primary)/0.12),transparent_40%)]" />
            <div className="container relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
              <Badge variant="secondary" className="mb-6 animate-in fade-in slide-in-from-bottom-2 rounded-full px-3 py-1">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" /> {heroContent.badge ?? "Launching soon in Nigeria"}
              </Badge>
              <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight animate-in fade-in slide-in-from-bottom-3 duration-700 sm:text-6xl lg:text-7xl">
                {heroContent.title ?? "Buy. Sell. Hire."}
                <span className="mt-2 block bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                  {heroContent.highlight ?? "Everything you need in one trusted marketplace."}
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground animate-in fade-in duration-1000 sm:text-lg">
                {heroContent.description ?? "Tile connects buyers, sellers and skilled artisans across Nigeria in one powerful platform. Join early and lock in a founding-member reward before the public launch."}
              </p>

              <div className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-3">
                {FOUNDING_REWARDS.slice(0, 3).map((tier) => (
                  <div key={`hero-tier-${tier.min}`} className="rounded-2xl border border-border/70 bg-background/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                      #{tier.min}–{tier.max}
                    </p>
                    <p className="mt-1 text-lg font-black">{tier.plan}</p>
                    <p className="text-xs text-muted-foreground">1 month free</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                  <Target className="mr-1.5 h-3.5 w-3.5" /> Limited launch rewards
                </Badge>
                <span className="text-muted-foreground">
                  Your queue position is your advantage.
                </span>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="h-12 px-8 text-base" onClick={scrollToForm}>
                  {heroContent.ctaPrimary ?? "Claim My Founding Spot"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
                  <a href="#why-join">{heroContent.ctaSecondary ?? "Learn More"}</a>
                </Button>
              </div>
              <div className="mt-8 flex flex-col gap-6 rounded-2xl border border-border/70 bg-background/70 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex -space-x-2">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="h-8 w-8 rounded-full border-2 border-background bg-primary/20" />
                    ))}
                  </div>
                  <span>
                    {heroContent.countLabel?.replace("{count}", animated.toLocaleString()) ?? `Join ${animated.toLocaleString()} early members preparing for launch`}
                  </span>
                </div>
                {launchContent.heading && (
                  <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-left sm:min-w-[220px]">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{launchContent.heading}</p>
                    <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <span>{countdown.days}d</span>
                      <span>{countdown.hours}h</span>
                      <span>{countdown.minutes}m</span>
                      <span>{countdown.seconds}s</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
        </div>
      </section>

      <section ref={formRef} id="join" className="container mx-auto max-w-3xl px-4 pb-20">
        <Card className="border-border/70 p-6 shadow-2xl shadow-primary/10 sm:p-8">
          {!statusHydrated ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">Loading your Tile membership…</p>
            </div>
          ) : done ? (
            <WaitlistProfile
              profileRef={profileRef}
              done={done}
              status={joinedProfile}
              currentPosition={currentPosition}
              currentReward={currentReward}
              referralCount={referralCount}
              userType={form.user_type}
              initialTab={profileTab}
              onContinueToAccount={continueToAccountSetup}
              onJoinAnother={() => setDone(null)}
            />
          ) : (
            <WaitlistForm
              form={form}
              errors={errors}
              referralReady={referralStatus.valid}
              formContent={formContent}
              pending={join.isPending}
              onChange={onFormChange}
              onSubmit={submit}
            />
          )}
        </Card>
      </section>

      <section className="border-t border-border/60 bg-primary/[0.03] py-10">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border bg-background p-5">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-primary" />
                <p className="font-bold">First 50</p>
              </div>
              <p className="mt-2 text-2xl font-black">VIP · 1 month free</p>
              <p className="mt-1 text-sm text-muted-foreground">The strongest founding reward.</p>
            </div>
            <div className="rounded-2xl border bg-background p-5">
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-primary" />
                <p className="font-bold">51–200</p>
              </div>
              <p className="mt-2 text-2xl font-black">PRO · 1 month free</p>
              <p className="mt-1 text-sm text-muted-foreground">Still an early-member advantage.</p>
            </div>
            <div className="rounded-2xl border bg-background p-5">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                <p className="font-bold">201–500</p>
              </div>
              <p className="mt-2 text-2xl font-black">LITE · 1 month free</p>
              <p className="mt-1 text-sm text-muted-foreground">Join before the public launch closes the window.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 py-14">
        <div className="container mx-auto max-w-3xl px-4">
          <Card className="p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black">Already joined?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Check your position, reward and referral code with the email you used to join.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Input
                type="email"
                value={statusEmail}
                onChange={(e) => setStatusEmail(e.target.value)}
                placeholder="you@example.com"
              />
              <Button onClick={checkWaitlistStatus} disabled={statusLoading} className="sm:min-w-[150px]">
                {statusLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                {statusLoading ? "Checking…" : "Check my status"}
              </Button>
            </div>

            {statusError && <p className="mt-3 text-sm text-destructive">{statusError}</p>}

            {statusData && (
              <div className="mt-5 rounded-2xl border bg-muted/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Founding member</p>
                    <p className="text-lg font-black">{statusData.full_name ?? "Member"}</p>
                  </div>
                  <Badge className="text-sm">#{statusData.queue_position}</Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Reward: <span className="font-semibold text-foreground">
                    {statusData.reward?.benefit ?? getFoundingReward(statusData.queue_position).detail}
                  </span>
                </p>
                {statusData.referral_token && (
                  <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Your referral code</p>
                    <p className="mt-1 font-mono font-bold text-foreground">{statusData.referral_token}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Share your personal invite link from your member card above.
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </section>

      <section className="border-t border-border/60 bg-muted/20 py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="rounded-3xl border border-border/70 bg-background p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight">{communityContent.title ?? "Live community momentum"}</h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{communityContent.subtitle ?? "Nigerians are already joining the waitlist and preparing for launch."}</p>
              </div>
              <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                {count.toLocaleString()} members already in
              </div>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {communityContent.items?.map((item, index) => (
                <div key={item.id ?? item.key ?? `community-${index}`} className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-2xl font-black text-foreground">{item.key ? pageData?.stats?.[item.key as keyof NonNullable<typeof pageData>["stats"]] ?? 0 : 0}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-muted/20 py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <Badge variant="secondary" className="mb-4">
            <Gift className="mr-1.5 h-3.5 w-3.5" /> Founding-member rewards
          </Badge>
          <h2 className="max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
            The earlier you join, the more you unlock.
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Your signup position determines your launch reward. Join early and keep your place in Tile's founding community.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {FOUNDING_REWARDS.map((tier) => {
              const Icon = tier.icon;
              return (
                <Card key={`reward-${tier.min}`} className="relative overflow-hidden border-border/70 p-5">
                  <div className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    {formatRewardRange(tier)}
                  </p>
                  <h3 className="mt-3 text-xl font-black">{tier.plan}</h3>
                  <p className="mt-2 text-sm font-semibold">{tier.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{tier.detail}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section id="why-join" className="py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{benefitsSection.title ?? "Why join early?"}</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">{benefitsSection.description ?? "Early members get advantages the public launch won't offer."}</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b, index) => {
              const Icon = ICONS[b.icon ?? "Rocket"] ?? Rocket;
              return (
                <Card key={b.title ? `${b.title}-${index}` : `benefit-${index}`} className="group border-border/70 p-6 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{b.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{b.body}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{featuresSection.title ?? "Everything Tile will do"}</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">{featuresSection.description ?? "One platform for goods, services and the people behind them."}</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, index) => {
              const Icon = ICONS[f.icon ?? "Sparkles"] ?? Sparkles;
              return (
                <Card key={f.title ? `${f.title}-${index}` : `feature-${index}`} className="border-border/70 p-5 transition-colors hover:border-primary/50">
                  <Icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-4 flex items-center gap-2 font-bold">
                    {f.title}
                    {f.soon && <Badge variant="secondary" className="text-[10px]">Soon</Badge>}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-muted/20 py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{progressContent.heading ?? "Launch progress"}</h2>
          <p className="mt-2 text-muted-foreground">{progressContent.description ?? "A live view of the build status keeps momentum high."}</p>
          <div className="mt-8 rounded-2xl border border-border/70 bg-background p-6 sm:p-8">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>Platform development</span>
              <span className="text-primary">{progressContent.overall ?? 82}%</span>
            </div>
            <Progress value={progressContent.overall ?? 82} className="mt-3 h-3" />
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {(progressContent.milestones ?? []).map((m, index) => (
                <div key={m.id ?? m.label ?? `milestone-${index}`} className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
                  <span className="font-medium">{m.label}</span>
                  <Badge variant={m.status === "Completed" ? "default" : m.status === "In Progress" ? "secondary" : "outline"}>
                    {m.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{faqSection.title ?? "Frequently asked questions"}</h2>
          <Accordion type="single" collapsible className="mt-8">
            {faqs.map((f, index) => (
              <AccordionItem key={f.q ? `${f.q}-${index}` : `faq-${index}`} value={f.q ?? `faq-${index}`}>
                <AccordionTrigger className="text-left font-semibold">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="border-t border-border/60 bg-gradient-to-b from-primary/10 to-transparent py-20">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <Users className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
            {footerContent.heading ?? "Ready to join Nigeria's next marketplace?"}
          </h2>
          <p className="mt-3 text-muted-foreground">{footerContent.body ?? "Join the waitlist today — it's free, and it takes 20 seconds."}</p>
          <Button
            size="lg"
            className="mt-8 h-14 px-10 text-base"
            onClick={() => (isReturningMember ? scrollToProfile("overview") : scrollToForm())}
          >
            {isReturningMember ? "Open My Profile" : (footerContent.cta ?? "Join the Waitlist")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      <footer className="border-t border-border/60 py-10">
        <div className="container mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {socials.map((s, index) => {
              const Icon = ICONS[s.icon ?? "Facebook"] ?? Facebook;
              return (
                <a key={s.href ?? s.label ?? `social-${index}`} href={s.href ?? "#"} aria-label={s.label}
                  className={`grid h-10 w-10 place-items-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary ${s.soon ? "opacity-50" : ""}`}>
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {footerContent.copyright?.replace("{year}", new Date().getFullYear().toString()) ?? `© ${new Date().getFullYear()} Tile. Nigeria's marketplace for buying, selling and hiring artisans.`}
          </p>
        </div>
      </footer>
    </div>
  );
}