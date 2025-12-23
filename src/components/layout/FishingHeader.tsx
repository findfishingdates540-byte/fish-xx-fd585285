import { useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Settings, LogOut, User, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

const fishingNavItems = [
  { to: "/app/spots", label: "Find Spots" },
  { to: "/app/trips", label: "My Trips" },
  { to: "/app/buddies", label: "Buddies", hasBadge: true },
  { to: "/app/catches", label: "Catches" },
  { to: "/app/buddy-messages", label: "Messages" },
];

export function FishingHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile-header", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, photos")
        .eq("id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch pending buddy requests count
  const { data: pendingRequestsCount = 0 } = useQuery({
    queryKey: ["pending-buddy-requests", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count } = await supabase
        .from("fishing_buddies")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .eq("status", "pending");
      return count || 0;
    },
    enabled: !!user?.id,
  });

  // Real-time subscription for buddy requests
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("buddy-requests-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "fishing_buddies",
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          // Invalidate and refetch the pending requests count
          queryClient.invalidateQueries({ queryKey: ["pending-buddy-requests", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const avatarUrl = profile?.photos?.[0];
  const initials = profile?.display_name?.charAt(0)?.toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-50 bg-background border-b">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left side - Logo and Nav */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link to="/app/spots" className="flex items-center gap-2">
            <img src={logo} alt="Find Fishing Dates" className="h-8 w-auto rounded" />
            <span className="font-bold text-lg">Find Fishing Dates</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {fishingNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "text-sm font-medium transition-colors hover:text-foreground relative",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )
                }
              >
                {item.label}
                {item.hasBadge && pendingRequestsCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-4 h-5 min-w-5 flex items-center justify-center text-xs px-1"
                  >
                    {pendingRequestsCount > 9 ? "9+" : pendingRequestsCount}
                  </Badge>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right side - Search, Notifications, and Profile */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="hidden sm:flex relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search locations..."
              className="pl-9 w-48 lg:w-64 bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>

          {/* Notifications */}
          <NotificationCenter />

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <Avatar className="h-9 w-9 border">
                  <AvatarImage src={avatarUrl || undefined} alt="Profile" />
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate("/app/profile")}>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/app/settings")}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
