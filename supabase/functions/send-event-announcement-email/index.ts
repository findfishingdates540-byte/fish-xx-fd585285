import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM = "Fish-X <team@fish-x.com>";
const APP_URL = "https://fish-x.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EventType = "tournament" | "photo_challenge" | "fishing_challenge";

const TABLE: Record<EventType, string> = {
  tournament: "tournaments",
  photo_challenge: "photo_challenges",
  fishing_challenge: "fishing_challenges",
};

const PATH: Record<EventType, string> = {
  tournament: "/app/tournaments",
  photo_challenge: "/app/photo-challenges",
  fishing_challenge: "/app/challenges",
};

const LABEL: Record<EventType, string> = {
  tournament: "tournament",
  photo_challenge: "photo challenge",
  fishing_challenge: "fishing challenge",
};

function escape(s: unknown) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); } catch { return ""; }
}

function renderHtml(opts: {
  name: string;
  kindLabel: string;
  title: string;
  description: string;
  banner?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  prize?: string | null;
  ctaUrl: string;
}) {
  const dateLine =
    opts.startDate && opts.endDate
      ? `${fmtDate(opts.startDate)} – ${fmtDate(opts.endDate)}`
      : fmtDate(opts.startDate) || fmtDate(opts.endDate) || "";
  return `<!doctype html>
<html><body style="margin:0;background:#f5f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#0b1220;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:#031029;color:#fff;border-radius:16px 16px 0 0;padding:20px 24px;">
      <div style="font-weight:700;font-size:20px;letter-spacing:0.5px;">Fish-X</div>
      <div style="font-size:12px;opacity:0.7;margin-top:4px;text-transform:uppercase;letter-spacing:1px;">New ${escape(opts.kindLabel)}</div>
    </div>
    ${opts.banner ? `<img src="${escape(opts.banner)}" alt="" style="display:block;width:100%;max-height:260px;object-fit:cover;border-left:1px solid #e5e9f2;border-right:1px solid #e5e9f2;" />` : ""}
    <div style="background:#ffffff;border-radius:0 0 16px 16px;padding:28px 24px;border:1px solid #e5e9f2;border-top:0;">
      <p style="margin:0 0 8px;font-size:14px;color:#5b6478;">Hi ${escape(opts.name)},</p>
      <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#031029;">${escape(opts.title)}</h1>
      ${dateLine ? `<p style="margin:0 0 6px;font-size:13px;color:#1454AE;font-weight:600;">📅 ${escape(dateLine)}</p>` : ""}
      ${opts.prize ? `<p style="margin:0 0 18px;font-size:13px;color:#1454AE;font-weight:600;">🏆 ${escape(opts.prize)}</p>` : ""}
      ${opts.description ? `<p style="margin:0 0 24px;font-size:15px;line-height:1.55;color:#3a4458;white-space:pre-line;">${escape(opts.description)}</p>` : ""}
      <a href="${opts.ctaUrl}" style="display:inline-block;background:#1454AE;color:#fff;text-decoration:none;font-weight:600;padding:13px 26px;border-radius:10px;font-size:14px;">View ${escape(opts.kindLabel)}</a>
      <p style="margin:32px 0 0;font-size:12px;color:#8b93a7;">You're receiving this because you're a Fish-X member. <a href="${APP_URL}/app/settings" style="color:#1454AE;">Manage email preferences</a>.</p>
    </div>
    <p style="margin:18px 0 0;text-align:center;font-size:11px;color:#9aa3b8;">© ${new Date().getFullYear()} Fish-X LLC</p>
  </div>
</body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claims.claims.sub as string;

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const event_type = body.event_type as EventType;
    const event_id = body.event_id as string;
    const force = !!body.force;

    if (!event_type || !TABLE[event_type] || !event_id) {
      return new Response(JSON.stringify({ error: "event_type and event_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Idempotency check
    if (!force) {
      const { data: prior } = await admin
        .from("event_announcement_email_log")
        .select("id, sent_at")
        .eq("event_type", event_type)
        .eq("event_id", event_id)
        .maybeSingle();
      if (prior) {
        return new Response(JSON.stringify({ skipped: "already_sent", sent_at: prior.sent_at }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Load event
    const { data: event, error: evErr } = await admin
      .from(TABLE[event_type])
      .select("*")
      .eq("id", event_id)
      .maybeSingle();
    if (evErr || !event) {
      return new Response(JSON.stringify({ error: "Event not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Recipients: ALL members with an email address (announcement blast — bypasses opt-in prefs)
    const { data: profiles, error: profErr } = await admin
      .from("profiles")
      .select("id, email, display_name");
    if (profErr) throw profErr;

    // Dedupe by email (case-insensitive) to avoid sending twice to the same address
    const seen = new Set<string>();
    const recipients = (profiles || []).filter((p: any) => {
      if (!p.email) return false;
      const key = String(p.email).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (recipients.length === 0) {
      await admin.from("event_announcement_email_log").insert({
        event_type, event_id, sent_by: userId, recipients_count: 0, status: "no_recipients",
      });
      return new Response(JSON.stringify({ ok: true, sent: 0, skipped: "no_recipients" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const kindLabel = LABEL[event_type];
    const ctaUrl = `${APP_URL}${PATH[event_type]}/${event.id}`;
    const subject = `New ${kindLabel}: ${event.title || "Just announced"}`;

    // Resend batch endpoint allows up to 100 per call. Each entry is a single email object.
    const BATCH = 100;
    let totalSent = 0;
    let lastError: string | null = null;

    for (let i = 0; i < recipients.length; i += BATCH) {
      const chunk = recipients.slice(i, i + BATCH);
      const payload = chunk.map((r: any) => ({
        from: FROM,
        to: [r.email],
        subject,
        html: renderHtml({
          name: r.display_name || "angler",
          kindLabel,
          title: event.title || "New event",
          description: event.description || "",
          banner: event.banner_url || null,
          startDate: event.start_date,
          endDate: event.end_date,
          prize: event.prize_description || null,
          ctaUrl,
        }),
      }));

      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 429) {
        // simple backoff: wait 2s and retry the same chunk once
        await new Promise((r) => setTimeout(r, 2000));
        const retry = await fetch("https://api.resend.com/emails/batch", {
          method: "POST",
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!retry.ok) { lastError = `429 then ${retry.status}: ${await retry.text()}`; break; }
        totalSent += chunk.length;
      } else if (!res.ok) {
        lastError = `${res.status}: ${await res.text()}`;
        break;
      } else {
        totalSent += chunk.length;
      }
      // small gap between batches
      if (i + BATCH < recipients.length) await new Promise((r) => setTimeout(r, 250));
    }

    await admin.from("event_announcement_email_log").insert({
      event_type,
      event_id,
      sent_by: userId,
      recipients_count: totalSent,
      status: lastError ? "partial" : "sent",
      error: lastError,
    });

    return new Response(
      JSON.stringify({ ok: !lastError, sent: totalSent, total: recipients.length, error: lastError }),
      { status: lastError ? 502 : 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-event-announcement-email error", e);
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});