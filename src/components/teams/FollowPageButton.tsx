import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTeamFollow } from "@/hooks/use-team-follow";

export function FollowPageButton({ teamId, teamName }: { teamId: string; teamName: string }) {
  const { data, toggle, setMuted } = useTeamFollow(teamId);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!data?.isFollowing) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => toggle.mutate()}
        disabled={toggle.isPending}
        className="gap-1.5"
      >
        <Bell className="h-4 w-4" /> Follow Page
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm" className="gap-1.5">
            {data.muted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            Following
            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setMuted.mutate(!data.muted)}>
            {data.muted ? <Bell className="h-4 w-4 mr-2" /> : <BellOff className="h-4 w-4 mr-2" />}
            {data.muted ? "Unmute notifications" : "Mute notifications"}
            {data.muted ? null : <Check className="h-3.5 w-3.5 ml-auto opacity-0" />}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={() => setConfirmOpen(true)}>
            Unfollow page
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unfollow {teamName}?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll stop seeing their page posts in your feed and won't get follower notifications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep following</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { toggle.mutate(); setConfirmOpen(false); }}
            >
              Unfollow
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}