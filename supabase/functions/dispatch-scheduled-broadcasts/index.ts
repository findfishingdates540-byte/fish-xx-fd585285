import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { dispatchBroadcast } from "../send-admin-broadcast/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Claim up to N due broadcasts
    const { data: due } = await admin
      .from("admin_broadcasts")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_for", new Date().toISOString())
      .order("scheduled_for", { ascending: true })
      .limit(5);

    const results: any[] = [];
    for (const broadcast of due || []) {
      // Atomic claim: flip to 'sending' only if still 'scheduled'
      const { data: claimed, error: claimErr } = await admin
        .from("admin_broadcasts")
        .update({
          status: "sending",
          dispatch_attempts: (broadcast.dispatch_attempts || 0) + 1,
        })
        .eq("id", broadcast.id)
        .eq("status", "scheduled")
        .select()
        .maybeSingle();
      if (claimErr || !claimed) continue;

      try {
        const { inAppSent, emailSent, recipientCount, lastError } = await dispatchBroadcast(admin, claimed);
        const sentCount = Math.max(inAppSent, emailSent, (claimed.channels || []).includes("popup") ? recipientCount : 0);
        await admin.from("admin_broadcasts").update({
          status: lastError ? "failed" : "sent",
          recipient_count: recipientCount,
          sent_count: sentCount,
          sent_at: new Date().toISOString(),
          last_dispatch_error: lastError,
        }).eq("id", claimed.id);
        results.push({ id: claimed.id, ok: !lastError, sent: sentCount, error: lastError });
      } catch (err: any) {
        await admin.from("admin_broadcasts").update({
          status: "failed",
          last_dispatch_error: err?.message || "dispatcher error",
        }).eq("id", claimed.id);
        results.push({ id: claimed.id, ok: false, error: err?.message });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});