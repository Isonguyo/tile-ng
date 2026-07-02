import { a as objectType, i as literalType, o as stringType, r as enumType, s as ZodIssueCode } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-schemas-DBGbn7o4.js
var loginSchema = objectType({
	email: stringType().trim().min(1, "Enter your email address").email("Enter a valid email address"),
	password: stringType().min(1, "Enter your password")
});
var signupSchema = objectType({
	full_name: stringType().trim().min(2, "Enter your full name").max(80, "Name is too long"),
	email: stringType().trim().min(1, "Enter your email address").email("Enter a valid email address"),
	password: stringType().min(8, "Use at least 8 characters").max(72, "Password is too long"),
	confirm_password: stringType().min(1, "Please confirm your password"),
	phone_number: stringType().trim().max(30).optional().or(literalType("")),
	business_name: stringType().trim().max(80).optional().or(literalType("")),
	account_type: enumType([
		"buyer",
		"merchant",
		"artisan"
	])
}).superRefine((value, ctx) => {
	if (value.password !== value.confirm_password) ctx.addIssue({
		code: ZodIssueCode.custom,
		path: ["confirm_password"],
		message: "Passwords do not match"
	});
});
var forgotPasswordSchema = objectType({ email: stringType().trim().min(1, "Enter your email address").email("Enter a valid email address") });
var resetPasswordSchema = objectType({
	password: stringType().min(8, "Use at least 8 characters").max(72, "Password is too long"),
	confirm_password: stringType().min(1, "Please confirm your password")
}).superRefine((value, ctx) => {
	if (value.password !== value.confirm_password) ctx.addIssue({
		code: ZodIssueCode.custom,
		path: ["confirm_password"],
		message: "Passwords do not match"
	});
});
var accountTypes = [
	{
		value: "buyer",
		label: "Buyer",
		hint: "Shop for products and services"
	},
	{
		value: "merchant",
		label: "Seller",
		hint: "Open a shop and list goods"
	},
	{
		value: "artisan",
		label: "Artisan",
		hint: "Offer services and book jobs"
	}
];
//#endregion
export { signupSchema as a, resetPasswordSchema as i, forgotPasswordSchema as n, loginSchema as r, accountTypes as t };
