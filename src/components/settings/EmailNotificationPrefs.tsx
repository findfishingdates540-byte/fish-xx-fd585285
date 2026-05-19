import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Prefs = {
  master_enabled: boolean;
  buddy_request: boolean;
  message: boolean;
  buddy_message: boolean;
  match: boolean;
  trip_invite: boolean;
  trip_reminder: boolean;
  feed_like: boolean;
  feed_comment: boolean;
  comment_mention: boolean;
  new_follower: boolean;
  prize_won: boolean;
  challenge_new: boolean;
};

const DEFAULT: Prefs = {
  master_enabled: true,
  buddy_request: true, message: true, buddy_message: true, match: true,
  trip_invite: true, trip_reminder: true, feed_like: true, feed_comment: true,
  comment_mention: true, new_follower: true, prize_won: true, challenge_new: true,
};

const ROWS: { key: keyof Prefs; label: string; desc: string }[] = [
  { key: "buddy_request", label: "Buddy requests", desc: "When someone wants to be your buddy" },
  { key: "message", label: "New messages", desc: "Only when you've been idle 5+ minutes" },
  { key: "buddy_message", label: "Buddy messages", desc: "DMs from your buddies (idle gated)" },
  { key: "match", label: "New matches", desc: "When a like becomes mutual (Dating)" },
  { key: "challenge_new", label: "New challenges & tournaments", desc: "When admins publish a new contest" },
  { key: "trip_invite", label: "Trip invitations", desc: "When a buddy invites you on a trip" },
  { key: "trip_reminder", label: "Trip reminders", desc: "Upcoming trip notifications" },
  { key: "comment_mention", label: "Mentions", desc: "When someone @mentions you" },
  { key: "feed_comment", label: "Feed comments", desc: "Comments on your posts and catches" },
  { key: "feed_like", label: "Likes", desc: "When someone likes your posts" },
  { key: "new_follower", label: "New followers", desc: "When someone follows you" },
  { key: "prize_won", label: "Prizes & payouts", desc: "When you win a contest or receive a payout" },
];

export function EmailNotificationPrefs() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from("notification_email_prefs")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setPrefs({ ...DEFAULT, ...data } as Prefs);
      setLoading(false);
    })();
  }, [user?.id]);

  const update = async (patch: Partial<Prefs>) => {
    if (!user?.id) return;
    const next = { ...prefs, ...patch };
    setPrefs(next);
    const { error } = await supabase
      .from("notification_email_prefs")
      .upsert({ user_id: user.id, ...next }, { onConflict: "user_id" });
    if (error) {
      toast.error("Couldn't save preferences");
      console.error(error);
    }
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div>
          <h3 className="font-semibold mb-1">Email Notifications</h3>
          <p className="text-sm text-muted-foreground">
            Get an email when something happens on FishX. We never email for messages while you're actively in the app.
          </p>
        </div>

        <div className="flex items-center justify-between py-2 border-b">
          <div>
            <p className="font-medium text-sm">Email me about activity</p>
            <p className="text-xs text-muted-foreground">Master switch for all notification emails</p>
          </div>
          <Switch
            checked={prefs.master_enabled}
            disabled={loading}
            onCheckedChange={(v) => update({ master_enabled: v })}
          />
        </div>

        <div className={`space-y-3 ${!prefs.master_enabled ? "opacity-50 pointer-events-none" : ""}`}>
          {ROWS.map((r) => (
            <div key={r.key} className="flex items-center justify-between py-1.5">
              <div className="pr-4">
                <p className="font-medium text-sm">{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
              <Switch
                checked={Boolean(prefs[r.key])}
                disabled={loading}
                onCheckedChange={(v) => update({ [r.key]: v } as Partial<Prefs>)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}