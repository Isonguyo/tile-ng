import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-B0U85Udx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as useAuth } from "./auth-context-ufRsuJHL.mjs";
import { t as Button } from "./button-DRsC1qZi.mjs";
import { _ as useNavigate, g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { N as MessageCircle, O as Phone, P as MapPin, at as ChevronLeft, it as ChevronRight, m as Star, p as Store, q as Heart } from "../_libs/lucide-react.mjs";
import { t as SiteHeader } from "./site-header-Cke-4LQf.mjs";
import { t as Card } from "./card-BLWafi8D.mjs";
import { t as Badge } from "./badge-Cc0IblCb.mjs";
import { r as formatNaira } from "./categories-j3aLXACs.mjs";
import { n as getSignedUrls } from "./storage-BCLwX12s.mjs";
import { t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Route } from "./listing._id-BO_8zagV.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/listing._id-YWhhH7Xl.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ListingDetail() {
	const { id } = Route.useParams();
	const { user } = useAuth();
	const [imgIdx, setImgIdx] = (0, import_react.useState)(0);
	const [imgUrls, setImgUrls] = (0, import_react.useState)([]);
	const [showPhone, setShowPhone] = (0, import_react.useState)(false);
	const [favored, setFavored] = (0, import_react.useState)(false);
	const { data: listing, isLoading } = useQuery({
		queryKey: [
			"listing",
			id,
			!!user
		],
		queryFn: async () => {
			const { data, error } = await supabase.from("listings").select(user ? "id,user_id,type,title,description,category,location,price,images,status,is_promoted,condition,brand,years_experience,service_mode,created_at,updated_at,phone" : "id,user_id,type,title,description,category,location,price,images,status,is_promoted,condition,brand,years_experience,service_mode,created_at,updated_at").eq("id", id).maybeSingle();
			if (error) throw error;
			if (!data) return null;
			const row = data;
			const { data: prof } = await supabase.from("public_profiles").select("full_name, avatar_url, is_verified, shop_slug, subscription_tier").eq("id", row.user_id).maybeSingle();
			return {
				...row,
				profile: prof
			};
		}
	});
	const { data: reviews = [] } = useQuery({
		queryKey: ["reviews", id],
		queryFn: async () => {
			const { data } = await supabase.from("reviews").select("*").eq("listing_id", id);
			return data ?? [];
		}
	});
	(0, import_react.useEffect)(() => {
		if (listing?.images?.length) getSignedUrls(listing.images).then(setImgUrls);
	}, [listing]);
	(0, import_react.useEffect)(() => {
		if (listing?.id) supabase.rpc("track_listing_view", { _id: listing.id });
	}, [listing?.id]);
	(0, import_react.useEffect)(() => {
		if (!user || !listing) return;
		supabase.from("favorites").select("user_id").eq("user_id", user.id).eq("listing_id", listing.id).maybeSingle().then(({ data }) => setFavored(!!data));
	}, [user, listing]);
	const toggleFav = async () => {
		if (!user || !listing) return toast.error("Sign in to save");
		if (favored) {
			await supabase.from("favorites").delete().eq("user_id", user.id).eq("listing_id", listing.id);
			setFavored(false);
		} else {
			await supabase.from("favorites").insert({
				user_id: user.id,
				listing_id: listing.id
			});
			setFavored(true);
		}
	};
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "container mx-auto py-12",
			children: "Loading…"
		})]
	});
	if (!listing) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "container mx-auto py-12",
			children: "Not found"
		})]
	});
	const avg = reviews.length ? {
		comm: reviews.reduce((s, r) => s + r.communication, 0) / reviews.length,
		time: reviews.reduce((s, r) => s + r.timeliness, 0) / reviews.length,
		qual: reviews.reduce((s, r) => s + r.work_quality, 0) / reviews.length
	} : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "container mx-auto px-4 py-6 grid lg:grid-cols-3 gap-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "lg:col-span-2 space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "overflow-hidden p-0 relative",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative aspect-video bg-muted",
							children: [imgUrls.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: imgUrls[imgIdx],
								alt: listing.title,
								className: "w-full h-full object-cover"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "w-full h-full grid place-items-center text-muted-foreground",
								children: "No images"
							}), imgUrls.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setImgIdx((i) => Math.max(0, i - 1)),
								className: "absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, {})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setImgIdx((i) => Math.min(imgUrls.length - 1, i + 1)),
								className: "absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {})
							})] })]
						}), imgUrls.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex gap-2 p-2 overflow-x-auto",
							children: imgUrls.map((u, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setImgIdx(i),
								className: `h-16 w-16 shrink-0 rounded border-2 ${i === imgIdx ? "border-accent" : "border-transparent"}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: u,
									alt: "",
									className: "w-full h-full object-cover rounded"
								})
							}, i))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										className: "bg-primary text-primary-foreground capitalize mb-2",
										children: listing.type
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
										className: "text-2xl font-bold",
										children: listing.title
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-sm text-muted-foreground flex items-center gap-1 mt-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-4 w-4" }), listing.location]
									})
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-3xl font-extrabold text-accent",
									children: formatNaira(listing.price)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-4 whitespace-pre-wrap text-foreground/90",
								children: listing.description
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid grid-cols-2 gap-3 mt-5 text-sm",
								children: listing.type === "goods" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spec, {
									label: "Brand",
									value: listing.brand
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spec, {
									label: "Condition",
									value: listing.condition?.replace("_", " ")
								})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spec, {
									label: "Experience",
									value: listing.years_experience ? `${listing.years_experience} yrs` : null
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spec, {
									label: "Mode",
									value: listing.service_mode
								})] })
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-lg font-semibold mb-3",
							children: "Milestone reviews"
						}), avg ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-3 gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Communication",
									value: avg.comm
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Timeliness",
									value: avg.time
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
									label: "Work quality",
									value: avg.qual
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-muted-foreground text-sm",
							children: "No reviews yet."
						})]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
				className: "lg:sticky lg:top-24 h-fit space-y-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "p-5 space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-12 w-12 rounded-full bg-primary text-primary-foreground grid place-items-center font-bold",
								children: (listing.profile?.full_name ?? "U")[0]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "font-semibold flex items-center gap-1",
								children: [listing.profile?.full_name ?? "Vendor", listing.profile?.is_verified && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									className: "bg-accent text-accent-foreground ml-1",
									children: "Verified"
								})]
							}) })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							onClick: () => {
								setShowPhone(true);
								if (listing.id) supabase.rpc("track_listing_click", { _id: listing.id });
							},
							className: "w-full bg-accent text-accent-foreground hover:bg-accent/90",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "h-4 w-4 mr-2" }), showPhone ? listing.phone : "Reveal phone number"]
						}),
						listing.profile?.shop_slug && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							variant: "outline",
							className: "w-full",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/shop/$slug",
								params: { slug: listing.profile.shop_slug },
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Store, { className: "h-4 w-4 mr-2" }), "Visit seller's shop"]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatWithVendorButton, {
							listingId: listing.id,
							sellerId: listing.user_id
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							onClick: toggleFav,
							className: "w-full",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: `h-4 w-4 mr-2 ${favored ? "fill-accent text-accent" : ""}` }), favored ? "Saved" : "Save"]
						})
					]
				})
			})]
		})]
	});
}
function Spec({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-muted-foreground text-xs uppercase",
		children: label
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "font-medium capitalize",
		children: value || "—"
	})] });
}
function Metric({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "text-center p-3 rounded-lg bg-muted",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted-foreground uppercase",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-2xl font-bold text-accent flex items-center justify-center gap-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "h-4 w-4 fill-current" }), value.toFixed(1)]
		})]
	});
}
function ChatWithVendorButton({ listingId, sellerId }) {
	const { user } = useAuth();
	const nav = useNavigate();
	const [busy, setBusy] = (0, import_react.useState)(false);
	const start = async () => {
		if (!user) {
			nav({ to: "/auth" });
			return;
		}
		if (user.id === sellerId) {
			toast.error("You cannot chat with yourself");
			return;
		}
		setBusy(true);
		const { data, error } = await supabase.rpc("ensure_chat", { _listing_id: listingId });
		setBusy(false);
		if (error || !data) return toast.error(error?.message ?? "Could not open chat");
		nav({
			to: "/messages/$chatId",
			params: { chatId: data }
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
		variant: "outline",
		className: "w-full",
		onClick: start,
		disabled: busy,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-4 w-4 mr-2" }), user ? busy ? "Opening…" : "Chat with vendor" : "Sign in to chat"]
	});
}
//#endregion
export { ListingDetail as component };
