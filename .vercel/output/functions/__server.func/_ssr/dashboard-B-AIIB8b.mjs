import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-B0U85Udx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as useAuth } from "./auth-context-ufRsuJHL.mjs";
import { t as Button } from "./button-Bq5vK6RO.mjs";
import { t as Card } from "./card-CzXpCsbD.mjs";
import { _ as useNavigate, g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as Share2, F as MessageSquare, M as Pencil, N as Package, O as RefreshCw, P as MousePointerClick, Q as Heart, _ as Sparkles, a as Wallet, at as Crown, d as TriangleAlert, h as Store, k as Plus, ot as Copy, p as Trash2, q as KeyRound, rt as Eye, x as ShieldCheck } from "../_libs/lucide-react.mjs";
import { t as SiteHeader } from "./site-header-DuVnqON_.mjs";
import { t as Badge } from "./badge-D1Dupn2y.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { t as Label } from "./label-DBD1bRRP.mjs";
import { i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-CCJRliUM.mjs";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, o as DialogTrigger, r as DialogFooter, t as Dialog } from "./dialog-B8mBdC_P.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Dg1urBTx.mjs";
import { t as Textarea } from "./textarea-kko37XEX.mjs";
import { n as LOCATIONS, r as formatNaira } from "./categories-j3aLXACs.mjs";
import { r as uploadKyc } from "./storage-BCLwX12s.mjs";
import { r as useQueryClient, t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as TierBadge } from "./tier-badge-C-srz-hZ.mjs";
import { t as QRCodeSVG } from "../_libs/qrcode.react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dashboard-B-AIIB8b.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Dashboard() {
	const { user, profile, loading, refreshProfile } = useAuth();
	const nav = useNavigate();
	const qc = useQueryClient();
	const { data: myListings = [] } = useQuery({
		queryKey: ["my-listings", user?.id],
		enabled: !!user,
		queryFn: async () => {
			const { data } = await supabase.from("listings").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
			return data ?? [];
		}
	});
	const { data: favorites = [] } = useQuery({
		queryKey: ["favs", user?.id],
		enabled: !!user,
		queryFn: async () => {
			const { data } = await supabase.from("favorites").select("listing_id, listings(*)").eq("user_id", user.id);
			return (data ?? []).map((f) => f.listings).filter(Boolean);
		}
	});
	const { data: chats = [] } = useQuery({
		queryKey: ["chats", user?.id],
		enabled: !!user,
		queryFn: async () => {
			const { data } = await supabase.from("chats").select("id, listing_id, listings(title)").or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`).order("created_at", { ascending: false });
			return data ?? [];
		}
	});
	if (!loading && !user) {
		nav({ to: "/auth" });
		return null;
	}
	if (loading || !profile) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "container py-12",
			children: "Loading…"
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "container mx-auto px-4 py-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-baseline justify-between mb-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
					className: "text-3xl font-bold flex items-center gap-2",
					children: [
						"Welcome, ",
						profile.full_name,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TierBadge, { tier: profile.subscription_tier })
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					className: "bg-accent text-accent-foreground hover:bg-accent/90",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/post-ad",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "h-4 w-4 mr-1" }), "Post Ad"]
					})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
				defaultValue: "buyer",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
						className: "bg-primary text-primary-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
							value: "buyer",
							className: "data-[state=active]:bg-accent data-[state=active]:text-accent-foreground",
							children: "Buyer Hub"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
							value: "merchant",
							className: "data-[state=active]:bg-accent data-[state=active]:text-accent-foreground",
							children: "Merchant Hub"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
						value: "buyer",
						className: "space-y-6 mt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							className: "p-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
								className: "font-semibold flex items-center gap-2 mb-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: "h-5 w-5 text-accent" }), " Favorited items"]
							}), favorites.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground",
								children: "Tap the heart on a listing to save it here."
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid sm:grid-cols-2 gap-3",
								children: favorites.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/listing/$id",
									params: { id: f.id },
									className: "border rounded p-3 hover:border-accent",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-medium",
										children: f.title
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-accent font-bold",
										children: formatNaira(f.price)
									})]
								}, f.id))
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							className: "p-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
								className: "font-semibold flex items-center gap-2 mb-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "h-5 w-5 text-accent" }), " Active chats"]
							}), chats.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground",
								children: "No conversations yet."
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "divide-y",
								children: chats.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "py-2 flex justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: c.listings?.title ?? "Chat" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/listing/$id",
										params: { id: c.listing_id },
										className: "text-accent",
										children: "Open"
									})]
								}, c.id))
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsContent, {
						value: "merchant",
						className: "space-y-6 mt-4",
						children: [
							!profile.is_merchant && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MerchantOnboarding, { onDone: refreshProfile }),
							profile.is_merchant && profile.shop_slug && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShopLinkCard, { slug: profile.shop_slug }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid md:grid-cols-3 gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
									className: "p-5 col-span-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
										className: "font-semibold flex items-center gap-2 mb-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "h-5 w-5 text-accent" }), " Your listings"]
									}), myListings.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-muted-foreground text-sm",
										children: "You haven't posted anything yet."
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
										className: "divide-y",
										children: myListings.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListingRow, {
											l,
											onChange: () => qc.invalidateQueries({ queryKey: ["my-listings", user?.id] })
										}, l.id))
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WalletCard, {
									balance: profile.wallet_balance,
									onTopup: () => {
										refreshProfile();
										qc.invalidateQueries();
									}
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BillingCard, {
								tier: profile.subscription_tier ?? "free",
								until: profile.subscription_until,
								onChange: refreshProfile
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KycCard, {
								status: profile.kyc_status,
								onUpload: refreshProfile
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminCodeCard, { onRedeemed: refreshProfile })
						]
					})
				]
			})]
		})]
	});
}
function WalletCard({ balance, onTopup }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [amount, setAmount] = (0, import_react.useState)("5000");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [method, setMethod] = (0, import_react.useState)("transfer");
	const [confirming, setConfirming] = (0, import_react.useState)(false);
	const [expiry, setExpiry] = (0, import_react.useState)(1800);
	(0, import_react.useEffect)(() => {
		if (!open) {
			setExpiry(1800);
			return;
		}
		const t = setInterval(() => setExpiry((e) => Math.max(0, e - 1)), 1e3);
		return () => clearInterval(t);
	}, [open]);
	const account = {
		bank: "Sterling Bank",
		number: "6982792154",
		name: "Tile Marketplace Ltd"
	};
	const mins = Math.floor(expiry / 60), secs = expiry % 60;
	const submit = async () => {
		setLoading(true);
		setConfirming(true);
		const { error } = await supabase.rpc("topup_wallet", {
			_amount: Number(amount),
			_reference: `paystack-mock-${Date.now()}`
		});
		setLoading(false);
		setConfirming(false);
		if (error) return toast.error(error.message);
		toast.success("Payment confirmed — wallet credited");
		setOpen(false);
		onTopup();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: "p-5 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
				className: "font-semibold flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "h-5 w-5" }), " Wallet"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-3xl font-extrabold mt-2",
				children: formatNaira(balance)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
				open,
				onOpenChange: setOpen,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "w-full mt-4 bg-accent text-accent-foreground hover:bg-accent/90",
						children: "Top up"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
					className: "max-w-2xl p-0 overflow-hidden",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid sm:grid-cols-[180px_1fr]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-muted/40 border-r p-4 space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-bold uppercase tracking-wide text-muted-foreground",
								children: "Payment Method"
							}), [
								{
									id: "transfer",
									label: "Bank Transfer"
								},
								{
									id: "opay",
									label: "Opay"
								},
								{
									id: "card",
									label: "Card"
								}
							].map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setMethod(m.id),
								className: `w-full text-left text-sm px-3 py-2 rounded ${method === m.id ? "bg-card text-foreground border" : "text-muted-foreground hover:bg-card/50"}`,
								children: m.label
							}, m.id))]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-5 bg-card text-foreground space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground",
										children: "Pay"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-2xl font-bold text-primary",
										children: formatNaira(Number(amount))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										type: "number",
										value: amount,
										onChange: (e) => setAmount(e.target.value),
										className: "mt-2"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex gap-2 mt-2",
										children: [
											1e3,
											5e3,
											1e4,
											25e3
										].map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: "outline",
											onClick: () => setAmount(String(v)),
											children: formatNaira(v)
										}, v))
									})
								] }),
								method === "transfer" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-sm text-center text-muted-foreground",
										children: [
											"Transfer ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
												className: "text-foreground",
												children: formatNaira(Number(amount))
											}),
											" from your bank to ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
												className: "text-foreground",
												children: account.name
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "bg-muted/40 rounded-lg p-4 space-y-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												label: "Bank Name",
												value: account.bank
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												label: "Account Number",
												value: account.number,
												copyable: true
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
												label: "Amount",
												value: `${formatNaira(Number(amount))}`,
												copyable: true
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "bg-amber-50 border border-amber-300 text-amber-900 rounded p-3 text-xs",
										children: [
											"Ensure you send the amount indicated only once.",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
											"This account will expire in ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", { children: [
												mins,
												" minutes ",
												secs.toString().padStart(2, "0"),
												" seconds"
											] }),
											". Do not save for future use."
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										onClick: submit,
										disabled: loading || expiry === 0,
										className: "w-full bg-primary text-primary-foreground",
										children: confirming ? "Verifying transfer…" : "I've sent the transfer — confirm"
									})
								] }),
								method === "opay" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-center py-8 space-y-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-muted-foreground",
										children: "Pay with Opay — scan QR in your Opay app"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										onClick: submit,
										disabled: loading,
										className: "bg-primary text-primary-foreground",
										children: "Simulate Opay payment"
									})]
								}),
								method === "card" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, { placeholder: "Card number" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, { placeholder: "MM / YY" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, { placeholder: "CVV" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											onClick: submit,
											disabled: loading,
											className: "w-full bg-primary text-primary-foreground",
											children: ["Pay ", formatNaira(Number(amount))]
										})
									]
								})
							]
						})]
					})
				})]
			})
		]
	});
}
function Row({ label, value, copyable }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-semibold",
			children: value
		})] }), copyable && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			size: "sm",
			variant: "outline",
			onClick: () => {
				navigator.clipboard.writeText(value.replace(/[^\d.]/g, ""));
				toast.success("Copied");
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "h-3 w-3 mr-1" }), "Copy"]
		})]
	});
}
function KycCard({ status, onUpload }) {
	const { user } = useAuth();
	const [busy, setBusy] = (0, import_react.useState)(false);
	const handle = async (e) => {
		const file = e.target.files?.[0];
		if (!file || !user) return;
		setBusy(true);
		try {
			const path = await uploadKyc(user.id, file);
			await supabase.from("profiles").update({
				kyc_status: "pending",
				kyc_doc_url: path
			}).eq("id", user.id);
			toast.success("KYC submitted — awaiting review");
			onUpload();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Upload failed");
		}
		setBusy(false);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: "p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
				className: "font-semibold flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "h-5 w-5 text-accent" }), " KYC verification"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted-foreground mt-1",
				children: ["Current status: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					className: "capitalize ml-1",
					children: status
				})]
			}),
			status === "verified" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-accent font-medium",
				children: "You are a verified vendor."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-3 inline-flex",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "file",
					accept: "image/*,.pdf",
					className: "hidden",
					onChange: handle,
					disabled: busy
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					variant: "outline",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: busy ? "Uploading…" : "Upload government ID" })
				})]
			})
		]
	});
}
function MerchantOnboarding({ onDone }) {
	const { user } = useAuth();
	const [open, setOpen] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [form, setForm] = (0, import_react.useState)({
		business_name: "",
		state: "",
		bio: "",
		whatsapp: "",
		bank_name: "",
		bank_account: "",
		bank_account_name: ""
	});
	const submit = async () => {
		if (!user || !form.business_name) return toast.error("Business name required");
		setBusy(true);
		const { data: slug } = await supabase.rpc("gen_shop_slug", { _name: form.business_name });
		const { error } = await supabase.from("profiles").update({
			...form,
			is_merchant: true,
			shop_slug: slug
		}).eq("id", user.id);
		setBusy(false);
		if (error) return toast.error(error.message);
		toast.success("Your shop is live");
		setOpen(false);
		onDone();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
		className: "p-5 border-accent/40 bg-accent/5",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
				className: "font-semibold flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Store, { className: "h-5 w-5 text-accent" }), " Open your personal shop"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground mt-1",
				children: "Get a shareable shop URL, QR code, WhatsApp button, and Paystack-verified payouts."
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
				open,
				onOpenChange: setOpen,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "bg-accent text-accent-foreground",
						children: "Become a merchant"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "max-h-[85vh] overflow-y-auto",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Merchant onboarding" }) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Business name *" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.business_name,
									onChange: (e) => setForm({
										...form,
										business_name: e.target.value
									})
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "State" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: form.state,
									onValueChange: (v) => setForm({
										...form,
										state: v
									}),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Pick a state" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: LOCATIONS.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: l,
										children: l
									}, l)) })]
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Bio" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
									rows: 3,
									value: form.bio,
									onChange: (e) => setForm({
										...form,
										bio: e.target.value
									})
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "WhatsApp number" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.whatsapp,
									onChange: (e) => setForm({
										...form,
										whatsapp: e.target.value
									}),
									placeholder: "+234…"
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Bank name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: form.bank_name,
										onChange: (e) => setForm({
											...form,
											bank_name: e.target.value
										})
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Account #" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										value: form.bank_account,
										onChange: (e) => setForm({
											...form,
											bank_account: e.target.value
										})
									})] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Account name (Paystack verified — simulated)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: form.bank_account_name,
									onChange: (e) => setForm({
										...form,
										bank_account_name: e.target.value
									})
								})] })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							disabled: busy,
							onClick: submit,
							className: "bg-accent text-accent-foreground",
							children: busy ? "Saving…" : "Open my shop"
						}) })
					]
				})]
			})]
		})
	});
}
function ShopLinkCard({ slug }) {
	const url = typeof window !== "undefined" ? `${window.location.origin}/shop/${slug}` : `/shop/${slug}`;
	const copy = async () => {
		await navigator.clipboard.writeText(url);
		toast.success("Link copied");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: "p-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
			className: "font-semibold flex items-center gap-2 mb-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Store, { className: "h-5 w-5 text-accent" }), " Your shop"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col sm:flex-row items-center gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-white p-2 rounded",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QRCodeSVG, {
					value: url,
					size: 120
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex-1 w-full",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "Public URL"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
						className: "block text-accent break-all text-sm mt-1",
						children: url
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2 mt-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							onClick: copy,
							variant: "outline",
							size: "sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "h-3 w-3 mr-1" }), "Copy link"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							size: "sm",
							className: "bg-accent text-accent-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/shop/$slug",
								params: { slug },
								children: "Visit shop"
							})
						})]
					})
				]
			})]
		})]
	});
}
var PLANS = [
	{
		tier: "lite",
		price: 5e3,
		perks: [
			"Verified Vendor Badge",
			"Custom Shop URL",
			"QR Code For Shop",
			"1 Promoted Listing Every 7 Days",
			"Basic Analytics",
			"Priority Support"
		]
	},
	{
		tier: "pro",
		price: 15e3,
		perks: [
			"Everything in Lite",
			"5 Promoted Listings Monthly",
			"Homepage Priority",
			"Featured Vendor Placement",
			"Product Performance Analytics",
			"Customer Inquiry Dashboard",
			"Social Sharing Tools"
		]
	},
	{
		tier: "vip",
		price: 4e4,
		perks: [
			"Everything in Pro",
			"Unlimited Listings",
			"Unlimited Promotions",
			"Homepage Featured Placement",
			"Multiple Staff Accounts",
			"Advanced Analytics",
			"Google Business Integration",
			"Automated Social Posting"
		]
	}
];
function BillingCard({ tier, until, onChange }) {
	const [busy, setBusy] = (0, import_react.useState)(null);
	const activate = async (t) => {
		setBusy(t);
		const { error } = await supabase.rpc("activate_subscription", { _tier: t });
		setBusy(null);
		if (error) return toast.error(error.message);
		toast.success(`${t.toUpperCase()} plan activated`);
		onChange();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: "p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
				className: "font-semibold flex items-center gap-2 mb-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crown, { className: "h-5 w-5 text-accent" }), " Subscriptions & billing"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted-foreground",
				children: [
					"Current plan: ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						className: "capitalize ml-1",
						children: tier
					}),
					until && tier !== "free" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "ml-2",
						children: ["renews ", new Date(until).toLocaleDateString()]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid md:grid-cols-3 gap-3 mt-4",
				children: PLANS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `p-4 rounded-lg border-2 ${tier === p.tier ? "border-accent" : "border-border"}`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-semibold uppercase",
							children: p.tier
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-2xl font-extrabold text-accent",
							children: [formatNaira(p.price), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-muted-foreground",
								children: "/mo"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "text-xs mt-2 space-y-1 text-muted-foreground",
							children: p.perks.map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["• ", x] }, x))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							disabled: busy === p.tier || tier === p.tier,
							onClick: () => activate(p.tier),
							className: "w-full mt-3 bg-accent text-accent-foreground",
							children: tier === p.tier ? "Active" : busy === p.tier ? "Activating…" : "Activate"
						})
					]
				}, p.tier))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground mt-3",
				children: "Paid from your Tile wallet. Top up first if balance is low."
			})
		]
	});
}
function AdminCodeCard({ onRedeemed }) {
	const { isAdmin } = useAuth();
	const [code, setCode] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	if (isAdmin) return null;
	const submit = async () => {
		if (!code) return;
		setBusy(true);
		const { data, error } = await supabase.rpc("redeem_admin_code", { _code: code.trim() });
		setBusy(false);
		if (error) return toast.error(error.message);
		if (data) {
			toast.success("Admin access granted");
			onRedeemed();
		} else toast.error("Invalid or used code");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: "p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
				className: "font-semibold flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, { className: "h-5 w-5 text-accent" }), " Admin invite code"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground mt-1",
				children: "Have a one-time admin code? Redeem it here to unlock the Admin Cabin."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-2 mt-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					value: code,
					onChange: (e) => setCode(e.target.value),
					placeholder: "TILE-ADMIN-XXXXXX"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					disabled: busy,
					onClick: submit,
					className: "bg-accent text-accent-foreground",
					children: "Redeem"
				})]
			})
		]
	});
}
function ListingRow({ l, onChange }) {
	const expiresAt = l.expires_at ? new Date(l.expires_at) : null;
	const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / 864e5) : null;
	const [stats, setStats] = (0, import_react.useState)(null);
	const [editOpen, setEditOpen] = (0, import_react.useState)(false);
	const [editForm, setEditForm] = (0, import_react.useState)({
		title: l.title,
		description: "",
		price: ""
	});
	(0, import_react.useEffect)(() => {
		let cancel = false;
		supabase.rpc("owner_listing_stats", { _id: l.id }).then(({ data }) => {
			const r = (data ?? [])[0];
			if (!cancel && r) setStats({
				views_count: r.views_count,
				clicks_count: r.clicks_count,
				favorites_count: Number(r.favorites_count)
			});
		});
		return () => {
			cancel = true;
		};
	}, [l.id]);
	const renew = async () => {
		const { error } = await supabase.rpc("renew_listing", { _listing_id: l.id });
		if (error) return toast.error(error.message);
		toast.success("Renewed for 30 days");
		onChange();
	};
	const remove = async () => {
		if (!confirm("Delete this ad permanently?")) return;
		const { error } = await supabase.from("listings").delete().eq("id", l.id);
		if (error) return toast.error(error.message);
		toast.success("Ad deleted");
		onChange();
	};
	const openEdit = async () => {
		const { data } = await supabase.from("listings").select("title,description,price").eq("id", l.id).maybeSingle();
		if (data) setEditForm({
			title: data.title,
			description: data.description,
			price: data.price?.toString() ?? ""
		});
		setEditOpen(true);
	};
	const saveEdit = async () => {
		const { error } = await supabase.from("listings").update({
			title: editForm.title,
			description: editForm.description,
			price: editForm.price ? Number(editForm.price) : null,
			status: "pending"
		}).eq("id", l.id);
		if (error) return toast.error(error.message);
		toast.success("Ad updated — pending re-review");
		setEditOpen(false);
		onChange();
	};
	const promote = async () => {
		const { data: authData } = await supabase.auth.getUser();
		const userId = authData.user?.id;
		if (!userId) {
			toast.error("User not authenticated");
			return;
		}
		const { error } = await supabase.rpc("promote_listing", {
			p_listing_id: l.id,
			p_user_id: userId
		});
		if (error) {
			console.error(error);
			toast.error(error.message);
			return;
		}
		toast.success("Listing promoted successfully");
		onChange();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "py-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex justify-between items-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/listing/$id",
					params: { id: l.id },
					className: "font-medium hover:text-accent",
					children: l.title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: l.status === "approved" ? "default" : l.status === "rejected" ? "destructive" : "secondary",
							className: "capitalize",
							children: l.status
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							className: "bg-primary text-primary-foreground capitalize",
							children: l.type
						}),
						l.status === "approved" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: l.is_promoted ? "default" : "outline",
							className: "h-7",
							disabled: l.is_promoted,
							onClick: promote,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-3 w-3 mr-1" }), l.is_promoted ? "Promoted" : "Promote"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "outline",
							className: "h-7 px-2",
							onClick: openEdit,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "h-3 w-3" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "outline",
							className: "h-7 px-2 text-destructive",
							onClick: remove,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-3 w-3" })
						})
					]
				})]
			}),
			stats && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-1 flex gap-3 text-xs text-muted-foreground",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center gap-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-3 w-3" }),
							stats.views_count,
							" views"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center gap-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MousePointerClick, { className: "h-3 w-3" }),
							stats.clicks_count,
							" clicks"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center gap-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heart, { className: "h-3 w-3" }),
							stats.favorites_count,
							" saves"
						]
					})
				]
			}),
			daysLeft !== null && l.status === "approved" && daysLeft <= 3 && daysLeft > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex items-center gap-2 text-xs bg-destructive/10 text-destructive p-2 rounded",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-3 w-3" }),
					" Expires in ",
					daysLeft,
					" day",
					daysLeft === 1 ? "" : "s",
					".",
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						variant: "outline",
						className: "ml-auto h-7",
						onClick: renew,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "h-3 w-3 mr-1" }), "Renew 30 days"]
					})
				]
			}),
			l.status === "expired" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex items-center gap-2 text-xs bg-muted p-2 rounded",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-3 w-3" }),
					" Expired.",
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						variant: "outline",
						className: "ml-auto h-7",
						onClick: renew,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "h-3 w-3 mr-1" }), "Reactivate"]
					})
				]
			}),
			daysLeft !== null && daysLeft > 3 && l.status === "approved" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-muted-foreground mt-1",
				children: [daysLeft, " days left"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: editOpen,
				onOpenChange: setEditOpen,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Edit ad" }) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Title" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: editForm.title,
								onChange: (e) => setEditForm({
									...editForm,
									title: e.target.value
								})
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Description" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
								rows: 5,
								value: editForm.description,
								onChange: (e) => setEditForm({
									...editForm,
									description: e.target.value
								})
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Price (₦)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								type: "number",
								value: editForm.price,
								onChange: (e) => setEditForm({
									...editForm,
									price: e.target.value
								})
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: "Edits send the ad back to admin review."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: saveEdit,
						className: "bg-accent text-accent-foreground",
						children: "Save changes"
					}) })
				] })
			})
		]
	});
}
//#endregion
export { Dashboard as component };
