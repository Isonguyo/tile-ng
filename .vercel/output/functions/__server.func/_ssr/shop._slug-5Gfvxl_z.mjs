import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-B0U85Udx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as useAuth } from "./auth-context-ufRsuJHL.mjs";
import { t as Button } from "./button-Bq5vK6RO.mjs";
import { t as Card } from "./card-CzXpCsbD.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as Share2, Ct as BadgeCheck, E as Search, I as MessageCircle, N as Package, Q as Heart, R as MapPin, T as Send, ct as CircleCheck, dt as ChevronRight, et as Flame, f as TrendingUp, ft as ChevronLeft, g as Star, j as Phone, n as Zap, o as Users, rt as Eye, u as Trophy, v as SlidersHorizontal, wt as Award, yt as Bookmark } from "../_libs/lucide-react.mjs";
import { t as SiteHeader } from "./site-header-DuVnqON_.mjs";
import { t as Badge } from "./badge-D1Dupn2y.mjs";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-CCJRliUM.mjs";
import { t as Textarea } from "./textarea-kko37XEX.mjs";
import { r as formatNaira } from "./categories-j3aLXACs.mjs";
import { r as useQueryClient, t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as TierBadge } from "./tier-badge-C-srz-hZ.mjs";
import { t as QRCodeSVG } from "../_libs/qrcode.react.mjs";
import { t as LoadingSpinner } from "./loading-spinner-R2T4_Xmi.mjs";
import { t as Route } from "./shop._slug-Cj3Y0wqj.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/shop._slug-5Gfvxl_z.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ShopPage() {
	const { slug } = Route.useParams();
	const { user } = useAuth();
	const qc = useQueryClient();
	const [searchQuery, setSearchQuery] = (0, import_react.useState)("");
	const [selectedCategory, setSelectedCategory] = (0, import_react.useState)("all");
	const [priceRange, setPriceRange] = (0, import_react.useState)("all");
	const [sortBy, setSortBy] = (0, import_react.useState)("featured");
	const [bannerIdx, setBannerIdx] = (0, import_react.useState)(0);
	const [rating, setRating] = (0, import_react.useState)(0);
	const [comment, setComment] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [following, setFollowing] = (0, import_react.useState)(false);
	const [followBusy, setFollowBusy] = (0, import_react.useState)(false);
	const { data: shop, isLoading } = useQuery({
		queryKey: ["shop", slug],
		queryFn: async () => {
			const { data } = await supabase.from("public_profiles").select("*").eq("shop_slug", slug).maybeSingle();
			return data ?? null;
		}
	});
	const { data: contact } = useQuery({
		queryKey: [
			"shop-contact",
			slug,
			!!user
		],
		enabled: !!user && !!shop?.id,
		queryFn: async () => {
			const { data } = await supabase.rpc("shop_contact", { _slug: slug });
			return (Array.isArray(data) ? data[0] : data) ?? null;
		}
	});
	const { data: listings = [] } = useQuery({
		queryKey: ["shop-listings", shop?.id],
		enabled: !!shop?.id,
		queryFn: async () => {
			const { data } = await supabase.from("listings").select("id,title,price,type,location,images,is_promoted,category,views_count,clicks_count").eq("user_id", shop.id).eq("status", "approved").order("is_promoted", { ascending: false });
			return data ?? [];
		}
	});
	const { data: reviews = [] } = useQuery({
		queryKey: ["shop-reviews", shop?.id],
		enabled: !!shop?.id,
		queryFn: async () => {
			const { data } = await supabase.from("shop_reviews").select("*").eq("shop_user_id", shop.id).order("created_at", { ascending: false });
			return data ?? [];
		}
	});
	const { data: followerCount = 0 } = useQuery({
		queryKey: ["shop-followers", shop?.id],
		enabled: !!shop?.id,
		queryFn: async () => {
			const { data } = await supabase.rpc("shop_follower_count", { _shop_id: shop.id });
			return Number(data ?? 0);
		}
	});
	const { data: favoritesCounts = {} } = useQuery({
		queryKey: [
			"shop-fav-counts",
			shop?.id,
			listings.length
		],
		enabled: !!shop?.id && listings.length > 0,
		queryFn: async () => {
			const ids = listings.map((l) => l.id);
			const { data } = await supabase.from("favorites").select("listing_id").in("listing_id", ids);
			const map = {};
			(data ?? []).forEach((r) => {
				map[r.listing_id] = (map[r.listing_id] || 0) + 1;
			});
			return map;
		}
	});
	(0, import_react.useEffect)(() => {
		if (!user || !shop?.id) return;
		(async () => {
			const { data } = await supabase.rpc("is_following_shop", { _shop_id: shop.id });
			setFollowing(!!data);
		})();
	}, [user, shop?.id]);
	const banners = (0, import_react.useMemo)(() => (shop?.portfolio_images ?? []).filter(Boolean).slice(0, 5), [shop?.portfolio_images]);
	(0, import_react.useEffect)(() => {
		if (banners.length < 2) return;
		const t = setInterval(() => setBannerIdx((i) => (i + 1) % banners.length), 6e3);
		return () => clearInterval(t);
	}, [banners.length]);
	const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
	const services = listings.filter((l) => l.type === "service");
	const goods = listings.filter((l) => l.type === "goods");
	const featuredListings = listings.filter((l) => l.is_promoted);
	const totalViews = listings.reduce((s, l) => s + (l.views_count ?? 0), 0);
	const totalWishlisted = Object.values(favoritesCounts).reduce((s, n) => s + n, 0);
	const ratingBreakdown = (0, import_react.useMemo)(() => {
		const counts = [
			0,
			0,
			0,
			0,
			0
		];
		reviews.forEach((r) => {
			if (r.rating >= 1 && r.rating <= 5) counts[r.rating - 1]++;
		});
		return counts.map((c, i) => ({
			stars: i + 1,
			count: c,
			pct: reviews.length ? c / reviews.length * 100 : 0
		})).reverse();
	}, [reviews]);
	const achievements = (0, import_react.useMemo)(() => {
		const list = [];
		if (shop?.is_verified) list.push({
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, { className: "h-3.5 w-3.5" }),
			label: "Verified",
			color: "bg-blue-500/10 text-blue-700 border-blue-200"
		});
		if ((shop?.subscription_tier ?? "free") !== "free") list.push({
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trophy, { className: "h-3.5 w-3.5" }),
			label: "Premium Seller",
			color: "bg-amber-500/10 text-amber-700 border-amber-200"
		});
		if (listings.length >= 20) list.push({
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "h-3.5 w-3.5" }),
			label: "Stocked Shop",
			color: "bg-purple-500/10 text-purple-700 border-purple-200"
		});
		if (avgRating >= 4.5 && reviews.length >= 3) list.push({
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "h-3.5 w-3.5" }),
			label: "Top Rated",
			color: "bg-emerald-500/10 text-emerald-700 border-emerald-200"
		});
		if (totalViews >= 500) list.push({
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, { className: "h-3.5 w-3.5" }),
			label: "Hot Shop",
			color: "bg-orange-500/10 text-orange-700 border-orange-200"
		});
		if (followerCount >= 50) list.push({
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: "h-3.5 w-3.5" }),
			label: "Fan Favorite",
			color: "bg-pink-500/10 text-pink-700 border-pink-200"
		});
		if (featuredListings.length > 0) list.push({
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { className: "h-3.5 w-3.5" }),
			label: "Featured",
			color: "bg-indigo-500/10 text-indigo-700 border-indigo-200"
		});
		return list;
	}, [
		shop,
		listings.length,
		avgRating,
		reviews.length,
		totalViews,
		followerCount,
		featuredListings.length
	]);
	const trustScore = (0, import_react.useMemo)(() => {
		let score = 40;
		if (shop?.is_verified) score += 20;
		if ((shop?.subscription_tier ?? "free") !== "free") score += 10;
		score += Math.min(15, Math.round(avgRating * 3));
		score += Math.min(10, Math.floor(reviews.length / 2));
		score += Math.min(5, Math.floor(followerCount / 20));
		return Math.min(100, score);
	}, [
		shop,
		avgRating,
		reviews.length,
		followerCount
	]);
	const dynamicCategories = (0, import_react.useMemo)(() => {
		const cats = /* @__PURE__ */ new Map();
		listings.forEach((l) => {
			if (l.category) cats.set(l.category, (cats.get(l.category) || 0) + 1);
		});
		return Array.from(cats.entries()).map(([name, count]) => ({
			name,
			count
		}));
	}, [listings]);
	const applySort = (arr) => {
		const a = [...arr];
		switch (sortBy) {
			case "price-asc": return a.sort((x, y) => (x.price ?? 0) - (y.price ?? 0));
			case "price-desc": return a.sort((x, y) => (y.price ?? 0) - (x.price ?? 0));
			case "popular": return a.sort((x, y) => (y.views_count ?? 0) - (x.views_count ?? 0));
			case "rating": return a;
			case "newest": return a;
			default: return a;
		}
	};
	const filteredGoods = (0, import_react.useMemo)(() => {
		return applySort(goods.filter((item) => {
			const q = searchQuery.toLowerCase();
			const matchesSearch = !q || item.title.toLowerCase().includes(q) || (item.category ?? "").toLowerCase().includes(q) || (item.location ?? "").toLowerCase().includes(q);
			const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
			let matchesPrice = true;
			if (priceRange === "under-50k") matchesPrice = (item.price ?? 0) < 5e4;
			else if (priceRange === "50k-200k") matchesPrice = (item.price ?? 0) >= 5e4 && (item.price ?? 0) <= 2e5;
			else if (priceRange === "above-200k") matchesPrice = (item.price ?? 0) > 2e5;
			return matchesSearch && matchesCategory && matchesPrice;
		}));
	}, [
		goods,
		searchQuery,
		selectedCategory,
		priceRange,
		sortBy
	]);
	const filteredServices = (0, import_react.useMemo)(() => {
		return applySort(services.filter((item) => {
			const q = searchQuery.toLowerCase();
			const matchesSearch = !q || item.title.toLowerCase().includes(q) || (item.category ?? "").toLowerCase().includes(q);
			const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
			return matchesSearch && matchesCategory;
		}));
	}, [
		services,
		searchQuery,
		selectedCategory,
		sortBy
	]);
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingSpinner, { label: "Loading shop…" })]
	});
	if (!shop) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "container py-12",
			children: "Shop not found."
		})]
	});
	const url = typeof window !== "undefined" ? window.location.href : "";
	const share = async () => {
		try {
			if (navigator.share) await navigator.share({
				title: shop.business_name ?? shop.full_name ?? "Shop",
				url
			});
			else {
				await navigator.clipboard.writeText(url);
				toast.success("Link copied");
			}
		} catch {}
	};
	const mine = user ? reviews.find((r) => r.reviewer_id === user.id) : null;
	const isOwn = user?.id === shop.id;
	const toggleFollow = async () => {
		if (!user) return toast.error("Sign in to follow this shop");
		if (isOwn) return toast.error("You can't follow your own shop");
		setFollowBusy(true);
		const { data, error } = await supabase.rpc("toggle_follow_shop", { _shop_id: shop.id });
		setFollowBusy(false);
		if (error) return toast.error(error.message);
		setFollowing(!!data);
		qc.invalidateQueries({ queryKey: ["shop-followers", shop.id] });
		toast.success(data ? "You are following this shop" : "Unfollowed");
	};
	const submitReview = async () => {
		if (!user) return toast.error("Sign in to leave a review");
		if (isOwn) return toast.error("You can't review your own shop");
		if (rating < 1) return toast.error("Please pick a star rating between 1 and 5");
		if (comment.length > 1e3) return toast.error("Comment too long (max 1000 chars)");
		setBusy(true);
		const { error } = await supabase.from("shop_reviews").upsert({
			shop_user_id: shop.id,
			reviewer_id: user.id,
			rating,
			comment: comment || null
		}, { onConflict: "shop_user_id,reviewer_id" });
		setBusy(false);
		if (error) return toast.error(error.message);
		toast.success(mine ? "Review updated" : "Review posted");
		setRating(0);
		setComment("");
		qc.invalidateQueries({ queryKey: ["shop-reviews", shop.id] });
	};
	const joinedYear = shop.created_at ? new Date(shop.created_at).getFullYear() : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-muted/20 pb-20 md:pb-0",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative bg-background border-b shadow-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-48 md:h-64 w-full bg-gradient-to-r from-primary/20 via-accent/10 to-primary/30 relative overflow-hidden",
					children: banners.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [banners.map((src, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src,
						alt: `Store banner ${i + 1}`,
						className: `absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === bannerIdx ? "opacity-100" : "opacity-0"}`
					}, i)), banners.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setBannerIdx((bannerIdx - 1 + banners.length) % banners.length),
							className: "absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-1.5 rounded-full shadow",
							"aria-label": "Previous",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "h-4 w-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setBannerIdx((bannerIdx + 1) % banners.length),
							className: "absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-1.5 rounded-full shadow",
							"aria-label": "Next",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-4 w-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5",
							children: banners.map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setBannerIdx(i),
								"aria-label": `Slide ${i + 1}`,
								className: `h-1.5 rounded-full transition-all ${i === bannerIdx ? "w-6 bg-white" : "w-1.5 bg-white/60"}`
							}, i))
						})
					] })] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 opacity-20 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "container mx-auto px-4 pb-6 relative",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16 md:-mt-20 z-10 relative",
						children: [
							shop.avatar_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: shop.avatar_url,
								alt: "Logo",
								className: "h-28 w-28 md:h-36 md:w-36 rounded-2xl bg-background border-4 border-background shadow-md object-cover"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-28 w-28 md:h-36 md:w-36 rounded-2xl bg-primary text-primary-foreground border-4 border-background shadow-md grid place-items-center text-4xl font-bold",
								children: (shop.business_name ?? shop.full_name ?? "S")[0]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1 space-y-2 w-full",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap items-center gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
												className: "text-2xl md:text-3xl font-extrabold tracking-tight",
												children: shop.business_name ?? shop.full_name
											}),
											shop.is_verified && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, { className: "h-6 w-6 text-accent fill-accent/10" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TierBadge, { tier: shop.subscription_tier })
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground font-medium",
										children: [
											shop.state && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "flex items-center gap-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-4 w-4 text-primary" }), shop.state]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "flex items-center gap-1",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "h-4 w-4 fill-amber-400 text-amber-400" }),
													avgRating.toFixed(1),
													" (",
													reviews.length,
													" reviews)"
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "flex items-center gap-1",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "h-4 w-4" }),
													followerCount,
													" followers"
												]
											}),
											joinedYear && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["• Since ", joinedYear] })
										]
									}),
									achievements.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex flex-wrap gap-1.5 pt-1",
										children: achievements.map((a, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: `inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${a.color}`,
											children: [a.icon, a.label]
										}, i))
									}),
									shop.bio && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "max-w-2xl text-foreground/80 text-sm mt-2 line-clamp-2 md:line-clamp-none",
										children: shop.bio
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap gap-2 w-full md:w-auto mt-4 md:mt-0",
								children: [
									!isOwn && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										onClick: toggleFollow,
										disabled: followBusy,
										variant: following ? "secondary" : "default",
										size: "sm",
										className: "flex-1 md:flex-none",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: `h-4 w-4 mr-1 ${following ? "fill-current" : ""}` }), following ? "Following" : "Follow"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										onClick: share,
										variant: "outline",
										size: "sm",
										className: "flex-1 md:flex-none",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "h-4 w-4 mr-1" }), "Share"]
									}),
									user ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [contact?.phone && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "outline",
										size: "sm",
										className: "flex-1 md:flex-none bg-accent/5 text-accent border-accent/20 hover:bg-accent/10",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "h-4 w-4 mr-1" }), contact.phone]
									}), contact?.whatsapp && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										asChild: true,
										variant: "outline",
										size: "sm",
										className: "flex-1 md:flex-none",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
											href: `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`,
											target: "_blank",
											rel: "noreferrer",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-4 w-4 mr-1 text-green-500" }), "WhatsApp"]
										})
									})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										asChild: true,
										variant: "default",
										size: "sm",
										className: "flex-1 md:flex-none",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
											to: "/auth",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "h-4 w-4 mr-1" }), "Sign in to Contact"]
										})
									})
								]
							})
						]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-6 lg:col-span-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							className: "p-4 shadow-sm grid grid-cols-2 gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "bg-muted/40 p-3 rounded-xl border flex items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "p-2 bg-primary/10 rounded-lg text-primary",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "h-5 w-5" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground font-medium",
										children: "Products"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-lg font-bold",
										children: listings.length
									})] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "bg-muted/40 p-3 rounded-xl border flex items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "p-2 bg-accent/10 rounded-lg text-accent",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "h-5 w-5" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground font-medium",
										children: "Followers"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-lg font-bold",
										children: followerCount
									})] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "bg-muted/40 p-3 rounded-xl border flex items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "p-2 bg-green-500/10 rounded-lg text-green-600",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-5 w-5" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground font-medium",
										children: "Total Views"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-lg font-bold",
										children: totalViews >= 1e3 ? `${(totalViews / 1e3).toFixed(1)}k` : totalViews
									})] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "bg-muted/40 p-3 rounded-xl border flex items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "p-2 bg-pink-500/10 rounded-lg text-pink-600",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, { className: "h-5 w-5" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground font-medium",
										children: "Wishlisted"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-lg font-bold",
										children: totalWishlisted
									})] })]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							className: "p-4 shadow-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between mb-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Award, { className: "h-4 w-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-sm font-semibold",
											children: "Trust Score"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-lg font-extrabold",
										children: [trustScore, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs text-muted-foreground",
											children: "/100"
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-2 bg-muted rounded-full overflow-hidden",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "h-full bg-gradient-to-r from-emerald-500 to-primary transition-all",
										style: { width: `${trustScore}%` }
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-[11px] text-muted-foreground mt-2 flex items-center gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-3 w-3 text-emerald-500" }), "Verified activity & reputation"]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							className: "p-4 shadow-sm hidden md:block",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
								className: "text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, { className: "h-4 w-4" }), " Store Categories"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => setSelectedCategory("all"),
									className: `w-full text-left px-3 py-2 rounded-lg text-sm flex justify-between items-center transition ${selectedCategory === "all" ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted text-muted-foreground"}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "All Categories" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs opacity-70",
										children: listings.length
									})]
								}), dynamicCategories.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => setSelectedCategory(cat.name),
									className: `w-full text-left px-3 py-2 rounded-lg text-sm flex justify-between items-center capitalize transition ${selectedCategory === cat.name ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted text-muted-foreground"}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: cat.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs opacity-70",
										children: cat.count
									})]
								}, cat.name))]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							className: "p-4 text-center shadow-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider",
									children: "Scan to visit storefront"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "bg-white p-3 rounded-xl inline-block border shadow-inner",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QRCodeSVG, {
										value: url,
										size: 130
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground mt-3 break-all bg-muted p-2 rounded-lg border border-dashed font-mono",
									children: url
								})
							]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "lg:col-span-3 space-y-6",
					children: [
						dynamicCategories.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => setSelectedCategory("all"),
								className: `shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${selectedCategory === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`,
								children: [
									"All (",
									listings.length,
									")"
								]
							}), dynamicCategories.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => setSelectedCategory(c.name),
								className: `shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border capitalize transition ${selectedCategory === c.name ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`,
								children: [
									c.name,
									" (",
									c.count,
									")"
								]
							}, c.name))]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							className: "p-4 shadow-sm bg-background flex flex-col md:flex-row items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative w-full md:flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									value: searchQuery,
									onChange: (e) => setSearchQuery(e.target.value),
									placeholder: "Search title, category, location…",
									className: "w-full pl-9 pr-4 py-2 bg-muted/50 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background transition"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 w-full md:w-auto",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									value: priceRange,
									onChange: (e) => setPriceRange(e.target.value),
									className: "w-full md:w-auto text-sm border bg-background rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "all",
											children: "All Prices"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "under-50k",
											children: "Under ₦50,000"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "50k-200k",
											children: "₦50,000 - ₦200,000"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "above-200k",
											children: "Above ₦200,000"
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									value: sortBy,
									onChange: (e) => setSortBy(e.target.value),
									className: "w-full md:w-auto text-sm border bg-background rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "featured",
											children: "Featured"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "popular",
											children: "Most Viewed"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "price-asc",
											children: "Price: Low → High"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "price-desc",
											children: "Price: High → Low"
										})
									]
								})]
							})]
						}),
						featuredListings.length > 0 && !searchQuery && selectedCategory === "all" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
								className: "text-sm font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "h-4 w-4 text-amber-500 fill-amber-500" }), " Featured Displays"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid grid-cols-2 md:grid-cols-3 gap-4",
								children: featuredListings.slice(0, 3).map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/listing/$id",
									params: { id: l.id },
									className: "relative group rounded-xl border bg-background overflow-hidden hover:shadow-md transition",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "aspect-square bg-muted",
											children: l.images?.[0] && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
												src: l.images[0],
												alt: l.title,
												className: "w-full h-full object-cover group-hover:scale-105 transition"
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "p-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm font-semibold line-clamp-1",
												children: l.title
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm font-extrabold",
												children: formatNaira(l.price ?? 0)
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded shadow",
											children: "Pinned"
										})
									]
								}, l.id))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
							defaultValue: "listings",
							className: "w-full",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex items-center justify-between border-b pb-1",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
										className: "bg-transparent h-auto p-0 gap-6",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
											value: "listings",
											className: "rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent p-2 font-bold text-sm data-[state=active]:shadow-none",
											children: [
												"Products (",
												filteredGoods.length,
												")"
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsTrigger, {
											value: "portfolio",
											className: "rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent p-2 font-bold text-sm data-[state=active]:shadow-none",
											children: [
												"Services (",
												filteredServices.length,
												")"
											]
										})]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
									value: "listings",
									className: "mt-4 focus-visible:outline-none",
									children: filteredGoods.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-center py-12 bg-background rounded-xl border border-dashed",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-60" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-muted-foreground font-medium text-sm",
											children: "No matching products found."
										})]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4",
										children: filteredGoods.map((l) => {
											const favs = favoritesCounts[l.id] ?? 0;
											const views = l.views_count ?? 0;
											const lowStock = views > 20 && views < 60;
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
												to: "/listing/$id",
												params: { id: l.id },
												className: "group relative rounded-xl border border-border bg-background overflow-hidden transition-all duration-200 hover:shadow-md flex flex-col justify-between",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "aspect-square bg-muted relative overflow-hidden",
													children: [
														l.images && l.images[0] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
															src: l.images[0],
															alt: l.title,
															className: "object-cover w-full h-full transition group-hover:scale-105"
														}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "w-full h-full bg-muted/60 flex items-center justify-center text-muted-foreground/40 text-xs",
															children: "No Image"
														}),
														l.is_promoted && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
															className: "absolute top-2 left-2 bg-accent text-accent-foreground text-[10px] font-bold",
															children: "Premium"
														}),
														lowStock && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
															className: "absolute bottom-2 left-2 bg-orange-500 text-white text-[10px] font-bold border-0",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "h-2.5 w-2.5 mr-0.5" }), "Selling fast"]
														}),
														favs > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: "absolute top-2 right-2 flex items-center gap-1 bg-background/90 backdrop-blur text-[10px] font-bold px-2 py-0.5 rounded-full shadow",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: "h-3 w-3 text-pink-500 fill-pink-500" }), favs]
														})
													]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "p-3.5 space-y-1.5",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-[10px] font-bold uppercase text-accent/90 tracking-wider block",
															children: l.category || "General"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
															className: "text-sm font-semibold tracking-tight text-foreground line-clamp-2 min-h-[40px] group-hover:text-primary transition-colors",
															children: l.title
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-center gap-2 text-xs text-muted-foreground",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "flex items-center gap-0.5",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-3 w-3" }),
																	" ",
																	views,
																	" views"
																]
															}), (l.clicks_count ?? 0) > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "•" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [l.clicks_count, " clicks"] })] })]
														})
													]
												})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "p-3.5 pt-0 border-t bg-muted/5 flex items-center justify-between",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-base font-extrabold text-foreground",
														children: formatNaira(l.price ?? 0)
													}), l.location && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "text-[10px] text-muted-foreground flex items-center gap-0.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-3 w-3" }), l.location]
													})]
												})]
											}, l.id);
										})
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
									value: "portfolio",
									className: "mt-4 focus-visible:outline-none",
									children: filteredServices.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-center py-12 bg-background rounded-xl border border-dashed",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-60" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-muted-foreground font-medium text-sm",
											children: "No services listed yet."
										})]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4",
										children: filteredServices.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
											to: "/listing/$id",
											params: { id: l.id },
											className: "rounded-xl overflow-hidden border border-border bg-background shadow-sm hover:shadow-md transition",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "aspect-video bg-muted relative",
												children: l.images && l.images[0] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
													src: l.images[0],
													alt: l.title,
													className: "object-cover w-full h-full"
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "p-3.5 space-y-1",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-[10px] font-bold uppercase text-primary tracking-wider",
														children: l.category || "Service"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-sm font-semibold text-foreground line-clamp-1",
														children: l.title
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "text-xs text-muted-foreground flex items-center gap-1",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-3 w-3" }), l.location || "Remote"]
													})
												]
											})]
										}, l.id))
									})
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t pt-4 mt-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground font-medium",
								children: ["Total inventory value: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-foreground font-bold",
									children: formatNaira(listings.reduce((s, l) => s + (l.price ?? 0), 0))
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/",
								className: "text-accent hover:underline text-sm font-semibold flex items-center gap-1",
								children: "← Back to marketplace"
							})]
						})] }),
						shop.id && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							className: "p-6 shadow-sm bg-background",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between flex-wrap gap-3 border-b pb-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "text-lg font-bold text-foreground",
										children: "Customer Reviews"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground",
										children: "Verified buyer testimonials."
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg border",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "flex",
												children: [
													1,
													2,
													3,
													4,
													5
												].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: `h-4 w-4 ${n <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}` }, n))
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-extrabold text-sm",
												children: avgRating.toFixed(1)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-xs text-muted-foreground",
												children: [
													"(",
													reviews.length,
													")"
												]
											})
										]
									})]
								}),
								reviews.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-center bg-muted/30 rounded-xl p-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-4xl font-extrabold",
												children: avgRating.toFixed(1)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "flex justify-center my-1",
												children: [
													1,
													2,
													3,
													4,
													5
												].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: `h-4 w-4 ${n <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}` }, n))
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-xs text-muted-foreground",
												children: [
													"Based on ",
													reviews.length,
													" review",
													reviews.length === 1 ? "" : "s"
												]
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "space-y-1.5",
										children: ratingBreakdown.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 text-xs",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "w-4 font-medium",
													children: row.stars
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "h-3 w-3 fill-amber-400 text-amber-400" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "flex-1 h-2 bg-muted rounded-full overflow-hidden",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "h-full bg-amber-400",
														style: { width: `${row.pct}%` }
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "w-8 text-right text-muted-foreground",
													children: row.count
												})
											]
										}, row.stars))
									})]
								}),
								user && !isOwn && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 p-4 rounded-xl border border-primary/10 space-y-3 bg-primary/5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-semibold text-foreground",
											children: mine ? "Update your review" : "Leave a review"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex gap-1",
											children: [
												1,
												2,
												3,
												4,
												5
											].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => setRating(n),
												"aria-label": `${n} star`,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: `h-6 w-6 transition ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground hover:text-amber-300"}` })
											}, n))
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
											rows: 3,
											value: comment,
											onChange: (e) => setComment(e.target.value),
											placeholder: "Share your experience with this shop…",
											className: "bg-background"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											onClick: submitReview,
											disabled: busy,
											size: "sm",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "h-4 w-4 mr-1.5" }), busy ? "Sending…" : "Submit Review"]
										})
									]
								}),
								!user && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground mt-4 text-center py-2 bg-muted/40 rounded-lg",
									children: "Sign in to leave a review."
								}),
								isOwn && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground mt-4 text-center py-2 bg-muted/40 rounded-lg",
									children: "You cannot review your own shop."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-6 space-y-4 divide-y",
									children: [reviews.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground text-center py-6",
										children: "No reviews yet — be the first."
									}), reviews.map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: `pt-4 ${i === 0 ? "pt-0" : ""}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-1",
											children: [[
												1,
												2,
												3,
												4,
												5
											].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: `h-3 w-3 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}` }, n)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[11px] text-muted-foreground ml-2 font-medium",
												children: new Date(r.created_at).toLocaleDateString()
											})]
										}), r.comment && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm text-foreground/90 mt-1.5 pl-0.5",
											children: r.comment
										})]
									}, r.id))]
								})
							]
						})
					]
				})]
			}),
			!isOwn && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed bottom-0 inset-x-0 z-40 md:hidden bg-background border-t shadow-lg px-3 py-2 flex items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: toggleFollow,
						disabled: followBusy,
						variant: following ? "secondary" : "outline",
						size: "sm",
						className: "flex-1",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: `h-4 w-4 ${following ? "fill-current text-pink-500" : ""}` })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: share,
						variant: "outline",
						size: "sm",
						className: "flex-1",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "h-4 w-4" })
					}),
					user && contact?.whatsapp ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						size: "sm",
						className: "flex-1 bg-green-600 hover:bg-green-700 text-white",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: `https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`,
							target: "_blank",
							rel: "noreferrer",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "h-4 w-4 mr-1" }), "Chat"]
						})
					}) : user && contact?.phone ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						size: "sm",
						className: "flex-1",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: `tel:${contact.phone}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "h-4 w-4 mr-1" }), "Call"]
						})
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						size: "sm",
						className: "flex-1",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/auth",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "h-4 w-4 mr-1" }), "Contact"]
						})
					})
				]
			})
		]
	});
}
//#endregion
export { ShopPage as component };
