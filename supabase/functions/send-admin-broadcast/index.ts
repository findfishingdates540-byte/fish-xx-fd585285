import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import DOMPurify from "npm:isomorphic-dompurify@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM = "Fish-X <team@fish-x.com>";
const APP_URL = "https://fish-x.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escape(s: unknown) {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const SANITIZE_OPTS = {
  ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "a", "ul", "ol", "li", "img", "h2", "h3", "blockquote"],
  ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel"],
  ALLOWED_URI_REGEXP: /^(https?:|mailto:|\/)/i,
};

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, SANITIZE_OPTS as any);
}

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function renderEmailHtml(opts: { name: string; title: string; bodyHtml: string; bodyText: string; ctaLabel?: string | null; ctaUrl?: string | null; }) {
  const inner = opts.bodyHtml && opts.bodyHtml.trim().length > 0
    ? opts.bodyHtml
    : escape(opts.bodyText).replace(/\n/g, "<br/>");
  const cta = opts.ctaUrl
    ? `<a href="${escape(opts.ctaUrl)}" style="display:inline-block;background:#1454AE;color:#fff;text-decoration:none;font-weight:600;padding:13px 26px;border-radius:10px;font-size:14px;">${escape(opts.ctaLabel || "Learn more")}</a>`
    : `<a href="${APP_URL}/app" style="display:inline-block;background:#1454AE;color:#fff;text-decoration:none;font-weight:600;padding:13px 26px;border-radius:10px;font-size:14px;">Open Fish-X</a>`;
  return `<!doctype html>
<html><body style="margin:0;background:#f5f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#0b1220;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:#031029;color:#fff;border-radius:16px 16px 0 0;padding:20px 24px;">
      <div style="font-weight:700;font-size:20px;letter-spacing:0.5px;">Fish-X</div>
      <div style="font-size:12px;opacity:0.7;margin-top:4px;text-transform:uppercase;letter-spacing:1px;">Announcement</div>
    </div>
    <div style="background:#ffffff;border-radius:0 0 16px 16px;padding:28px 24px;border:1px solid #e5e9f2;border-top:0;">
      <p style="margin:0 0 8px;font-size:14px;color:#5b6478;">Hi ${escape(opts.name)},</p>
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#031029;">${escape(opts.title)}</h1>
      <div style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3a4458;">${inner}</div>
      ${cta}
      <p style="margin:32px 0 0;font-size:12px;color:#8b93a7;">You're receiving this because you're a Fish-X member.</p>
    </div>
    <p style="margin:18px 0 0;text-align:center;font-size:11px;color:#9aa3b8;">© ${new Date().getFullYear()} Fish-X LLC</p>
  </div>
</body></html>`;
}

