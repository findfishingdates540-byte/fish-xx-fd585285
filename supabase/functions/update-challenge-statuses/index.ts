import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();
    const transitions: string[] = [];

    // 1. upcoming → submissions_open (when now >= start_date)
    const { data: toOpen, error: e1 } = await supabase
      .from("photo_challenges")
      .update({ status: "submissions_open" })
      .eq("status", "upcoming")
      .lte("start_date", now)
      .select("id, title");

    if (e1) console.error("Error transitioning to submissions_open:", e1);
    if (toOpen?.length) {
      transitions.push(`submissions_open: ${toOpen.map(c => c.title).join(", ")}`);
    }

    // 2. submissions_open → voting (when now >= end_date)
    const { data: toVoting, error: e2 } = await supabase
      .from("photo_challenges")
      .update({ status: "voting" })
      .eq("status", "submissions_open")
      .lte("end_date", now)
      .select("id, title");

    if (e2) console.error("Error transitioning to voting:", e2);
    if (toVoting?.length) {
      transitions.push(`voting: ${toVoting.map(c => c.title).join(", ")}`);
    }

    // 3. voting → completed (when now >= voting_end_date) + tally votes
    const { data: toComplete, error: e3 } = await supabase
      .from("photo_challenges")
      .select("id, title")
      .eq("status", "voting")
      .lte("voting_end_date", now);

    if (e3) console.error("Error finding challenges to complete:", e3);

    if (toComplete?.length) {
      for (const challenge of toComplete) {
        // Tally votes and find winner (rank 1)
        const { data: results, error: tallyErr } = await supabase.rpc("tally_photo_challenge_votes", {
          p_challenge_id: challenge.id,
        });
        if (tallyErr) {
          console.error(`Error tallying votes for ${challenge.title}:`, tallyErr);
        }

        const winnerId = results?.[0]?.user_id ?? null;

        // Mark as completed with winner
        const { error: completeErr } = await supabase
          .from("photo_challenges")
          .update({ status: "completed", winner_id: winnerId })
          .eq("id", challenge.id);

        if (completeErr) {
          console.error(`Error completing ${challenge.title}:`, completeErr);
        }
      }
      transitions.push(`completed: ${toComplete.map(c => c.title).join(", ")}`);
    }

    console.log("Challenge status update complete.", transitions.length ? transitions : "No transitions needed.");

    return new Response(
      JSON.stringify({ success: true, transitions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Challenge status update error:", error);
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
