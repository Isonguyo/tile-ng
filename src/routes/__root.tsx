import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "../lib/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import {
  LAUNCHED,
  REDIRECT_MOBILE_TO_WAITLIST,
  WAITLIST_EXEMPT_PREFIXES,
} from "@/lib/launch-config";

/**
 * Pre-launch gate: on mobile, public pages redirect to /wait-list until launch.
 * Flip LAUNCHED in src/lib/launch-config.ts to disable without changing links.
 */
function PreLaunchMobileGate() {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (LAUNCHED || !REDIRECT_MOBILE_TO_WAITLIST) return;
    if (typeof window === "undefined") return;
    if (window.innerWidth >= 768) return;
    if (WAITLIST_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p))) return;
    void router.navigate({ to: "/wait-list", replace: true });
  }, [pathname, router]);

  return null;
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Tile" },
      { name: "description", content: "Tile is a dual-sided marketplace for buying and selling goods, and hiring services." },
      { name: "author", content: "Tile" },
      { property: "og:title", content: "Tile" },
      { property: "og:description", content: "Tile is a dual-sided marketplace for buying and selling goods, and hiring services." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Tile" },
      { name: "twitter:title", content: "Tile" },
      { name: "twitter:description", content: "Tile is a dual-sided marketplace for buying and selling goods, and hiring services." },
      { property: "og:image", content: "https://res.cloudinary.com/dbozz4sgv/image/upload/v1781367385/tile-logo_vv2c8v.jpg" },
      { name: "twitter:image", content: "https://res.cloudinary.com/dbozz4sgv/image/upload/v1781367385/tile-logo_vv2c8v.jpg" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isWaitlist = pathname.startsWith("/wait-list");

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PreLaunchMobileGate />
        {/* Add bottom padding so content isn't hidden behind the fixed nav */}
        <main className={isWaitlist ? undefined : "pb-20 md:pb-0"}>
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        {!isWaitlist && <MobileBottomNav />}

        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
