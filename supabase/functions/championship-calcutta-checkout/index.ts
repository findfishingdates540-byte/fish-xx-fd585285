import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe is not configured");
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("User not authenticated");

    const { championshipId, teamId, successUrl, cancelUrl } = await req.json();
    if (!championshipId || !teamId) throw new Error("Missing championshipId or teamId");

    const supabaseService = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify championship + that caller is the team captain
    const { data: champ, error: cErr } = await supabaseService
      .from("fishing_challenges")
      .select("id, title, is_championship, calcutta_entry_fee, status")
      .eq("id", championshipId)
      .single();
    if (cErr || !champ?.is_championship) throw new Error("Championship not found");
    if (!champ.calcutta_entry_fee || Number(champ.calcutta_entry_fee) <= 0) {
      throw new Error("This championship has no Calcutta entry fee");
    }

    const { data: team } = await supabaseService
      .from("fishing_teams")
      .select("id, name, captain_id")
      .eq("id", teamId)
      .single();
    if (!team) throw new Error("Team not found");
    if (team.captain_id !== user.id) throw new Error("Only the team captain can pay the Calcutta");

    const { data: reg } = await supabaseService
      .from("championship_teams")
      .select("id, calcutta_paid")
      .eq("championship_id", championshipId)
      .eq("team_id", teamId)
      .maybeSingle();
    if (!reg) throw new Error("Register your team for the championship first");
    if (reg.calcutta_paid) throw new Error("Your team has already paid the Calcutta");

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id ??
      (await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      })).id;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: `Team Calcutta · ${champ.title}`,
            description: `Calcutta side-pot entry for team ${team.name}`,
          },
          unit_amount: Math.round(Number(champ.calcutta_entry_fee) * 100),
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url:
        successUrl ||
        `${req.headers.get("origin")}/app/championships/${championshipId}?payment=success`,
      cancel_url:
        cancelUrl ||
        `${req.headers.get("origin")}/app/championships/${championshipId}?payment=cancelled`,
      metadata: {
        supabase_user_id: user.id,
        championship_id: championshipId,
        team_id: teamId,
        championship_team_id: reg.id,
        type: "championship_calcutta_entry",
      },
    });

    await supabaseService
      .from("championship_teams")
      .update({ stripe_session_id: session.id })
      .eq("id", reg.id);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Calcutta checkout error:", error);
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});