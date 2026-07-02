import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-B0U85Udx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as useAuth } from "./auth-context-ufRsuJHL.mjs";
import { t as Button } from "./button-DRsC1qZi.mjs";
import { _ as useNavigate, g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { G as ImagePlus, P as MapPin, _t as ArrowUp, at as ChevronLeft, bt as ArrowDown, h as Sparkles, ht as BadgeCheck, it as ChevronRight, r as X, st as Check, y as ShieldCheck } from "../_libs/lucide-react.mjs";
import { t as SiteHeader } from "./site-header-Cke-4LQf.mjs";
import { t as Card } from "./card-BLWafi8D.mjs";
import { t as Textarea } from "./textarea-DBn9CRiI.mjs";
import { t as CATEGORIES } from "./categories-j3aLXACs.mjs";
import { i as uploadListingImages } from "./storage-BCLwX12s.mjs";
import { t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Input } from "./input-DicJzR9-.mjs";
import { t as Label } from "./label-B4PTMSG2.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-DUy71i1r.mjs";
import { a as objectType, n as coerce, o as stringType, r as enumType } from "../_libs/zod.mjs";
import { r as useForm, t as u } from "../_libs/@hookform/resolvers+[...].mjs";
import { n as usePlan, t as hasCapability } from "./use-plan-ql2zu8lW.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/post-ad-DK0-2KH_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var schema = objectType({
	category: stringType().min(1, "Choose a category"),
	title: stringType().min(5, "Title is too short").max(120),
	description: stringType().min(20, "Tell buyers more").max(2e3),
	state_id: stringType().min(1, "Please select a state"),
	lga_id: stringType().min(1, "Please select an LGA"),
	phone: stringType().min(7),
	price: coerce.number().positive().optional(),
	condition: enumType([
		"new",
		"used_like_new",
		"used_good",
		"used_fair"
	]).optional(),
	brand: stringType().optional()
});
var DRAFT_KEY = "tile-post-ad-draft";
var CATEGORY_META = {
	phones: {
		icon: "📱",
		subtitle: "Electronics, mobile and accessories"
	},
	fashion: {
		icon: "👗",
		subtitle: "Style, wearables and beauty"
	},
	cars: {
		icon: "🚗",
		subtitle: "Vehicles and auto gear"
	},
	property: {
		icon: "🏠",
		subtitle: "Homes, apartments and rentals"
	},
	furniture: {
		icon: "🪑",
		subtitle: "Interior pieces and décor"
	},
	electronics: {
		icon: "💻",
		subtitle: "Laptops, consoles and gadgets"
	}
};
function PostAd() {
	const { user, loading, profile } = useAuth();
	const nav = useNavigate();
	const [mode, setMode] = (0, import_react.useState)("home");
	const [step, setStep] = (0, import_react.useState)(1);
	const [files, setFiles] = (0, import_react.useState)([]);
	const [coverIndex, setCoverIndex] = (0, import_react.useState)(null);
	const [submitting, setSubmitting] = (0, import_react.useState)(false);
	const [submittingStage, setSubmittingStage] = (0, import_react.useState)("Preparing your listing");
	const [submitted, setSubmitted] = (0, import_react.useState)(false);
	const [submittedListingId, setSubmittedListingId] = (0, import_react.useState)(null);
	const [draftStatus, setDraftStatus] = (0, import_react.useState)("Draft ready");
	const [promotionState, setPromotionState] = (0, import_react.useState)("idle");
	const [promoting, setPromoting] = (0, import_react.useState)(false);
	const [promotionStats, setPromotionStats] = (0, import_react.useState)(null);
	const [detectingLocation, setDetectingLocation] = (0, import_react.useState)(false);
	const [detectedLocation, setDetectedLocation] = (0, import_react.useState)(null);
	const [dragActive, setDragActive] = (0, import_react.useState)(false);
	const form = useForm({
		resolver: u(schema),
		defaultValues: {
			category: "",
			title: "",
			description: "",
			state_id: "",
			lga_id: "",
			phone: profile?.phone ?? "",
			price: void 0,
			condition: void 0,
			brand: ""
		}
	});
	const watch = form.watch();
	const { data: states = [] } = useQuery({
		queryKey: ["post-states"],
		queryFn: async () => {
			const { data, error } = await supabase.from("states").select("id, name").order("name", { ascending: true });
			if (error) throw error;
			return data || [];
		}
	});
	const { data: lgas = [] } = useQuery({
		queryKey: ["post-lgas", watch.state_id],
		queryFn: async () => {
			if (!watch.state_id) return [];
			const { data, error } = await supabase.from("lgas").select("id, name").eq("state_id", watch.state_id).order("name", { ascending: true });
			if (error) throw error;
			return data || [];
		},
		enabled: !!watch.state_id
	});
	const { data: plan } = usePlan();
	const tier = (plan?.tier ?? profile?.subscription_tier ?? "free").toLowerCase();
	const canOpenShop = hasCapability(plan, "shop") || tier !== "free";
	const canPromote = hasCapability(plan, "promote");
	const planLabel = tier === "free" ? "Free" : tier.charAt(0).toUpperCase() + tier.slice(1);
	const qualityScore = (0, import_react.useMemo)(() => {
		let score = 20;
		if (watch.title && watch.title.length >= 8) score += 20;
		if (watch.description && watch.description.length >= 80) score += 20;
		if (watch.price) score += 15;
		if (watch.brand) score += 10;
		if (watch.condition) score += 10;
		if (files.length >= 2) score += 10;
		if (files.length >= 4) score += 10;
		return Math.min(score, 100);
	}, [
		files.length,
		watch.brand,
		watch.condition,
		watch.description,
		watch.price,
		watch.title
	]);
	(0, import_react.useEffect)(() => {
		if (!user) return;
		const raw = window.localStorage.getItem(DRAFT_KEY);
		if (!raw) return;
		try {
			const parsed = JSON.parse(raw);
			form.reset({
				category: parsed.category ?? "",
				title: parsed.title ?? "",
				description: parsed.description ?? "",
				state_id: parsed.state_id ?? "",
				lga_id: parsed.lga_id ?? "",
				phone: parsed.phone ?? profile?.phone ?? "",
				price: parsed.price ?? void 0,
				condition: parsed.condition ?? void 0,
				brand: parsed.brand ?? ""
			});
			if (parsed.filesCount) setDraftStatus("Draft restored");
		} catch {}
	}, [
		form,
		profile?.phone,
		user
	]);
	(0, import_react.useEffect)(() => {
		if (!user) return;
		const values = form.getValues();
		const payload = {
			category: values.category,
			title: values.title,
			description: values.description,
			state_id: values.state_id,
			lga_id: values.lga_id,
			phone: values.phone,
			price: values.price,
			condition: values.condition,
			brand: values.brand
		};
		const timer = window.setTimeout(() => {
			window.localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
			setDraftStatus("Draft saved");
		}, 1800);
		return () => window.clearTimeout(timer);
	}, [
		form,
		user,
		watch.category,
		watch.title,
		watch.description,
		watch.state_id,
		watch.lga_id,
		watch.phone,
		watch.price,
		watch.condition,
		watch.brand
	]);
	const nextStep = () => {
		if (step < 4) setStep((s) => s + 1);
	};
	const prevStep = () => {
		if (step > 1) setStep((s) => s - 1);
	};
	const addFiles = (incoming) => {
		const filtered = Array.from(incoming).filter((file) => file.type.startsWith("image/"));
		if (!filtered.length) return;
		setFiles((prev) => [...prev, ...filtered].slice(0, 8));
		if (coverIndex === null) setCoverIndex(0);
	};
	const moveFile = (from, direction) => {
		setFiles((prev) => {
			const next = [...prev];
			const target = from + direction;
			if (target < 0 || target >= next.length) return prev;
			const [item] = next.splice(from, 1);
			next.splice(target, 0, item);
			return next;
		});
	};
	const handleDetectLocation = async () => {
		if (!navigator.geolocation) {
			toast.error("Geolocation is not available in this browser.");
			return;
		}
		setDetectingLocation(true);
		navigator.geolocation.getCurrentPosition(async (pos) => {
			try {
				const address = (await (await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`)).json())?.address ?? {};
				const place = [
					address.city,
					address.town,
					address.village,
					address.state,
					address.country
				].filter(Boolean).join(", ");
				setDetectedLocation(place || "Location detected");
				const normalized = (value) => value.toLowerCase().replace(/state|city|town|province|lga/g, "").trim();
				const matchedState = states.find((s) => normalized(s.name).includes(normalized(place)) || normalized(place).includes(normalized(s.name)));
				if (matchedState) {
					form.setValue("state_id", matchedState.id, { shouldValidate: true });
					form.setValue("lga_id", "", { shouldValidate: true });
				}
				toast.success(`Detected ${place || "your location"}`);
			} catch {
				toast.error("Could not reverse-geocode your location right now.");
			} finally {
				setDetectingLocation(false);
			}
		}, () => {
			setDetectingLocation(false);
			toast.error("Location access was denied.");
		});
	};
	const applyAiDescription = () => {
		const title = watch.title?.trim();
		if (!title) {
			toast.error("Add a title first so Tile can draft your listing.");
			return;
		}
		const generated = `${title.replace(/\s+/g, " ")} in excellent condition, carefully maintained, and ready for a new owner. This is a great option for buyers who want a reliable, well-kept item with clear value for money. Include key details, condition, and any included accessories in the final listing.`;
		form.setValue("description", generated, { shouldValidate: true });
		toast.success("AI description drafted");
	};
	const loadListingStats = async (listingId) => {
		const { data } = await supabase.rpc("owner_listing_stats", { _id: listingId });
		const row = (data ?? [])[0];
		if (row) setPromotionStats({
			views_count: row.views_count,
			clicks_count: row.clicks_count,
			favorites_count: Number(row.favorites_count)
		});
	};
	const handlePromoteListing = async () => {
		if (!user || !submittedListingId) return;
		setPromoting(true);
		try {
			const { data, error } = await supabase.rpc("promote_listing", {
				p_listing_id: submittedListingId,
				p_user_id: user.id
			});
			if (error) throw error;
			if (!data) throw new Error("Promotion was not accepted.");
			setPromotionState("promoted");
			await loadListingStats(submittedListingId);
			toast.success("Listing promoted successfully");
		} catch (e) {
			console.error("PROMOTE LISTING ERROR:", e);
			if (e && typeof e === "object" && "message" in e) toast.error(String(e.message));
			else toast.error("Unable to promote this listing right now.");
		} finally {
			setPromoting(false);
		}
	};
	const onSubmit = async (vals) => {
		if (!user) return;
		setSubmitting(true);
		setSubmittingStage("Checking plan limits");
		try {
			const { data: ok, error: qErr } = await supabase.rpc("check_post_quota", { _type: "goods" });
			if (qErr) throw qErr;
			if (!ok) {
				toast.error("Your current plan has reached the listing limit.");
				setSubmitting(false);
				return;
			}
			setSubmittingStage("Uploading photos");
			let imagePaths = [];
			if (files.length) imagePaths = await uploadListingImages(user.id, files);
			const selectedState = states.find((s) => s.id === vals.state_id);
			const location = [lgas.find((l) => l.id === vals.lga_id)?.name, selectedState?.name].filter(Boolean).join(", ");
			setSubmittingStage("Submitting for review");
			const { data, error } = await supabase.from("listings").insert({
				user_id: user.id,
				type: "goods",
				category: vals.category,
				title: vals.title,
				description: vals.description,
				location,
				phone: vals.phone,
				price: vals.price ?? null,
				condition: vals.condition ?? null,
				brand: vals.brand ?? null,
				images: imagePaths,
				status: "pending"
			}).select().single();
			if (error) throw error;
			window.localStorage.removeItem(DRAFT_KEY);
			setSubmittedListingId(data.id);
			setPromotionState("idle");
			setPromotionStats(null);
			setSubmitted(true);
			toast.success("Listing submitted for review");
		} catch (e) {
			console.error("POST AD ERROR:", e);
			if (e && typeof e === "object" && "message" in e) toast.error(String(e.message));
			else toast.error("Failed to post ad.");
		} finally {
			setSubmitting(false);
			setSubmittingStage("Preparing your listing");
		}
	};
	const onInvalid = (errors) => {
		const first = Object.keys(errors)[0];
		if (first) toast.error(`Please complete: ${first}`);
	};
	if (!loading && !user) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "container mx-auto py-20 text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-bold",
				children: "Sign in to post an ad"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				className: "mt-4 bg-accent text-accent-foreground",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/auth",
					children: "Sign in"
				})
			})]
		})]
	});
	const planSummary = [
		tier === "free" ? "3 listings" : "Unlimited listings",
		tier === "free" ? "No promotions" : tier === "lite" ? "1 promotion weekly" : "Multiple promotions",
		canOpenShop ? "Shop enabled" : "Shop locked",
		tier === "free" ? "Basic chat" : "Premium messaging"
	];
	const priceHint = watch.price ? Number(watch.price) > 0 ? `${new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency: "NGN",
		maximumFractionDigits: 0
	}).format(Number(watch.price) * .95)} average price` : "" : "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "container mx-auto px-4 py-8 max-w-6xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-3xl font-bold",
					children: "Post on Tile"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-muted-foreground mt-2",
					children: mode === "home" ? "Pick the right path for your business and publish with confidence." : "A plan-aware posting flow built for trust, conversion and premium growth."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-2xl border bg-card p-4 min-w-[260px] shadow-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-semibold",
								children: "Your plan"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, { className: "h-4 w-4 text-accent" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xl font-bold mt-1",
							children: planLabel
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground mt-1",
							children: canOpenShop ? "Shop enabled" : "Shop requires Lite or higher"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3 space-y-1 text-sm text-muted-foreground",
							children: planSummary.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["• ", item] }, item))
						})
					]
				})]
			}), mode === "home" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-6 lg:grid-cols-[1.2fr_0.8fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "p-6 space-y-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-2xl font-bold",
						children: "What do you want to do today?"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground mt-2",
						children: "Choose the path that fits your business and plan."
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "outline",
								className: "justify-start h-auto p-5 border-2 hover:border-accent/40 whitespace-normal",
								onClick: () => {
									setMode("sell");
									setStep(1);
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-left",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-bold text-lg",
										children: "🛒 Sell Something"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground mt-1",
										children: "Quick listings, photos and built-in buyer messaging."
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "outline",
								className: "justify-start h-auto p-5 border-2 hover:border-accent/40 whitespace-normal",
								onClick: () => nav({ to: "/artisan/create" }),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-left",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-bold text-lg",
										children: "🛠 Offer a Service"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground mt-1",
										children: "Create an artisan profile with portfolios and bookings."
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "button",
								variant: "outline",
								className: "justify-start h-auto p-5 border-2 hover:border-accent/40 whitespace-normal",
								onClick: () => canOpenShop ? nav({ to: "/open-shop" }) : toast.info("Opening a shop requires Lite, Pro or VIP."),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-left",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "font-bold text-lg",
											children: "🏪 Open Your Own Shop"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm text-muted-foreground mt-1",
											children: "Create a branded storefront, share a custom URL and unlock analytics."
										}),
										!canOpenShop && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm text-accent mt-2",
											children: "Requires Lite Plan"
										})
									]
								})
							})
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "p-6 space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 text-accent font-semibold",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "h-5 w-5" }), " Trust score"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl bg-muted/30 p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-3xl font-bold",
								children: [profile?.is_verified ? "96" : "84", "%"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-muted-foreground mt-1",
								children: ["Phone verified • Email verified • ", profile?.kyc_status === "verified" ? "KYC verified" : "KYC pending"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2 text-sm text-muted-foreground",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "• Better trust means better conversion." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "• Premium plans unlock promotions and analytics." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "• Buyers feel safer when listings are polished and verified." })
							]
						})
					]
				})]
			}) : submitted ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "p-8 text-center space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-7 w-7" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-2xl font-bold",
						children: "Congratulations — your listing is live for review."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-muted-foreground",
						children: "Your listing is now pending review and will be visible once approved. Share it while you wait."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							variant: "outline",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/dashboard",
								children: "View dashboard"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "bg-accent text-accent-foreground",
							onClick: () => setMode("home"),
							children: "Create another"
						})]
					}),
					submittedListingId && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border bg-muted/20 p-5 text-left",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-semibold",
									children: "Boost visibility"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted-foreground mt-1",
									children: "Give this listing a stronger push with a promotion that can help it reach more buyers."
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									type: "button",
									className: "bg-accent text-accent-foreground",
									onClick: handlePromoteListing,
									disabled: promoting || promotionState === "promoted" || !canPromote,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "mr-2 h-4 w-4" }), promoting ? "Promoting..." : promotionState === "promoted" ? "Promoted" : "Promote listing"]
								})]
							}),
							!canPromote && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm text-muted-foreground",
								children: "Upgrade to Lite or above to unlock promotions and stronger visibility."
							}),
							promotionStats && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 grid gap-3 sm:grid-cols-3 text-sm text-muted-foreground",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-xl border bg-background p-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-semibold text-foreground",
											children: promotionStats.views_count
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "views" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-xl border bg-background p-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-semibold text-foreground",
											children: promotionStats.clicks_count
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "clicks" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-xl border bg-background p-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-semibold text-foreground",
											children: promotionStats.favorites_count
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "saves" })]
									})
								]
							})
						]
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-6 lg:grid-cols-[1.25fr_0.75fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "p-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-6 flex items-center gap-2 text-sm text-muted-foreground",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded-full bg-accent/10 px-2 py-1 text-accent",
									children: draftStatus
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "•" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									"Listing quality ",
									qualityScore,
									"%"
								] })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-6 flex flex-wrap gap-2",
							children: [
								"Category",
								"Details",
								"Photos",
								"Preview"
							].map((label, index) => {
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: `rounded-full border px-3 py-1 text-sm ${index + 1 === step ? "border-accent bg-accent/10 text-foreground" : "text-muted-foreground"}`,
									children: [
										index + 1,
										" ",
										label
									]
								}, label);
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: form.handleSubmit(onSubmit, onInvalid),
							className: "space-y-5",
							children: [
								step === 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "text-xl font-semibold",
										children: "Pick a category"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground",
										children: "Cards feel more premium and make it easier to browse your listing."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "grid gap-3 md:grid-cols-2 mt-4",
										children: CATEGORIES.filter((c) => c.type === "goods").map((c) => {
											const isSelected = watch.category === c.slug;
											const meta = CATEGORY_META[c.slug] ?? {
												icon: "📦",
												subtitle: "Popular listing"
											};
											return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => form.setValue("category", c.slug, { shouldValidate: true }),
												className: `rounded-2xl border p-4 text-left transition-all ${isSelected ? "border-accent bg-accent/10" : "border-border bg-card hover:bg-muted/50"}`,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-start justify-between gap-3",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "text-lg font-semibold",
														children: [
															meta.icon,
															" ",
															c.label
														]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-sm text-muted-foreground mt-1",
														children: meta.subtitle
													})] }), isSelected && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-5 w-5 text-accent" })]
												})
											}, c.slug);
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between pt-4 border-t",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											variant: "outline",
											onClick: () => setMode("home"),
											children: "Cancel"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											type: "button",
											disabled: !watch.category,
											onClick: nextStep,
											children: ["Next ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "ml-2 h-4 w-4" })]
										})]
									})
								] }),
								step === 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "text-xl font-semibold",
										children: "Add details that convert"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Title" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												...form.register("title"),
												placeholder: "iPhone 15 Pro Max 256GB"
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Description" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
												rows: 6,
												...form.register("description"),
												placeholder: "Add condition, specs, warranty and why someone should buy it."
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "flex items-center justify-end",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
													type: "button",
													variant: "outline",
													size: "sm",
													onClick: applyAiDescription,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "mr-2 h-4 w-4" }), " Generate with AI"]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid gap-4 md:grid-cols-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Price (₦)" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														type: "number",
														...form.register("price"),
														placeholder: "420000"
													}),
													priceHint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "mt-2 text-sm text-muted-foreground",
														children: priceHint
													})
												] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Brand" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													...form.register("brand"),
													placeholder: "Apple, Samsung, Toyota"
												})] })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Condition" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
												value: watch.condition,
												onValueChange: (value) => form.setValue("condition", value),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select condition" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "new",
														children: "Brand new"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "used_like_new",
														children: "Used - Like new"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "used_good",
														children: "Used - Good"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
														value: "used_fair",
														children: "Used - Fair"
													})
												] })]
											})] })
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between pt-4 border-t",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											type: "button",
											variant: "outline",
											onClick: prevStep,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "mr-2 h-4 w-4" }), "Back"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											type: "button",
											onClick: nextStep,
											children: ["Next ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "ml-2 h-4 w-4" })]
										})]
									})
								] }),
								step === 3 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "text-xl font-semibold",
										children: "Photos and location"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-5 rounded-2xl border bg-muted/20 p-5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
													className: "font-semibold",
													children: "Location"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm text-muted-foreground",
													children: "Use GPS or pick from the list."
												})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
													type: "button",
													variant: "outline",
													size: "sm",
													onClick: handleDetectLocation,
													disabled: detectingLocation,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "mr-2 h-4 w-4" }), detectingLocation ? "Detecting..." : "Detect my location"]
												})]
											}),
											detectedLocation && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-sm text-accent",
												children: ["Detected: ", detectedLocation]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "State" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
												value: watch.state_id,
												onValueChange: (value) => {
													form.setValue("state_id", value);
													form.setValue("lga_id", "");
												},
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Choose state" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: states.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: s.id,
													children: s.name
												}, s.id)) })]
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Local government area" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
												disabled: !watch.state_id,
												value: watch.lga_id,
												onValueChange: (value) => form.setValue("lga_id", value),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Choose LGA" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: lgas.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: l.id,
													children: l.name
												}, l.id)) })]
											})] })
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Photos" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-sm text-muted-foreground",
													children: [files.length, "/8 images"]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: `rounded-2xl border-2 border-dashed p-6 text-center transition-all ${dragActive ? "border-accent bg-accent/10" : "border-border"}`,
												onDragOver: (e) => {
													e.preventDefault();
													setDragActive(true);
												},
												onDragLeave: () => setDragActive(false),
												onDrop: (e) => {
													e.preventDefault();
													setDragActive(false);
													addFiles(e.dataTransfer.files);
												},
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													id: "listing-images",
													type: "file",
													multiple: true,
													accept: "image/*",
													className: "hidden",
													onChange: (e) => {
														if (e.target.files) addFiles(e.target.files);
													}
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
													htmlFor: "listing-images",
													className: "flex cursor-pointer flex-col items-center gap-3",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "h-8 w-8 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "font-semibold",
														children: "Drag photos here or browse"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-sm text-muted-foreground",
														children: "Use clear images to improve trust and buyer interest."
													})] })]
												})]
											}),
											files.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "grid gap-3 md:grid-cols-2",
												children: files.map((file, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "rounded-2xl border p-3",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "relative overflow-hidden rounded-xl border aspect-square bg-muted",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
															src: URL.createObjectURL(file),
															alt: "",
															className: "h-full w-full object-cover"
														}), coverIndex === index && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "absolute left-2 top-2 rounded-full bg-accent px-2 py-1 text-[10px] font-semibold text-accent-foreground",
															children: "Cover"
														})]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "mt-2 flex items-center justify-between gap-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "truncate text-sm font-medium",
															children: file.name
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex gap-1",
															children: [
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																	type: "button",
																	size: "sm",
																	variant: "outline",
																	onClick: () => moveFile(index, -1),
																	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, { className: "h-3 w-3" })
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																	type: "button",
																	size: "sm",
																	variant: "outline",
																	onClick: () => moveFile(index, 1),
																	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDown, { className: "h-3 w-3" })
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																	type: "button",
																	size: "sm",
																	variant: "outline",
																	onClick: () => setCoverIndex(index),
																	children: "Cover"
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
																	type: "button",
																	size: "sm",
																	variant: "outline",
																	onClick: () => setFiles((prev) => prev.filter((_, i) => i !== index)),
																	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-3 w-3" })
																})
															]
														})]
													})]
												}, `${file.name}-${index}`))
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Contact phone number" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										...form.register("phone"),
										placeholder: "08012345678"
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between pt-4 border-t",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											type: "button",
											variant: "outline",
											onClick: prevStep,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "mr-2 h-4 w-4" }), "Back"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											type: "button",
											onClick: nextStep,
											children: ["Preview ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "ml-2 h-4 w-4" })]
										})]
									})
								] }),
								step === 4 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "text-xl font-semibold",
										children: "Preview your listing"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground",
										children: "Review the listing exactly as buyers will see it before publishing."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-4 rounded-2xl border bg-muted/20 p-5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-2xl bg-background p-4",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs font-semibold uppercase tracking-wide text-accent",
													children: "Preview"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
													className: "mt-2 text-xl font-semibold",
													children: watch.title || "Your title goes here"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "mt-2 text-sm text-muted-foreground",
													children: watch.description || "Add a clear description with condition, specs and pricing."
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "mt-3 flex items-center gap-2 text-sm text-muted-foreground",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: watch.price ? `₦${Number(watch.price).toLocaleString()}` : "Price not set" }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "•" }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: watch.condition ? watch.condition.replace(/_/g, " ") : "Condition pending" })
													]
												})
											]
										}), canPromote ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-2xl border bg-background p-4",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
													className: "font-semibold",
													children: "Want more buyers?"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm text-muted-foreground mt-1",
													children: "Promote this listing after publishing to increase visibility."
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "mt-3 text-sm text-muted-foreground",
													children: "Your promotion will be activated once the listing is submitted and approved."
												})
											]
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "rounded-2xl border border-dashed border-accent/30 bg-accent/5 p-4 text-sm text-muted-foreground",
											children: "Upgrade to Lite to unlock promotions, a store and richer analytics."
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between pt-4 border-t",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											type: "button",
											variant: "outline",
											onClick: prevStep,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "mr-2 h-4 w-4" }), "Back"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											type: "submit",
											disabled: submitting,
											className: "bg-accent text-accent-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "mr-2 h-4 w-4" }), submitting ? submittingStage : "Publish listing"]
										})]
									})
								] })
							]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-semibold",
							children: "Subscription-aware features"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
							className: "mt-3 space-y-2 text-sm text-muted-foreground",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "• Free: 3 active listings, no promotions." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "• Lite: shop enabled, 1 weekly promotion." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "• Pro: priority search, promotions and analytics." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "• VIP: priority placement and multi-staff support." })
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-semibold",
							children: "Trust signals"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 space-y-2 text-sm text-muted-foreground",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "• Phone verified" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "• Email verified" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["• ", profile?.kyc_status === "verified" ? "KYC verified" : "KYC pending"] })
							]
						})]
					})]
				})]
			})]
		})]
	});
}
//#endregion
export { PostAd as component };
