import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Enter your email address").email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export const signupSchema = z
  .object({
    full_name: z.string().trim().min(2, "Enter your full name").max(80, "Name is too long"),
    email: z
      .string()
      .trim()
      .min(1, "Enter your email address")
      .email("Enter a valid email address"),
    password: z.string().min(8, "Use at least 8 characters").max(72, "Password is too long"),
    confirm_password: z.string().min(1, "Please confirm your password"),
    phone_number: z.string().trim().max(30).optional().or(z.literal("")),
    business_name: z.string().trim().max(80).optional().or(z.literal("")),
    account_type: z.enum(["buyer", "merchant", "artisan"]),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirm_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirm_password"],
        message: "Passwords do not match",
      });
    }
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "Enter your email address").email("Enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters").max(72, "Password is too long"),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirm_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirm_password"],
        message: "Passwords do not match",
      });
    }
  });

export const accountTypes = [
  { value: "buyer", label: "Buyer", hint: "Shop for products and services" },
  { value: "merchant", label: "Seller", hint: "Open a shop and list goods" },
  { value: "artisan", label: "Artisan", hint: "Offer services and book jobs" },
] as const;

export type AccountType = (typeof accountTypes)[number]["value"];
