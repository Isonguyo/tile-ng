import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { c as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { n as cn } from "./button-DRsC1qZi.mjs";
import { et as Circle, st as Check } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/password-strength-hg-e5DDV.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var rules = [
	{
		key: "length",
		label: "8+ characters"
	},
	{
		key: "uppercase",
		label: "Uppercase"
	},
	{
		key: "lowercase",
		label: "Lowercase"
	},
	{
		key: "number",
		label: "Number"
	},
	{
		key: "special",
		label: "Special character"
	}
];
function PasswordStrength({ password }) {
	const score = (0, import_react.useMemo)(() => {
		if (!password) return 0;
		let value = 0;
		if (password.length >= 8) value += 1;
		if (/[A-Z]/.test(password)) value += 1;
		if (/[a-z]/.test(password)) value += 1;
		if (/\d/.test(password)) value += 1;
		if (/[^A-Za-z0-9]/.test(password)) value += 1;
		if (/^(.)\1+$/.test(password)) value = Math.min(value, 1);
		return Math.min(value, 5);
	}, [password]);
	const label = [
		"Weak",
		"Fair",
		"Good",
		"Strong",
		"Excellent"
	][Math.min(score, 4)] ?? "Weak";
	const tone = [
		"bg-red-500",
		"bg-amber-500",
		"bg-blue-500",
		"bg-emerald-500",
		"bg-emerald-600"
	][Math.min(score, 4)] ?? "bg-red-500";
	const met = [
		password.length >= 8,
		/[A-Z]/.test(password),
		/[a-z]/.test(password),
		/\d/.test(password),
		/[^A-Za-z0-9]/.test(password)
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2 rounded-xl border border-border/70 bg-background/70 p-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between text-xs font-medium",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-muted-foreground",
					children: "Password strength"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("font-semibold", score >= 4 ? "text-emerald-600" : score >= 2 ? "text-amber-600" : "text-red-600"),
					children: label
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex gap-1",
				children: [
					0,
					1,
					2,
					3,
					4
				].map((step) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn("h-1.5 flex-1 rounded-full transition-colors", step < score ? tone : "bg-muted") }, step))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-2 sm:grid-cols-2",
				children: rules.map((rule, index) => {
					const valid = met[index];
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 text-xs text-muted-foreground",
						children: [valid ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-3.5 w-3.5 text-emerald-500" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, { className: "h-3.5 w-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: valid ? "text-foreground" : void 0,
							children: rule.label
						})]
					}, rule.key);
				})
			})
		]
	});
}
function scorePassword(password) {
	if (!password) return {
		score: 0,
		label: "Weak"
	};
	let value = 0;
	if (password.length >= 8) value += 1;
	if (/[A-Z]/.test(password)) value += 1;
	if (/[a-z]/.test(password)) value += 1;
	if (/\d/.test(password)) value += 1;
	if (/[^A-Za-z0-9]/.test(password)) value += 1;
	if (/^(.)\1+$/.test(password)) value = Math.min(value, 1);
	return {
		score: Math.min(value, 5),
		label: [
			"Weak",
			"Fair",
			"Good",
			"Strong",
			"Excellent"
		][Math.min(value, 4)] ?? "Weak"
	};
}
//#endregion
export { scorePassword as n, PasswordStrength as t };
