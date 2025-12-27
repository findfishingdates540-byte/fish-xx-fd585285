import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Map plan IDs to account modes
const planToAccountMode: Record<string, 'fishing' | 'both'> = {
  'angler': 'fishing',
  'trophy': 'both',
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

    // Initialize Supabase with service role for admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    console.log("Received webhook event");

    // For now, we'll parse the event directly since we may not have webhook secret configured
    // In production, you should verify the signature with STRIPE_WEBHOOK_SECRET
    let event: Stripe.Event;
    
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // Parse without verification (for testing)
      event = JSON.parse(body);
      console.log("Warning: Processing webhook without signature verification");
    }

    console.log("Event type:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout session completed:", session.id);
        
        const userId = session.metadata?.supabase_user_id;
        const planId = session.metadata?.plan_id;
        const billingCycle = session.metadata?.billing_cycle;
        const customerId = session.customer as string;
        
        if (userId) {
          // Calculate expiration date
          const daysToAdd = billingCycle === "annual" ? 365 : 30;
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + daysToAdd);

          // Determine the account mode based on the plan purchased
          const newAccountMode = planId ? planToAccountMode[planId] || 'both' : 'both';
          
          console.log(`Updating user ${userId} to plan ${planId}, account_mode: ${newAccountMode}`);

          // Update user's premium status, store stripe_customer_id, and update account_mode
          const { error } = await supabase
            .from("profiles")
            .update({
              is_premium: true,
              premium_expires_at: expiresAt.toISOString(),
              stripe_customer_id: customerId,
              account_mode: newAccountMode,
            })
            .eq("id", userId);

          if (error) {
            console.error("Error updating user premium status:", error);
          } else {
            console.log(`Updated premium status, customer ID, and account_mode to '${newAccountMode}' for user:`, userId);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription updated:", subscription.id);
        
        // Get customer to find user
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        const userId = customer.metadata?.supabase_user_id;
        
        if (userId) {
          const isActive = subscription.status === "active" || subscription.status === "trialing";
          
          // Get the price/product to determine the plan
          const priceId = subscription.items.data[0]?.price?.id;
          let newAccountMode: 'fishing' | 'both' | null = null;
          
          if (priceId) {
            // Try to determine plan from price metadata or product
            const price = await stripe.prices.retrieve(priceId, { expand: ['product'] });
            const product = price.product as Stripe.Product;
            const planId = product.metadata?.plan_id;
            
            if (planId && planToAccountMode[planId]) {
              newAccountMode = planToAccountMode[planId];
            }
          }
          
          const updateData: Record<string, unknown> = {
            is_premium: isActive,
            premium_expires_at: isActive 
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
          };
          
          // Only update account_mode if we determined a new mode and subscription is active
          if (isActive && newAccountMode) {
            updateData.account_mode = newAccountMode;
            console.log(`Updating account_mode to ${newAccountMode} for user ${userId}`);
          }
          
          const { error } = await supabase
            .from("profiles")
            .update(updateData)
            .eq("id", userId);

          if (error) {
            console.error("Error updating subscription status:", error);
          } else {
            console.log("Updated subscription for user:", userId, "Active:", isActive);
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription cancelled:", subscription.id);
        
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        const userId = customer.metadata?.supabase_user_id;
        
        if (userId) {
          // When subscription is cancelled, set account_mode back to 'dating' (free tier)
          const { error } = await supabase
            .from("profiles")
            .update({
              is_premium: false,
              premium_expires_at: null,
              account_mode: 'dating', // Downgrade to free dating mode
            })
            .eq("id", userId);

          if (error) {
            console.error("Error cancelling subscription:", error);
          } else {
            console.log("Cancelled subscription and reset account_mode to 'dating' for user:", userId);
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Invoice payment succeeded:", invoice.id);
        // Subscription renewals are handled here
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Invoice payment failed:", invoice.id);
        // Could send notification to user about failed payment
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
