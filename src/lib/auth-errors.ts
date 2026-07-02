/**
 * Map Supabase auth error messages to friendly, user-facing copy.
 */
export function friendlyAuthError(message: string | undefined | null): string {
  if (!message) return "Something went wrong. Please try again.";
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "Wrong email or password. Try again or reset your password.";
  if (m.includes("email not confirmed")) return "Check your email and click the confirmation link before signing in.";
  if (m.includes("user already registered")) return "That email is already in use. Try signing in instead.";
  if (m.includes("password should be at least")) return "Password must be at least 8 characters.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Wait a minute and try again.";
  if (m.includes("weak password") || m.includes("pwned") || m.includes("compromised")) {
    return "That password has appeared in a data breach. Please choose a stronger one.";
  }
  if (m.includes("network") || m.includes("fetch")) return "Network issue. Check your connection and retry.";
  if (m.includes("not authenticated")) return "Please sign in to continue.";
  return message.charAt(0).toUpperCase() + message.slice(1);
}