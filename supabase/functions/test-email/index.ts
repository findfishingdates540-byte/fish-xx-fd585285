import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { to } = await req.json();
    const key = Deno.env.get("RESEND_API_KEY");
    if (!key) throw new Error("RESEND_API_KEY missing");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "FishX <team@fish-x.com>",
        to: [to],
        subject: "FishX domain test ✅",
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#fff;">
          <h1 style="color:#1454AE;margin:0 0 16px;">FishX email test</h1>
          <p style="color:#333;font-size:16px;line-height:1.6;">If you're reading this, the new <strong>fish-x.com</strong> sending domain is wired up correctly through Resend.</p>
          <p style="color:#666;font-size:14px;margin-top:24px;">— Sent from team@fish-x.com</p>
        </div>`,
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