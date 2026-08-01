import { Link, useNavigate } from "@tanstack/react-router";
import {
  Plus,
  LogOut,
  Shield,
  LayoutDashboard,
  Store,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAuth } from "@/lib/auth-context";
import { NotificationsBell } from "@/components/notifications-bell";
import { MessagesBell } from "@/components/messages-bell";

export function SiteHeader() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const initials = (profile?.full_name ?? "Account")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((name) => name[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full max-w-full overflow-hidden bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto flex min-w-0 items-center justify-between gap-3 px-4 py-3">
        {/* Logo */}
        <Link
          to="/"
          className="flex min-w-0 shrink-0 items-center gap-3 group"
        >
          {/* Cloudinary Logo */}
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg transition-transform duration-300 group-hover:scale-105">
            <img
              src="https://res.cloudinary.com/dbozz4sgv/image/upload/v1781367385/tile-logo_vv2c8v.jpg"
              alt="Tile Logo"
              className="h-full w-full object-cover"
              loading="eager"
            />
          </div>

          {/* Brand */}
          <span className="hidden text-2xl font-black tracking-tight text-foreground bg-gradient-to-r from-[#0F5132] via-[#198754] to-[#0F5132] bg-clip-text text-transparent transition-all duration-300 group-hover:opacity-90 sm:inline">
            Tile
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          <Button
            asChild
            variant="ghost"
            className="text-primary-foreground hover:bg-primary/80"
          >
            <Link to="/">
              <Store className="mr-1 h-4 w-4" />
              Marketplace
            </Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            className="text-primary-foreground hover:bg-primary/80"
          >
            <Link to="/artisans">
              <Users className="mr-1 h-4 w-4" />
              Artisans
            </Link>
          </Button>
        </nav>

        {/* Right Side Actions */}
        <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-2">
          {/* Messages */}
          <MessagesBell />

          {/* Notifications */}
          <NotificationsBell />

          {/* Desktop Post Ad Button */}
          <Button
            asChild
            className="hidden bg-accent text-accent-foreground hover:bg-accent/90 sm:inline-flex"
          >
            <Link to="/post-ad">
              <Plus className="mr-1 h-4 w-4" />
              Post Ad
            </Link>
          </Button>

          {/* Signed-in User */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-10 shrink-0 gap-2 px-2 text-primary-foreground hover:bg-primary/80"
                >
                  {/* Profile Photo */}
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name ?? "Account"}
                      className="h-8 w-8 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    /* Initials fallback */
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                      {initials}
                    </div>
                  )}

                  {/* User Name */}
                  <span className="hidden max-w-[120px] truncate text-sm font-medium sm:block">
                    {profile?.full_name ?? "Account"}
                  </span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-56"
              >
                <DropdownMenuItem
                  onClick={() => navigate({ to: "/dashboard" })}
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>

                {isAdmin && (
                  <DropdownMenuItem
                    onClick={() => navigate({ to: "/admin" })}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Cabin
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={async () => {
                    await signOut();
                    navigate({ to: "/" });
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            /* Signed-out User */
            <Button
              asChild
              variant="ghost"
              className="shrink-0 text-primary-foreground hover:bg-primary/80"
            >
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
