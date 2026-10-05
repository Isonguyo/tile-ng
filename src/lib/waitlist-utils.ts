import { z } from "zod";
import {
  Rocket,
  BadgeCheck,
  Store,
  Wrench,
  Gift,
  ShoppingBag,
  Users,
  MessageSquare,
  ShieldCheck,
  Megaphone,
  Search,
  Sparkles,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Music2,
  Twitter,
  MessageCircle,
  Crown,
  type LucideIcon,
} from "lucide-react";
import { LOCATIONS } from "@/lib/categories";
import { siteUrl } from "@/lib/site-url";

export const WAITLIST_ASSETS = {
  logo: "https://res.cloudinary.com/dbozz4sgv/image/upload/v1781367385/tile-logo_vv2c8v.jpg",
  ogImage: "https://res.cloudinary.com/dbozz4sgv/image/upload/v1781367385/tile-logo_vv2c8v.jpg",
  canonicalUrl: "https://tile-ng.vercel.app/wait-list",
} as const;

export const WAITLIST_SEO = {
  title: "Tile Marketplace | Join the Waitlist",
  description:
    "Join Tile's founding-member wait-list. Early members can unlock launch rewards, early access and private pre-launch setup.",
  url: WAITLIST_ASSETS.canonicalUrl,
  image: WAITLIST_ASSETS.ogImage,
} as const;

export const PENDING_REFERRAL_KEY = "tile_waitlist_pending_referral";
export const WAITLIST_STATUS_KEY = "tile_waitlist_status";
export const WAITLIST_CONTEXT_KEY = "tile_waitlist_context";

export type HeroContent = {
  badge?: string;
  title?: string;
  highlight?: string;
  description?: string;
  ctaPrimary?: string;
  ctaSecondary?: string;
  countLabel?: string;
};

export type CommunityContent = {
  title?: string;
  subtitle?: string;
  items?: Array<{ id?: string; label?: string; key?: string }>;
};

export type LaunchContent = {
  heading?: string;
  description?: string;
  deadline?: string;
};

export type BenefitItem = { title?: string; body?: string; icon?: string };
export type FeatureItem = { title?: string; body?: string; icon?: string; soon?: boolean };
export type FAQItem = { q?: string; a?: string };
export type SocialItem = { label?: string; href?: string; icon?: string; soon?: boolean };
export type MilestoneItem = { id?: string; label?: string; status?: string };

export type ProgressContent = {
  heading?: string;
  description?: string;
  overall?: number;
  milestones?: MilestoneItem[];
};

export type FooterContent = {
  heading?: string;
  body?: string;
  cta?: string;
  copyright?: string;
};

export type SectionContent = {
  title?: string;
  description?: string;
};

export type FormContent = {
  title?: string;
  subtitle?: string;
  submit?: string;
  successTitle?: string;
  successTitleExists?: string;
  successBody?: string;
  successButton?: string;
};

export type WaitlistReward = {
  name?: string;
  min_position?: number;
  max_position?: number | null;
  reward_plan?: string | null;
  free_months?: number;
  benefit?: string;
};

export type WaitlistStatus = {
  status?: string;
  waitlist_id?: string;
  full_name?: string;
  email?: string;
  queue_position?: number;
  referral_token?: string;
  referrals_count?: number;
  referred_by?: string | null;
  referral_attributed?: boolean;
  user_type?: string;
  created_at?: string;
  auth_user_id?: string | null;
  account_created_at?: string | null;
  reward?: WaitlistReward;
};

export type WaitlistPageData = {
  stats?: {
    count?: number;
    buyers?: number;
    sellers?: number;
    artisans?: number;
    all_types?: number;
    visits?: number;
    join_clicks?: number;
    signups?: number;
  };
  content?: Record<string, unknown>;
};

export type WaitlistFormValues = {
  full_name: string;
  email: string;
  phone: string;
  state: string;
  city: string;
  user_type: "buyer" | "seller" | "artisan" | "all";
  referral_code: string;
};

export type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export type FoundingReward = {
  min: number;
  max: number;
  title: string;
  plan: string;
  detail: string;
  icon: LucideIcon;
};

const UNBOUNDED_TIER_MAX = Number.POSITIVE_INFINITY;

export const FALLBACK_FOUNDING_REWARD: FoundingReward = {
  min: 501,
  max: UNBOUNDED_TIER_MAX,
  title: "Founding Member",
  plan: "Early Access",
  detail: "Founding-member early access and launch updates",
  icon: Sparkles,
};

export const FOUNDING_REWARDS: FoundingReward[] = [
  {
    min: 1,
    max: 50,
    title: "Founding 50",
    plan: "VIP",
    detail: "1 month of VIP free when Tile launches",
    icon: Crown,
  },
  {
    min: 51,
    max: 200,
    title: "Early Member",
    plan: "PRO",
    detail: "1 month of PRO free when Tile launches",
    icon: BadgeCheck,
  },
  {
    min: 201,
    max: 500,
    title: "Early Member",
    plan: "LITE",
    detail: "1 month of LITE free when Tile launches",
    icon: Gift,
  },
  FALLBACK_FOUNDING_REWARD,
];

