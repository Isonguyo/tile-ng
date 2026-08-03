// Pre-launch switches. Flip LAUNCHED to true on launch day to disable the
// waitlist gate without touching any links.
export const LAUNCHED = false;

// While not launched, mobile visitors landing on public pages are sent to /wait-list.
export const REDIRECT_MOBILE_TO_WAITLIST = true;

// Paths that are always reachable, even on mobile pre-launch.
export const WAITLIST_EXEMPT_PREFIXES = [
  "/wait-list",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/admin",
  "/dashboard",
];

export const LAUNCH_PROGRESS = {
  overall: 85,
  milestones: [
    { label: "Marketplace", status: "Completed" as const },
    { label: "Messaging", status: "Completed" as const },
    { label: "Analytics", status: "Completed" as const },
    { label: "Payments", status: "In Progress" as const },
    { label: "Mobile Apps", status: "Coming Soon" as const },
  ],
};
