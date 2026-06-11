import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { ApprovalBadge } from "@/components/competition/ApprovalBadge";
import { medium, thumb } from "@/lib/image-url";
import {
  ArrowLeft,
  Share2,
  CheckCircle2,
  Fish,
  MapPin,
  ThumbsUp,
  MessageSquare,
  Flag,
  Scale,
  Ruler,
  Clock,
  Trophy,
  Sparkles,
  Star,
  Zap,
  UserPlus,
} from "lucide-react";
import { ShareSheet } from "@/components/feed/ShareSheet";
import { getShareBaseUrl } from "@/lib/config";
import { CatchComments } from "@/components/catches/CatchComments";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function CatchDetail() {
  const { catchId } = useParams<{ catchId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shareOpen, setShareOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Fetch catch
  const { data: catchData, isLoading } = useQuery({
    queryKey: ["catch-detail", catchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catches")
        .select("*")
        .eq("id", catchId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!catchId,
  });

  // Fetch catch photos
  const { data: catchPhotos = [] } = useQuery({
    queryKey: ["catch-detail-photos", catchId],
    queryFn: async () => {
      const { data } = await supabase
        .from("catch_photos")
        .select("*")
        .eq("catch_id", catchId!)
        .order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!catchId,
  });

  // Fetch angler profile
  const { data: angler } = useQuery({
    queryKey: ["catch-detail-angler", catchData?.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles_safe")
        .select("id, display_name, photos, fishing_experience, id_verified, live_verified")
        .eq("id", catchData!.user_id)
        .maybeSingle();
      return data;
    },
    enabled: !!catchData?.user_id,
  });

  // Fetch angler's leaderboard stats
  const { data: anglerStats } = useQuery({
    queryKey: ["catch-detail-angler-stats", catchData?.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("leaderboard_entries")
        .select("total_caught, rank_by_weight")
        .eq("user_id", catchData!.user_id);
      if (!data || data.length === 0) return { totalCatches: 0, bestRank: null, seasonPoints: 0 };
      const totalCatches = data.reduce((sum, e) => sum + e.total_caught, 0);
      const bestRank = Math.min(...data.map((e) => e.rank_by_weight || 999).filter(Boolean));
      return { totalCatches, bestRank: bestRank < 999 ? bestRank : null, seasonPoints: totalCatches * 20 };
    },
    enabled: !!catchData?.user_id,
  });

  // Fetch angler badges
  const { data: badges = [] } = useQuery({
    queryKey: ["catch-detail-badges", catchData?.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("angler_badges")
        .select("badge_name, badge_type")
        .eq("user_id", catchData!.user_id)
        .limit(5);
      return data || [];
    },
    enabled: !!catchData?.user_id,
  });

  // Fetch species info
  const { data: speciesInfo } = useQuery({
    queryKey: ["catch-detail-species", catchData?.species_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("fish_species")
        .select("name")
        .eq("id", catchData!.species_id!)
        .maybeSingle();
      return data;
    },
    enabled: !!catchData?.species_id,
  });

  // Fetch spot info
  const { data: spotInfo } = useQuery({
    queryKey: ["catch-detail-spot", catchData?.fishing_spot_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("fishing_spots")
        .select("name, location_name")
        .eq("id", catchData!.fishing_spot_id!)
        .maybeSingle();
      return data;
    },
    enabled: !!catchData?.fishing_spot_id,
  });

  const heroPhoto = catchData?.cover_photo_url || catchPhotos[0]?.photo_url || null;

  // Build a complete, deduplicated, labeled photo gallery
  type GalleryItem = { url: string; label: string };
  const gallery: GalleryItem[] = (() => {
    const items: GalleryItem[] = [];
    const seen = new Set<string>();
    const push = (url: string | null | undefined, label: string) => {
      if (!url || seen.has(url)) return;
      seen.add(url);
      items.push({ url, label });
    };
    push(catchData?.cover_photo_url, "Trophy Shot");
    push(catchData?.measurement_photo_url, "Measurement");
    catchPhotos.forEach((p: any) => {
      const label =
        p.photo_type === "scale" ? "On the Scale" :
        p.photo_type === "measurement" ? "Measurement" :
        p.photo_type === "trophy" ? "Trophy Shot" :
        "Additional";
      push(p.photo_url, label);
    });
    (catchData?.photos || []).forEach((u: string) => push(u, "Additional"));
    return items;
  })();
  const speciesName = speciesInfo?.name || catchData?.species_name || "Unknown Species";
  const locationName = catchData?.general_location || spotInfo?.location_name || spotInfo?.name || null;
  const caughtAt = catchData?.caught_at ? new Date(catchData.caught_at) : null;
  const experienceLabel = angler?.fishing_experience
    ? angler.fishing_experience.charAt(0).toUpperCase() + angler.fishing_experience.slice(1) + " Angler"
    : "Angler";

  const shareUrl = `${getShareBaseUrl()}/app/catches/${catchId}`;
  const shareTitle = `${speciesName} Catch on Fish-X`;
  const handleShare = () => setShareOpen(true);

  const badgeIcon = (type: string) => {
    switch (type) {
      case "first_catch": return <Sparkles className="h-3 w-3" />;
      case "top_angler": return <Trophy className="h-3 w-3" />;
      case "big_game": return <Star className="h-3 w-3" />;
      case "release_champion": return <Zap className="h-3 w-3" />;
      default: return <Trophy className="h-3 w-3" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6 pb-24">
        <Skeleton className="h-10 w-48" />
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-6">
            <Skeleton className="h-[400px] rounded-xl" />
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          </div>
          <Skeleton className="w-full lg:w-80 h-[400px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (!catchData) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4">
        <Fish className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-lg font-bold mb-1">Catch Not Found</h2>
        <p className="text-sm text-muted-foreground mb-4">This catch record doesn't exist or has been removed.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold">Catch Details</h1>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
              ID: #{catchData.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
          <Share2 className="h-3.5 w-3.5" />
          Share
        </Button>
      </div>

      <ShareSheet
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        shareUrl={shareUrl}
        shareTitle={shareTitle}
        shareText={`Check out this ${speciesName} catch on Fish-X`}
      />

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6 px-4 md:px-6">
        {/* LEFT: Photo + Stats + Intelligence */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Action Video */}
          {(catchData as any).video_url && (
            <div className="relative rounded-xl overflow-hidden bg-black">
              <video
                src={(catchData as any).video_url}
                controls
                playsInline
                preload="metadata"
                className="w-full max-h-[420px] object-contain bg-black"
              />
              <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/70 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                ▶ Action Clip
              </div>
            </div>
          )}

          {/* Hero Photo */}
          <div className="relative rounded-xl overflow-hidden bg-muted">
            {heroPhoto ? (
              <img src={medium(heroPhoto)} alt={speciesName} loading="eager" decoding="async" fetchPriority="high" className="w-full h-[300px] md:h-[420px] object-cover" />
            ) : (
              <div className="w-full h-[300px] md:h-[420px] flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                <Fish className="h-24 w-24 text-muted-foreground/20" />
              </div>
            )}

            {/* Status badge */}
            <div className="absolute top-4 right-4">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm border ${
                catchData.catch_status === "released"
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-400 border-amber-500/30"
              }`}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                {catchData.catch_status === "released" ? "Catch & Released" : "Harvested"}
              </span>
            </div>

            {/* Verified badge */}
            {catchData.is_verified && (
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                  <Scale className="h-3 w-3" />
                  Verified
                </span>
              </div>
            )}
            {(catchData.challenge_id || catchData.tournament_id) && catchData.approval_status && (
              <div className="absolute bottom-4 right-4">
                <ApprovalBadge status={catchData.approval_status} notes={catchData.approval_notes} size="md" />
              </div>
            )}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Scale className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Weight</p>
              </div>
              <p className="text-xl font-bold">
                {catchData.weight_lbs ? (
                  <>{catchData.weight_lbs} <span className="text-sm font-normal text-muted-foreground">lbs</span></>
                ) : "—"}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Length</p>
              </div>
              <p className="text-xl font-bold">
                {catchData.length_in ? (
                  <>{catchData.length_in} <span className="text-sm font-normal text-muted-foreground">in</span></>
                ) : "—"}
              </p>
            </div>
            <button
              onClick={() => catchData?.species_id && navigate(`/app/leaderboard/species/${catchData.species_id}`)}
              className="rounded-xl border bg-card p-4 text-left hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <Fish className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Species</p>
              </div>
              <p className="text-sm font-bold leading-tight group-hover:text-primary transition-colors">{speciesName}</p>
              {catchData?.species_id && <p className="text-[10px] text-primary mt-1">View Leaderboard →</p>}
            </button>
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Time</p>
              </div>
              <p className="text-xl font-bold">
                {caughtAt ? (
                  <>
                    {caughtAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      {caughtAt.toLocaleTimeString("en-US", { hour12: true }).split(" ")[1]}
                    </span>
                  </>
                ) : "—"}
              </p>
            </div>
          </div>

          {/* Catch Intelligence */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-bold text-sm flex items-center gap-2 mb-4">
              <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              Catch Intelligence
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {catchData.bait_used && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tackle / Lure</span>
                    <span className="text-sm font-semibold">{catchData.bait_used}</span>
                  </div>
                </>
              )}
              {catchData.gear_used && catchData.gear_used.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Gear Used</span>
                  <span className="text-sm font-semibold">{catchData.gear_used.join(", ")}</span>
                </div>
              )}
              {caughtAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Date</span>
                  <span className="text-sm font-semibold">
                    {caughtAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              )}
              {catchData.catch_status && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="text-sm font-semibold capitalize">{catchData.catch_status}</span>
                </div>
              )}
            </div>
            {catchData.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Notes</p>
                <p className="text-sm text-foreground">{catchData.notes}</p>
              </div>
            )}
          </div>

          {/* Additional Photos */}
          {gallery.length > 1 && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm">All Photos</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {gallery.map((item, idx) => (
                  <button
                    key={item.url + idx}
                    onClick={() => setLightboxUrl(item.url)}
                    className="relative group rounded-lg overflow-hidden bg-muted"
                  >
                    <img
                      src={thumb(item.url)}
                      alt={item.label}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-32 object-cover transition-transform group-hover:scale-[1.02]"
                    />
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-semibold uppercase tracking-wider">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <CatchComments catchId={catchData.id} />
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="w-full lg:w-80 shrink-0 space-y-5">
          {/* Angler Card */}
          <div className="rounded-xl border bg-card p-5 text-center">
            <button
              onClick={() => angler && navigate(`/app/u/${angler.id}`)}
              className="inline-block"
            >
              <Avatar className="h-20 w-20 mx-auto mb-3 ring-2 ring-primary/20 ring-offset-2 ring-offset-card">
                <AvatarImage src={angler?.photos?.[0] || ""} />
                <AvatarFallback className="text-lg bg-muted">
                  {(angler?.display_name || "?")[0]}
                </AvatarFallback>
              </Avatar>
            </button>
            <h3 className="font-bold text-base">{angler?.display_name || "Angler"}</h3>
            <p className="text-xs text-primary font-medium mt-0.5">
              {experienceLabel}
              {anglerStats?.bestRank && ` • Rank #${anglerStats.bestRank}`}
            </p>

            <div className={`grid ${(catchData.challenge_id || catchData.tournament_id) ? "grid-cols-2" : "grid-cols-1"} gap-3 mt-4`}>
              {(catchData.challenge_id || catchData.tournament_id) && (
                <div className="rounded-lg border px-3 py-2.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Catch Points</p>
                  <p className="text-lg font-bold">{Number(catchData.computed_score || 0).toLocaleString()}</p>
                </div>
              )}
              <div className="rounded-lg border px-3 py-2.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total Catches</p>
                <p className="text-lg font-bold">{(anglerStats?.totalCatches || 0).toLocaleString()}</p>
              </div>
            </div>

            {user?.id !== catchData.user_id && (
              <Button
                className="w-full mt-4 gap-2"
                onClick={() => angler && navigate(`/app/u/${angler.id}`)}
              >
                <UserPlus className="h-4 w-4" />
                Follow Angler
              </Button>
            )}

            {angler && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => navigate(`/app/u/${angler.id}`)}
              >
                View all {angler.display_name?.split(" ")[0] || "their"} catches →
              </Button>
            )}
          </div>

          {/* Achievements */}
          {badges.length > 0 && (
            <div className="rounded-xl border bg-card p-5">
              <h3 className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">
                Achievements Earned
              </h3>
              <div className="flex flex-wrap gap-2">
                {badges.map((b, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border bg-muted/50"
                  >
                    {badgeIcon(b.badge_type)}
                    {b.badge_name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Location */}
          {locationName && (
            <div className="rounded-xl border bg-card p-5">
              <h3 className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">
                Location
              </h3>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-medium">{locationName}</span>
              </div>
              <div className="rounded-lg bg-muted h-36 flex items-center justify-center">
                <p className="text-xs text-muted-foreground">Exact location hidden for privacy</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ThumbsUp className="h-4 w-4" />
                <span className="text-xs">0</span>
              </button>
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs">0</span>
              </button>
            </div>
            <button className="text-muted-foreground hover:text-destructive transition-colors">
              <Flag className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <Dialog open={!!lightboxUrl} onOpenChange={(o) => !o && setLightboxUrl(null)}>
        <DialogContent className="max-w-4xl bg-black/95 border-0 p-2">
          {lightboxUrl && (
            <img src={lightboxUrl} alt="Catch photo" className="w-full max-h-[80vh] object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
