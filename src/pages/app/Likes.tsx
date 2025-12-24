import { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Heart, Lock, Crown, X, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DiscoverSidebar } from "@/components/discover";
import { toast } from "sonner";

interface LikeProfile {
  id: string;
  matchId: string;
  displayName: string;
  age: number | null;
  location: string | null;
  photo: string | null;
  bio: string | null;
}

export default function Likes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { accountMode } = useOutletContext<{ accountMode: 'dating' | 'fishing' | 'both' }>();
  const [likes, setLikes] = useState<LikeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  // Get user profile for sidebar
  const { data: profile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('display_name, photos, is_premium')
        .eq('id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (user) {
      fetchLikes();
      checkPremiumStatus();
    }
  }, [user]);

  const checkPremiumStatus = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", user.id)
      .maybeSingle();
    setIsPremium(data?.is_premium ?? false);
  };

  const fetchLikes = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Get matches where other user liked current user, but current user hasn't liked back
      const { data: matchesAsUser1, error: error1 } = await supabase
        .from("matches")
        .select("id, user2_id")
        .eq("user1_id", user.id)
        .eq("user2_liked", true)
        .eq("user1_liked", false);

      const { data: matchesAsUser2, error: error2 } = await supabase
        .from("matches")
        .select("id, user1_id")
        .eq("user2_id", user.id)
        .eq("user1_liked", true)
        .eq("user2_liked", false);

      if (error1 || error2) throw error1 || error2;

      // Combine and get unique user IDs who liked us
      const likerIds: { matchId: string; oderId: string }[] = [];
      
      matchesAsUser1?.forEach((m) => {
        likerIds.push({ matchId: m.id, oderId: m.user2_id });
      });
      
      matchesAsUser2?.forEach((m) => {
        likerIds.push({ matchId: m.id, oderId: m.user1_id });
      });

      if (likerIds.length === 0) {
        setLikes([]);
        setLoading(false);
        return;
      }

      // Fetch profiles for these users
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, display_name, date_of_birth, location_name, photos, bio")
        .in("id", likerIds.map((l) => l.oderId));

      if (profileError) throw profileError;

      const likeProfiles: LikeProfile[] = likerIds.map((liker) => {
        const profile = profiles?.find((p) => p.id === liker.oderId);
        const age = profile?.date_of_birth
          ? Math.floor(
              (Date.now() - new Date(profile.date_of_birth).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000)
            )
          : null;

        return {
          id: liker.oderId,
          matchId: liker.matchId,
          displayName: profile?.display_name || "Unknown",
          age,
          location: profile?.location_name || null,
          photo: profile?.photos?.[0] || null,
          bio: profile?.bio || null,
        };
      });

      setLikes(likeProfiles);
    } catch (error) {
      console.error("Error fetching likes:", error);
      toast.error("Failed to load likes");
    } finally {
      setLoading(false);
    }
  };

  const handleLikeBack = async (like: LikeProfile) => {
    if (!user) return;

    try {
      // Determine if current user is user1 or user2 in this match
      const { data: match } = await supabase
        .from("matches")
        .select("user1_id, user2_id")
        .eq("id", like.matchId)
        .single();

      if (!match) return;

      const isUser1 = match.user1_id === user.id;
      const updateField = isUser1 ? "user1_liked" : "user2_liked";

      const { error } = await supabase
        .from("matches")
        .update({
          [updateField]: true,
          is_match: true,
          matched_at: new Date().toISOString(),
        })
        .eq("id", like.matchId);

      if (error) throw error;

      toast.success(`You matched with ${like.displayName}!`);
      setLikes((prev) => prev.filter((l) => l.id !== like.id));
    } catch (error) {
      console.error("Error liking back:", error);
      toast.error("Failed to like back");
    }
  };

  const handlePass = async (like: LikeProfile) => {
    // For now, just remove from the list locally
    // In production, you might want to mark this as "passed" in the database
    setLikes((prev) => prev.filter((l) => l.id !== like.id));
    toast("Passed", { description: `You passed on ${like.displayName}` });
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-6">
            <Heart className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Likes</h1>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
            ))}
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {/* Mobile back button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden mr-2"
              onClick={() => navigate("/app/discover")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Heart className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Likes</h1>
            {likes.length > 0 && (
              <span className="bg-primary text-primary-foreground text-sm font-medium px-2 py-0.5 rounded-full">
                {likes.length}
              </span>
            )}
          </div>
        </div>

        {likes.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No likes yet</h2>
            <p className="text-muted-foreground max-w-xs">
              When someone likes your profile, they'll appear here. Keep swiping to get more visibility!
            </p>
          </div>
        ) : (
          <>
            {/* Only show upgrade prompt for fishing/both accounts */}
            {!isPremium && accountMode !== 'dating' && (
              <Card className="p-4 mb-6 bg-gradient-to-r from-amber-500/10 to-amber-600/10 border-amber-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Crown className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Upgrade to Premium</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      See who likes you instantly and match faster
                    </p>
                    <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
                      Get Premium
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-4">
              {likes.map((like) => (
                <Card
                  key={like.id}
                  className="relative overflow-hidden rounded-xl group"
                >
                  <div className="aspect-[3/4] relative">
                    {/* Photo with blur for non-premium */}
                    <div
                      className={`absolute inset-0 bg-cover bg-center ${
                        !isPremium ? "blur-lg" : ""
                      }`}
                      style={{
                        backgroundImage: like.photo
                          ? `url(${like.photo})`
                          : "linear-gradient(135deg, hsl(var(--muted)), hsl(var(--muted-foreground)/0.2))",
                      }}
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Lock icon for non-premium */}
                    {!isPremium && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                          <Lock className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    )}

                    {/* Profile info */}
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="font-semibold text-white truncate">
                        {isPremium ? like.displayName : "???"}
                        {like.age && isPremium && (
                          <span className="font-normal">, {like.age}</span>
                        )}
                      </h3>
                      {like.location && isPremium && (
                        <p className="text-white/70 text-sm truncate">
                          {like.location}
                        </p>
                      )}
                    </div>

                    {/* Action buttons for premium users */}
                    {isPremium && (
                      <div className="absolute bottom-16 left-0 right-0 flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="outline"
                          className="w-10 h-10 rounded-full bg-white/90 hover:bg-white border-0"
                          onClick={() => handlePass(like)}
                        >
                          <X className="w-5 h-5 text-red-500" />
                        </Button>
                        <Button
                          size="icon"
                          className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 border-0"
                          onClick={() => handleLikeBack(like)}
                        >
                          <Check className="w-5 h-5 text-white" />
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </>
    );
  };

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <DiscoverSidebar
        accountMode={accountMode}
        discoveryMode={accountMode === 'both' ? 'combo' : accountMode}
        onDiscoveryModeChange={() => {}}
        userName={profile?.display_name || 'User'}
        userPhoto={profile?.photos?.[0]}
        isPremium={profile?.is_premium || false}
      />

      {/* Main Content */}
      <main className="flex-1 p-4 pb-24 lg:ml-60">
        {renderContent()}
      </main>
    </div>
  );
}
