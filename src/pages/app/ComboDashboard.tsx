import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveMode } from "@/contexts/ActiveModeContext";

import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchCelebrationModal } from "@/components/discover/MatchCelebrationModal";
import { toast } from "sonner";

import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { playNotificationSound, playBuddyRequestSound } from "@/utils/notification-sound";
import { useWeather, getWindDirection, getFishingConditions } from "@/hooks/use-weather";
import { NotificationCenter } from "@/components/notifications";
import {
  LayoutDashboard,
  Users,
  Map,
  MessageSquare,
  Calendar,
  Settings,
  Fish,
  Heart,
  X,
  Bookmark,
  MapPin,
  Sun,
  Cloud,
  Wind,
  Droplets,
  Star,
  SlidersHorizontal,
  Anchor,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";
import type { Database } from "@/integrations/supabase/types";

// Browser notification helpers
const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};

const showBrowserNotification = (title: string, body: string, icon?: string) => {
  if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
    new Notification(title, {
      body,
      icon: icon || '/favicon.png',
      badge: '/favicon.png',
    });
  }
};

interface UserProfileData {
  id: string;
  display_name: string | null;
  photos: string[] | null;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
}

interface ProfileData {
  id: string;
  display_name: string | null;
  photos: string[] | null;
  age: number | null;  // Pre-calculated by public_profiles view
  fishing_experience: string | null;
  preferred_species: string[] | null;
  fishing_gear: string[] | null;
  location_name: string | null;
  gender?: string | null;
}

interface FishingSpot {
  id: string;
  name: string;
  photos: string[] | null;
  species_available: string[] | null;
  rating_avg: number | null;
  is_public: boolean | null;
  location_lat: number | null;
  location_lng: number | null;
}

// Calculate distance between two coordinates in miles
const calculateDistanceMiles = (
  lat1: number | null,
  lng1: number | null,
  lat2: number | null,
  lng2: number | null
): number | null => {
  if (!lat1 || !lng1 || !lat2 || !lng2) return null;
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal place
};

interface RecentFeedPost {
  id: string;
  photos: string[] | null;
  video_url: string | null;
  content: string | null;
  created_at: string;
  user_id: string;
  profile?: {
    display_name: string | null;
    photos: string[] | null;
  };
}

function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

const sidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/app", active: true },
  { label: "Matches", icon: Users, href: "/app/matches", badge: null },
  { label: "Map Spots", icon: Map, href: "/app/spots" },
  { label: "Messages", icon: MessageSquare, href: "/app/messages" },
  { label: "Planned Trips", icon: Calendar, href: "/app/trips" },
  { label: "Invite Friends", icon: Users, href: "/app/settings?tab=invite" },
];

type AccountMode = Database['public']['Enums']['account_mode'];

