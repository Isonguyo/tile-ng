import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-B0U85Udx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as useAuth } from "./auth-context-ufRsuJHL.mjs";
import { n as cn, t as Button } from "./button-DRsC1qZi.mjs";
import { _ as useNavigate, g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { I as MailCheck, O as Phone, X as Eye, Z as EyeOff, _ as ShoppingBag, dt as Briefcase, et as Circle, i as Wrench, p as Store, z as LoaderCircle } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Input } from "./input-DicJzR9-.mjs";
import { t as Label } from "./label-B4PTMSG2.mjs";
import { r as useForm, t as u } from "../_libs/@hookform/resolvers+[...].mjs";
import { n as friendlyAuthError, t as AuthLayout } from "./auth-layout-jFihKfkU.mjs";
import { a as signupSchema, t as accountTypes } from "./auth-schemas-DBGbn7o4.mjs";
import { t as OAuthButtons } from "./oauth-buttons-BxN_vBQE.mjs";
import { n as scorePassword, t as PasswordStrength } from "./password-strength-hg-e5DDV.mjs";
import { n as RadioGroupIndicator, r as RadioGroupItem$1, t as RadioGroup$1 } from "../_libs/radix-ui__react-radio-group.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/signup-CRHWXwFY.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var RadioGroup = import_react.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadioGroup$1, {
		className: cn("grid gap-2", className),
		...props,
		ref
	});
});
RadioGroup.displayName = RadioGroup$1.displayName;
var RadioGroupItem = import_react.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadioGroupItem$1, {
		ref,
		className: cn("aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", className),
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadioGroupIndicator, {
			className: "flex items-center justify-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, { className: "h-3.5 w-3.5 fill-primary" })
		})
	});
});
RadioGroupItem.displayName = RadioGroupItem$1.displayName;
function EmailVerificationNotice({ email, onResend, busy, cooldown }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-left",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid h-11 w-11 place-items-center rounded-full bg-emerald-500/15 text-emerald-600",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MailCheck, { className: "h-5 w-5" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-lg font-semibold",
				children: "Verify your email"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: [
					"We’ve sent a confirmation link to ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-semibold text-foreground",
						children: email ?? "your inbox"
					}),
					"."
				]
			})] })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-2 sm:flex-row",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				onClick: onResend,
				disabled: busy || cooldown > 0,
				className: "w-full sm:w-auto",
				children: cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				asChild: true,
				variant: "outline",
				className: "w-full sm:w-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/login",
					children: "Back to login"
				})
			})]
		})]
	});
}
var typeIcons = {
	buyer: ShoppingBag,
	merchant: Store,
	artisan: Wrench
};
function SignupPage() {
	const nav = useNavigate();
	const { user, loading } = useAuth();
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [showPassword, setShowPassword] = (0, import_react.useState)(false);
	const [showConfirm, setShowConfirm] = (0, import_react.useState)(false);
	const [emailSent, setEmailSent] = (0, import_react.useState)(false);
	const [cooldown, setCooldown] = (0, import_react.useState)(0);
	const { register, handleSubmit, watch, setValue, formState: { errors, isValid } } = useForm({
		resolver: u(signupSchema),
		mode: "onChange",
		defaultValues: {
			full_name: "",
			email: "",
			password: "",
			confirm_password: "",
			phone_number: "",
			business_name: "",
			account_type: "buyer"
		}
	});
	const password = watch("password");
	const email = watch("email");
	const accountType = watch("account_type");
	(0, import_react.useEffect)(() => {
		if (!loading && user) nav({ to: "/dashboard" });
	}, [
		loading,
		nav,
		user
	]);
	(0, import_react.useEffect)(() => {
		if (!cooldown) return;
		const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1e3);
		return () => window.clearTimeout(timer);
	}, [cooldown]);
	const onSubmit = async (values) => {
		if (busy) return;
		if (scorePassword(values.password).score < 3) {
			toast.error("Choose a stronger password before continuing.");
			return;
		}
		setBusy(true);
		const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/verify-email` : void 0;
		const { data, error } = await supabase.auth.signUp({
			email: values.email,
			password: values.password,
			options: {
				emailRedirectTo: redirectTo,
				data: {
					full_name: values.full_name,
					account_type: values.account_type,
					phone_number: values.phone_number || null,
					business_name: values.business_name || null
				}
			}
		});
		setBusy(false);
		if (error) {
			toast.error(friendlyAuthError(error.message));
			return;
		}
		if (data.session) {
			toast.success("Account created. You’re ready to explore Tile.");
			nav({ to: "/dashboard" });
			return;
		}
		setEmailSent(true);
		toast.success("Account created. Please verify your email to continue.");
	};
	const resendEmail = async () => {
		if (!email) {
			toast.error("Enter your email before requesting another verification link.");
			return;
		}
		setBusy(true);
		const { error } = await supabase.auth.resend({
			type: "signup",
			email
		});
		setBusy(false);
		if (error) {
			toast.error(friendlyAuthError(error.message));
			return;
		}
		toast.success("Verification email sent.");
		setCooldown(60);
	};
	const canSubmit = (0, import_react.useMemo)(() => Boolean(watch("full_name") && watch("email") && password && watch("confirm_password") && isValid), [
		isValid,
		password,
		watch
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthLayout, {
		title: "Create your account",
		description: "Join Tile to buy, sell, and discover trusted goods and services across Nigeria.",
		backTo: "/",
		backLabel: "Back home",
		compact: true,
		children: emailSent ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmailVerificationNotice, {
			email,
			onResend: resendEmail,
			busy,
			cooldown
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-6 text-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "Build your profile and start trading with confidence"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: handleSubmit(onSubmit),
				className: "space-y-4",
				noValidate: true,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "I’m signing up as" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadioGroup, {
							value: accountType,
							onValueChange: (value) => setValue("account_type", value),
							className: "grid gap-2 sm:grid-cols-3",
							children: accountTypes.map(({ value, label, hint }) => {
								const Icon = typeIcons[value];
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: `cursor-pointer rounded-xl border p-3 text-left transition-all ${accountType === value ? "border-primary bg-primary/5 ring-2 ring-primary" : "hover:border-primary/50"}`,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RadioGroupItem, {
											value,
											className: "sr-only"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "mb-2 h-5 w-5 text-primary" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-semibold",
											children: label
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-[11px] text-muted-foreground",
											children: hint
										})
									]
								}, value);
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "full_name",
								children: "Full name"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "full_name",
								autoComplete: "name",
								...register("full_name")
							}),
							errors.full_name ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-red-600",
								children: errors.full_name.message
							}) : null
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "email",
								children: "Email address"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "email",
								type: "email",
								autoComplete: "email",
								...register("email")
							}),
							errors.email ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-red-600",
								children: errors.email.message
							}) : null
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "phone_number",
								children: "Phone number"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "phone_number",
									className: "pl-9",
									...register("phone_number")
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "business_name",
								children: "Business name"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Briefcase, { className: "pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "business_name",
									className: "pl-9",
									...register("business_name")
								})]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "password",
								children: "Password"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "password",
									type: showPassword ? "text" : "password",
									autoComplete: "new-password",
									...register("password")
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-label": showPassword ? "Hide password" : "Show password",
									onClick: () => setShowPassword((value) => !value),
									className: "absolute right-3 top-2.5 text-muted-foreground transition-colors hover:text-foreground",
									children: showPassword ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-4 w-4" })
								})]
							}),
							errors.password ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-red-600",
								children: errors.password.message
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PasswordStrength, { password })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "confirm_password",
								children: "Confirm password"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "confirm_password",
									type: showConfirm ? "text" : "password",
									autoComplete: "new-password",
									...register("confirm_password")
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-label": showConfirm ? "Hide confirmation password" : "Show confirmation password",
									onClick: () => setShowConfirm((value) => !value),
									className: "absolute right-3 top-2.5 text-muted-foreground transition-colors hover:text-foreground",
									children: showConfirm ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-4 w-4" })
								})]
							}),
							errors.confirm_password ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-red-600",
								children: errors.confirm_password.message
							}) : null
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "submit",
						disabled: busy || !canSubmit,
						className: "w-full bg-accent text-accent-foreground hover:bg-accent/90",
						children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }) : null, busy ? "Creating account…" : "Create account"]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative my-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-0 flex items-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-full border-t" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "relative flex justify-center text-xs uppercase",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "bg-background px-2 text-muted-foreground",
						children: "or"
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OAuthButtons, { disabled: busy }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-6 text-center text-sm text-muted-foreground",
				children: ["Already have an account? ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/login",
					className: "font-semibold text-primary hover:underline",
					children: "Sign in"
				})]
			})
		] })
	});
}
//#endregion
export { SignupPage as component };
