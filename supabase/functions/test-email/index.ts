import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_URL = "https://fish-x.com";
const LOGO_URL = "https://fish-xx.lovable.app/fishx-logo.png";

function brandedEmail(opts: { title: string; intro: string; body: string; ctaUrl: string; ctaLabel: string; name: string }) {
  return `<!doctype html>
<html><body style="margin:0;background:#f5f7fb;font-family:'Outfit',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#0b1220;">
  <div style="max-width:560px;margin:0 auto;padding:24px;text-align:center;">
    <div style="background:#031029;color:#fff;border-radius:16px 16px 0 0;padding:28px;text-align:center;">
      <img src="${LOGO_URL}" alt="Fish-X" width="120" style="display:block;margin:0 auto;max-width:120px;height:auto;" />
    </div>
    <div style="background:#ffffff;border-radius:0 0 16px 16px;padding:36px 28px;border:1px solid #e5e9f2;border-top:0;text-align:center;">
      <p style="margin:0 0 8px;font-size:14px;color:#5b6478;">Hi ${opts.name},</p>
      <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;color:#031029;">${opts.title}</h1>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#3a4458;">${opts.intro}</p>
      <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#3a4458;">${opts.body}</p>
      <a href="${opts.ctaUrl}" style="display:inline-block;background:#1454AE;color:#fff;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:10px;font-size:14px;">${opts.ctaLabel}</a>
      <hr style="border:0;border-top:1px solid #eef1f6;margin:32px 0 18px;">
      <p style="margin:0;font-size:12px;color:#8b93a7;line-height:1.5;">You're receiving this because of your Fish-X notification settings.<br/><a href="${APP_URL}/app/settings" style="color:#1454AE;">Manage emails</a>.</p>
    </div>
    <p style="margin:18px 0 0;text-align:center;font-size:11px;color:#9aa3b8;">© ${new Date().getFullYear()} Fish-X LLC · team@fish-x.com</p>
  </div>
</body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { to, name } = await req.json();
    const key = Deno.env.get("RESEND_API_KEY");
    if (!key) throw new Error("RESEND_API_KEY missing");
    const html = brandedEmail({
      title: "Your Fish-X emails look like this",
      intro: "This is a sample of the branded email template every Fish-X notification, verification, and support email uses.",
      body: "Dark navy header, primary blue call-to-action, soft card with shadow, and a subtle footer with an unsubscribe link. Sent from your new verified <strong>fish-x.com</strong> domain.",
      ctaUrl: `${APP_URL}/app/feed`,
      ctaLabel: "Open Fish-X",
      name: name || "angler",
    });
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Fish-X <team@fish-x.com>",
        to: [to],
        subject: "🎣 Your Fish-X branded email preview",
        html,
      }),
    });
    const body = await res.text();
    return new Response(JSON.stringify({ status: res.status, body }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: res.ok ? 200 : 502,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});