/**
 * Map Supabase auth error messages to friendly, user-facing copy.
 */
export function friendlyAuthError(
  message: string | undefined | null,
  fallback = "We couldn't complete that request. Please try again.",
): string {
  if (!message) return fallback;
  const m = message.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid_grant") || m.includes("wrong password")) {
    return "Invalid login credentials. Please try again or reset your password.";
  }
  if (m.includes("email not confirmed") || m.includes("email_confirm")) return "Please verify your email before signing in.";
  if (m.includes("user already registered") || m.includes("already registered") || m.includes("email already exists")) {
    return "That email is already registered. Try signing in instead.";
  }
  if (m.includes("password should be at least") || m.includes("password is too weak") || m.includes("weak password")) {
    return "Password is too weak. Add more characters and a mix of letters, numbers, and symbols.";
  }
  if (m.includes("verification") && m.includes("expired")) return "The verification link has expired. Request a new one.";
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (m.includes("forbidden") || m.includes("not authorized") || m.includes("permission denied")) {
    return "You don't have permission to do that.";
  }
  if (m.includes("pwned") || m.includes("compromised")) {
    return "That password has appeared in a data breach. Please choose a stronger one.";
  }
  if (m.includes("network") || m.includes("fetch")) return "Network issue. Check your connection and retry.";
  if (m.includes("not authenticated")) return "Please sign in to continue.";
  if (m.includes("invalid email") || m.includes("email address")) {
    return "Enter a valid email address and try again.";
  }
  if (m.includes("token") && (m.includes("expired") || m.includes("invalid"))) {
    return "This link has expired or is no longer valid. Request a new one.";
  }
  return fallback;
}
