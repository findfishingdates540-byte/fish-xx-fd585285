import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Crown, Globe, Lock, Pencil, Users } from "lucide-react";
import { FollowPageButton } from "@/components/teams/FollowPageButton";

interface Props {
  team: any;
  surface: "page" | "group";
  memberCount: number;
  followerCount?: number;
  isCaptain: boolean;
  isMember: boolean;
  onEdit?: () => void;
  rightSlot?: React.ReactNode;
}

export function TeamSurfaceHeader({
  team,
  surface,
  memberCount,
  followerCount = 0,
  isCaptain,
  isMember,
  onEdit,
  rightSlot,
}: Props) {
  const navigate = useNavigate();
  const teamId = team.id as string;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 220);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isGroup = surface === "group";

  return (
    <>
      {/* Full-bleed cover (escapes container) */}
      <div className="relative left-1/2 -translate-x-1/2 w-screen">
        <div className="relative h-44 md:h-72 overflow-hidden">
          {team.cover_url ? (
            <img src={team.cover_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.45),transparent_55%),radial-gradient(circle_at_80%_80%,hsl(var(--primary)/0.3),transparent_50%)] bg-card" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

          {/* Back / surface switcher */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/app/teams/${teamId}`)}
              className="gap-1.5 backdrop-blur bg-background/70 hover:bg-background"
            >
              <ArrowLeft className="h-4 w-4" /> Profile
            </Button>
            <div className="flex items-center gap-2">
              {isCaptain && onEdit && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onEdit}
                  className="gap-1.5 backdrop-blur bg-background/70 hover:bg-background"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit {surface}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Identity row */}
      <div className="-mt-16 md:-mt-20 relative px-1 md:px-2 mb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-background ring-4 ring-background shadow-lg overflow-hidden grid place-items-center text-2xl font-bold text-primary shrink-0">
            {team.logo_url ? (
              <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
            ) : (
              <span>{team.name.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1 min-w-0 md:pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="gap-1 text-[10px] uppercase tracking-wider">
                {isGroup ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                {isGroup ? "Group" : "Page"}
              </Badge>
              {isCaptain && (
                <Badge className="bg-primary/10 text-primary border-0 gap-1 text-[10px]">
                  <Crown className="h-3 w-3" /> Captain
                </Badge>
              )}
            </div>
            <h1 className="text-2xl md:text-4xl font-bold leading-tight mt-1">{team.name}</h1>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground">{memberCount}</span> members
              </span>
              {!isGroup && followerCount > 0 && (
                <>
                  <span>·</span>
                  <span><span className="font-medium text-foreground">{followerCount}</span> {followerCount === 1 ? "follower" : "followers"}</span>
                </>
              )}
              {isGroup && (
                <>
                  <span>·</span>
                  <span>Members-only conversation</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 md:pb-2 flex-wrap">
            {!isGroup && <FollowPageButton teamId={teamId} teamName={team.name} />}
            {rightSlot}
          </div>
        </div>
      </div>

      {/* Sticky compact bar */}
      {scrolled && (
        <div className="fixed top-0 inset-x-0 z-30 bg-background/90 backdrop-blur border-b">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-2 flex items-center gap-3">
            <button
              onClick={() => navigate(`/app/teams/${teamId}`)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Back to profile"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="w-7 h-7 rounded-full overflow-hidden bg-muted grid place-items-center text-xs font-bold text-primary shrink-0">
              {team.logo_url ? (
                <img src={team.logo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span>{team.name.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{team.name}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{surface}</p>
            </div>
            {!isGroup && <FollowPageButton teamId={teamId} teamName={team.name} />}
          </div>
        </div>
      )}
    </>
  );
}
