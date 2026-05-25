import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supa = createClient(SUPABASE_URL, SERVICE_KEY);

    // Find unread message-type notifications, 5min-24h old, without email_sent_at
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const until = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: rows, error } = await supa
      .from("notifications")
      .select("id")
      .in("type", ["message", "buddy_message"])
      .eq("is_read", false)
      .is("email_sent_at", null)
      .gte("created_at", since)
      .lte("created_at", until)
      .limit(200);
    if (error) throw error;

    let sent = 0, skipped = 0, failed = 0;
    for (const n of rows ?? []) {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/send-notification-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_KEY}` },
          body: JSON.stringify({ notification_id: n.id }),
        });
        const j = await res.json().catch(() => ({}));
        if (res.ok && j?.ok) {
          sent++;
          await supa.from("notifications").update({ email_sent_at: new Date().toISOString() }).eq("id", n.id);
        } else if (j?.skipped) {
          skipped++;
          // Only mark as handled if user has email disabled or no email — not for transient "user_active"
          if (j.skipped !== "user_active") {
            await supa.from("notifications").update({ email_sent_at: new Date().toISOString() }).eq("id", n.id);
          }
        } else {
          failed++;
          console.error("send failed", n.id, res.status, j);
        }
      } catch (e) {
        failed++;
        console.error("error sending", n.id, e);
      }
    }

    return new Response(JSON.stringify({ scanned: rows?.length ?? 0, sent, skipped, failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-message-emails error", e);
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});