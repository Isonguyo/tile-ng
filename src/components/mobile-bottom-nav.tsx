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
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center gap-1 transition-colors ${
        active
          ? "text-primary"
          : "text-muted-foreground hover:text-primary"
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}

export function MobileBottomNav() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">

        <div className="relative flex h-16 items-center justify-around">

          {/* Home */}
          <NavItem
            to="/"
            label="Home"
            active={pathname === "/"}
            icon={<Home className="h-5 w-5" />}
          />

          {/* Services */}
          <NavItem
            to="/artisans"
            label="Services"
            active={pathname.startsWith("/artisans")}
            icon={<Wrench className="h-5 w-5" />}
          />

          {/* Floating Sell Button */}
          <Sheet>
            <SheetTrigger asChild>
              <button
                className="absolute left-1/2 -translate-x-1/2 -top-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition hover:scale-105"
              >
                <Plus className="h-7 w-7" />
              </button>
            </SheetTrigger>

            <SheetContent side="bottom" className="rounded-t-3xl">
              <SheetHeader>
                <SheetTitle>What would you like to do?</SheetTitle>
              </SheetHeader>

              <div className="mt-6 grid gap-3">

                <Link
                  to="/post-ad"
                  className="flex items-center gap-4 rounded-xl border p-4 transition hover:bg-muted"
                >
                  <Package className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="font-semibold">
                      Sell a Product
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Create a marketplace listing.
                    </p>
                  </div>
                </Link>

                <Link
                  to="/dashboard"
                  className="flex items-center gap-4 rounded-xl border p-4 transition hover:bg-muted"
                >
                  <Store className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="font-semibold">
                      Open Your Shop
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Manage your business storefront.
                    </p>
                  </div>
                </Link>

                <Link
                  to="/artisan/create"
                  className="flex items-center gap-4 rounded-xl border p-4 transition hover:bg-muted"
                >
                  <Briefcase className="h-6 w-6 text-primary" />
                  <div>
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

          {/* Inbox */}
          <NavItem
            to="/messages"
            label="Inbox"
            active={pathname.startsWith("/messages")}
            icon={<MessageCircle className="h-5 w-5" />}
          />

          {/* Profile */}
          <NavItem
            to="/dashboard"
            label="Profile"
            active={
              pathname.startsWith("/profile") ||
              pathname.startsWith("/dashboard")
            }
            icon={<User className="h-5 w-5" />}
          />

        </div>
      </nav>

      {/* Prevent content from hiding behind nav */}
      <div className="h-16 md:hidden" />
    </>
  );
}

export default MobileBottomNav;