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
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("User not authenticated");

    const { challengeId, entryFee, challengeTitle, successUrl, cancelUrl } = await req.json();

    if (!challengeId || !entryFee) {
      throw new Error("Missing challengeId or entryFee");
    }

    // Verify the challenge exists and is open for submissions
    const { data: challenge, error: challengeError } = await supabase
      .from("photo_challenges")
      .select("id, status, entry_fee")
      .eq("id", challengeId)
      .single();

    if (challengeError || !challenge) throw new Error("Challenge not found");
    if (challenge.status !== "submissions_open") throw new Error("Challenge is not accepting submissions");

    // Check user hasn't already entered
    const { data: existingEntry } = await supabase
      .from("photo_challenge_entries")
      .select("id")
      .eq("challenge_id", challengeId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingEntry) throw new Error("You have already entered this challenge");

    const amountCents = Math.round(challenge.entry_fee * 100);

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    }

    // Create one-time payment checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Photo Challenge Entry: ${challengeTitle || "Fish Photo Challenge"}`,
              description: `Entry fee for photo challenge`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl || `${req.headers.get("origin")}/app/photo-challenges/${challengeId}?payment=success`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/app/photo-challenges/${challengeId}?payment=cancelled`,
      metadata: {
        supabase_user_id: user.id,
        challenge_id: challengeId,
        type: "photo_challenge_entry",
      },
    });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Photo challenge checkout error:", error);
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
