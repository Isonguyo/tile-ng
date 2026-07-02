import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { P as MapPin, U as Image, X as Eye, ht as BadgeCheck, j as MousePointerClick, m as Star } from "../_libs/lucide-react.mjs";
import { t as Card } from "./card-BLWafi8D.mjs";
import { t as Badge } from "./badge-Cc0IblCb.mjs";
import { r as formatNaira } from "./categories-j3aLXACs.mjs";
import { t as getSignedUrl } from "./storage-BCLwX12s.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/listing-card-BaKCvctb.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ListingCard({ l }) {
	const [url, setUrl] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (l.images[0]) getSignedUrl(l.images[0]).then(setUrl);
	}, [l.images]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: "/listing/$id",
		params: { id: l.id },
		className: "block group",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			className: "overflow-hidden border-border hover:shadow-lg transition-all hover:-translate-y-0.5 p-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative aspect-[4/3] bg-muted",
				children: [
					url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: url,
						alt: l.title,
						className: "w-full h-full object-cover",
						loading: "lazy"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "w-full h-full grid place-items-center text-muted-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { className: "h-10 w-10" })
					}),
					l.is_promoted && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
						className: "absolute top-2 left-2 bg-accent text-accent-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "h-3 w-3 mr-1" }), "Promoted"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						className: "absolute top-2 right-2 bg-primary text-primary-foreground capitalize",
						children: l.type
					}),
					l.seller_tier && l.seller_tier !== "free" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
						className: "absolute bottom-2 left-2 bg-emerald-600 text-white gap-1 capitalize",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, { className: "h-3 w-3" }),
							"Verified ",
							l.seller_tier === "lite" ? "Vendor" : l.seller_tier
						]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-3 space-y-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-medium line-clamp-2 text-sm group-hover:text-accent",
						children: l.title
					}),
					l.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground line-clamp-2",
						children: l.description
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-accent font-bold text-lg",
						children: formatNaira(l.price)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between text-xs text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-3 w-3" }), l.location]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-0.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-3 w-3" }), l.views_count ?? 0]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-0.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MousePointerClick, { className: "h-3 w-3" }), l.clicks_count ?? 0]
							})]
						})]
					})
				]
			})]
		})
	});
}
//#endregion
export { ListingCard as t };