// Shared fan-out logic; reused by send-now and by dispatcher
export async function dispatchBroadcast(admin: any, broadcast: any): Promise<{ inAppSent: number; emailSent: number; recipientCount: number; lastError: string | null; }> {
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email, display_name")
    .eq("is_banned", false);
  const allProfiles = profiles || [];

  let inAppSent = 0;
  let emailSent = 0;
  let lastError: string | null = null;
  const channels: string[] = broadcast.channels || [];
  const title: string = broadcast.title;
  const bodyHtml: string = broadcast.body_html || "";
  const bodyText: string = broadcast.body || htmlToText(bodyHtml);
  const popup_cta_url = broadcast.popup_cta_url;
  const popup_cta_label = broadcast.popup_cta_label;

  if (channels.includes("in_app")) {
    const excerpt = (bodyText || "").slice(0, 200);
    const rows = allProfiles.map((p: any) => ({
      user_id: p.id,
      type: "admin_broadcast",
      title,
      body: excerpt,
      data: { broadcast_id: broadcast.id, body_html: bodyHtml || null, cta_url: popup_cta_url, cta_label: popup_cta_label },
    }));
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      const { error } = await admin.from("notifications").insert(chunk);
      if (error) { lastError = `in_app: ${error.message}`; break; }
      inAppSent += chunk.length;
    }
  }

  if (channels.includes("email") && RESEND_API_KEY) {
    const seen = new Set<string>();
    const recipients = allProfiles.filter((p: any) => {
      if (!p.email) return false;
      const k = String(p.email).toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    const BATCH = 100;
    for (let i = 0; i < recipients.length; i += BATCH) {
      const chunk = recipients.slice(i, i + BATCH);
      const payload = chunk.map((r: any) => ({
        from: FROM,
        to: [r.email],
        subject: title,
        html: renderEmailHtml({
          name: r.display_name || "angler",
          title,
          bodyHtml,
          bodyText,
          ctaLabel: popup_cta_label,
          ctaUrl: popup_cta_url,
        }),
      }));
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        if (res.status === 429) {
          await new Promise((r) => setTimeout(r, 2000));
          const retry = await fetch("https://api.resend.com/emails/batch", {
            method: "POST",
            headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!retry.ok) { lastError = `email 429 then ${retry.status}`; break; }
          emailSent += chunk.length;
        } else {
          lastError = `email ${res.status}: ${await res.text()}`;
          break;
        }
      } else {
        emailSent += chunk.length;
      }
      if (i + BATCH < recipients.length) await new Promise((r) => setTimeout(r, 250));
    }
  }

  return { inAppSent, emailSent, recipientCount: allProfiles.length, lastError };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
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
    const title = String(body.title || "").trim();
    const rawHtml = String(body.body_html || "").trim();
    const message = String(body.body || "").trim();
    const channels: string[] = Array.isArray(body.channels) ? body.channels.filter((c: string) => ["email", "in_app", "popup"].includes(c)) : [];
    const popup_variant = ["info", "success", "warning"].includes(body.popup_variant) ? body.popup_variant : "info";
    const popup_cta_label = body.popup_cta_label ? String(body.popup_cta_label).slice(0, 60) : null;
    const popup_cta_url = body.popup_cta_url ? String(body.popup_cta_url).slice(0, 500) : null;
    const scheduledForRaw = body.scheduled_for ? String(body.scheduled_for) : null;
    let scheduled_for: string | null = null;
    if (scheduledForRaw) {
      const d = new Date(scheduledForRaw);
      if (isNaN(d.getTime())) {
        return new Response(JSON.stringify({ error: "Invalid scheduled_for" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (d.getTime() < Date.now() - 30_000) {
        return new Response(JSON.stringify({ error: "scheduled_for must be in the future" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      scheduled_for = d.toISOString();
    }

    const bodyHtml = rawHtml ? sanitizeHtml(rawHtml) : "";
    const bodyText = message || (bodyHtml ? htmlToText(bodyHtml) : "");

    if (!title || (!bodyText && !bodyHtml) || channels.length === 0) {
      return new Response(JSON.stringify({ error: "title, body and at least one channel are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const initialStatus = scheduled_for ? "scheduled" : "sending";
    const { data: broadcast, error: bcErr } = await admin
      .from("admin_broadcasts")
      .insert({
        title, body: bodyText, body_html: bodyHtml || null, channels, audience: "all",
        popup_variant, popup_cta_label, popup_cta_url,
        status: initialStatus, scheduled_for, created_by: userId,
      })
      .select()
      .single();
    if (bcErr || !broadcast) throw bcErr || new Error("Failed to create broadcast");

    if (scheduled_for) {
      return new Response(JSON.stringify({
        ok: true,
        broadcast_id: broadcast.id,
        scheduled_for,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { inAppSent, emailSent, recipientCount, lastError } = await dispatchBroadcast(admin, broadcast);
    const sentCount = Math.max(inAppSent, emailSent, channels.includes("popup") ? recipientCount : 0);

    await admin.from("admin_broadcasts").update({
      status: lastError ? "failed" : "sent",
      recipient_count: recipientCount,
      sent_count: sentCount,
      sent_at: new Date().toISOString(),
      last_dispatch_error: lastError,
    }).eq("id", broadcast.id);

    return new Response(JSON.stringify({
      ok: !lastError,
      broadcast_id: broadcast.id,
      recipient_count: recipientCount,
      in_app_sent: inAppSent,
      email_sent: emailSent,
      error: lastError,
    }), { status: lastError ? 502 : 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});