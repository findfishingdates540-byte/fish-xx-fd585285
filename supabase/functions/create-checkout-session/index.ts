import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Price IDs will be created dynamically or you can use existing Stripe price IDs
const PLAN_PRICES: Record<string, { monthly: number; annual: number; name: string }> = {
  angler: { monthly: 999, annual: 9590, name: "The Angler" },
  trophy: { monthly: 2499, annual: 23990, name: "Captain's Combo" },
  catch: { monthly: 1499, annual: 14390, name: "The Catch" },
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY not configured");
      throw new Error("Stripe is not configured");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Get authorization header for user info
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("User auth error:", userError);
      throw new Error("User not authenticated");
    }

    console.log("Creating checkout session for user:", user.id);

    // Parse request body
    const { planId, billing, successUrl, cancelUrl } = await req.json();
    
    if (!planId || !PLAN_PRICES[planId]) {
      throw new Error("Invalid plan ID");
    }

    const plan = PLAN_PRICES[planId];
    const isAnnual = billing === "annual";
    const priceInCents = isAnnual ? plan.annual : plan.monthly;

    console.log("Plan:", planId, "Billing:", billing, "Price:", priceInCents);

    // Check if customer already exists in Stripe
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("Found existing Stripe customer:", customerId);
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
      console.log("Created new Stripe customer:", customerId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: plan.name,
              description: `${isAnnual ? "Annual" : "Monthly"} subscription`,
            },
            unit_amount: priceInCents,
            recurring: {
              interval: isAnnual ? "year" : "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl || `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/pricing`,
      metadata: {
        supabase_user_id: user.id,
        plan_id: planId,
        billing_cycle: billing,
      },
    });

    console.log("Created checkout session:", session.id);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
