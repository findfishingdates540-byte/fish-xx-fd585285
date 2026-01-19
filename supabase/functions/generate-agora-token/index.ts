import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Agora token generation (simplified RTC token builder)
function buildToken(
  appId: string,
  appCertificate: string,
  channelName: string,
  uid: number,
  role: number,
  privilegeExpiredTs: number
): string {
  const VERSION = "007";
  const encoder = new TextEncoder();
  
  // Generate random salt and timestamp
  const salt = Math.floor(Math.random() * 0xFFFFFFFF);
  const ts = Math.floor(Date.now() / 1000);
  
  // Build message
  const message = {
    salt,
    ts,
    privileges: {
      1: privilegeExpiredTs, // kJoinChannel
      2: privilegeExpiredTs, // kPublishAudioStream
      3: privilegeExpiredTs, // kPublishVideoStream
      4: privilegeExpiredTs, // kPublishDataStream
    }
  };
  
  const messageStr = JSON.stringify(message);
  const messageBytes = encoder.encode(messageStr);
  
  // Create signature using HMAC-SHA256
  const signContent = `${appId}${channelName}${uid}${messageStr}`;
  
  // Import key for HMAC
  const keyData = encoder.encode(appCertificate);
  
  // Since we can't do async HMAC here easily, we'll use a simpler approach
  // For production, you should use the official Agora token library
  // This is a simplified version that works with Agora's basic auth
  
  // For now, we'll generate a basic token format that Agora accepts
  // The actual token generation should use crypto.subtle.sign
  
  // Base64 encode the components
  const base64Encode = (str: string): string => {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  
  // Create a simple token structure
  const tokenContent = {
    appId,
    channelName,
    uid,
    role,
    privilegeExpiredTs,
    ts,
    salt
  };
  
  return base64Encode(JSON.stringify(tokenContent));
}

// Proper RTC Token generation using crypto
async function generateRtcToken(
  appId: string,
  appCertificate: string,
  channelName: string,
  uid: string,
  role: number = 1,
  tokenExpireSeconds: number = 3600
): Promise<string> {
  const encoder = new TextEncoder();
  
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + tokenExpireSeconds;
  
  // Generate random salt
  const salt = Math.floor(Math.random() * 0xFFFFFFFF);
  
  // Build privileges map
  const privileges: Record<number, number> = {
    1: privilegeExpiredTs, // kJoinChannel
    2: privilegeExpiredTs, // kPublishAudioStream  
    3: privilegeExpiredTs, // kPublishVideoStream
    4: privilegeExpiredTs, // kPublishDataStream
  };
  
  // Pack privileges
  const packUint16 = (val: number): Uint8Array => {
    const buf = new Uint8Array(2);
    buf[0] = val & 0xff;
    buf[1] = (val >> 8) & 0xff;
    return buf;
  };
  
  const packUint32 = (val: number): Uint8Array => {
    const buf = new Uint8Array(4);
    buf[0] = val & 0xff;
    buf[1] = (val >> 8) & 0xff;
    buf[2] = (val >> 16) & 0xff;
    buf[3] = (val >> 24) & 0xff;
    return buf;
  };
  
  const packString = (str: string): Uint8Array => {
    const strBytes = encoder.encode(str);
    const lenBytes = packUint16(strBytes.length);
    const result = new Uint8Array(lenBytes.length + strBytes.length);
    result.set(lenBytes, 0);
    result.set(strBytes, lenBytes.length);
    return result;
  };
  
  const packMapUint32 = (map: Record<number, number>): Uint8Array => {
    const entries = Object.entries(map);
    const parts: Uint8Array[] = [packUint16(entries.length)];
    
    for (const [key, value] of entries) {
      parts.push(packUint16(parseInt(key)));
      parts.push(packUint32(value));
    }
    
    const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of parts) {
      result.set(part, offset);
      offset += part.length;
    }
    return result;
  };
  
  // Build message content
  const uidNum = uid ? parseInt(uid) || 0 : 0;
  
  const messageParts: Uint8Array[] = [
    packUint32(salt),
    packUint32(currentTimestamp),
    packMapUint32(privileges),
  ];
  
  const messageLength = messageParts.reduce((sum, p) => sum + p.length, 0);
  const message = new Uint8Array(messageLength);
  let msgOffset = 0;
  for (const part of messageParts) {
    message.set(part, msgOffset);
    msgOffset += part.length;
  }
  
  // Build content for signature
  const contentParts: Uint8Array[] = [
    packString(appId),
    packString(channelName),
    packUint32(uidNum),
    message,
  ];
  
  const contentLength = contentParts.reduce((sum, p) => sum + p.length, 0);
  const content = new Uint8Array(contentLength);
  let contentOffset = 0;
  for (const part of contentParts) {
    content.set(part, contentOffset);
    contentOffset += part.length;
  }
  
  // Generate HMAC-SHA256 signature
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(appCertificate),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", key, content);
  const signatureBytes = new Uint8Array(signature);
  
  // Build final token
  const tokenParts: Uint8Array[] = [
    packString(appId),
    packUint32(currentTimestamp),
    packUint32(salt),
    packUint16(signatureBytes.length),
    signatureBytes,
    packUint16(message.length),
    message,
  ];
  
  const tokenLength = tokenParts.reduce((sum, p) => sum + p.length, 0);
  const tokenBytes = new Uint8Array(tokenLength);
  let tokenOffset = 0;
  for (const part of tokenParts) {
    tokenBytes.set(part, tokenOffset);
    tokenOffset += part.length;
  }
  
  // Base64 encode
  const base64Token = btoa(String.fromCharCode(...tokenBytes));
  
  return "007" + base64Token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { channelName, uid, role = 1 } = await req.json();

    if (!channelName) {
      return new Response(
        JSON.stringify({ error: "channelName is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const appId = Deno.env.get("AGORA_APP_ID");
    const appCertificate = Deno.env.get("AGORA_APP_CERTIFICATE");

    if (!appId || !appCertificate) {
      console.error("Agora credentials not configured");
      return new Response(
        JSON.stringify({ error: "Agora credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate token valid for 1 hour
    const token = await generateRtcToken(
      appId,
      appCertificate,
      channelName,
      uid || "0",
      role,
      3600
    );

    console.log(`Generated token for channel: ${channelName}, uid: ${uid}`);

    return new Response(
      JSON.stringify({ token, appId, channelName }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating Agora token:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
