import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as objectType, o as stringType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-KHDnuILI.js
var $$splitComponentImporter = () => import("./routes-BRJHogMj.mjs");
var searchSchema = objectType({
	q: stringType().optional(),
	loc: stringType().optional(),
	cat: stringType().optional()
});
var Route = createFileRoute("/")({
	head: () => ({
		meta: [
			{ title: "Tile — Buy, Sell & Hire Across Nigeria" },
			{
				name: "description",
				content: "Nigeria's trusted marketplace for buying, selling and hiring. Discover verified shops, products and professional services near you."
			},
			{
				property: "og:title",
				content: "Tile Marketplace"
			},
			{
				property: "og:description",
				content: "Find trusted products, services and verified merchants across Nigeria."
			},
			{
				property: "og:type",
				content: "website"
			}
		],
		links: [{
			rel: "icon",
			type: "image/png",
			href: "https://res.cloudinary.com/dbozz4sgv/image/upload/v1781367385/tile-logo_vv2c8v.jpg"
		}, {
			rel: "apple-touch-icon",
			href: "https://res.cloudinary.com/dbozz4sgv/image/upload/v1781367385/tile-logo_vv2c8v.jpg"
		}]
	}),
	validateSearch: searchSchema,
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
