import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-B0U85Udx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./button-Bq5vK6RO.mjs";
import { t as Card } from "./card-CzXpCsbD.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { Ct as BadgeCheck, E as Search, R as MapPin, _ as Sparkles, g as Star, l as UserRound, vt as Briefcase, x as ShieldCheck } from "../_libs/lucide-react.mjs";
import { t as SiteHeader } from "./site-header-DuVnqON_.mjs";
import { t as Badge } from "./badge-D1Dupn2y.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { t as useQuery } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/artisans-CZ2ZI7W3.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ArtisanDirectoryPage() {
	const [qProfession, setQProfession] = (0, import_react.useState)("");
	const [qState, setQState] = (0, import_react.useState)("");
	const [qLga, setQLga] = (0, import_react.useState)("");
	const { data: artisans = [], isLoading, isError } = useQuery({
		queryKey: ["public-artisans"],
		queryFn: async () => {
			const { data, error } = await supabase.from("profiles").select("*").eq("is_artisan", true).order("full_name");
			if (error) throw error;
			return data ?? [];
		}
	});
	const filtered = (0, import_react.useMemo)(() => {
		const p = qProfession.trim().toLowerCase();
		const s = qState.trim().toLowerCase();
		const l = qLga.trim().toLowerCase();
		return artisans.filter((a) => {
			if (p && !(a.profession ?? "").toLowerCase().includes(p)) return false;
			if (s && !(a.state ?? "").toLowerCase().includes(s)) return false;
			if (l && !(a.lga ?? "").toLowerCase().includes(l)) return false;
			return true;
		});
	}, [
		artisans,
		qProfession,
		qState,
		qLga
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "border-b bg-muted/30",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "container mx-auto max-w-7xl px-4 py-16",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-w-3xl",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-4xl md:text-5xl font-bold tracking-tight",
							children: "Find Trusted Artisans Near You"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-5 text-lg text-muted-foreground",
							children: "Discover experienced artisans across Nigeria. Browse professional profiles, view previous projects and contact artisans directly."
						})]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "container mx-auto max-w-7xl px-4 py-12",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 md:grid-cols-3 gap-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							className: "p-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "h-8 w-8 text-primary mb-4" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-semibold",
									children: "Verified Pros"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted-foreground mt-2",
									children: "Every professional profile highlights real experience and verified records."
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							className: "p-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "h-8 w-8 text-primary mb-4" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-semibold",
									children: "Easy Search"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted-foreground mt-2",
									children: "Search by profession, state and local government areas instantly."
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							className: "p-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-8 w-8 text-primary mb-4" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-semibold",
									children: "Near You"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted-foreground mt-2",
									children: "Find trusted professionals close to your building or construction location."
								})
							]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "container mx-auto max-w-7xl px-4 pb-20",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-2xl font-bold text-foreground",
							children: "Available Tile Professionals"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted-foreground",
							children: [
								filtered.length,
								" of ",
								artisans.length,
								" artisans"
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "mb-6 grid gap-3 border-border/70 p-4 sm:grid-cols-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Briefcase, { className: "pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: qProfession,
									onChange: (e) => setQProfession(e.target.value),
									placeholder: "Profession (e.g. Tiler)",
									className: "pl-9"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: qState,
									onChange: (e) => setQState(e.target.value),
									placeholder: "State",
									className: "pl-9"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: qLga,
									onChange: (e) => setQLga(e.target.value),
									placeholder: "LGA",
									className: "pl-9"
								})]
							})
						]
					}),
					isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-center py-12 text-muted-foreground",
						children: "Loading artisans..."
					}) : isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-xl border border-dashed p-12 text-center text-muted-foreground",
						children: "Couldn’t load artisans. Please retry."
					}) : filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl border border-dashed p-16 text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "mx-auto h-14 w-14 text-muted-foreground" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mt-6 text-2xl font-semibold",
								children: "No Artisans Found"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-muted-foreground max-w-md mx-auto",
								children: "Try clearing your filters or expanding your search area."
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
						children: filtered.map((artisan) => {
							const tier = (artisan.subscription_tier ?? "free").toString().toLowerCase();
							const isPremium = tier === "pro" || tier === "vip";
							const isTopRated = (artisan.years_experience ?? 0) >= 5 || (artisan.avg_rating ?? 0) >= 4.5;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
								className: "overflow-hidden border shadow-sm hover:shadow-lg transition-all flex flex-col justify-between " + (isPremium ? "border-amber-400/50 ring-1 ring-amber-400/30" : isTopRated ? "border-primary/40" : ""),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-6",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-start gap-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "h-16 w-16 rounded-full overflow-hidden bg-muted flex-shrink-0 border",
												children: artisan.profile_photo || artisan.avatar_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
													src: artisan.profile_photo || artisan.avatar_url || void 0,
													alt: artisan.full_name || "Artisan",
													className: "h-full w-full object-cover"
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "h-full w-full flex items-center justify-center bg-muted",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, { className: "h-6 w-6 text-muted-foreground" })
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-1",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
															className: "font-bold text-lg text-foreground line-clamp-1",
															children: artisan.full_name || "Anonymous Artisan"
														}), artisan.is_verified ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, { className: "h-4 w-4 text-emerald-600" }) : null]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-sm font-medium text-primary",
														children: artisan.profession || "Specialist Installer"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-1 text-xs text-muted-foreground pt-1",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-3.5 w-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [artisan.state || "Nigeria", artisan.lga ? ` • ${artisan.lga}` : ""] })]
													})
												]
											})]
										}),
										(isPremium || isTopRated) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-3 flex flex-wrap gap-2",
											children: [isPremium && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
												className: "gap-1 bg-amber-500/15 text-amber-700 hover:bg-amber-500/20",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-3 w-3" }),
													" ",
													tier.toUpperCase()
												]
											}), isTopRated && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
												variant: "secondary",
												className: "gap-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "h-3 w-3" }), " Top rated"]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-sm text-muted-foreground mt-4 line-clamp-3 italic",
											children: [
												"\"",
												artisan.bio || "No biography provided yet.",
												"\""
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-wrap gap-2 mt-4 text-xs font-medium text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "flex items-center gap-1 bg-muted px-2 py-1 rounded-md",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Briefcase, { className: "h-3.5 w-3.5" }),
													" ",
													artisan.years_experience || 0,
													" Yrs Exp"
												]
											}), artisan.starting_price && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "bg-primary/10 text-primary px-2 py-1 rounded-md font-semibold",
												children: ["Starting: ₦", Number(artisan.starting_price).toLocaleString()]
											})]
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-4 bg-muted/40 border-t flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex items-center gap-0.5",
										children: [...Array(5)].map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "h-3.5 w-3.5 text-amber-500 fill-amber-500" }, i))
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										asChild: true,
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
											to: "/artisans/$id",
											params: { id: artisan.id },
											children: "View Profile"
										})
									})]
								})]
							}, artisan.id);
						})
					})
				]
			})
		]
	});
}
//#endregion
export { ArtisanDirectoryPage as component };
