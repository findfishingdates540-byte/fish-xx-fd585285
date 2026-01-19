import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type RtcRole = "publisher" | "subscriber";

function toNumericUid(uid: unknown): number {
  const raw = String(uid ?? "");
  const digits = raw.replace(/\D/g, "");
  const n = parseInt(digits.slice(0, 9), 10);
  return Number.isFinite(n) && n > 0 ? n : Math.floor(Math.random() * 1_000_000_000);
}

function concat(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, a) => sum + a.length, 0);
  const out = new Uint8Array(totalLength);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

function u16le(n: number): Uint8Array {
  const out = new Uint8Array(2);
  out[0] = n & 0xff;
  out[1] = (n >> 8) & 0xff;
  return out;
}

function u32le(n: number): Uint8Array {
  const out = new Uint8Array(4);
  out[0] = n & 0xff;
  out[1] = (n >> 8) & 0xff;
  out[2] = (n >> 16) & 0xff;
  out[3] = (n >> 24) & 0xff;
  return out;
}

function packString(str: string): Uint8Array {
  const bytes = new TextEncoder().encode(str);
  return concat([u16le(bytes.length), bytes]);
}

function packPrivileges(privs: Record<number, number>): Uint8Array {
  const entries = Object.entries(privs);
  const parts: Uint8Array[] = [u16le(entries.length)];
  for (const [k, v] of entries) {
    parts.push(u16le(parseInt(k, 10)));
    parts.push(u32le(v));
  }
  return concat(parts);
}

async function hmacSha256(keyStr: string, data: Uint8Array): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(keyStr),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  // Deno's type definitions can treat Uint8Array.buffer as ArrayBufferLike (SAB).
  // Copy into a fresh ArrayBuffer to satisfy BufferSource and avoid type errors.
  const dataBuffer = new Uint8Array(data).buffer;
  const sig = await crypto.subtle.sign("HMAC", key, dataBuffer);
  return new Uint8Array(sig);
}

/**
 * Agora RTC token builder ("007" format).
 * Produces a token compatible with Agora Web SDK join.
 */
async function buildRtcTokenV007(params: {
  appId: string;
  appCertificate: string;
  channelName: string;
  uid: number;
  role: RtcRole;
  expireInSeconds: number;
}): Promise<{ token: string; expireTs: number }> {
  const nowTs = Math.floor(Date.now() / 1000);
  const expireTs = nowTs + params.expireInSeconds;
  const salt = Math.floor(Math.random() * 0xffffffff);

  // Privileges (same ones used by official builders)
  const privileges: Record<number, number> = {
    1: expireTs, // kJoinChannel
    2: params.role === "subscriber" ? 0 : expireTs, // kPublishAudioStream
    3: params.role === "subscriber" ? 0 : expireTs, // kPublishVideoStream
    4: params.role === "subscriber" ? 0 : expireTs, // kPublishDataStream
  };

  const message = concat([u32le(salt), u32le(nowTs), packPrivileges(privileges)]);

  const content = concat([
    packString(params.appId),
    packString(params.channelName),
    u32le(params.uid),
    message,
  ]);

  const signature = await hmacSha256(params.appCertificate, content);

  const tokenBytes = concat([
    packString(params.appId),
    u32le(nowTs),
    u32le(salt),
    u16le(signature.length),
    signature,
    u16le(message.length),
    message,
  ]);

  const base64 = btoa(String.fromCharCode(...tokenBytes));
  return { token: `007${base64}`, expireTs };
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

    if (!/^[a-f0-9]{32}$/i.test(appId)) {
      return new Response(JSON.stringify({ error: "Invalid Agora App ID format" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const numericUid = toNumericUid(uid);
    const safeRole: RtcRole = role === "subscriber" ? "subscriber" : "publisher";

    const { token } = await buildRtcTokenV007({
      appId,
      appCertificate,
      channelName,
      uid: numericUid,
      role: safeRole,
      expireInSeconds: 3600,
    });

    return new Response(JSON.stringify({ token, appId, channelName, uid: numericUid }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-agora-token error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