export function isUnboundedRewardMax(max: number) {
  return !Number.isFinite(max);
}

export function formatRewardRange(tier: Pick<FoundingReward, "min" | "max">) {
  return isUnboundedRewardMax(tier.max) ? `#${tier.min}+` : `#${tier.min}–${tier.max}`;
}

export function getFoundingReward(position?: number): FoundingReward {
  const parsed = Number(position);
  const p = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;

  const match = FOUNDING_REWARDS.find((tier) => {
    const upper = Number.isFinite(tier.max) ? tier.max : UNBOUNDED_TIER_MAX;
    return p >= tier.min && p <= upper;
  });

  return match ?? FALLBACK_FOUNDING_REWARD;
}

export const ICONS: Record<string, LucideIcon> = {
  Rocket,
  BadgeCheck,
  Store,
  Wrench,
  Gift,
  ShoppingBag,
  Users,
  MessageSquare,
  ShieldCheck,
  Megaphone,
  Search,
  Sparkles,
  Facebook,
  Instagram,
  Music2,
  Twitter,
  Linkedin,
  Youtube,
  MessageCircle,
  Crown,
};

const optionalString = z.string().optional();
const optionalBoolean = z.boolean().optional();

const heroContentSchema: z.ZodType<HeroContent> = z.object({
  badge: optionalString,
  title: optionalString,
  highlight: optionalString,
  description: optionalString,
  ctaPrimary: optionalString,
  ctaSecondary: optionalString,
  countLabel: optionalString,
});

const communityContentSchema: z.ZodType<CommunityContent> = z.object({
  title: optionalString,
  subtitle: optionalString,
  items: z
    .array(
      z.object({
        id: optionalString,
        label: optionalString,
        key: optionalString,
      }),
    )
    .optional(),
});

const launchContentSchema: z.ZodType<LaunchContent> = z.object({
  heading: optionalString,
  description: optionalString,
  deadline: optionalString,
});

const benefitItemSchema: z.ZodType<BenefitItem> = z.object({
  title: optionalString,
  body: optionalString,
  icon: optionalString,
});

const featureItemSchema: z.ZodType<FeatureItem> = z.object({
  title: optionalString,
  body: optionalString,
  icon: optionalString,
  soon: optionalBoolean,
});

const faqItemSchema: z.ZodType<FAQItem> = z.object({
  q: optionalString,
  a: optionalString,
});

const socialItemSchema: z.ZodType<SocialItem> = z.object({
  label: optionalString,
  href: optionalString,
  icon: optionalString,
  soon: optionalBoolean,
});

const milestoneItemSchema: z.ZodType<MilestoneItem> = z.object({
  id: optionalString,
  label: optionalString,
  status: optionalString,
});

const progressContentSchema: z.ZodType<ProgressContent> = z.object({
  heading: optionalString,
  description: optionalString,
  overall: z.number().optional(),
  milestones: z.array(milestoneItemSchema).optional(),
});

const footerContentSchema: z.ZodType<FooterContent> = z.object({
  heading: optionalString,
  body: optionalString,
  cta: optionalString,
  copyright: optionalString,
});

const sectionContentSchema: z.ZodType<SectionContent> = z.object({
  title: optionalString,
  description: optionalString,
});

const formContentSchema: z.ZodType<FormContent> = z.object({
  title: optionalString,
  subtitle: optionalString,
  submit: optionalString,
  successTitle: optionalString,
  successTitleExists: optionalString,
  successBody: optionalString,
  successButton: optionalString,
});

const waitlistPageDataSchema = z.object({
  stats: z
    .object({
      count: z.number().optional(),
      buyers: z.number().optional(),
      sellers: z.number().optional(),
      artisans: z.number().optional(),
      all_types: z.number().optional(),
      visits: z.number().optional(),
      join_clicks: z.number().optional(),
      signups: z.number().optional(),
    })
    .passthrough()
    .optional(),
  content: z.record(z.string(), z.unknown()).optional(),
});

const waitlistRewardSchema: z.ZodType<WaitlistReward> = z.object({
  name: optionalString,
  min_position: z.number().optional(),
  max_position: z.number().nullable().optional(),
  reward_plan: z.string().nullable().optional(),
  free_months: z.number().optional(),
  benefit: optionalString,
});

export const waitlistStatusSchema: z.ZodType<WaitlistStatus> = z.object({
  status: optionalString,
  waitlist_id: optionalString,
  full_name: optionalString,
  email: optionalString,
  queue_position: z.number().optional(),
  referral_token: optionalString,
  referrals_count: z.number().optional(),
  referred_by: z.string().nullable().optional(),
  referral_attributed: optionalBoolean,
  user_type: optionalString,
  created_at: optionalString,
  auth_user_id: z.string().nullable().optional(),
  account_created_at: z.string().nullable().optional(),
  reward: waitlistRewardSchema.optional(),
});

