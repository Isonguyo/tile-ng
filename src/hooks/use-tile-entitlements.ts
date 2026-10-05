import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { rpcUntyped } from "@/lib/waitlist-rpc";

export type TileEntitlements = {
  tier?: string | null;
  tier_rank?: number | null;
  active_until?: string | null;
  max_active_listings?: number | null;
  active_listings?: number | null;
  can_create_listing?: boolean | null;
  unlimited_listings?: boolean | null;
  unlimited_promotions?: boolean | null;
  multiple_staff_accounts?: boolean | null;
  advanced_analytics?: boolean | null;
  google_business_integration?: boolean | null;
  automated_social_posting?: boolean | null;
  ai_sales_assistant?: boolean | null;
  staff_context?: unknown;
  top_ads?: unknown;
  custom_shop_url?: boolean | null;
  qr_code?: boolean | null;
  verified_vendor_badge?: boolean | null;
  verification_required_for_badge?: boolean | null;
  priority_support?: boolean | null;
  featured_vendor_eligible?: boolean | null;
  homepage_priority?: boolean | null;
  analytics_level?: string | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return asRecord(value[0]);
  if (value && typeof value === "object") return value as Record<string, unknown>;
  return null;
}

export function useTileEntitlements() {
  const { user } = useAuth();

  return useQuery<TileEntitlements | null>({
    queryKey: ["tile-entitlements", user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await rpcUntyped("get_user_entitlements");
      if (error) throw error;
      const row = asRecord(data);
      if (!row) return null;
      const nested = asRecord(row.entitlements) ?? row;
      return nested as TileEntitlements;
    },
  });
}

export function isTopAdsEntitled(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    return ["true", "enabled", "available", "per_7_days", "unlimited"].includes(
      value.toLowerCase(),
    );
  }
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    row.mode === "unlimited" ||
    row.enabled === true ||
    row.allowed === true ||
    (typeof row.limit === "number" && row.limit > 0)
  );
}

export function hasUnlimitedListings(value: TileEntitlements | null | undefined): boolean {
  if (!value) return false;
  return (
    value.unlimited_listings === true ||
    (Object.prototype.hasOwnProperty.call(value, "max_active_listings") &&
      value.max_active_listings === null)
  );
}

export function hasVipEntitlement(value: TileEntitlements | null | undefined): boolean {
  if (!value) return false;
  if (
    value.unlimited_listings === true ||
    value.unlimited_promotions === true ||
    value.multiple_staff_accounts === true ||
    value.advanced_analytics === true ||
    value.google_business_integration === true ||
    value.automated_social_posting === true ||
    value.ai_sales_assistant === true
  )
    return true;
  if (typeof value.tier_rank === "number") return value.tier_rank >= 3;
  return value.tier?.trim().toLowerCase() === "vip";
}

export function hasVendorAnalytics(value: string | null | undefined): boolean {
  return (
    typeof value === "string" &&
    value.trim() !== "" &&
    !["none", "disabled", "unavailable"].includes(value.trim().toLowerCase())
  );
}

/** Tier rank is supplied by the entitlement RPC and reflects the effective
 * plan, including subscription expiry. The tier name is a compatibility
 * fallback for older RPC payloads. */
export function hasProOrVipEntitlement(value: TileEntitlements | null | undefined): boolean {
  if (!value) return false;
  if (typeof value.tier_rank === "number") return value.tier_rank >= 2;
  const tier = value.tier?.trim().toLowerCase();
  return tier === "pro" || tier === "vip";
}

export function hasAdvancedVendorAnalytics(value: string | null | undefined): boolean {
  if (!hasVendorAnalytics(value)) return false;
  const level = value!.trim().toLowerCase();
  return !["basic", "lite", "summary"].includes(level);
}
