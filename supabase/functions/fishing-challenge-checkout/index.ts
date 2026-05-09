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

    const { challengeId, successUrl, cancelUrl } = await req.json();
    if (!challengeId) throw new Error("Missing challengeId");

    const { data: challenge, error: cErr } = await supabase
      .from("fishing_challenges")
      .select("id, title, status, entry_fee, entry_fee_enabled, prize_type")
      .eq("id", challengeId)
      .single();
    if (cErr || !challenge) throw new Error("Challenge not found");
    if (!challenge.entry_fee_enabled || !challenge.entry_fee) {
      throw new Error("Challenge does not require an entry fee");
    }
    if (challenge.prize_type !== "cash") {
      throw new Error("Only cash-prize challenges accept Stripe entry fees");
    }

    const supabaseService = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: existing } = await supabaseService
      .from("fishing_challenge_entries")
      .select("has_paid")
      .eq("challenge_id", challengeId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing?.has_paid) throw new Error("You have already paid for this challenge");

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
              name: `Challenge Entry: ${challenge.title}`,
              description: "Fishing challenge entry fee",
            },
            unit_amount: Math.round(Number(challenge.entry_fee) * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url:
        successUrl ||
        `${req.headers.get("origin")}/app/challenges/${challengeId}?payment=success`,
      cancel_url:
        cancelUrl ||
        `${req.headers.get("origin")}/app/challenges/${challengeId}?payment=cancelled`,
      metadata: {
        supabase_user_id: user.id,
        challenge_id: challengeId,
        type: "fishing_challenge_entry",
      },
    });

    await supabaseService.from("escrow_transactions").insert({
      fishing_challenge_id: challengeId,
      user_id: user.id,
      amount: challenge.entry_fee,
      stripe_session_id: session.id,
      status: "pending",
    });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Fishing challenge checkout error:", error);
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});