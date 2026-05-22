import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { useTeamContext } from "@/hooks/use-team-context";
import { useTeamRole } from "@/hooks/use-team-role";
import { useTeamFollow } from "@/hooks/use-team-follow";
import { TeamSurfaceHeader, type TeamHeaderTab } from "@/components/teams/TeamSurfaceHeader";
import { TeamFeedTab } from "@/components/teams/TeamFeedTab";
import { TeamRightRail } from "@/components/teams/TeamRightRail";
import { EditTeamDialog } from "@/components/teams/EditTeamDialog";
import { TeamMentionsFeed } from "@/components/teams/TeamMentionsFeed";
import { TeamAboutPanel } from "@/components/teams/TeamAboutPanel";
import { TeamMembersPanel } from "@/components/teams/TeamMembersPanel";
import { TeamMediaTab } from "@/components/teams/TeamMediaTab";
import { TeamInsightsTab } from "@/components/teams/TeamInsightsTab";
import { logTeamPageView } from "@/hooks/use-team-page-insights";
import { useAuth } from "@/contexts/AuthContext";

export default function TeamPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { team, teamLoading, members, memberUserIds, profiles, isCaptain, isMember, memberCount } = useTeamContext(teamId);
  const { data: role } = useTeamRole(teamId);
  const { data: followInfo } = useTeamFollow(teamId);
  const [editOpen, setEditOpen] = useState(false);
  const [tab, setTab] = useState<TeamHeaderTab>("posts");

  useEffect(() => {
    if (teamId) logTeamPageView(teamId, user?.id || null);
  }, [teamId, user?.id]);

  if (teamLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-6 pb-24">
        <Skeleton className="h-72 w-screen relative left-1/2 -translate-x-1/2" />
        <Skeleton className="h-32 mt-4" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center py-20">
        <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground font-medium">Page not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/app/teams")}>Browse Teams</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 pb-24">
      <TeamSurfaceHeader
        team={team}
        surface="page"
        memberCount={memberCount}
        followerCount={followInfo?.count ?? team.followers_count ?? 0}
        isCaptain={isCaptain}
        isMember={isMember}
        onEdit={() => setEditOpen(true)}
        activeTab={tab}
        onTabChange={setTab}
        showInsights={isCaptain}
      />
      {isCaptain && <EditTeamDialog open={editOpen} onOpenChange={setEditOpen} team={team} />}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="min-w-0">
          {tab === "posts" && (
            <TeamFeedTab
              teamId={teamId!}
              surface="page"
              teamName={team.name}
              teamLogo={team.logo_url}
              canPost={!!role?.canPostPage}
              canView={true}
              isCaptain={isCaptain}
            />
          )}
          {tab === "about" && (
            <TeamAboutPanel team={team} memberUserIds={memberUserIds} memberCount={memberCount} />
          )}
          {tab === "members" && (
            <TeamMembersPanel team={team} members={members} profiles={profiles} isCaptain={isCaptain} />
          )}
          {tab === "media" && <TeamMediaTab teamId={teamId!} />}
          {tab === "mentions" && <TeamMentionsFeed teamName={team.name} />}
          {tab === "insights" && isCaptain && <TeamInsightsTab teamId={teamId!} isCaptain={isCaptain} />}
        </div>
        <div className="hidden lg:block sticky top-20">
          <TeamRightRail
            team={team}
            memberCount={memberCount}
            memberUserIds={memberUserIds}
            profiles={profiles}
            isCaptain={isCaptain}
          />
        </div>
      </div>
    </div>
  );
}
