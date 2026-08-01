import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Wrench,
  Plus,
  MessageCircle,
  User,
  Package,
  Store,
  Briefcase,
} from "lucide-react";
import type { ReactNode } from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function NavItem({
  to,
  label,
  icon,
  active,
}: {
  to: string;
  label: string;
  icon: ReactNode;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex min-w-0 w-full flex-col items-center justify-center gap-1 overflow-hidden transition-colors ${
        active
          ? "text-primary"
          : "text-muted-foreground hover:text-primary"
      }`}
    >
      {icon}

      <span className="max-w-full truncate text-[10px] font-medium">
        {label}
      </span>
    </Link>
  );
}

export function MobileBottomNav() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-50 w-full max-w-full overflow-hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
        <div className="grid h-16 w-full grid-cols-5 items-center">
          {/* Home */}
          <NavItem
            to="/"
            label="Home"
            active={pathname === "/"}
            icon={<Home className="h-5 w-5 shrink-0" />}
          />

          {/* Services */}
          <NavItem
            to="/artisans"
            label="Services"
            active={pathname.startsWith("/artisans")}
            icon={<Wrench className="h-5 w-5 shrink-0" />}
          />

          {/* Center Create Button */}
          <div className="relative flex h-full w-full items-center justify-center">
            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Create"
                  className="absolute -top-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-105 active:scale-95"
                >
                  <Plus className="h-7 w-7" />
                </button>
              </SheetTrigger>

              <SheetContent
                side="bottom"
                className="rounded-t-3xl"
              >
                <SheetHeader>
                  <SheetTitle>
                    What would you like to do?
                  </SheetTitle>
                </SheetHeader>

                <div className="mt-6 grid gap-3">
                  {/* Sell Product */}
                  <Link
                    to="/post-ad"
                    className="flex items-center gap-4 rounded-xl border p-4 transition hover:bg-muted"
                  >
                    <Package className="h-6 w-6 shrink-0 text-primary" />

                    <div className="min-w-0">
                      <h3 className="font-semibold">
                        Sell a Product
                      </h3>

                      <p className="text-sm text-muted-foreground">
                        Create a marketplace listing.
                      </p>
                    </div>
                  </Link>

                  {/* Open Shop */}
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-4 rounded-xl border p-4 transition hover:bg-muted"
                  >
                    <Store className="h-6 w-6 shrink-0 text-primary" />

                    <div className="min-w-0">
                      <h3 className="font-semibold">
                        Open Your Shop
                      </h3>

                      <p className="text-sm text-muted-foreground">
                        Manage your business storefront.
                      </p>
                    </div>
                  </Link>

                  {/* Become Artisan */}
                  <Link
                    to="/artisan/create"
                    className="flex items-center gap-4 rounded-xl border p-4 transition hover:bg-muted"
                  >
                    <Briefcase className="h-6 w-6 shrink-0 text-primary" />

                    <div className="min-w-0">
                      <h3 className="font-semibold">
                        Become an Artisan
                      </h3>

                      <p className="text-sm text-muted-foreground">
                        Offer professional services.
                      </p>
                    </div>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Inbox */}
          <NavItem
            to="/messages"
            label="Inbox"
            active={pathname.startsWith("/messages")}
            icon={<MessageCircle className="h-5 w-5 shrink-0" />}
          />

          {/* Profile */}
          <NavItem
            to="/dashboard"
            label="Profile"
            active={
              pathname.startsWith("/profile") ||
              pathname.startsWith("/dashboard")
            }
            icon={<User className="h-5 w-5 shrink-0" />}
          />
        </div>
      </nav>

      {/* Prevent page content from hiding behind bottom nav */}
      <div className="h-16 md:hidden" />
    </>
  );
}

export default MobileBottomNav;
