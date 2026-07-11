import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-B0U85Udx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as useAuth } from "./auth-context-ufRsuJHL.mjs";
import { n as cn, t as Button } from "./button-Bq5vK6RO.mjs";
import { t as Card } from "./card-CzXpCsbD.mjs";
import { _ as useNavigate, g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { R as MapPin, St as BadgeDollarSign, Y as Images, Z as House, _t as CalendarDays, ct as CircleCheck, dt as ChevronRight, ft as ChevronLeft, g as Star, gt as Camera, l as UserRound, mt as Check, n as Zap, r as X, vt as Briefcase } from "../_libs/lucide-react.mjs";
import { n as CheckboxIndicator, t as Checkbox$1 } from "../_libs/@radix-ui/react-checkbox+[...].mjs";
import { t as SiteHeader } from "./site-header-DuVnqON_.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { t as Label } from "./label-DBD1bRRP.mjs";
import { t as Progress } from "./progress-DOIEKRJF.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-Dg1urBTx.mjs";
import { t as Textarea } from "./textarea-kko37XEX.mjs";
import { t as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as objectType, n as coerce, o as stringType, t as booleanType } from "../_libs/zod.mjs";
import { n as Controller, r as useForm, t as u } from "../_libs/@hookform/resolvers+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/create-oWqNNkIf.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Checkbox = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox$1, {
	ref,
	className: cn("grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckboxIndicator, {
		className: cn("grid place-content-center text-current"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" })
	})
}));
Checkbox.displayName = Checkbox$1.displayName;
var ARTISAN_CATEGORIES = [
	{
		id: "electrician",
		label: "Electrician",
		icon: "⚡"
	},
	{
		id: "plumber",
		label: "Plumber",
		icon: "🚰"
	},
	{
		id: "carpenter",
		label: "Carpenter",
		icon: "🪚"
	},
	{
		id: "mechanic",
		label: "Mechanic",
		icon: "🔧"
	},
	{
		id: "ac-technician",
		label: "AC Technician",
		icon: "❄️"
	},
	{
		id: "welder",
		label: "Welder",
		icon: "🔥"
	},
	{
		id: "painter",
		label: "Painter",
		icon: "🎨"
	},
	{
		id: "tiler",
		label: "Tiler",
		icon: "🧱"
	},
	{
		id: "roofer",
		label: "Roofer",
		icon: "🏠"
	},
	{
		id: "bricklayer",
		label: "Bricklayer",
		icon: "🧱"
	},
	{
		id: "tailor",
		label: "Tailor / Fashion Designer",
		icon: "🧵"
	},
	{
		id: "shoemaker",
		label: "Shoemaker",
		icon: "👞"
	},
	{
		id: "hairdresser",
		label: "Hair Stylist",
		icon: "💇"
	},
	{
		id: "barber",
		label: "Barber",
		icon: "💈"
	},
	{
		id: "makeup-artist",
		label: "Makeup Artist",
		icon: "💄"
	},
	{
		id: "photographer",
		label: "Photographer",
		icon: "📷"
	},
	{
		id: "videographer",
		label: "Videographer",
		icon: "🎥"
	},
	{
		id: "graphic-designer",
		label: "Graphic Designer",
		icon: "🎨"
	},
	{
		id: "ui-designer",
		label: "UI/UX Designer",
		icon: "🖥️"
	},
	{
		id: "web-developer",
		label: "Web Developer",
		icon: "💻"
	},
	{
		id: "mobile-developer",
		label: "Mobile App Developer",
		icon: "📱"
	},
	{
		id: "generator-repair",
		label: "Generator Repair",
		icon: "⚙️"
	},
	{
		id: "phone-repair",
		label: "Phone Repair",
		icon: "📱"
	},
	{
		id: "computer-repair",
		label: "Computer Repair",
		icon: "💻"
	},
	{
		id: "solar-installer",
		label: "Solar Installer",
		icon: "☀️"
	},
	{
		id: "cleaner",
		label: "Cleaner",
		icon: "🧹"
	},
	{
		id: "security",
		label: "Security Service",
		icon: "🛡️"
	},
	{
		id: "chef",
		label: "Chef / Caterer",
		icon: "👨‍🍳"
	},
	{
		id: "event-planner",
		label: "Event Planner",
		icon: "🎉"
	},
	{
		id: "dj",
		label: "DJ",
		icon: "🎧"
	},
	{
		id: "mc",
		label: "Master of Ceremony",
		icon: "🎤"
	},
	{
		id: "private-teacher",
		label: "Private Tutor",
		icon: "📚"
	},
	{
		id: "laundry",
		label: "Laundry Service",
		icon: "🧺"
	},
	{
		id: "delivery",
		label: "Dispatch Rider",
		icon: "🏍️"
	},
	{
		id: "moving-service",
		label: "Moving Service",
		icon: "🚚"
	}
];
var schema = objectType({
	full_name: stringType().min(2, "Enter your full name"),
	profession: stringType().min(1, "Select your profession"),
	bio: stringType().min(30, "Tell customers about yourself (minimum 30 characters)").max(500, "Bio is too long"),
	phone: stringType().min(10, "Enter a valid phone number"),
	whatsapp: stringType().optional(),
	state: stringType().min(1, "Select a state"),
	lga: stringType().min(1, "Select an LGA"),
	years_experience: coerce.number().min(0).max(80),
	is_available: booleanType(),
	starting_price: coerce.number().optional(),
	offers_home_service: booleanType(),
	offers_emergency_service: booleanType(),
	available_weekends: booleanType()
});
function ArtisanCreatePage() {
	const { user, loading } = useAuth();
	const navigate = useNavigate();
	const [step, setStep] = (0, import_react.useState)(1);
	const [profilePhoto, setProfilePhoto] = (0, import_react.useState)(null);
	const [portfolioImages, setPortfolioImages] = (0, import_react.useState)([]);
	const [submitting, setSubmitting] = (0, import_react.useState)(false);
	const avatarInputRef = (0, import_react.useRef)(null);
	const portfolioInputRef = (0, import_react.useRef)(null);
	const form = useForm({
		resolver: u(schema),
		defaultValues: {
			full_name: "",
			profession: "",
			bio: "",
			phone: "",
			whatsapp: "",
			state: "",
			lga: "",
			years_experience: 0,
			is_available: true,
			starting_price: void 0,
			offers_home_service: true,
			offers_emergency_service: false,
			available_weekends: false
		}
	});
	const watch = form.watch();
	const { data: states = [] } = useQuery({
		queryKey: ["artisan-states"],
		queryFn: async () => {
			const { data, error } = await supabase.from("states").select("id, name").order("name");
			if (error) throw error;
			return data ?? [];
		}
	});
	const { data: lgas = [] } = useQuery({
		queryKey: ["artisan-lgas", watch.state],
		enabled: !!watch.state,
		queryFn: async () => {
			const { data, error } = await supabase.from("lgas").select("id, name").eq("state_id", watch.state).order("name");
			if (error) throw error;
			return data ?? [];
		}
	});
	const handleValidateBasicInfo = async () => {
		if (await form.trigger([
			"full_name",
			"profession",
			"bio",
			"phone",
			"state",
			"lga",
			"years_experience"
		])) setStep(3);
		else if (form.formState.errors.bio) toast.error("Please tell customers more about yourself. Your bio needs at least 30 characters.");
		else toast.error("Please complete all required fields correctly.");
	};
	const handleAdvanceToReview = () => {
		if (!profilePhoto) {
			toast.error("Please attach a professional profile photo.");
			return;
		}
		if (portfolioImages.length < 3) {
			toast.error("Please upload at least 3 samples of your previous work.");
			return;
		}
		setStep(4);
	};
	const selectedStateName = states.find((s) => s.id === watch.state)?.name || "";
	const selectedLgaName = lgas.find((l) => l.id === watch.lga)?.name || "";
	const onSubmit = async (values) => {
		if (!user) return;
		setSubmitting(true);
		try {
			let avatarUrl = "";
			let portfolioUrls = [];
			if (profilePhoto) {
				const fileExt = profilePhoto.name.split(".").pop();
				const filePath = `${user.id}/artisan-avatar-${Date.now()}.${fileExt}`;
				const { error: avatarErr } = await supabase.storage.from("listings").upload(filePath, profilePhoto, {
					cacheControl: "3600",
					upsert: true
				});
				if (avatarErr) throw avatarErr;
				const { data: { publicUrl } } = supabase.storage.from("listings").getPublicUrl(filePath);
				avatarUrl = publicUrl;
			}
			if (portfolioImages.length > 0) for (const file of portfolioImages) {
				const fileExt = file.name.split(".").pop();
				const filePath = `${user.id}/artisan-portfolio-${crypto.randomUUID()}.${fileExt}`;
				const { error: portErr } = await supabase.storage.from("listings").upload(filePath, file);
				if (portErr) throw portErr;
				const { data: { publicUrl } } = supabase.storage.from("listings").getPublicUrl(filePath);
				portfolioUrls.push(publicUrl);
			}
			const { error } = await supabase.from("profiles").update({
				full_name: values.full_name,
				profession: values.profession,
				bio: values.bio,
				phone: values.phone,
				whatsapp: values.whatsapp || null,
				state: selectedStateName,
				lga: selectedLgaName,
				years_experience: values.years_experience,
				is_available: values.is_available,
				is_artisan: true,
				starting_price: values.starting_price || null,
				offers_home_service: values.offers_home_service,
				offers_emergency_service: values.offers_emergency_service,
				available_weekends: values.available_weekends,
				avatar_url: avatarUrl || void 0,
				profile_photo: avatarUrl || void 0,
				portfolio_images: portfolioUrls.length > 0 ? portfolioUrls : void 0
			}).eq("id", user.id);
			if (error) throw error;
			toast.success("Welcome to Tile Pro! Your specialized profile is officially live.");
			navigate({ to: "/" });
		} catch (err) {
			console.error(err);
			toast.error(err?.message || "Could not synchronize profile settings.");
		} finally {
			setSubmitting(false);
		}
	};
	if (!loading && !user) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "container mx-auto max-w-xl px-4 py-24 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-3xl font-bold",
					children: "Become a Tile Artisan"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-muted-foreground",
					children: "Create your professional profile so customers can discover and contact you anywhere in Nigeria."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					className: "mt-8",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/auth",
						children: "Sign in to continue"
					})
				})
			]
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "container mx-auto max-w-3xl px-4 py-10",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-8 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-4xl font-bold tracking-tight",
						children: "Become a Tile Pro"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-muted-foreground",
						children: "Join the professional network of verified service providers and installers across Nigeria."
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, {
						value: step * 25,
						className: "h-2"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-center mt-2 text-muted-foreground font-medium",
						children: [
							"Step ",
							step,
							" of 4"
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					className: "overflow-hidden border shadow-sm",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: form.handleSubmit(onSubmit),
						children: [
							step === 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-8",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-center",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "flex justify-center mb-5",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, { className: "h-16 w-16 text-primary" })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
												className: "text-3xl font-bold",
												children: "Become a Tile Artisan"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-4 text-muted-foreground max-w-lg mx-auto",
												children: "Create your professional profile so customers across Nigeria can discover your skills, view your previous work and contact you directly."
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-10 space-y-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-5 w-5 text-green-600" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Appear in local artisan search results" })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-5 w-5 text-green-600" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Build trust with a complete professional profile" })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-5 w-5 text-green-600" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Showcase photos of your previous projects" })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-5 w-5 text-green-600" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Receive enquiries directly from customers" })]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-10 rounded-xl border bg-muted/30 p-5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "font-semibold mb-4",
											children: "How it works"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-3 text-sm",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "1️⃣ Create your artisan profile" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "2️⃣ Upload your portfolio" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "3️⃣ Customers contact you directly" })
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										className: "w-full mt-10",
										size: "lg",
										type: "button",
										onClick: () => setStep(2),
										children: ["Create My Profile", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "ml-2 h-5 w-5" })]
									})
								]
							}),
							step === 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-8 space-y-6",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "text-2xl font-bold",
										children: "Basic Information"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-muted-foreground mt-2",
										children: "Tell customers who you are and what you do."
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Full Name" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											placeholder: "John Doe",
											...form.register("full_name")
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Profession" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: watch.profession,
											onValueChange: (value) => form.setValue("profession", value, {
												shouldValidate: true,
												shouldDirty: true
											}),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select your profession" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: ARTISAN_CATEGORIES.map((category) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: category.label,
												children: category.label
											}, category.id)) })]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Phone Number" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											placeholder: "08012345678",
											...form.register("phone")
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "WhatsApp Number (Optional)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											placeholder: "08012345678",
											...form.register("whatsapp")
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "State" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: watch.state,
											onValueChange: (value) => {
												form.setValue("state", value, {
													shouldValidate: true,
													shouldDirty: true
												});
												form.setValue("lga", "");
											},
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select State" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: states.map((state) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: state.id,
												children: state.name
											}, state.id)) })]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Local Government Area" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											disabled: !watch.state,
											value: watch.lga,
											onValueChange: (value) => form.setValue("lga", value, {
												shouldValidate: true,
												shouldDirty: true
											}),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select Local Government" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: lgas.map((lga) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
												value: lga.id,
												children: lga.name
											}, lga.id)) })]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Years of Experience" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											type: "number",
											placeholder: "5",
											...form.register("years_experience")
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex justify-between items-center",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Professional Bio" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: `text-xs ${(watch.bio?.length ?? 0) >= 30 ? "text-green-600 font-medium" : "text-muted-foreground"}`,
													children: [watch.bio?.length ?? 0, "/500 characters"]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
												rows: 6,
												maxLength: 500,
												placeholder: "Tell customers about your experience, skills, projects and why they should hire you...",
												...form.register("bio")
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: `text-xs ${(watch.bio?.length ?? 0) >= 30 ? "text-green-600" : "text-orange-600 font-medium"}`,
												children: "Minimum 30 characters required. Tell customers what makes you stand out."
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between pt-4 border-t",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "outline",
											onClick: () => setStep(1),
											type: "button",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "mr-2 h-4 w-4" }), "Back"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											type: "button",
											onClick: handleValidateBasicInfo,
											children: ["Continue", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "ml-2 h-4 w-4" })]
										})]
									})
								]
							}),
							step === 3 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-8 space-y-8",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Images, { className: "h-8 w-8 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "text-2xl font-bold tracking-tight",
											children: "Portfolio & Setup"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-muted-foreground text-sm mt-1",
											children: "This is what customers will look at before they initiate contact with you."
										})] })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
										className: "p-6 border-dashed border-2 flex flex-col items-center bg-muted/5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "h-8 w-8 text-muted-foreground mb-3" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
												className: "font-semibold text-center text-sm flex items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, { className: "h-4 w-4" }), " Profile Photo"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted-foreground text-center mt-1 max-w-xs",
												children: "Upload a clear, welcoming, and professional photo of yourself."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-4 flex flex-col items-center gap-3 w-full max-w-xs",
												children: [
													profilePhoto && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "h-16 w-16 border rounded-full overflow-hidden shadow-inner",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
															src: URL.createObjectURL(profilePhoto),
															alt: "Avatar",
															className: "h-full w-full object-cover"
														})
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														type: "file",
														ref: avatarInputRef,
														accept: "image/*",
														className: "hidden",
														onChange: (e) => {
															if (e.target.files && e.target.files[0]) setProfilePhoto(e.target.files[0]);
														}
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
														variant: "outline",
														className: "w-full",
														type: "button",
														onClick: () => avatarInputRef.current?.click(),
														children: profilePhoto ? "Change Photo" : "Choose Photo"
													})
												]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
										className: "p-6 border-dashed border-2 bg-muted/5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "text-center max-w-md mx-auto mb-4",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
														className: "font-semibold text-sm flex items-center justify-center gap-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Images, { className: "h-4 w-4" }), " Previous Jobs"]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-xs text-muted-foreground mt-1",
														children: "Upload between 3 and 8 clear photos of real setup jobs or projects you have personally completed."
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "text-xs font-semibold mt-2 text-primary",
														children: [portfolioImages.length, "/8 uploaded"]
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-col items-center",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													type: "file",
													ref: portfolioInputRef,
													multiple: true,
													accept: "image/*",
													className: "hidden",
													onChange: (e) => {
														if (!e.target.files) return;
														const uploaded = Array.from(e.target.files);
														setPortfolioImages((prev) => [...prev, ...uploaded].slice(0, 8));
													}
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													variant: "outline",
													className: "w-full max-w-xs",
													type: "button",
													onClick: () => portfolioInputRef.current?.click(),
													children: "Add Portfolio Photos"
												})]
											}),
											portfolioImages.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "grid grid-cols-4 gap-3 mt-5",
												children: portfolioImages.map((file, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "relative rounded-lg overflow-hidden border aspect-square bg-background",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
														src: URL.createObjectURL(file),
														alt: "",
														className: "w-full h-full object-cover"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														onClick: () => setPortfolioImages((p) => p.filter((_, i) => i !== idx)),
														className: "absolute top-1 right-1 bg-black/80 text-white rounded-full p-1 hover:bg-black transition-colors",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-3 w-3" })
													})]
												}, idx))
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2 max-w-sm",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
												htmlFor: "starting_price",
												className: "font-semibold text-sm flex items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeDollarSign, { className: "h-5 w-5 text-muted-foreground" }), " Starting Price (Optional)"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "relative rounded-md shadow-sm",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-muted-foreground text-sm",
														children: "₦"
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													id: "starting_price",
													type: "number",
													className: "pl-7",
													placeholder: "e.g. 15,000",
													...form.register("starting_price")
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[11px] text-muted-foreground",
												children: "Example: Starting from ₦15,000 per square meter or project base rate."
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-4 pt-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											className: "font-semibold text-sm block border-b pb-2",
											children: "Service Terms & Availability Settings"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-start space-x-3 rounded-lg border p-3 shadow-sm bg-background",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Controller, {
														name: "is_available",
														control: form.control,
														render: ({ field }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
															id: "is_available",
															checked: field.value,
															onCheckedChange: field.onChange
														})
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "grid gap-1.5 leading-none",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
															htmlFor: "is_available",
															className: "text-sm font-medium cursor-pointer flex items-center gap-1.5",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, { className: "h-3.5 w-3.5 text-muted-foreground" }), " Available for work"]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-xs text-muted-foreground",
															children: "Instantly show up in customer matching queues."
														})]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-start space-x-3 rounded-lg border p-3 shadow-sm bg-background",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Controller, {
														name: "offers_home_service",
														control: form.control,
														render: ({ field }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
															id: "offers_home_service",
															checked: field.value,
															onCheckedChange: field.onChange
														})
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "grid gap-1.5 leading-none",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
															htmlFor: "offers_home_service",
															className: "text-sm font-medium cursor-pointer flex items-center gap-1.5",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, { className: "h-3.5 w-3.5 text-muted-foreground" }), " Home service"]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-xs text-muted-foreground",
															children: "Open to traveling directly to client construction locations."
														})]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-start space-x-3 rounded-lg border p-3 shadow-sm bg-background",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Controller, {
														name: "offers_emergency_service",
														control: form.control,
														render: ({ field }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
															id: "offers_emergency_service",
															checked: field.value,
															onCheckedChange: field.onChange
														})
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "grid gap-1.5 leading-none",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
															htmlFor: "offers_emergency_service",
															className: "text-sm font-medium cursor-pointer flex items-center gap-1.5",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { className: "h-3.5 w-3.5 text-muted-foreground" }), " Emergency service"]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-xs text-muted-foreground",
															children: "Available for urgent repairs callouts outside standard hours."
														})]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-start space-x-3 rounded-lg border p-3 shadow-sm bg-background",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Controller, {
														name: "available_weekends",
														control: form.control,
														render: ({ field }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
															id: "available_weekends",
															checked: field.value,
															onCheckedChange: field.onChange
														})
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "grid gap-1.5 leading-none",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
															htmlFor: "available_weekends",
															className: "text-sm font-medium cursor-pointer flex items-center gap-1.5",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "h-3.5 w-3.5 text-muted-foreground" }), " Weekend Availability"]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-xs text-muted-foreground",
															children: "Accept appointments over Saturdays and Sundays."
														})]
													})]
												})
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between pt-4 border-t",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "outline",
											onClick: () => setStep(2),
											type: "button",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "mr-2 h-4 w-4" }), "Back"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											type: "button",
											onClick: handleAdvanceToReview,
											disabled: portfolioImages.length < 3,
											children: ["Continue to Review", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "ml-2 h-4 w-4" })]
										})]
									})
								]
							}),
							step === 4 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-8 space-y-6",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "text-2xl font-bold",
										children: "Review Profile Card"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-muted-foreground mt-1 text-sm",
										children: "This is how your professional public profile card appears to customers. Check everything before launching."
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "max-w-md mx-auto w-full border rounded-xl shadow-lg bg-card overflow-hidden",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "bg-primary/5 p-6 flex flex-col items-center text-center relative border-b",
											children: [
												watch.is_available && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "absolute top-4 right-4 bg-green-500/10 text-green-700 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" }), "Available Today"]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "h-24 w-24 rounded-full border-4 border-background overflow-hidden bg-muted shadow-md mb-3",
													children: profilePhoto ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
														src: URL.createObjectURL(profilePhoto),
														alt: "Avatar Preview",
														className: "h-full w-full object-cover"
													}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "h-full w-full flex items-center justify-center bg-muted",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, { className: "h-8 w-8 text-muted-foreground" })
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
													className: "text-xl font-bold text-foreground flex items-center gap-1.5",
													children: watch.full_name || "John Doe"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-sm font-medium text-primary mt-0.5",
													children: watch.profession || "Verified Installer"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "flex items-center gap-0.5 mt-2",
													children: [...Array(5)].map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: `h-4 w-4 ${i < 4 ? "text-amber-500 fill-amber-500" : "text-muted border-muted"}` }, i))
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-4 text-xs font-medium text-muted-foreground",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "flex items-center gap-1",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Briefcase, { className: "h-3.5 w-3.5" }),
															" ",
															watch.years_experience || 0,
															" years experience"
														]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "flex items-center gap-1",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "h-3.5 w-3.5" }),
															" ",
															selectedStateName || "Lagos",
															" • ",
															selectedLgaName || "Ikeja"
														]
													})]
												}),
												watch.starting_price && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "mt-4 bg-background border rounded-lg px-4 py-1.5 text-xs font-bold text-foreground shadow-sm",
													children: ["Starting From ₦", Number(watch.starting_price).toLocaleString()]
												})
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "p-5 space-y-4 text-sm",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
													className: "text-xs font-bold tracking-wider text-muted-foreground uppercase mb-1.5",
													children: "About"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-muted-foreground leading-relaxed italic",
													children: [
														"\"",
														watch.bio || "No profile bio written yet...",
														"\""
													]
												})] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
													className: "text-xs font-bold tracking-wider text-muted-foreground uppercase mb-2",
													children: "Portfolio Showcase"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "grid grid-cols-4 gap-2",
													children: portfolioImages.map((file, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "aspect-square rounded-md overflow-hidden border bg-muted shadow-sm",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
															src: URL.createObjectURL(file),
															alt: "",
															className: "w-full h-full object-cover"
														})
													}, idx))
												})] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "pt-3 border-t grid grid-cols-3 gap-2 text-center text-[11px] font-semibold text-muted-foreground",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: `p-2 rounded-md border ${watch.offers_home_service ? "bg-green-500/5 text-green-700 border-green-200/50" : "opacity-40"}`,
															children: ["Home Service ", watch.offers_home_service ? "✓" : "✗"]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: `p-2 rounded-md border ${watch.offers_emergency_service ? "bg-green-500/5 text-green-700 border-green-200/50" : "opacity-40"}`,
															children: ["Emergency ", watch.offers_emergency_service ? "✓" : "✗"]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: `p-2 rounded-md border ${watch.available_weekends ? "bg-green-500/5 text-green-700 border-green-200/50" : "opacity-40"}`,
															children: ["Weekends ", watch.available_weekends ? "✓" : "✗"]
														})
													]
												})
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between pt-4 border-t",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "outline",
											onClick: () => setStep(3),
											type: "button",
											disabled: submitting,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "mr-2 h-4 w-4" }), "Back"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "submit",
											disabled: submitting,
											children: submitting ? "Publishing Profile..." : "Publish Profile Now"
										})]
									})
								]
							})
						]
					})
				})
			]
		})]
	});
}
//#endregion
export { ArtisanCreatePage as component };
