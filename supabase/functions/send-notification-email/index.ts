import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM = "Fish-X <team@fish-x.com>";
const APP_URL = "https://fish-x.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PREF_KEY: Record<string, string> = {
  buddy_request: "buddy_request",
  message: "message",
  buddy_message: "buddy_message",
  match: "match",
  trip_invite: "trip_invite",
  trip_reminder: "trip_reminder",
  feed_like: "feed_like",
  feed_comment: "feed_comment",
  comment_mention: "comment_mention",
  new_follower: "new_follower",
  prize_won: "prize_won",
  challenge_new: "challenge_new",
  team_page_message: "message",
};

const CTA_PATH: Record<string, string> = {
  buddy_request: "/app/buddies",
  message: "/app/messages",
  buddy_message: "/app/messages",
  match: "/app/matches",
  trip_invite: "/app/trips",
  trip_reminder: "/app/trips",
  feed_like: "/app/feed",
  feed_comment: "/app/feed",
  comment_mention: "/app/feed",
  new_follower: "/app/feed",
  prize_won: "/app/notifications",
  challenge_new: "/app/challenges",
};

// Allow team_page_message to deep-link into the right thread/inbox
(CTA_PATH as any).team_page_message = "/app/notifications";

function escape(s: string) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function renderHtml(opts: { title: string; body: string; ctaUrl: string; ctaLabel: string; name: string }) {
  return `<!doctype html>
<html><body style="margin:0;background:#f5f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#0b1220;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <div style="background:#031029;color:#fff;border-radius:16px 16px 0 0;padding:20px 24px;">
      <div style="font-weight:700;font-size:20px;letter-spacing:0.5px;">Fish-X</div>
    </div>
    <div style="background:#ffffff;border-radius:0 0 16px 16px;padding:28px 24px;border:1px solid #e5e9f2;border-top:0;">
      <p style="margin:0 0 8px;font-size:14px;color:#5b6478;">Hi ${escape(opts.name)},</p>
      <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;">${escape(opts.title)}</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.55;color:#3a4458;">${escape(opts.body)}</p>
      <a href="${opts.ctaUrl}" style="display:inline-block;background:#1454AE;color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:10px;font-size:14px;">${escape(opts.ctaLabel)}</a>
      <p style="margin:32px 0 0;font-size:12px;color:#8b93a7;">You're receiving this because of your Fish-X notification settings. <a href="${APP_URL}/app/settings" style="color:#1454AE;">Manage emails</a>.</p>
    </div>
    <p style="margin:18px 0 0;text-align:center;font-size:11px;color:#9aa3b8;">© ${new Date().getFullYear()} Fish-X LLC</p>
  </div>
</body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");
    const { notification_id } = await req.json();
    if (!notification_id) return new Response(JSON.stringify({ error: "notification_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: n } = await supa.from("notifications").select("*").eq("id", notification_id).maybeSingle();
    if (!n) return new Response(JSON.stringify({ skipped: "not_found" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: profile } = await supa.from("profiles").select("email,display_name,last_active_at").eq("id", n.user_id).maybeSingle();
    if (!profile?.email) return new Response(JSON.stringify({ skipped: "no_email" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Idle gating for messages: only email if user has been idle for >= 5 min
    if (n.type === "message" || n.type === "buddy_message") {
      const last = profile.last_active_at ? new Date(profile.last_active_at).getTime() : 0;
      if (last && Date.now() - last < 5 * 60 * 1000) {
        return new Response(JSON.stringify({ skipped: "user_active" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Load prefs (default to true if missing)
    const { data: prefs } = await supa.from("notification_email_prefs").select("*").eq("user_id", n.user_id).maybeSingle();
    if (prefs) {
      if (!prefs.master_enabled) return new Response(JSON.stringify({ skipped: "master_off" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const key = PREF_KEY[n.type];
      if (key && prefs[key] === false) return new Response(JSON.stringify({ skipped: "type_off" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const ctaUrl = APP_URL + (CTA_PATH[n.type] || "/app/notifications");
    const ctaLabel = n.type === "message" || n.type === "buddy_message" ? "Open message" :
                     n.type === "buddy_request" ? "View request" :
                     n.type === "challenge_new" ? "View challenge" :
                     n.type === "match" ? "See match" : "Open Fish-X";

    const html = renderHtml({
      title: n.title || "You have a new Fish-X notification",
      body: n.body || "",
      ctaUrl, ctaLabel,
      name: profile.display_name || "angler",
    });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [profile.email],
        subject: n.title || "New Fish-X notification",
        html,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("resend error", res.status, text);
      return new Response(JSON.stringify({ error: "resend_failed", detail: text }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("send-notification-email error", e);
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});