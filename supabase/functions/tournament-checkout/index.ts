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

    const { tournamentId, successUrl, cancelUrl } = await req.json();
    if (!tournamentId) throw new Error("Missing tournamentId");

    const { data: tournament, error: tErr } = await supabase
      .from("tournaments")
      .select("id, title, status, entry_fee, entry_fee_enabled, prize_type, max_participants")
      .eq("id", tournamentId)
      .single();
    if (tErr || !tournament) throw new Error("Tournament not found");
    if (!tournament.entry_fee_enabled || !tournament.entry_fee) {
      throw new Error("Tournament does not require an entry fee");
    }
    if (tournament.prize_type !== "cash") {
      throw new Error("Only cash-prize tournaments accept Stripe entry fees");
    }
    if (tournament.status !== "registration") {
      throw new Error("Tournament registration is closed");
    }

    const supabaseService = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: existing } = await supabaseService
      .from("tournament_participants")
      .select("has_paid")
      .eq("tournament_id", tournamentId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing?.has_paid) throw new Error("You are already registered");

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data[0]?.id ??
      (await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      })).id;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Tournament Entry: ${tournament.title}`,
              description: "Tournament entry fee",
            },
            unit_amount: Math.round(Number(tournament.entry_fee) * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url:
        successUrl ||
        `${req.headers.get("origin")}/app/tournaments/${tournamentId}?payment=success`,
      cancel_url:
        cancelUrl ||
        `${req.headers.get("origin")}/app/tournaments/${tournamentId}?payment=cancelled`,
      metadata: {
        supabase_user_id: user.id,
        tournament_id: tournamentId,
        type: "tournament_entry",
      },
    });

    await supabaseService.from("escrow_transactions").insert({
      tournament_id: tournamentId,
      user_id: user.id,
      amount: tournament.entry_fee,
      stripe_session_id: session.id,
      status: "pending",
    });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Tournament checkout error:", error);
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});