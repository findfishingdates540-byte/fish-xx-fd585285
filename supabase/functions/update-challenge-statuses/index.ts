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

    // Read the global platform fee from app_settings (single source of truth)
    const { data: feeSetting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "platform_fee_percent")
      .maybeSingle();
    const globalFeePct = Number(
      (feeSetting?.value as { percent?: number } | null)?.percent ?? 10,
    );

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

    // 3. voting → completed (when now >= voting_end_date) + tally votes + create payout
    const { data: toComplete, error: e3 } = await supabase
      .from("photo_challenges")
      .select("id, title, entry_fee, entry_fee_enabled, platform_fee_percent, is_admin_funded, prize_type, prize_description, gift_card_code")
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

        // Create prize payout record if there's a winner
        if (winnerId) {
          // Compute prize pool from held escrow rows
          let grossPool = 0;
          let platformFee = 0;
          let prizeAmount = 0;

          if (challenge.prize_type === "cash" && challenge.entry_fee_enabled && !challenge.is_admin_funded) {
            const { data: heldRows } = await supabase
              .from("escrow_transactions")
              .select("amount")
              .eq("challenge_id", challenge.id)
              .eq("status", "held");
            grossPool = (heldRows || []).reduce((s, r) => s + Number(r.amount || 0), 0);
            const feePct = globalFeePct;
            platformFee = +(grossPool * (feePct / 100)).toFixed(2);
            prizeAmount = +(grossPool - platformFee).toFixed(2);

            // Release escrow
            await supabase
              .from("escrow_transactions")
              .update({ status: "released", released_at: now })
              .eq("challenge_id", challenge.id)
              .eq("status", "held");
          }

          const { error: payoutErr } = await supabase
            .from("prize_payouts")
            .insert({
              winner_id: winnerId,
              challenge_id: challenge.id,
              prize_type: challenge.prize_type || "cash",
              prize_amount: prizeAmount,
              gross_pool: grossPool,
              platform_fee_amount: platformFee,
              prize_description: challenge.prize_description ||
                (prizeAmount > 0 ? `$${prizeAmount.toFixed(2)} cash prize` : null),
              gift_card_code: challenge.gift_card_code || null,
              status: "pending",
              notified_at: now,
            });

          if (payoutErr) {
            console.error(`Error creating payout for ${challenge.title}:`, payoutErr);
          }

          // Create notification for winner
          const { error: notifErr } = await supabase
            .from("notifications")
            .insert({
              user_id: winnerId,
              type: "prize_won",
              title: "🏆 You Won!",
              body: `Congratulations! You won "${challenge.title}"!`,
              data: { challenge_id: challenge.id, prize_type: challenge.prize_type },
            });

          if (notifErr) {
            console.error(`Error notifying winner for ${challenge.title}:`, notifErr);
          }
        }
      }
      transitions.push(`completed: ${toComplete.map(c => c.title).join(", ")}`);
    }

    // 4. Fishing challenges: status active → completed when end_date passed
    const today = new Date().toISOString().slice(0, 10);
    const { data: fcDone } = await supabase
      .from("fishing_challenges")
      .select("id, title, entry_fee, entry_fee_enabled, platform_fee_percent, is_admin_funded, prize_type, prize_description, winner_id, status")
      .in("status", ["active", "in_progress"])
      .lt("end_date", today);

    if (fcDone?.length) {
      for (const ch of fcDone) {
        // Mark completed (winner_id assumed pre-set by admin or ranking; skip payout if missing)
        await supabase
          .from("fishing_challenges")
          .update({ status: "completed" })
          .eq("id", ch.id);

        if (!ch.winner_id) continue;

        let grossPool = 0;
        let platformFee = 0;
        let prizeAmount = 0;

        if (ch.prize_type === "cash" && ch.entry_fee_enabled && !ch.is_admin_funded) {
          const { data: heldRows } = await supabase
            .from("escrow_transactions")
            .select("amount")
            .eq("fishing_challenge_id", ch.id)
            .eq("status", "held");
          grossPool = (heldRows || []).reduce((s, r) => s + Number(r.amount || 0), 0);
          const feePct = globalFeePct;
          platformFee = +(grossPool * (feePct / 100)).toFixed(2);
          prizeAmount = +(grossPool - platformFee).toFixed(2);

          await supabase
            .from("escrow_transactions")
            .update({ status: "released", released_at: now })
            .eq("fishing_challenge_id", ch.id)
            .eq("status", "held");
        }

        await supabase.from("prize_payouts").insert({
          winner_id: ch.winner_id,
          fishing_challenge_id: ch.id,
          prize_type: ch.prize_type || "cash",
          prize_amount: prizeAmount,
          gross_pool: grossPool,
          platform_fee_amount: platformFee,
          prize_description: ch.prize_description ||
            (prizeAmount > 0 ? `$${prizeAmount.toFixed(2)} cash prize` : null),
          status: "pending",
          notified_at: now,
        });

        await supabase.from("notifications").insert({
          user_id: ch.winner_id,
          type: "prize_won",
          title: "🏆 You Won!",
          body: `Congratulations! You won "${ch.title}"!`,
          data: { fishing_challenge_id: ch.id, prize_type: ch.prize_type },
        });
      }
      transitions.push(`fishing_completed: ${fcDone.map(c => c.title).join(", ")}`);
    }

    // 5. Tournaments: in_progress → completed when end_date passed
    const { data: tDone } = await supabase
      .from("tournaments")
      .select("id, title, entry_fee, entry_fee_enabled, is_admin_funded, prize_type, prize_description, gift_card_code, winner_id, status, end_date")
      .in("status", ["in_progress", "registration", "seeding"])
      .not("end_date", "is", null)
      .lt("end_date", now);

    if (tDone?.length) {
      for (const t of tDone) {
        // Try to derive winner from final matchup if missing
        let winnerId = t.winner_id as string | null;
        if (!winnerId) {
          const { data: finalMatch } = await supabase
            .from("tournament_matchups")
            .select("winner_id, round_id")
            .eq("tournament_id", t.id)
            .eq("status", "completed")
            .order("matchup_number", { ascending: false })
            .limit(1)
            .maybeSingle();
          winnerId = finalMatch?.winner_id ?? null;
        }

        await supabase
          .from("tournaments")
          .update({ status: "completed", winner_id: winnerId })
          .eq("id", t.id);

        if (!winnerId) continue;

        let grossPool = 0;
        let platformFee = 0;
        let prizeAmount = 0;

        if (t.prize_type === "cash" && t.entry_fee_enabled && !t.is_admin_funded) {
          const { data: heldRows } = await supabase
            .from("escrow_transactions")
            .select("amount")
            .eq("tournament_id", t.id)
            .eq("status", "held");
          grossPool = (heldRows || []).reduce((s, r) => s + Number(r.amount || 0), 0);
          const feePct = globalFeePct;
          platformFee = +(grossPool * (feePct / 100)).toFixed(2);
          prizeAmount = +(grossPool - platformFee).toFixed(2);

          await supabase
            .from("escrow_transactions")
            .update({ status: "released", released_at: now })
            .eq("tournament_id", t.id)
            .eq("status", "held");
        }

        await supabase.from("prize_payouts").insert({
          winner_id: winnerId,
          tournament_id: t.id,
          prize_type: t.prize_type || "cash",
          prize_amount: prizeAmount,
          gross_pool: grossPool,
          platform_fee_amount: platformFee,
          prize_description: t.prize_description ||
            (prizeAmount > 0 ? `$${prizeAmount.toFixed(2)} cash prize` : null),
          gift_card_code: t.gift_card_code || null,
          status: "pending",
          notified_at: now,
        });

        await supabase.from("notifications").insert({
          user_id: winnerId,
          type: "prize_won",
          title: "🏆 Tournament Won!",
          body: `Congratulations! You won "${t.title}"!`,
          data: { tournament_id: t.id, prize_type: t.prize_type },
        });
      }
      transitions.push(`tournaments_completed: ${tDone.map(t => t.title).join(", ")}`);
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
