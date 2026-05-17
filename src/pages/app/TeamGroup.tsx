import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Lock, Users } from "lucide-react";
import { useTeamContext } from "@/hooks/use-team-context";
import { useTeamRole } from "@/hooks/use-team-role";
import { TeamSurfaceHeader, type TeamHeaderTab } from "@/components/teams/TeamSurfaceHeader";
import { TeamFeedTab } from "@/components/teams/TeamFeedTab";
import { TeamRightRail } from "@/components/teams/TeamRightRail";
import { EditTeamDialog } from "@/components/teams/EditTeamDialog";
import { TeamMentionsFeed } from "@/components/teams/TeamMentionsFeed";

export default function TeamGroup() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { team, teamLoading, memberUserIds, profiles, isCaptain, isMember, memberCount } = useTeamContext(teamId);
  const { data: role } = useTeamRole(teamId);
  const [editOpen, setEditOpen] = useState(false);
  const [tab, setTab] = useState<TeamHeaderTab>("posts");

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
        <p className="text-muted-foreground font-medium">Group not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/app/teams")}>Browse Teams</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 pb-24">
      <TeamSurfaceHeader
        team={team}
        surface="group"
        memberCount={memberCount}
        isCaptain={isCaptain}
        isMember={isMember}
        onEdit={() => setEditOpen(true)}
        activeTab={tab}
        onTabChange={setTab}
      />
      {isCaptain && <EditTeamDialog open={editOpen} onOpenChange={setEditOpen} team={team} />}

      {!isMember ? (
        <div className="rounded-xl border bg-card p-10 text-center">
          <Lock className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <h2 className="font-bold text-lg mb-1">Members only</h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            The Group is a private space for members of {team.name}. Join the team from the profile to enter the conversation.
          </p>
          <Button onClick={() => navigate(`/app/teams/${teamId}`)}>Back to profile</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          {tab === "mentions" ? (
            <TeamMentionsFeed teamName={team.name} />
          ) : (
            <TeamFeedTab
              teamId={teamId!}
              surface="group"
              teamName={team.name}
              teamLogo={team.logo_url}
              canPost={!!role?.canPostGroup}
              canView={true}
              isCaptain={isCaptain}
            />
          )}
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
      )}
    </div>
  );
}
