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
    <header className="sticky top-0 z-50 w-full max-w-full overflow-hidden bg-[#05100B]/90 backdrop-blur-md border-b border-[#163321] text-slate-100 shadow-xl shadow-black/30">
      <div className="container mx-auto flex min-w-0 items-center justify-between gap-3 px-4 py-3">
        {/* Logo */}
        <Link
          to="/"
          className="flex min-w-0 shrink-0 items-center gap-3 group"
        >
          {/* Logo Container */}
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-[#22C55E]/30 bg-[#081810] p-0.5 transition-transform duration-300 group-hover:scale-105 group-hover:border-[#22C55E]">
            <img
              src="https://res.cloudinary.com/dbozz4sgv/image/upload/v1781367385/tile-logo_vv2c8v.jpg"
              alt="Tile Logo"
              className="h-full w-full object-cover rounded-lg"
              loading="eager"
            />
          </div>

          {/* Brand Name */}
          <span className="hidden text-2xl font-black tracking-tight text-white transition-all duration-300 group-hover:text-[#22C55E] sm:inline">
            Tile
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1.5 md:flex">
          <Button
            asChild
            variant="ghost"
            className="text-slate-300 hover:text-[#22C55E] hover:bg-[#102A1C]/60 rounded-xl transition-all"
          >
            <Link to="/">
              <Store className="mr-1.5 h-4 w-4 text-[#22C55E]" />
              Marketplace
            </Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            className="text-slate-300 hover:text-[#22C55E] hover:bg-[#102A1C]/60 rounded-xl transition-all"
          >
            <Link to="/artisans">
              <Users className="mr-1.5 h-4 w-4 text-[#22C55E]" />
              Artisans
            </Link>
          </Button>
        </nav>

        {/* Right Side Actions */}
        <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2.5">
          {/* Messages */}
          <MessagesBell />

          {/* Notifications */}
          <NotificationsBell />

          {/* Desktop Post Ad Button */}
          <Button
            asChild
            className="hidden bg-[#22C55E] text-[#05100B] font-bold hover:bg-[#16A34A] rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all sm:inline-flex"
          >
            <Link to="/post-ad">
              <Plus className="mr-1 h-4 w-4 stroke-[3]" />
              Post Ad
            </Link>
          </Button>

          {/* Signed-in User */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-10 shrink-0 gap-2 px-2 text-slate-200 hover:text-white hover:bg-[#102A1C]/60 rounded-xl transition-all"
                >
                  {/* Profile Photo */}
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name ?? "Account"}
                      className="h-8 w-8 shrink-0 rounded-full object-cover border border-[#22C55E]/40"
                    />
                  ) : (
                    /* Initials fallback */
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#22C55E] text-xs font-black text-[#05100B]">
                      {initials}
                    </div>
                  )}

                  {/* User Name */}
                  <span className="hidden max-w-[120px] truncate text-xs font-semibold sm:block">
                    {profile?.full_name ?? "Account"}
                  </span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-56 rounded-2xl border border-[#163321] bg-[#081810]/95 backdrop-blur-xl p-1.5 text-slate-200 shadow-2xl shadow-black/80"
              >
                <DropdownMenuItem
                  className="rounded-xl hover:bg-[#102A1C] focus:bg-[#102A1C] cursor-pointer text-xs font-medium text-slate-200 focus:text-white p-2.5"
                  onClick={() => navigate({ to: "/dashboard" })}
                >
                  <LayoutDashboard className="mr-2 h-4 w-4 text-[#22C55E]" />
                  Dashboard
                </DropdownMenuItem>

                {isAdmin && (
                  <DropdownMenuItem
                    className="rounded-xl hover:bg-[#102A1C] focus:bg-[#102A1C] cursor-pointer text-xs font-medium text-slate-200 focus:text-white p-2.5"
                    onClick={() => navigate({ to: "/admin" })}
                  >
                    <Shield className="mr-2 h-4 w-4 text-[#22C55E]" />
                    Admin Cabin
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="bg-[#163321]" />

                <DropdownMenuItem
                  className="rounded-xl hover:bg-red-500/10 focus:bg-red-500/10 text-red-400 focus:text-red-300 cursor-pointer text-xs font-medium p-2.5"
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
              className="shrink-0 text-slate-300 hover:text-[#22C55E] hover:bg-[#102A1C]/60 rounded-xl transition-all"
            >
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}