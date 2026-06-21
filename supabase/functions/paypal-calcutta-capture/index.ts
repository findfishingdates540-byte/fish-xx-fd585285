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

    const { orderId } = await req.json();
    if (!orderId) throw new Error("Missing orderId");

    const token = await getPaypalAccessToken();

    // Fetch order first to validate
    const orderRes = await fetch(`${paypalBase()}/v2/checkout/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const order = await orderRes.json();
    if (!orderRes.ok) throw new Error(`PayPal order lookup failed: ${order.message || orderRes.statusText}`);

    const pu = order.purchase_units?.[0];
    const customId: string = pu?.custom_id || "";
    const [championshipId, teamId, registrationId] = customId.split(":");
    if (!championshipId || !teamId || !registrationId) {
      throw new Error("PayPal order is missing championship metadata");
    }

    const svc = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Confirm caller is the team captain
    const { data: team } = await svc
      .from("fishing_teams")
      .select("captain_id")
      .eq("id", teamId)
      .single();
    if (!team || team.captain_id !== user.id) throw new Error("Only the team captain can confirm payment");

    let status: string = order.status;
    let captureId: string | null = null;

    if (status === "APPROVED") {
      const capRes = await fetch(`${paypalBase()}/v2/checkout/orders/${orderId}/capture`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: "{}",
      });
      const cap = await capRes.json();
      if (!capRes.ok) throw new Error(`PayPal capture failed: ${cap.message || capRes.statusText}`);
      status = cap.status;
      captureId = cap.purchase_units?.[0]?.payments?.captures?.[0]?.id || null;
    } else if (status === "COMPLETED") {
      captureId = pu?.payments?.captures?.[0]?.id || null;
    }

    if (status !== "COMPLETED") {
      return new Response(
        JSON.stringify({ ok: false, status }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    await svc.from("championship_teams")
      .update({
        calcutta_paid: true,
        calcutta_paid_at: new Date().toISOString(),
        stripe_session_id: `paypal:${orderId}${captureId ? ":" + captureId : ""}`,
      })
      .eq("id", registrationId);

    return new Response(
      JSON.stringify({ ok: true, status, championshipId, teamId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("PayPal Calcutta capture error:", error);
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});