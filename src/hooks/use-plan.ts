import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export type PlanLimits = {
  tier: "free" | "lite" | "pro" | "vip";
  display_name: string;
  price_ngn: number;
  max_goods: number;
  max_services: number;
  can_shop: boolean;
  can_promote: boolean;
  can_ai_desc: boolean;
  can_vanity_slug: boolean;
  boost_credits: number;
  features: string[];
  used_goods: number;
  used_services: number;
  active_until: string | null;
};

export function usePlan() {
  const { user } = useAuth();
  return useQuery<PlanLimits | null>({
    queryKey: ["plan-limits", user?.id ?? "anon"],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_plan_limits");
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row as unknown as PlanLimits) ?? null;
    },
  });
}

export type PlanCapability =
  | "shop"
  | "promote"
  | "ai_desc"
  | "vanity_slug"
  | "goods_quota"
  | "services_quota";

export function hasCapability(plan: PlanLimits | null | undefined, cap: PlanCapability): boolean {
  if (!plan) return false;
  switch (cap) {
    case "shop": return plan.can_shop;
    case "promote": return plan.can_promote;
    case "ai_desc": return plan.can_ai_desc;
    case "vanity_slug": return plan.can_vanity_slug;
    case "goods_quota": return plan.used_goods < plan.max_goods;
    case "services_quota": return plan.used_services < plan.max_services;
  }
}