export default function ComboDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeMode, setActiveMode } = useActiveMode();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [nearbyAnglers, setNearbyAnglers] = useState<ProfileData[]>([]);
  const [hotSpots, setHotSpots] = useState<FishingSpot[]>([]);
  const [latestFeedPost, setLatestFeedPost] = useState<RecentFeedPost | null>(null);
  const [feedRefreshTrigger, setFeedRefreshTrigger] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [featuredSpot, setFeaturedSpot] = useState<FishingSpot | null>(null);
  const previousNotificationCountRef = useRef<number>(0);
  const [swipedAnglers, setSwipedAnglers] = useState<Set<string>>(new Set());
  const [matchedProfile, setMatchedProfile] = useState<ProfileData | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(null);

  // For combo users, this just switches their view preference (not account type in DB)
  const handleModeSwitch = (mode: 'unified' | 'dating' | 'fishing') => {
    setActiveMode(mode);
    // Navigate to the appropriate home page for the selected mode
    switch (mode) {
      case 'dating':
        navigate('/app/discover');
        break;
      case 'fishing':
        navigate('/app/feed');
        break;
      case 'unified':
      default:
        navigate('/app/dashboard');
        break;
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Fetch notifications for desktop sidebar
  const { data: recentMatches } = useQuery({
    queryKey: ['recent-matches', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('matches')
        .select(`
          id,
          matched_at,
          user1_id,
          user2_id,
          user1:profiles!matches_user1_id_fkey(display_name, photos),
          user2:profiles!matches_user2_id_fkey(display_name, photos)
        `)
        .eq('is_match', true)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('matched_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Dating messages (unread)
  const { data: unreadMessages } = useQuery({
    queryKey: ['unread-messages', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          sender:profiles!messages_sender_id_fkey(display_name, photos)
        `)
        .eq('is_read', false)
        .neq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Buddy messages (unread) - for fishing mode
  const { data: unreadBuddyMessages } = useQuery({
    queryKey: ['unread-buddy-messages', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // First get user's buddy relationships
      const { data: buddies } = await supabase
        .from('fishing_buddies')
        .select('id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);
      
      if (!buddies || buddies.length === 0) return [];
      
      const buddyIds = buddies.map(b => b.id);
      
      const { data } = await supabase
        .from('buddy_messages')
        .select('id, content, created_at, sender_id, buddy_id')
        .in('buddy_id', buddyIds)
        .eq('is_read', false)
        .neq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: tripInvites } = useQuery({
    queryKey: ['trip-invites', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('trip_participants')
        .select(`
          id,
          created_at,
          status,
          trip_id,
          trip:fishing_trips(title, trip_date)
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch weather data using user's actual location
  const { data: weatherData, isLoading: weatherLoading } = useWeather(
    userProfile?.location_lat,
    userProfile?.location_lng
  );

  // Total message count for sidebar badge (dating + buddy)
  const totalMessageCount = (unreadMessages?.length || 0) + (unreadBuddyMessages?.length || 0);

  const totalNotifications = 
    (recentMatches?.length || 0) + 
    (unreadMessages?.length || 0) + 
    (unreadBuddyMessages?.length || 0) +
    (tripInvites?.length || 0);

  const notifications = [
    ...(recentMatches?.map((match: any) => {
      const otherUser = match.user1_id === user?.id ? match.user2 : match.user1;
      return {
        id: `match-${match.id}`,
        type: 'match' as const,
        title: 'New Match!',
        message: `You matched with ${otherUser?.display_name || 'Someone'}`,
        time: match.matched_at,
        link: '/app/matches',
        icon: Heart,
      };
    }) || []),
    ...(unreadMessages?.map((msg: any) => ({
      id: `msg-${msg.id}`,
      type: 'message' as const,
      title: 'New Message',
      message: `${msg.sender?.display_name || 'Someone'}: ${msg.content?.slice(0, 30)}...`,
      time: msg.created_at,
      link: '/app/messages',
      icon: MessageSquare,
    })) || []),
    ...(unreadBuddyMessages?.map((msg: any) => ({
      id: `buddy-msg-${msg.id}`,
      type: 'buddy_message' as const,
      title: 'New Buddy Message',
      message: `${msg.content?.slice(0, 30)}...`,
      time: msg.created_at,
      link: '/app/buddy-messages',
      icon: Users,
    })) || []),
    ...(tripInvites?.map((invite: any) => ({
      id: `trip-${invite.id}`,
      type: 'trip' as const,
      title: 'Trip Invitation',
      message: `You're invited to "${invite.trip?.title || 'a fishing trip'}"`,
      time: invite.created_at,
      link: '/app/trips',
      icon: Calendar,
    })) || []),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  // Real-time subscriptions for notifications with sound and browser notifications
  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up real-time notification subscriptions for combo dashboard');

    const channel = supabase
      .channel('combo-dashboard-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
        },
        (payload) => {
          console.log('Match update received:', payload);
          const match = payload.new as any;
          if (match.is_match && (match.user1_id === user.id || match.user2_id === user.id)) {
            queryClient.invalidateQueries({ queryKey: ['recent-matches', user.id] });
            // Play sound and show browser notification
            playNotificationSound();
            showBrowserNotification('New Match!', 'You have a new match on Find Fishing Dates!');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('New message received:', payload);
          const message = payload.new as any;
          if (message.sender_id !== user.id) {
            queryClient.invalidateQueries({ queryKey: ['unread-messages', user.id] });
            // Play sound and show browser notification
            playNotificationSound();
            showBrowserNotification('New Message', 'You have a new message!');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'buddy_messages',
        },
        (payload) => {
          console.log('New buddy message received:', payload);
          const message = payload.new as any;
          if (message.sender_id !== user.id) {
            queryClient.invalidateQueries({ queryKey: ['unread-buddy-messages', user.id] });
            // Play buddy sound and show browser notification
            playBuddyRequestSound();
            showBrowserNotification('New Buddy Message', 'You have a new message from a fishing buddy!');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trip_participants',
        },
        (payload) => {
          console.log('Trip invitation received:', payload);
          const invite = payload.new as any;
          if (invite.user_id === user.id) {
            queryClient.invalidateQueries({ queryKey: ['trip-invites', user.id] });
            // Play sound and show browser notification
            playNotificationSound();
            showBrowserNotification('Trip Invitation', 'You have been invited to a fishing trip!');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'feed_posts',
        },
        (payload) => {
          console.log('New feed post:', payload);
          // Trigger a refresh of feed data
          setFeedRefreshTrigger(prev => prev + 1);
        }
      )
      .subscribe((status) => {
        console.log('Combo dashboard notification subscription status:', status);
      });

    return () => {
      console.log('Cleaning up combo dashboard notification subscriptions');
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, feedRefreshTrigger]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch user profile including location coordinates for weather
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, display_name, photos, location_name, location_lat, location_lng, gender")
        .eq("id", user.id)
        .single();
      
      setUserProfile(profile);

      // Fetch match count
      const { count } = await supabase
        .from("matches")
        .select("id", { count: "exact", head: true })
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq("is_match", true);
      
      setMatchCount(count || 0);

      // Fetch already swiped profile IDs to exclude them
      const { data: existingMatches } = await supabase
        .from("matches")
        .select("user1_id, user2_id")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      const swipedIds = new Set<string>();
      existingMatches?.forEach((match) => {
        if (match.user1_id === user.id) {
          swipedIds.add(match.user2_id);
        } else {
          swipedIds.add(match.user1_id);
        }
      });

      // Fetch nearby anglers using public_profiles view for privacy (age is pre-calculated)
      // Only fetch if user has set their gender (required for opposite-gender filtering)
      let anglersList: typeof nearbyAnglers = [];
      
      if (profile?.gender === 'male' || profile?.gender === 'female') {
        let anglersQuery = supabase
          .from("public_profiles")
          .select("id, display_name, photos, age, fishing_experience, preferred_species, fishing_gear, location_name, gender")
          .neq("id", user.id)
          .not("photos", "is", null);

        // Exclude already swiped profiles
        if (swipedIds.size > 0) {
          anglersQuery = anglersQuery.not("id", "in", `(${Array.from(swipedIds).join(",")})`);
        }

        // Apply strict opposite gender filtering (male sees female only, female sees male only)
        anglersQuery = anglersQuery.eq('gender', profile.gender === 'male' ? 'female' : 'male');

        const { data: anglers } = await anglersQuery.limit(5);
        anglersList = anglers || [];
      }
      
      setNearbyAnglers(anglersList);

      // Fetch hot spots (newest first)
      const { data: spots } = await supabase
        .from("fishing_spots")
        .select("id, name, photos, species_available, rating_avg, is_public, location_lat, location_lng, created_at")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(3);
      
      setHotSpots(spots || []);
      if (spots && spots.length > 0) {
        setFeaturedSpot(spots[0]);
      }

      // Fetch latest feed post with profile info
      const { data: feedPosts } = await supabase
        .from("feed_posts")
        .select(`
          id, photos, video_url, content, created_at, user_id
        `)
        .order("created_at", { ascending: false })
        .limit(1);

      if (feedPosts && feedPosts.length > 0) {
        const post = feedPosts[0];
        const { data: postProfile } = await supabase
          .from("profiles")
          .select("id, display_name, photos")
          .eq("id", post.user_id)
          .single();

        setLatestFeedPost({
          ...post,
          profile: postProfile || undefined
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Swipe mutation for Like/Pass actions
  const swipeMutation = useMutation({
    mutationFn: async ({ targetId, liked }: { targetId: string; liked: boolean }) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Check if a match record already exists
      const { data: existingMatch } = await supabase
        .from("matches")
        .select("*")
        .or(
          `and(user1_id.eq.${user.id},user2_id.eq.${targetId}),and(user1_id.eq.${targetId},user2_id.eq.${user.id})`
        )
        .maybeSingle();

      if (existingMatch) {
        // Update existing match
        const isUser1 = existingMatch.user1_id === user.id;
        const updateData = isUser1
          ? { user1_liked: liked }
          : { user2_liked: liked };

        // Check if this creates a mutual match
        const otherUserLiked = isUser1
          ? existingMatch.user2_liked
          : existingMatch.user1_liked;
        
        if (liked && otherUserLiked) {
          Object.assign(updateData, { is_match: true, matched_at: new Date().toISOString() });
        }

        const { data, error } = await supabase
          .from("matches")
          .update(updateData)
          .eq("id", existingMatch.id)
          .select()
          .single();

        if (error) throw error;
        return { match: data, isNewMatch: liked && otherUserLiked };
      } else {
        // Create new match record
        const [id1, id2] = [user.id, targetId].sort();
        const isUser1 = id1 === user.id;

        const { data, error } = await supabase
          .from("matches")
          .insert({
            user1_id: id1,
            user2_id: id2,
            user1_liked: isUser1 ? liked : null,
            user2_liked: isUser1 ? null : liked,
            is_match: false,
          })
          .select()
          .single();

        if (error) throw error;
        return { match: data, isNewMatch: false };
      }
    },
    onSuccess: (result, variables) => {
      // Add to swiped set to remove from UI
      setSwipedAnglers((prev) => new Set(prev).add(variables.targetId));

      if (variables.liked) {
        if (result.isNewMatch) {
          // It's a match! Show celebration modal
          const matchedAngler = nearbyAnglers.find((a) => a.id === variables.targetId);
          if (matchedAngler) {
            setMatchedProfile(matchedAngler);
            setCurrentMatchId(result.match.id);
            setShowMatchModal(true);
            setMatchCount((prev) => prev + 1);
          }
          toast.success("It's a match! 🎉", { description: "You both liked each other!" });
        } else {
          toast.success("Profile liked!", { description: "We'll let you know if they like you back." });
        }
      } else {
        toast("Profile passed", { description: "You won't see this profile again." });
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["recent-matches", user?.id] });
    },
    onError: (error) => {
      console.error("Swipe error:", error);
      toast.error("Something went wrong", { description: "Please try again." });
    },
  });

  const handleLikeAngler = (angler: ProfileData) => {
    swipeMutation.mutate({ targetId: angler.id, liked: true });
  };

  const handlePassAngler = (angler: ProfileData) => {
    swipeMutation.mutate({ targetId: angler.id, liked: false });
  };

  const handleAnglerCardClick = (anglerId: string) => {
    navigate(`/app/u/${anglerId}`);
  };

  const clearMatchedProfile = () => {
    setMatchedProfile(null);
    setCurrentMatchId(null);
    setShowMatchModal(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row min-h-screen bg-background">
        {/* Desktop Sidebar Skeleton */}
        <div className="hidden lg:block w-60 border-r bg-card p-4">
          <Skeleton className="h-12 w-full mb-8" />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full mb-2" />
          ))}
        </div>
        <div className="flex-1 p-4 lg:p-6">
          <Skeleton className="h-8 w-48 lg:w-64 mb-6" />
          <Skeleton className="h-48 lg:h-64 w-full mb-6" />
          <Skeleton className="h-32 lg:h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-muted/30">
      {/* Sidebar - Hidden on mobile */}
      <aside className="hidden lg:flex w-60 border-r bg-card flex-col sticky top-0 h-screen">
        <div className="p-4 border-b flex items-center justify-between">
          <Link to="/app" className="flex items-center gap-3">
            <span className="font-bold text-xl tracking-tight">FFD</span>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Combo Mode</p>
          </Link>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-3">
          {sidebarItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1",
                item.active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
              {item.label === "Matches" && matchCount > 0 && (
                <Badge variant="secondary" className="ml-auto bg-primary text-primary-foreground text-xs">
                  {matchCount}
                </Badge>
              )}
              {item.label === "Messages" && totalMessageCount > 0 && (
                <Badge variant="secondary" className="ml-auto bg-destructive text-destructive-foreground text-xs">
                  {totalMessageCount}
                </Badge>
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t">
          <Button
            className="w-full mb-3 gap-2"
            onClick={() => navigate("/app/catches")}
          >
            <Fish className="h-4 w-4" />
            Log Catch
          </Button>
          <div className="flex items-center gap-2">
            <Link to="/app/profile" className="flex-shrink-0">
              <Avatar className="h-9 w-9 border-2 border-primary/20 hover:border-primary transition-colors">
                <AvatarImage src={userProfile?.photos?.[0]} className="object-cover" />
                <AvatarFallback className="text-xs">
                  {userProfile?.display_name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
            <Link
              to="/app/settings"
              className="flex-1 flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto flex flex-col">
        {/* Full-width Header Section */}
        <div className="p-4 lg:p-6 pb-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold">
                {getGreeting()}, {userProfile?.display_name?.split(' ')[0] || 'Angler'}!
              </h1>
              <p className="text-sm lg:text-base text-muted-foreground">
                Conditions look perfect for fishing today.
              </p>
            </div>

            {/* View Mode Toggle + Notification Bell - Hidden on mobile (uses AppHeader switcher) */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="bg-muted rounded-full p-1 flex">
                {[
                  { value: "unified", label: "Unified View", icon: LayoutDashboard },
                  { value: "dating", label: "Dating Only", icon: Heart },
                  { value: "fishing", label: "Fishing Spots", icon: Anchor },
                ].map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => handleModeSwitch(mode.value as 'unified' | 'dating' | 'fishing')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                      activeMode === mode.value
                        ? "bg-background text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <mode.icon className="h-4 w-4" />
                    {mode.label}
                  </button>
                ))}
              </div>
              <NotificationCenter />
            </div>
          </div>

          {/* Suggestion of the Day */}
          {featuredSpot && (
            <Card className="mb-6 overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/2 h-64 md:h-80 relative">
                  <img
                    src={featuredSpot.photos?.[0] || "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=800"}
                    alt={featuredSpot.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                    Suggestion of the Day
                  </Badge>
                </div>
                <div className="md:w-1/2 p-6 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-primary border-primary">
                      {featuredSpot.rating_avg ? `${Math.round(featuredSpot.rating_avg * 10)}% Match` : "Top Rated"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {(() => {
                        const distance = calculateDistanceMiles(
                          userProfile?.location_lat,
                          userProfile?.location_lng,
                          featuredSpot.location_lat,
                          featuredSpot.location_lng
                        );
                        return distance !== null ? `• ${distance} miles away` : "";
                      })()}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold mb-2">
                    Perfect Catch & Match: {featuredSpot.name}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    A top-rated spot for quiet conversation and excellent {featuredSpot.species_available?.[0] || "Bass"} fishing. Based on your shared interest in fly...
                  </p>
                  <div className="flex items-center gap-3">
                    <Button onClick={() => navigate(`/app/spots/${featuredSpot.id}`)}>
                      View Details
                    </Button>
                    <Button variant="outline" size="icon">
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Two-column layout for remaining content */}
        <div className="flex flex-1 px-4 lg:px-6 pb-6 gap-6">
          <main className="flex-1 min-w-0">
            {/* Mobile/Tablet Weather Card */}
            <div className="lg:hidden mb-4">
              <Card className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-0">
                <CardContent className="p-3">
                  {weatherLoading ? (
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full bg-white/20" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-20 bg-white/20" />
                        <Skeleton className="h-3 w-32 bg-white/20" />
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Location prompt if not set */}
                      {!userProfile?.location_lat && !userProfile?.location_lng && (
                        <button
                          onClick={() => navigate("/app/settings")}
                          className="w-full text-left text-xs bg-white/20 hover:bg-white/30 rounded px-2 py-1.5 mb-2 transition-colors"
                        >
                          <span className="opacity-90">📍 Set your location in </span>
                          <span className="underline">Settings</span>
                        </button>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {weatherData?.condition?.toLowerCase().includes('clear') ? (
                            <Sun className="h-8 w-8 text-yellow-300" />
                          ) : weatherData?.condition?.toLowerCase().includes('cloud') ? (
                            <Cloud className="h-8 w-8 text-white/80" />
                          ) : weatherData?.condition?.toLowerCase().includes('rain') ? (
                            <Droplets className="h-8 w-8 text-blue-200" />
                          ) : (
                            <Sun className="h-8 w-8 text-yellow-300 opacity-50" />
                          )}
                          <div>
                            <p className="text-2xl font-bold">{weatherData?.temperature ?? "--"}°</p>
                            <p className="text-xs opacity-80">{weatherData?.condition || "--"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs opacity-80 flex items-center gap-1 justify-end">
                            <MapPin className="h-3 w-3" />
                            {weatherData?.location || userProfile?.location_name || "--"}
                          </p>
                          <p className="text-xs opacity-70 flex items-center gap-1 justify-end mt-0.5">
                            <Wind className="h-3 w-3" /> {weatherData?.wind?.speed ?? "--"}mph
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <AnimatePresence mode="wait">
              {/* New Anglers Near You - Show in unified and dating modes */}
              {(activeMode === "unified" || activeMode === "dating") && (
                <motion.div
                  key="anglers"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="mb-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Heart className="h-5 w-5 text-destructive" />
                      New Anglers Near You
                    </h2>
                    <Button variant="link" className="text-primary" onClick={() => navigate("/app/discover")}>
                      View All
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                      {nearbyAnglers
                        .filter((angler) => !swipedAnglers.has(angler.id))
                        .slice(0, 3)
                        .map((angler, index) => (
                          <motion.div
                            key={angler.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                          >
                            <Card 
                              className="overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 border-0 bg-card"
                              onClick={() => handleAnglerCardClick(angler.id)}
                            >
                              <div className="relative aspect-[4/5] overflow-hidden">
                                <img 
                                  src={angler.photos?.[0] || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"} 
                                  alt={angler.display_name || "Angler"}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                
                                {angler.fishing_experience && (
                                  <Badge className="absolute top-3 left-3 bg-white/90 text-foreground backdrop-blur-sm capitalize text-xs">
                                    {angler.fishing_experience}
                                  </Badge>
                                )}
                                
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                  <h3 className="font-bold text-lg text-white mb-1">
                                    {angler.display_name || "Anonymous"}{angler.age ? `, ${angler.age}` : ""}
                                  </h3>
                                  {angler.location_name && (
                                    <p className="text-sm text-white/80 flex items-center gap-1 mb-3">
                                      <MapPin className="h-3.5 w-3.5" />
                                      {angler.location_name}
                                    </p>
                                  )}
                                  
                                  <div className="flex flex-wrap gap-1.5 mb-4">
                                    {angler.preferred_species?.slice(0, 2).map((species, i) => (
                                      <Badge key={i} className="bg-white/20 text-white border-0 backdrop-blur-sm text-xs">
                                        {species}
                                      </Badge>
                                    ))}
                                  </div>
                                  
                                  <div className="flex items-center justify-center gap-4" onClick={(e) => e.stopPropagation()}>
                                    <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.1 }}>
                                      <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="rounded-full h-12 w-12 bg-white/10 border-white/30 hover:bg-white/20 backdrop-blur-sm transition-all"
                                        onClick={() => handlePassAngler(angler)}
                                        disabled={swipeMutation.isPending}
                                      >
                                        <X className="h-5 w-5 text-white" />
                                      </Button>
                                    </motion.div>
                                    <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.1 }}>
                                      <Button 
                                        size="icon" 
                                        className="rounded-full h-14 w-14 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-lg shadow-rose-500/40 transition-all border-2 border-white/20"
                                        onClick={() => handleLikeAngler(angler)}
                                        disabled={swipeMutation.isPending}
                                      >
                                        <Heart className="h-6 w-6 fill-white text-white" />
                                      </Button>
                                    </motion.div>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          </motion.div>
                        ))}
                    </AnimatePresence>
                  </div>
                    
                  {/* Empty state when all profiles swiped */}
                  {nearbyAnglers.filter((a) => !swipedAnglers.has(a.id)).length === 0 && nearbyAnglers.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-8"
                    >
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <Heart className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">You've seen everyone nearby!</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Check back later for new anglers or explore more profiles.
                      </p>
                      <Button onClick={() => navigate("/app/discover")}>
                        Discover More
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Fishing Spots Grid - Show in unified and fishing modes */}
              {(activeMode === "unified" || activeMode === "fishing") && hotSpots.length > 0 && (
                <motion.div
                  key="spots"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut", delay: activeMode === "unified" ? 0.1 : 0 }}
                  className="mb-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Popular Fishing Spots
                    </h2>
                    <Button variant="link" className="text-primary" onClick={() => navigate("/app/spots")}>
                      View All
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {hotSpots.map((spot, index) => (
                      <motion.div
                        key={spot.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/app/spots/${spot.id}`)}>
                          <div className="relative h-32">
                            <img
                              src={spot.photos?.[0] || "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=400"}
                              alt={spot.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 text-white px-2 py-1 rounded-full text-xs">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              {spot.rating_avg?.toFixed(1) || "4.5"}
                            </div>
                          </div>
                          <CardContent className="p-3">
                            <h3 className="font-semibold text-sm mb-1">{spot.name}</h3>
                            <div className="flex flex-wrap gap-1">
                              {spot.species_available?.slice(0, 2).map((species, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {species}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Latest Feed Post - Show in unified and fishing modes */}
              {(activeMode === "unified" || activeMode === "fishing") && latestFeedPost && (
                <motion.div
                  key="feed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut", delay: activeMode === "unified" ? 0.2 : 0.1 }}
                  className="mb-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Fish className="h-5 w-5 text-primary" />
                      Latest Feed
                    </h2>
                    <Button variant="link" className="text-primary" onClick={() => navigate("/app/feed")}>
                      View All
                    </Button>
                  </div>
                  
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/app/feed")}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={latestFeedPost.profile?.photos?.[0]} />
                          <AvatarFallback>
                            {latestFeedPost.profile?.display_name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {latestFeedPost.profile?.display_name || "Someone"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTimeAgo(latestFeedPost.created_at)}
                          </p>
                        </div>
                      </div>
                      {latestFeedPost.content && (
                        <p className="text-sm mt-3 line-clamp-2">{latestFeedPost.content}</p>
                      )}
                      {latestFeedPost.video_url ? (
                        <video
                          src={latestFeedPost.video_url}
                          className="w-full h-48 object-cover rounded-lg mt-3"
                          muted
                          playsInline
                        />
                      ) : latestFeedPost.photos?.[0] && (
                        <img
                          src={latestFeedPost.photos[0]}
                          alt="Latest feed post"
                          className="w-full h-48 object-cover rounded-lg mt-3"
                        />
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Right Sidebar - Now inside the two-column layout */}
          <aside className="w-80 hidden lg:block space-y-4">
            {/* Weather Widget */}
            <Card className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-0">
              <CardContent className="p-4">
                {weatherLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-24 bg-white/20" />
                    <Skeleton className="h-12 w-20 bg-white/20" />
                    <Skeleton className="h-4 w-full bg-white/20" />
                  </div>
                ) : (
                  <>
                    {/* Location prompt if not set */}
                    {!userProfile?.location_lat && !userProfile?.location_lng && (
                      <button
                        onClick={() => navigate("/app/settings")}
                        className="w-full text-left text-xs bg-white/20 hover:bg-white/30 rounded px-2 py-1.5 mb-2 transition-colors"
                      >
                        <span className="opacity-90">📍 Set your location in </span>
                        <span className="underline">Settings</span>
                      </button>
                    )}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs opacity-80">Current Location</p>
                        <p className="font-semibold flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {weatherData?.location || userProfile?.location_name || "--"}
                        </p>
                      </div>
                      {weatherData?.condition?.toLowerCase().includes('clear') ? (
                        <Sun className="h-10 w-10 text-yellow-300" />
                      ) : weatherData?.condition?.toLowerCase().includes('cloud') ? (
                        <Cloud className="h-10 w-10 text-white/80" />
                      ) : weatherData?.condition?.toLowerCase().includes('rain') ? (
                        <Droplets className="h-10 w-10 text-blue-200" />
                      ) : (
                        <Sun className="h-10 w-10 text-yellow-300 opacity-50" />
                      )}
                    </div>
                    <div className="mb-3">
                      <span className="text-5xl font-bold">{weatherData?.temperature ?? "--"}°</span>
                    </div>
                    <p className="text-sm opacity-90 flex items-center gap-2">
                      <Cloud className="h-4 w-4" />
                      {weatherData?.condition || "--"} • <Wind className="h-4 w-4" /> {weatherData?.wind?.speed ?? "--"}mph {weatherData?.wind?.direction ? getWindDirection(weatherData.wind.direction) : "--"}
                    </p>
                    <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/20">
                      <div className="text-center">
                        <p className="text-xs opacity-70">Bite Rating</p>
                        <p className={`font-semibold ${weatherData ? getFishingConditions(weatherData).color : ''}`}>
                          {weatherData ? getFishingConditions(weatherData).rating : "--"}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs opacity-70">Pressure</p>
                        <p className="font-semibold">{weatherData?.pressure ? (weatherData.pressure * 0.02953).toFixed(1) : "--"}in</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs opacity-70">Humidity</p>
                        <p className="font-semibold">{weatherData?.humidity ?? "--"}%</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Local Hot Spots */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Local Hot Spots
                  </CardTitle>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {hotSpots.map((spot) => (
                  <Link
                    key={spot.id}
                    to={`/app/spots/${spot.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <img
                      src={spot.photos?.[0] || "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=100"}
                      alt={spot.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{spot.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        Known for: {spot.species_available?.slice(0, 2).join(", ") || "Various fish"}
                      </p>
                      <Badge variant="secondary" className="text-xs mt-1">
                        Active Now
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-amber-500">
                        <span className="text-sm font-medium">{spot.rating_avg?.toFixed(1) || "4.5"}</span>
                        <Star className="h-3 w-3 fill-current" />
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

      {/* Match Celebration Modal */}
      <MatchCelebrationModal
        open={showMatchModal}
        onClose={clearMatchedProfile}
        matchProfile={
          matchedProfile && currentMatchId
            ? {
                id: matchedProfile.id,
                matchId: currentMatchId,
                name: matchedProfile.display_name || "Anonymous",
                age: matchedProfile.age || null,
                photo: matchedProfile.photos?.[0] || "",
                fishingType: matchedProfile.fishing_experience || undefined,
                bio: matchedProfile.preferred_species?.join(", ") || undefined,
              }
            : null
        }
        currentUserPhoto={userProfile?.photos?.[0] || ""}
        compatibilityScore={85}
      />
    </div>
  );
}
