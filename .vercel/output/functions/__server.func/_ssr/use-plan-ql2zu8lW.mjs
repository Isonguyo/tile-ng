import { t as supabase } from "./client-B0U85Udx.mjs";
import { n as useAuth } from "./auth-context-ufRsuJHL.mjs";
import { t as useQuery } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/use-plan-ql2zu8lW.js
function usePlan() {
	const { user } = useAuth();
	return useQuery({
		queryKey: ["plan-limits", user?.id ?? "anon"],
		enabled: !!user,
		staleTime: 3e4,
		queryFn: async () => {
			const { data, error } = await supabase.rpc("get_plan_limits");
			if (error) throw error;
			return (Array.isArray(data) ? data[0] : data) ?? null;
		}
	});
}
function hasCapability(plan, cap) {
	if (!plan) return false;
	switch (cap) {
		case "shop": return plan.can_shop;
		case "promote": return plan.can_promote;
		case "ai_desc": return plan.can_ai_desc;
		case "vanity_slug": return plan.can_vanity_slug;
		case "goods_quota": return plan.used_goods < plan.max_goods;
		case "services_quota": return plan.used_services < plan.max_services;
		case "premium_inbox": return plan.tier === "pro" || plan.tier === "vip";
	}
}
//#endregion
export { usePlan as n, hasCapability as t };
