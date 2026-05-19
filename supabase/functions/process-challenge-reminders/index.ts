import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderRow {
  id: string;
  user_id: string;
  challenge_id: string;
  remind_at: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();
    console.log(`[process-challenge-reminders] running at ${now}`);

    // Pull due, unsent reminders (small batch to keep request bounded)
    const { data: reminders, error } = await supabase
      .from("challenge_reminders")
      .select("id, user_id, challenge_id, remind_at")
      .eq("sent", false)
      .lte("remind_at", now)
      .limit(200);

    if (error) throw error;

    const results = { processed: 0, sent: 0, skipped: 0, errors: [] as string[] };

    if (!reminders || reminders.length === 0) {
      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Bulk-load referenced challenges
    const challengeIds = [...new Set(reminders.map((r: ReminderRow) => r.challenge_id))];
    const { data: challenges } = await supabase
      .from("fishing_challenges")
      .select("id, title, start_date")
      .in("id", challengeIds);
    const byId = new Map<string, { id: string; title: string; start_date: string }>();
    (challenges || []).forEach((c: any) => byId.set(c.id, c));

    for (const r of reminders as ReminderRow[]) {
      results.processed++;
      try {
        const ch = byId.get(r.challenge_id);
        if (!ch) {
          // Mark sent so we don't retry forever on a deleted challenge
          await supabase.from("challenge_reminders").update({ sent: true }).eq("id", r.id);
          results.skipped++;
          continue;
        }

        const startsAt = new Date(ch.start_date);
        const minsUntil = Math.round((startsAt.getTime() - Date.now()) / 60000);
        const whenLabel =
          minsUntil <= 0
            ? "is starting now"
            : minsUntil < 60
              ? `starts in ${minsUntil} min`
              : `starts in about ${Math.round(minsUntil / 60)}h`;

        const title = "🎣 Challenge starting soon";
        const body = `"${ch.title}" ${whenLabel}. Tap to register or check the leaderboard.`;
        const url = `/app/challenges/${ch.id}`;

        // 1) In-app notification
        await supabase.from("notifications").insert({
          user_id: r.user_id,
          type: "challenge_reminder",
          title,
          body,
          data: { url, tag: `challenge-reminder-${ch.id}`, challenge_id: ch.id },
        });

        // 2) Push notification (best-effort)
        try {
          const pushRes = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              userId: r.user_id,
              title,
              body,
              url,
              tag: `challenge-reminder-${ch.id}`,
            }),
          });
          if (!pushRes.ok) {
            console.warn(`Push failed for reminder ${r.id}: ${await pushRes.text()}`);
          }
        } catch (pushErr) {
          console.warn(`Push exception for reminder ${r.id}:`, pushErr);
        }

        // 3) Mark sent
        const { error: updErr } = await supabase
          .from("challenge_reminders")
          .update({ sent: true })
          .eq("id", r.id);
        if (updErr) throw updErr;

        results.sent++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`Reminder ${r.id} failed:`, msg);
        results.errors.push(`${r.id}: ${msg}`);
      }
    }

    console.log("[process-challenge-reminders] done", results);
    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("process-challenge-reminders error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});