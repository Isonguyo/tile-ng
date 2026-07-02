import { Link, useNavigate } from "@tanstack/react-router";
import { Plus, User, LogOut, Shield, LayoutDashboard, Store, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";
import { NotificationsBell } from "@/components/notifications-bell";
import { MessagesBell } from "@/components/messages-bell";

export function SiteHeader() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3">
       <Link to="/" className="flex items-center gap-3 group">
  {/* Cloudinary Logo Image Wrapper */}
  <div className="relative h-9 w-9 overflow-hidden rounded-lg transition-transform duration-300 group-hover:scale-105">
    <img 
      src="https://res.cloudinary.com/dbozz4sgv/image/upload/v1781367385/tile-logo_vv2c8v.jpg" 
      alt="Tile Logo" 
      className="h-full w-full object-cover"
      loading="eager"
    />
  </div>
  
  {/* Styled Brand Typography */}
  <span className="text-2xl font-black tracking-tight text-foreground bg-gradient-to-r from-[#0F5132] via-[#198754] to-[#0F5132] bg-clip-text text-transparent transition-all duration-300 group-hover:opacity-90">
    Tile
  </span>
</Link>

        <nav className="hidden md:flex items-center gap-1">
          <Button asChild variant="ghost" className="text-primary-foreground hover:bg-primary/80">
            <Link to="/"><Store className="h-4 w-4 mr-1" /> Marketplace</Link>
          </Button>
          <Button asChild variant="ghost" className="text-primary-foreground hover:bg-primary/80">
            <Link to="/artisans"><Users className="h-4 w-4 mr-1" /> Artisans</Link>
          </Button>
        </nav>

        <div className="flex items-center gap-2">
          <MessagesBell />
          <NotificationsBell />
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link to="/post-ad"><Plus className="h-4 w-4 mr-1" /> Post Ad</Link>
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80">
                  <User className="h-4 w-4 mr-1" />
                  {profile?.full_name ?? "Account"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate({ to: "/dashboard" })}>
                  <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
                    <Shield className="h-4 w-4 mr-2" /> Admin Cabin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="ghost" className="text-primary-foreground hover:bg-primary/80">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
