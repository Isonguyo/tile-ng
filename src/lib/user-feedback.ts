import { toast } from "sonner";

/**
 * Convert backend and browser failures into copy that is safe to show to users.
 * Raw server messages often contain table, policy, or implementation details.
 */
export function friendlyErrorMessage(
  error: unknown,
  fallback = "We couldn't complete that action. Please try again.",
): string {
  const message = error instanceof Error
    ? error.message
    : typeof error === "string"
      ? error
      : error && typeof error === "object" && "message" in error && typeof error.message === "string"
        ? error.message
        : "";
  const normalized = message.toLowerCase();

  if (!normalized) return fallback;
  if (normalized.includes("network") || normalized.includes("fetch") || normalized.includes("connection")) {
    return "Connection issue. Check your internet and try again.";
  }
  if (
    normalized.includes("not authenticated") ||
    normalized.includes("jwt expired") ||
    normalized.includes("invalid jwt")
  ) {
    return "Your session has expired. Sign in again to continue.";
  }
  if (
    normalized.includes("permission denied") ||
    normalized.includes("not authorized") ||
    normalized.includes("row-level security") ||
    normalized.includes("insufficient privilege")
  ) {
    return "You don't have permission to do that.";
  }
  if (
    normalized.includes("duplicate key") ||
    normalized.includes("already exists") ||
    normalized.includes("unique constraint")
  ) {
    return "That information is already in use. Check it and try again.";
  }
  if (normalized.includes("rate limit") || normalized.includes("too many requests")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  return fallback;
}

export function showError(error: unknown, fallback?: string): void {
  toast.error(friendlyErrorMessage(error, fallback));
}
