import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { RtcRole, RtcTokenBuilder } from "https://esm.sh/agora-access-token@2.0.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function toNumericUid(uid: unknown): number {
  const raw = String(uid ?? "");
  const digits = raw.replace(/\D/g, "");
  const n = parseInt(digits.slice(0, 9), 10);
  return Number.isFinite(n) && n > 0 ? n : Math.floor(Math.random() * 1_000_000_000);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { channelName, uid, role = "publisher" } = await req.json();

    if (!channelName) {
      return new Response(JSON.stringify({ error: "channelName is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const appId = Deno.env.get("AGORA_APP_ID") ?? "";
    const appCertificate = Deno.env.get("AGORA_APP_CERTIFICATE") ?? "";

    if (!appId || !appCertificate) {
      return new Response(JSON.stringify({ error: "Agora credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const numericUid = toNumericUid(uid);

    const expireTimestamp = Math.floor(Date.now() / 1000) + 3600;
    const rtcRole = role === "subscriber" ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      numericUid,
      rtcRole,
      expireTimestamp
    );

    return new Response(JSON.stringify({ token, appId, channelName, uid: numericUid }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-agora-token error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
