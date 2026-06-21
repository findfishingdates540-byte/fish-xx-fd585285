import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const paypalBase = () =>
  (Deno.env.get("PAYPAL_ENV") || "sandbox").toLowerCase() === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getPaypalAccessToken() {
  const id = Deno.env.get("PAYPAL_CLIENT_ID");
  const secret = Deno.env.get("PAYPAL_CLIENT_SECRET");
  if (!id || !secret) throw new Error("PayPal is not configured");
  const res = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${id}:${secret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`PayPal auth failed: ${data.error_description || res.statusText}`);
  return data.access_token as string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("User not authenticated");

    const { championshipId, teamId } = await req.json();
    if (!championshipId || !teamId) throw new Error("Missing championshipId or teamId");

    const svc = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: champ, error: cErr } = await svc
      .from("fishing_challenges")
      .select("id, title, is_championship, calcutta_entry_fee")
      .eq("id", championshipId)
      .single();
    if (cErr || !champ?.is_championship) throw new Error("Championship not found");
    const fee = Number(champ.calcutta_entry_fee || 0);
    if (fee <= 0) throw new Error("This championship has no Calcutta entry fee");

    const { data: team } = await svc
      .from("fishing_teams")
      .select("id, name, captain_id")
      .eq("id", teamId)
      .single();
    if (!team) throw new Error("Team not found");
    if (team.captain_id !== user.id) throw new Error("Only the team captain can pay the Calcutta");

    const { data: reg } = await svc
      .from("championship_teams")
      .select("id, calcutta_paid")
      .eq("championship_id", championshipId)
      .eq("team_id", teamId)
      .maybeSingle();
    if (!reg) throw new Error("Register your team for the championship first");
    if (reg.calcutta_paid) throw new Error("Your team has already paid the Calcutta");

    const origin = req.headers.get("origin") || "";
    const returnUrl = `${origin}/app/championships/${championshipId}?paypal=return`;
    const cancelUrl = `${origin}/app/championships/${championshipId}?paypal=cancelled`;

    const token = await getPaypalAccessToken();
    const orderRes = await fetch(`${paypalBase()}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          reference_id: reg.id,
          description: `Team Calcutta · ${champ.title} · ${team.name}`.slice(0, 127),
          amount: { currency_code: "USD", value: fee.toFixed(2) },
          custom_id: `${championshipId}:${teamId}:${reg.id}`,
        }],
        application_context: {
          brand_name: "FishX",
          user_action: "PAY_NOW",
          shipping_preference: "NO_SHIPPING",
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      }),
    });
    const order = await orderRes.json();
    if (!orderRes.ok) throw new Error(`PayPal order failed: ${order.message || orderRes.statusText}`);

    const approve = (order.links || []).find((l: any) => l.rel === "approve")?.href;
    if (!approve) throw new Error("No approval link returned by PayPal");

    await svc.from("championship_teams")
      .update({ stripe_session_id: `paypal:${order.id}` })
      .eq("id", reg.id);

    return new Response(
      JSON.stringify({ url: approve, orderId: order.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("PayPal Calcutta checkout error:", error);
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});