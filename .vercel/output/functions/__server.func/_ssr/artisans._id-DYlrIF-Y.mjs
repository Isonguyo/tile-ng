import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./button-Bq5vK6RO.mjs";
import { t as Card } from "./card-CzXpCsbD.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { Ct as BadgeCheck, Dt as ArrowLeft, I as MessageCircle, R as MapPin, _ as Sparkles, g as Star, j as Phone, l as UserRound, r as X, vt as Briefcase, x as ShieldCheck } from "../_libs/lucide-react.mjs";
import { t as SiteHeader } from "./site-header-DuVnqON_.mjs";
import { t as Badge } from "./badge-D1Dupn2y.mjs";
import { n as DialogContent, t as Dialog } from "./dialog-B8mBdC_P.mjs";
import { t as Route } from "./artisans._id-Cg7cTMsU.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/artisans._id-DYlrIF-Y.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function sanitizePhone(v) {
	if (!v) return null;
	const digits = v.replace(/\D+/g, "");
	if (!digits) return null;
	if (digits.startsWith("234")) return digits;
	if (digits.startsWith("0")) return `234${digits.slice(1)}`;
	return digits;
}
function ArtisanDetailPage() {
	const artisan = Route.useLoaderData();
	const [preview, setPreview] = (0, import_react.useState)(null);
	const avatar = artisan.profile_photo || artisan.avatar_url;
	const gallery = (artisan.portfolio_images ?? []).filter(Boolean);
	const waPhone = sanitizePhone(artisan.whatsapp || artisan.phone);
	const telPhone = artisan.phone?.replace(/\s+/g, "") || null;
	const tier = (artisan.subscription_tier ?? "free").toString().toLowerCase();
	const isPremium = tier === "pro" || tier === "vip";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "container mx-auto max-w-6xl px-4 py-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						variant: "ghost",
						size: "sm",
						className: "mb-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/artisans",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "mr-2 h-4 w-4" }), " Back to artisans"]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "overflow-hidden border-border/70",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative h-40 bg-gradient-to-br from-primary/20 via-primary/10 to-emerald-500/10 sm:h-56",
							children: [gallery[0] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: gallery[0],
								alt: "",
								className: "h-full w-full object-cover opacity-60"
							}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "-mt-14 px-6 pb-6 sm:-mt-16 sm:px-8",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-end gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "h-28 w-28 overflow-hidden rounded-2xl border-4 border-background bg-muted shadow-xl sm:h-32 sm:w-32",
										children: avatar ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: avatar,
											alt: artisan.full_name ?? "Artisan",
											className: "h-full w-full object-cover"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "grid h-full w-full place-items-center text-muted-foreground",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, { className: "h-10 w-10" })
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "pb-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-wrap items-center gap-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
														className: "text-2xl font-bold sm:text-3xl",
														children: artisan.full_name || "Anonymous Artisan"
													}),
													artisan.is_verified && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
														className: "gap-1 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, { className: "h-3.5 w-3.5" }), " Verified"]
													}),
													isPremium && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
														className: "gap-1 bg-amber-500/15 text-amber-700 hover:bg-amber-500/20",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-3.5 w-3.5" }),
															" ",
															tier.toUpperCase()
														]
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-1 text-primary font-medium",
												children: artisan.profession || "Specialist"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "mt-1 flex items-center gap-1 text-sm text-muted-foreground",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-3.5 w-3.5" }),
													artisan.state || "Nigeria",
													artisan.lga ? ` • ${artisan.lga}` : ""
												]
											})
										]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap gap-2",
									children: [telPhone && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										asChild: true,
										className: "bg-emerald-600 hover:bg-emerald-700",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
											href: `tel:${telPhone}`,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "mr-2 h-4 w-4" }), " Call now"]
										})
									}), waPhone && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										asChild: true,
										variant: "outline",
										className: "border-emerald-600/40 text-emerald-700 hover:bg-emerald-50",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
											href: `https://wa.me/${waPhone}`,
											target: "_blank",
											rel: "noreferrer",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "mr-2 h-4 w-4" }), " WhatsApp"]
										})
									})]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
										icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Briefcase, { className: "h-4 w-4" }),
										label: "Experience",
										value: `${artisan.years_experience ?? 0} yrs`
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
										icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "h-4 w-4 fill-amber-500 text-amber-500" }),
										label: "Rating",
										value: (artisan.avg_rating ?? 0).toFixed(1)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
										icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "h-4 w-4" }),
										label: "Jobs done",
										value: String(artisan.total_sales ?? 0)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
										icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-4 w-4" }),
										label: "Starting price",
										value: artisan.starting_price ? `₦${Number(artisan.starting_price).toLocaleString()}` : "On request"
									})
								]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							className: "p-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-xl font-semibold",
									children: "Portfolio"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-sm text-muted-foreground",
									children: [
										gallery.length,
										" ",
										gallery.length === 1 ? "image" : "images"
									]
								})]
							}), gallery.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-6 rounded-xl border border-dashed p-10 text-center text-muted-foreground",
								children: "No portfolio images yet."
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3",
								children: gallery.map((src, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setPreview(src),
									className: "group relative aspect-square overflow-hidden rounded-xl border bg-muted focus:outline-none focus:ring-2 focus:ring-primary",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src,
										alt: `Portfolio ${i + 1}`,
										className: "h-full w-full object-cover transition-transform group-hover:scale-105"
									})
								}, `${src}-${i}`))
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
								className: "p-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-lg font-semibold",
									children: "About"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-line",
									children: artisan.bio?.trim() || "This artisan hasn’t written a bio yet."
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
								className: "p-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-lg font-semibold",
									children: "Contact"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 space-y-2 text-sm",
									children: [telPhone ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
										href: `tel:${telPhone}`,
										className: "flex items-center gap-2 text-foreground hover:text-primary",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "h-4 w-4" }),
											" ",
											telPhone
										]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-muted-foreground",
										children: "No phone number provided."
									}), waPhone && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
										href: `https://wa.me/${waPhone}`,
										target: "_blank",
										rel: "noreferrer",
										className: "flex items-center gap-2 text-emerald-700 hover:underline",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-4 w-4" }), " Chat on WhatsApp"]
									})]
								})]
							})]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: !!preview,
				onOpenChange: (o) => !o && setPreview(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-w-4xl border-0 bg-black/95 p-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setPreview(null),
						className: "absolute right-3 top-3 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20",
						"aria-label": "Close preview",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
					}), preview && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: preview,
						alt: "Portfolio preview",
						className: "h-auto max-h-[85vh] w-full object-contain"
					})]
				})
			})
		]
	});
}
function Stat({ icon, label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border bg-background/60 p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 text-xs text-muted-foreground",
			children: [icon, label]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-lg font-semibold",
			children: value
		})]
	});
}
//#endregion
export { ArtisanDetailPage as component };
