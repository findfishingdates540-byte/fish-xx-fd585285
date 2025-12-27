import { useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveMode } from "@/contexts/ActiveModeContext";
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
import { Search, Settings, LogOut, User, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";


const fishingNavItems = [
  { to: "/app/feed", label: "Feed" },
  { to: "/app/spots", label: "Find Spots" },
  { to: "/app/trips", label: "My Trips" },
  { to: "/app/buddies", label: "Buddies", badgeType: "buddyRequests" as const },
  { to: "/app/buddy-messages", label: "Messages", badgeType: "messages" as const },
  { to: "/app/catches", label: "Catches" },
];

export function FishingHeader() {
  const { user } = useAuth();
  const { wasOriginallyCombo } = useActiveMode();
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

  // Fetch unread buddy messages count
  const { data: unreadMessagesCount = 0 } = useQuery({
    queryKey: ["unread-buddy-messages-header", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      
      // Get all buddy relationships where user is involved
      const { data: buddies } = await supabase
        .from("fishing_buddies")
        .select("id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);
      
      if (!buddies || buddies.length === 0) return 0;
      
      const buddyIds = buddies.map(b => b.id);
      
      const { count } = await supabase
        .from("buddy_messages")
        .select("*", { count: "exact", head: true })
        .in("buddy_id", buddyIds)
        .neq("sender_id", user.id)
        .eq("is_read", false);
      
      return count || 0;
    },
    enabled: !!user?.id,
  });

  // Real-time subscription for buddy requests and messages
  useEffect(() => {
    if (!user?.id) return;

    const buddyChannel = supabase
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
          queryClient.invalidateQueries({ queryKey: ["pending-buddy-requests", user.id] });
        }
      )
      .subscribe();

    const messagesChannel = supabase
      .channel("buddy-messages-header-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "buddy_messages",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["unread-buddy-messages-header", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(buddyChannel);
      supabase.removeChannel(messagesChannel);
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
            {/* Dashboard link for originally-combo users */}
            {wasOriginallyCombo && (
              <NavLink
                to="/app/dashboard"
                className={({ isActive }) =>
                  cn(
                    "text-sm font-medium transition-colors hover:text-foreground flex items-center gap-1.5",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )
                }
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </NavLink>
            )}
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
                {item.badgeType === "buddyRequests" && pendingRequestsCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-4 h-5 min-w-5 flex items-center justify-center text-xs px-1"
                  >
                    {pendingRequestsCount > 9 ? "9+" : pendingRequestsCount}
                  </Badge>
                )}
                {item.badgeType === "messages" && unreadMessagesCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-4 h-5 min-w-5 flex items-center justify-center text-xs px-1"
                  >
                    {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
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
          <NotificationCenter mode="fishing" />

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
