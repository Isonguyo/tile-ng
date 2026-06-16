import { Link, useNavigate } from "@tanstack/react-router";
import { Search, MapPin, Plus, User, LogOut, Shield, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { LOCATIONS } from "@/lib/categories";
import { useState } from "react";
import { NotificationsBell } from "@/components/notifications-bell";
import { MessagesBell } from "@/components/messages-bell";

export function SiteHeader() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [loc, setLoc] = useState("all");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/", search: { q, loc } as never });
  };

  return (
    <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto flex flex-wrap items-center gap-3 px-4 py-3">
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

        <form onSubmit={submit} className="flex flex-1 min-w-[260px] items-center gap-2 rounded-md bg-background/95 p-1 text-foreground">
          <div className="flex items-center gap-2 px-2 flex-1">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search goods & services…"
              className="border-0 shadow-none focus-visible:ring-0 px-0 h-9" />
          </div>
          <Select value={loc} onValueChange={setLoc}>
            <SelectTrigger className="w-[150px] border-0 shadow-none h-9">
              <MapPin className="h-4 w-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Nigeria</SelectItem>
              {LOCATIONS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button type="submit" variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground h-9">Search</Button>
        </form>

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
