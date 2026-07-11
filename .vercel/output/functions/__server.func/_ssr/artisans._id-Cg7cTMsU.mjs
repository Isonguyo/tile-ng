import { t as supabase } from "./client-B0U85Udx.mjs";
import { N as notFound, m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/artisans._id-Cg7cTMsU.js
var $$splitComponentImporter = () => import("./artisans._id-DYlrIF-Y.mjs");
var $$splitErrorComponentImporter = () => import("./artisans._id-7MKgc74-.mjs");
var $$splitNotFoundComponentImporter = () => import("./artisans._id-DLb55GCg.mjs");
var Route = createFileRoute("/artisans/$id")({
	head: ({ loaderData }) => {
		const name = loaderData?.full_name;
		return { meta: [{ title: name ? `${name} — Artisan on Tile` : "Artisan Profile — Tile" }] };
	},
	loader: async ({ params }) => {
		const { data, error } = await supabase.from("profiles").select("id, full_name, avatar_url, profile_photo, bio, profession, state, lga, years_experience, starting_price, portfolio_images, phone, whatsapp, is_verified, is_artisan, subscription_tier, avg_rating, total_sales").eq("id", params.id).maybeSingle();
		if (error) throw error;
		if (!data || !data.is_artisan) throw notFound();
		return data;
	},
	notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter, "notFoundComponent"),
	errorComponent: lazyRouteComponent($$splitErrorComponentImporter, "errorComponent"),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
