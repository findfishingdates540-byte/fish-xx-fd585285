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
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Search, Settings, LogOut, User, LayoutDashboard, Trophy, Fish, Swords, BarChart3, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

const scoreboardLinks = [
  { to: "/app/leaderboard", label: "Scoreboards Hub", description: "Overall rankings and top anglers", icon: BarChart3 },
  { to: "/app/species", label: "Species Explorer", description: "Browse species directory and records", icon: Fish },
  { to: "/app/challenges", label: "Fishing Challenges", description: "Compete in live and upcoming events", icon: Swords },
  { to: "/app/photo-challenges", label: "Photo Challenges", description: "Submit photos, vote & win prizes", icon: Camera },
  { to: "/app/teams", label: "Teams", description: "Create or join a fishing team", icon: Trophy },
];


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
  const { isComboUser } = useActiveMode();
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
      <div className="px-4 lg:px-8 h-16 flex items-center justify-between">
        {/* Left side - Logo and Nav */}
        <div className="flex items-center gap-4 lg:gap-8 min-w-0 overflow-visible">
          {/* Logo */}
          <Link to="/app/feed" className="flex items-center shrink-0 pl-4">
            <span className="text-xl font-black tracking-tight">
              FISH<span className="text-primary">-X</span>
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6">
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

            {/* Scoreboard Hub Dropdown */}
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm font-medium text-muted-foreground hover:text-foreground bg-transparent h-auto p-0 data-[state=open]:text-foreground">
                    <Trophy className="h-3.5 w-3.5 mr-1" />
                    Scoreboard Hub
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[320px] gap-1 p-3">
                      {scoreboardLinks.map((link) => (
                        <li key={link.to + link.label}>
                          <NavigationMenuLink asChild>
                            <Link
                              to={link.to}
                              className="flex items-start gap-3 rounded-lg p-3 hover:bg-accent transition-colors"
                            >
                              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                <link.icon className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{link.label}</p>
                                <p className="text-xs text-muted-foreground">{link.description}</p>
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
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
