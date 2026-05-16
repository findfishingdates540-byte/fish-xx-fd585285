import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ScoringMethod = "biggest_catch" | "total_weight" | "most_catches";
type TournamentFormat = "single_elimination" | "double_elimination";
type SeedingMethod = "random" | "ranked" | "manual";

interface RecalcBody {
  tournament_id: string;
  scoring_method?: ScoringMethod;
  format?: TournamentFormat;
  seeding_method?: SeedingMethod;
  recalculate?: boolean;
}

function roundName(roundsTotal: number, roundIndex: number): string {
  // roundIndex is 1-based
  const remaining = roundsTotal - roundIndex; // 0 => final
  if (remaining === 0) return "Final";
  if (remaining === 1) return "Semifinals";
  if (remaining === 2) return "Quarterfinals";
  const teamsThisRound = Math.pow(2, roundsTotal - roundIndex + 1);
  return `Round of ${teamsThisRound}`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate caller as admin
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as RecalcBody;
    if (!body?.tournament_id) {
      return new Response(JSON.stringify({ error: "tournament_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load tournament + participants
    const { data: t, error: tErr } = await admin
      .from("tournaments")
      .select("*")
      .eq("id", body.tournament_id)
      .single();
    if (tErr || !t) {
      return new Response(JSON.stringify({ error: "Tournament not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update tournament config first
    const updates: Record<string, unknown> = {};
    if (body.scoring_method) updates.scoring_method = body.scoring_method;
    if (body.format) updates.format = body.format;
    if (body.seeding_method) updates.seeding_method = body.seeding_method;
    if (Object.keys(updates).length) {
      const { error: uErr } = await admin
        .from("tournaments")
        .update(updates)
        .eq("id", body.tournament_id);
      if (uErr) throw uErr;
    }

    if (!body.recalculate) {
      return new Response(
        JSON.stringify({ success: true, updated: updates, recalculated: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Block recalc if any matchup is already completed
    const { data: completed } = await admin
      .from("tournament_matchups")
      .select("id")
      .eq("tournament_id", body.tournament_id)
      .eq("status", "completed")
      .limit(1);
    if (completed && completed.length > 0) {
      return new Response(
        JSON.stringify({
          error:
            "Cannot recalculate: at least one matchup is already completed. Reset scores first or wait until tournament ends.",
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Pull participants (team-based)
    const { data: parts } = await admin
      .from("tournament_participants")
      .select("id, team_id, seed_number, user_id")
      .eq("tournament_id", body.tournament_id);
    const teamParts = (parts || []).filter((p) => p.team_id);
    if (teamParts.length < 2) {
      return new Response(
        JSON.stringify({ error: "Need at least 2 registered teams to build a bracket" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const seeding: SeedingMethod = (body.seeding_method ?? t.seeding_method) as SeedingMethod;
    let ordered = teamParts.slice();
    if (seeding === "random") ordered = shuffle(ordered);
    else if (seeding === "ranked") {
      ordered.sort((a, b) => (a.seed_number ?? 9999) - (b.seed_number ?? 9999));
    }

    // Pad to next power of 2 with BYE slots (null team)
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(ordered.length)));
    const slots: (typeof ordered[number] | null)[] = ordered.slice();
    while (slots.length < bracketSize) slots.push(null);

    // Wipe previous bracket
    await admin.from("tournament_matchups").delete().eq("tournament_id", body.tournament_id);
    await admin.from("tournament_rounds").delete().eq("tournament_id", body.tournament_id);

    const roundsTotal = Math.log2(bracketSize);
    const fmt: TournamentFormat = (body.format ?? t.format) as TournamentFormat;

    // Create rounds (winners bracket)
    const startDate = t.start_date ? new Date(t.start_date) : new Date();
    const endDate = t.end_date ? new Date(t.end_date) : null;
    const dayMs = 24 * 60 * 60 * 1000;
    const span =
      endDate && endDate > startDate
        ? endDate.getTime() - startDate.getTime()
        : roundsTotal * dayMs;
    const perRound = span / roundsTotal;

    const roundRows: Array<Record<string, unknown>> = [];
    for (let r = 1; r <= roundsTotal; r++) {
      roundRows.push({
        tournament_id: body.tournament_id,
        round_number: r,
        round_name: roundName(roundsTotal, r),
        bracket_type: "winners",
        status: "pending",
        start_date: new Date(startDate.getTime() + perRound * (r - 1)).toISOString(),
        end_date: new Date(startDate.getTime() + perRound * r - 1).toISOString(),
      });
    }
    const { data: createdRounds, error: rErr } = await admin
      .from("tournament_rounds")
      .insert(roundRows)
      .select();
    if (rErr) throw rErr;
    const winnersRounds = (createdRounds || []).sort(
      (a: any, b: any) => a.round_number - b.round_number,
    );

    // Build matchups round by round, with next_matchup_id linkage.
    // First create empty matchup IDs by inserting placeholders per round, then update with team assignments and next_matchup_id.
    // Round 1: pair slots[0]-slots[1], slots[2]-slots[3], …
    type MatchInsert = {
      tournament_id: string;
      round_id: string;
      matchup_number: number;
      team1_id: string | null;
      team2_id: string | null;
      status: string;
      next_matchup_id: string | null;
    };
    const matchesByRound: any[][] = [];
    let matchupCounter = 0;
    // Round 1
    const round1Inserts: MatchInsert[] = [];
    for (let i = 0; i < slots.length; i += 2) {
      matchupCounter++;
      round1Inserts.push({
        tournament_id: body.tournament_id,
        round_id: winnersRounds[0].id,
        matchup_number: matchupCounter,
        team1_id: slots[i]?.team_id ?? null,
        team2_id: slots[i + 1]?.team_id ?? null,
        status: "pending",
        next_matchup_id: null,
      });
    }
    const { data: r1, error: r1Err } = await admin
      .from("tournament_matchups")
      .insert(round1Inserts)
      .select();
    if (r1Err) throw r1Err;
    matchesByRound.push((r1 || []).sort((a: any, b: any) => a.matchup_number - b.matchup_number));

    // Subsequent rounds (empty placeholders linking from previous)
    for (let r = 1; r < roundsTotal; r++) {
      const prev = matchesByRound[r - 1];
      const inserts: MatchInsert[] = [];
      for (let i = 0; i < prev.length; i += 2) {
        matchupCounter++;
        inserts.push({
          tournament_id: body.tournament_id,
          round_id: winnersRounds[r].id,
          matchup_number: matchupCounter,
          team1_id: null,
          team2_id: null,
          status: "pending",
          next_matchup_id: null,
        });
      }
      const { data: created, error: cErr } = await admin
        .from("tournament_matchups")
        .insert(inserts)
        .select();
      if (cErr) throw cErr;
      const sorted = (created || []).sort(
        (a: any, b: any) => a.matchup_number - b.matchup_number,
      );
      matchesByRound.push(sorted);

      // Link previous round's pairs to this round
      for (let i = 0; i < prev.length; i += 2) {
        const nextId = sorted[i / 2].id;
        await admin
          .from("tournament_matchups")
          .update({ next_matchup_id: nextId })
          .in("id", [prev[i].id, prev[i + 1].id]);
      }
    }

    // Optional losers bracket placeholder for double_elimination (winners only fully wired here; losers is created flat for visibility)
    if (fmt === "double_elimination") {
      const losersRound = await admin
        .from("tournament_rounds")
        .insert({
          tournament_id: body.tournament_id,
          round_number: 99,
          round_name: "Losers Bracket",
          bracket_type: "losers",
          status: "pending",
          start_date: startDate.toISOString(),
          end_date: endDate?.toISOString() ?? null,
        })
        .select()
        .single();
      // Intentionally minimal: a single losers round placeholder so the UI shows the bracket type.
      if (losersRound.data) {
        await admin.from("tournament_matchups").insert({
          tournament_id: body.tournament_id,
          round_id: losersRound.data.id,
          matchup_number: matchupCounter + 1,
          team1_id: null,
          team2_id: null,
          status: "pending",
          next_matchup_id: null,
        });
      }
    }

    // Reset elimination state on participants
    await admin
      .from("tournament_participants")
      .update({ eliminated: false, eliminated_in_round: null, final_placement: null })
      .eq("tournament_id", body.tournament_id);

    await admin
      .from("tournaments")
      .update({ winner_team_id: null, winner_id: null })
      .eq("id", body.tournament_id);

    return new Response(
      JSON.stringify({
        success: true,
        recalculated: true,
        rounds_created: roundsTotal + (fmt === "double_elimination" ? 1 : 0),
        bracket_size: bracketSize,
        format: fmt,
        scoring_method: body.scoring_method ?? t.scoring_method,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("recalculate-tournament-bracket error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});