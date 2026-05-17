import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Crown, Globe, Lock, MessageCircle, Pencil, Share2 } from "lucide-react";
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
        <div className="relative h-56 md:h-[22rem] overflow-hidden">
          {team.cover_url ? (
            <img src={team.cover_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.45),transparent_55%),radial-gradient(circle_at_80%_80%,hsl(var(--primary)/0.3),transparent_50%)] bg-card" />
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/60 to-transparent" />

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

      {/* Identity row — Facebook-style: logo overlaps cover, name centered, actions right */}
      <div className="-mt-12 md:-mt-16 relative mb-4">
        <div className="flex items-end gap-4 md:gap-6">
          {/* Circular logo overlapping cover */}
          <div className="w-28 h-28 md:w-40 md:h-40 rounded-full bg-background ring-4 ring-background shadow-xl overflow-hidden grid place-items-center text-3xl font-bold text-primary shrink-0">
            {team.logo_url ? (
              <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
            ) : (
              <span>{team.name.slice(0, 2).toUpperCase()}</span>
            )}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0 pb-1 md:pb-3">
            <h1 className="text-2xl md:text-3xl font-bold leading-tight truncate">{team.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-medium text-foreground">{!isGroup ? followerCount : memberCount}</span>{" "}
              {!isGroup ? (followerCount === 1 ? "follower" : "followers") : "members"}
              {!isGroup && (
                <> · <span className="font-medium text-foreground">{memberCount}</span> {memberCount === 1 ? "member" : "members"}</>
              )}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
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
          </div>

          {/* Actions on the right (Facebook-style row) */}
          <div className="hidden md:flex items-center gap-2 pb-3 shrink-0">
            {!isGroup && <FollowPageButton teamId={teamId} teamName={team.name} />}
            <Button size="sm" variant="secondary" className="gap-1.5">
              <MessageCircle className="h-4 w-4" /> Message
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (navigator.share) navigator.share({ title: team.name, url: window.location.href }).catch(() => {});
                else navigator.clipboard?.writeText(window.location.href);
              }}
              className="gap-1.5"
            >
              <Share2 className="h-4 w-4" /> Share
            </Button>
            {rightSlot}
          </div>
        </div>

        {/* Mobile actions row */}
        <div className="md:hidden flex items-center gap-2 mt-3 flex-wrap">
          {!isGroup && <FollowPageButton teamId={teamId} teamName={team.name} />}
          <Button size="sm" variant="secondary" className="gap-1.5">
            <MessageCircle className="h-4 w-4" /> Message
          </Button>
          {rightSlot}
        </div>
      </div>

      {/* Tab/nav strip beneath identity (visual mirror of FB) */}
      <div className="border-b mb-6 -mx-4 md:-mx-6 px-4 md:px-6">
        <nav className="flex items-center gap-1 overflow-x-auto">
          {[
            { key: surface, label: "Posts", active: true, onClick: () => {} },
            { key: "about", label: "About", active: false, onClick: () => navigate(`/app/teams/${teamId}?tab=about`) },
            { key: "members", label: "Members", active: false, onClick: () => navigate(`/app/teams/${teamId}?tab=members`) },
            { key: "media", label: "Photos", active: false, onClick: () => navigate(`/app/teams/${teamId}?tab=media`) },
            ...(!isGroup ? [{ key: "group", label: "Group", active: false, onClick: () => navigate(`/app/teams/${teamId}/group`) }] : [{ key: "page", label: "Page", active: false, onClick: () => navigate(`/app/teams/${teamId}/page`) }]),
          ].map((t) => (
            <button
              key={t.key}
              onClick={t.onClick}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition ${
                t.active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-t-md"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
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