const NIGERIAN_PHONE = /^(?:\+?234|0)[789][01]\d{8}$/;
const CITY_NAME = /^[A-Za-z][A-Za-z\s'.-]{1,59}$/;

export const waitlistJoinSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120, "Name is too long"),
  email: z.string().trim().email("Enter a valid email address").max(255),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine(
      (value) => !value || NIGERIAN_PHONE.test(value.replace(/[\s()-]/g, "")),
      "Enter a valid Nigerian phone number",
    ),
  state: z
    .string()
    .trim()
    .refine(
      (value) => !value || (LOCATIONS as readonly string[]).includes(value),
      "Select a valid Nigerian state",
    ),
  city: z
    .string()
    .trim()
    .max(60)
    .refine((value) => !value || CITY_NAME.test(value), "Enter a valid city name"),
  user_type: z.enum(["buyer", "seller", "artisan", "all"]),
  referral_code: z.string().trim().max(40),
});

export function parseWaitlistPageData(raw: unknown): WaitlistPageData {
  const parsed = waitlistPageDataSchema.safeParse(raw);
  return parsed.success ? parsed.data : {};
}

export function parseWaitlistStatus(raw: unknown): WaitlistStatus | null {
  const parsed = waitlistStatusSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function getContentValue<T>(
  content: object | undefined,
  key: string,
  schema: z.ZodType<T>,
  fallback: T,
): T {
  const value = content && key in content ? (content as Record<string, unknown>)[key] : undefined;
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
}

export const waitlistContentSchemas = {
  hero: heroContentSchema,
  community: communityContentSchema,
  launch: launchContentSchema,
  benefits: z.array(benefitItemSchema),
  features: z.array(featureItemSchema),
  faqs: z.array(faqItemSchema),
  socials: z.array(socialItemSchema),
  progress: progressContentSchema,
  footer: footerContentSchema,
  sections: z.record(z.string(), sectionContentSchema),
  form: formContentSchema,
  section: sectionContentSchema,
};

export function getPrelaunchAccountType(userType: string) {
  if (userType === "seller") return "merchant";
  if (userType === "artisan") return "artisan";
  if (userType === "buyer") return "buyer";
  return undefined;
}

export function rememberReferralCode(code: string) {
  const clean = code.trim().toUpperCase();
  if (!clean) return;

  try {
    window.localStorage.setItem(
      PENDING_REFERRAL_KEY,
      JSON.stringify({
        code: clean,
        saved_at: Date.now(),
      }),
    );
  } catch {
    // Ignore storage failures.
  }
}

export function getRememberedReferralCode() {
  try {
    const raw = window.localStorage.getItem(PENDING_REFERRAL_KEY);
    if (!raw) return "";

    const parsed = JSON.parse(raw) as { code?: string; saved_at?: number };
    if (!parsed.code || !parsed.saved_at) return "";

    if (Date.now() - parsed.saved_at > 30 * 24 * 60 * 60 * 1000) {
      window.localStorage.removeItem(PENDING_REFERRAL_KEY);
      return "";
    }

    return parsed.code.toUpperCase();
  } catch {
    return "";
  }
}

export function saveWaitlistAccountContext(email: string, userType: string) {
  try {
    window.sessionStorage.setItem(
      WAITLIST_CONTEXT_KEY,
      JSON.stringify({
        email,
        user_type: userType,
        account_type: getPrelaunchAccountType(userType),
        created_at: new Date().toISOString(),
      }),
    );
  } catch {
    // Session storage can be unavailable in restrictive browser contexts.
  }
}

export function persistWaitlistStatusLocal(status: WaitlistStatus) {
  try {
    window.localStorage.setItem(WAITLIST_STATUS_KEY, JSON.stringify(status));
  } catch {
    // Status lookup remains available if local storage is unavailable.
  }
}

export function clearPendingReferral() {
  try {
    window.localStorage.removeItem(PENDING_REFERRAL_KEY);
  } catch {
    // Ignore cleanup failures.
  }
}

export function getCountdown(target?: string): Countdown {
  if (!target) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  const deadline = new Date(target).getTime();
  if (!Number.isFinite(deadline)) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  const delta = deadline - Date.now();
  if (delta <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  return {
    days: Math.floor(delta / (1000 * 60 * 60 * 24)),
    hours: Math.floor((delta / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((delta / (1000 * 60)) % 60),
    seconds: Math.floor((delta / 1000) % 60),
  };
}

export function scrollElementIntoView(
  element: HTMLElement | null,
  options?: ScrollIntoViewOptions,
) {
  element?.scrollIntoView({
    behavior: "smooth",
    block: "start",
    ...options,
  });
}

export function buildReferralSharePath(token: string) {
  return `?ref=${encodeURIComponent(token)}`;
}

/** Full, production-safe invite link for a member's canonical referral token. */
export function buildReferralShareUrl(token: string) {
  return `${siteUrl("/wait-list")}${buildReferralSharePath(token)}`;
}

export type ReferralCheck = {
  code: string;
  state: "idle" | "checking" | "valid" | "invalid";
  referrerName?: string;
};

export function fieldErrorsFromZod(error: z.ZodError): Record<string, string> {
  const next: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !next[key]) next[key] = issue.message;
  }
  return next;
}
