import { i as __toESM } from "../_runtime.mjs";
import { t as supabase } from "./client-B0U85Udx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as Button } from "./button-Bq5vK6RO.mjs";
import { _ as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { H as Lock, U as LoaderCircle, it as EyeOff, rt as Eye } from "../_libs/lucide-react.mjs";
import { t as Input } from "./input-B8Q2ztVi.mjs";
import { t as Label } from "./label-DBD1bRRP.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { r as useForm, t as u } from "../_libs/@hookform/resolvers+[...].mjs";
import { n as friendlyAuthError, t as AuthLayout } from "./auth-layout-BPtfkEUS.mjs";
import { i as resetPasswordSchema } from "./auth-schemas-DBGbn7o4.mjs";
import { n as scorePassword, t as PasswordStrength } from "./password-strength-BzvLbvZO.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/reset-password-BqawBkp5.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ResetPage() {
	const nav = useNavigate();
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [ready, setReady] = (0, import_react.useState)(false);
	const [showPassword, setShowPassword] = (0, import_react.useState)(false);
	const [showConfirm, setShowConfirm] = (0, import_react.useState)(false);
	const { register, handleSubmit, watch, formState: { errors, isValid } } = useForm({
		resolver: u(resetPasswordSchema),
		mode: "onChange",
		defaultValues: {
			password: "",
			confirm_password: ""
		}
	});
	const password = watch("password");
	(0, import_react.useEffect)(() => {
		const { data: sub } = supabase.auth.onAuthStateChange((event) => {
			if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
		});
		supabase.auth.getSession().then(({ data }) => {
			if (data.session) setReady(true);
		});
		return () => sub.subscription.unsubscribe();
	}, []);
	const submit = async (values) => {
		if (scorePassword(values.password).score < 3) {
			toast.error("Choose a stronger password before continuing.");
			return;
		}
		setBusy(true);
		const { error } = await supabase.auth.updateUser({ password: values.password });
		setBusy(false);
		if (error) {
			toast.error(friendlyAuthError(error.message));
			return;
		}
		toast.success("Password updated successfully.");
		nav({ to: "/login" });
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AuthLayout, {
		title: "Set a new password",
		description: "Protect your Tile account with a strong password you can remember.",
		backTo: "/login",
		backLabel: "Back to sign in",
		compact: true,
		children: [!ready ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700",
			children: "Open this page from the secure reset link in your email so we can update your password safely."
		}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			onSubmit: handleSubmit(submit),
			className: "mt-6 space-y-4",
			noValidate: true,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "password",
							children: "New password"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "password",
									type: showPassword ? "text" : "password",
									autoComplete: "new-password",
									className: "pl-9 pr-10",
									...register("password")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-label": showPassword ? "Hide password" : "Show password",
									onClick: () => setShowPassword((value) => !value),
									className: "absolute right-3 top-2.5 text-muted-foreground transition-colors hover:text-foreground",
									children: showPassword ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-4 w-4" })
								})
							]
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
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "confirm_password",
									type: showConfirm ? "text" : "password",
									autoComplete: "new-password",
									className: "pl-9 pr-10",
									...register("confirm_password")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-label": showConfirm ? "Hide confirmation password" : "Show confirmation password",
									onClick: () => setShowConfirm((value) => !value),
									className: "absolute right-3 top-2.5 text-muted-foreground transition-colors hover:text-foreground",
									children: showConfirm ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-4 w-4" })
								})
							]
						}),
						errors.confirm_password ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-red-600",
							children: errors.confirm_password.message
						}) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					type: "submit",
					disabled: busy || !ready || !isValid,
					className: "w-full",
					children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }) : null, busy ? "Updating password…" : "Update password"]
				})
			]
		})]
	});
}
//#endregion
export { ResetPage as component };
