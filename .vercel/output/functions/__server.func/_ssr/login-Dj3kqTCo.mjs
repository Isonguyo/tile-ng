import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-B0U85Udx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as useAuth } from "./auth-context-ufRsuJHL.mjs";
import { t as Button } from "./button-Bq5vK6RO.mjs";
import { _ as useNavigate, g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { H as Lock, U as LoaderCircle, it as EyeOff, rt as Eye, z as Mail } from "../_libs/lucide-react.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { t as Label } from "./label-DBD1bRRP.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { r as useForm, t as u } from "../_libs/@hookform/resolvers+[...].mjs";
import { n as friendlyAuthError, t as AuthLayout } from "./auth-layout-BPtfkEUS.mjs";
import { r as loginSchema } from "./auth-schemas-DBGbn7o4.mjs";
import { t as OAuthButtons } from "./oauth-buttons-DpODx8GX.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-Dj3kqTCo.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function LoginPage() {
	const nav = useNavigate();
	const { user, loading } = useAuth();
	const [showPassword, setShowPassword] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const { register, handleSubmit, formState: { errors, isValid }, watch } = useForm({
		resolver: u(loginSchema),
		mode: "onChange",
		defaultValues: {
			email: "",
			password: ""
		}
	});
	const email = watch("email");
	const password = watch("password");
	(0, import_react.useEffect)(() => {
		if (!loading && user) nav({ to: "/dashboard" });
	}, [
		loading,
		nav,
		user
	]);
	const onSubmit = async (values) => {
		if (busy) return;
		setBusy(true);
		const { error } = await supabase.auth.signInWithPassword({
			email: values.email,
			password: values.password
		});
		setBusy(false);
		if (error) {
			toast.error(friendlyAuthError(error.message));
			return;
		}
		toast.success("Welcome back to Tile");
		nav({ to: "/dashboard" });
	};
	const canSubmit = (0, import_react.useMemo)(() => Boolean(email && password && isValid), [
		email,
		password,
		isValid
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AuthLayout, {
		title: "Welcome back",
		description: "Sign in to continue managing your listings, messages, and profile on Tile.",
		backTo: "/",
		backLabel: "Back home",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-6 text-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "Access your trusted marketplace workspace"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: handleSubmit(onSubmit),
				className: "space-y-4",
				noValidate: true,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "email",
								children: "Email address"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "email",
									type: "email",
									autoComplete: "email",
									className: "pl-9",
									...register("email")
								})]
							}),
							errors.email ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-red-600",
								children: errors.email.message
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: "We’ll keep your account secure with Supabase auth."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "password",
									children: "Password"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/forgot-password",
									className: "text-xs font-semibold text-primary hover:underline",
									children: "Forgot password?"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "password",
										type: showPassword ? "text" : "password",
										autoComplete: "current-password",
										className: "pl-9 pr-10",
										...register("password")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										"aria-label": showPassword ? "Hide password" : "Show password",
										onClick: () => setShowPassword((v) => !v),
										className: "absolute right-3 top-2.5 text-muted-foreground transition-colors hover:text-foreground",
										children: showPassword ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-4 w-4" })
									})
								]
							}),
							errors.password ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-red-600",
								children: errors.password.message
							}) : null
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "submit",
						disabled: busy || !canSubmit,
						className: "w-full bg-accent text-accent-foreground hover:bg-accent/90",
						children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }) : null, busy ? "Signing in…" : "Sign in"]
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
				children: ["New to Tile? ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/signup",
					className: "font-semibold text-primary hover:underline",
					children: "Create an account"
				})]
			})
		]
	});
}
//#endregion
export { LoginPage as component };
