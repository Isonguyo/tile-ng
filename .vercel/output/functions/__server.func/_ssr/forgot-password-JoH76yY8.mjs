import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-B0U85Udx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./button-Bq5vK6RO.mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { U as LoaderCircle, ct as CircleCheck, z as Mail } from "../_libs/lucide-react.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { t as Label } from "./label-DBD1bRRP.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { r as useForm, t as u } from "../_libs/@hookform/resolvers+[...].mjs";
import { n as friendlyAuthError, t as AuthLayout } from "./auth-layout-BPtfkEUS.mjs";
import { n as forgotPasswordSchema } from "./auth-schemas-DBGbn7o4.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/forgot-password-JoH76yY8.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ForgotPage() {
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [sent, setSent] = (0, import_react.useState)(false);
	const { register, handleSubmit, watch, formState: { errors, isValid } } = useForm({
		resolver: u(forgotPasswordSchema),
		mode: "onChange",
		defaultValues: { email: "" }
	});
	const email = watch("email");
	const submit = async (values) => {
		setBusy(true);
		const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/reset-password` : void 0;
		const { error } = await supabase.auth.resetPasswordForEmail(values.email, { redirectTo });
		setBusy(false);
		if (error) {
			toast.error(friendlyAuthError(error.message));
			return;
		}
		setSent(true);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AuthLayout, {
		title: "Forgot password?",
		description: "Enter your email and we’ll send a secure reset link to your inbox.",
		backTo: "/login",
		backLabel: "Back to sign in",
		compact: true,
		children: [sent ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "mt-0.5 h-5 w-5 text-emerald-600" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-semibold",
					children: "Check your inbox"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: [
						"If ",
						email,
						" is registered, we’ve sent a secure reset link."
					]
				})] })]
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: handleSubmit(submit),
			className: "space-y-4",
			noValidate: true,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
						children: "We’ll never share your email with third parties."
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				type: "submit",
				disabled: busy || !isValid,
				className: "w-full",
				children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }) : null, busy ? "Sending reset link…" : "Send reset link"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-6 text-center text-sm text-muted-foreground",
			children: ["Remembered it? ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/login",
				className: "font-semibold text-primary hover:underline",
				children: "Sign in"
			})]
		})]
	});
}
//#endregion
export { ForgotPage as component };
