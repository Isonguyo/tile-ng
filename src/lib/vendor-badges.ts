export function hasVerifiedVendorBadge(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value === "string") {
    const normalized = value.toLowerCase().replace(/[_-]+/g, " ");
    return normalized === "verified" || normalized.includes("verified vendor");
  }
  if (Array.isArray(value)) {
    return value.some((item) => {
      if (typeof item === "string") {
        const normalized = item.toLowerCase().replace(/[_-]+/g, " ");
        return normalized === "verified" || normalized.includes("verified vendor");
      }
      return hasVerifiedVendorBadge(item);
    });
  }
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  if (
    row.verified_vendor_badge === true ||
    row.vendor_verified === true ||
    row.is_verified_vendor === true ||
    row.verified_vendor === true
  )
    return true;
  const label = [row.badge, row.badge_name, row.badge_type, row.name, row.key, row.slug].find(
    (item): item is string => typeof item === "string",
  );
  if (label) {
    const normalized = label.toLowerCase().replace(/[_-]+/g, " ");
    if (normalized === "verified" || normalized.includes("verified vendor")) return true;
  }
  return hasVerifiedVendorBadge(row.badges ?? row.vendor_badges);
}
