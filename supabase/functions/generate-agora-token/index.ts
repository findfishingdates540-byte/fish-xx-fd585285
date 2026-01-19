import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// RtcTokenBuilder compatible implementation
// Based on Agora's AccessToken2 format
class RtcTokenBuilder {
  private appId: string;
  private appCertificate: string;
  private channelName: string;
  private uid: number;
  private expireTimestamp: number;

  constructor(
    appId: string,
    appCertificate: string,
    channelName: string,
    uid: number,
    expireTimestamp: number
  ) {
    this.appId = appId;
    this.appCertificate = appCertificate;
    this.channelName = channelName;
    this.uid = uid;
    this.expireTimestamp = expireTimestamp;
  }

  async build(): Promise<string> {
    const encoder = new TextEncoder();
    
    // Token version
    const VERSION = "007";
    
    // Generate random values
    const salt = Math.floor(Math.random() * 0xFFFFFFFF);
    const currentTs = Math.floor(Date.now() / 1000);
    
    // Privileges
    const PRIVILEGE_JOIN_CHANNEL = 1;
    const PRIVILEGE_PUBLISH_AUDIO = 2;
    const PRIVILEGE_PUBLISH_VIDEO = 3;
    const PRIVILEGE_PUBLISH_DATA = 4;
    
    const privileges: Map<number, number> = new Map([
      [PRIVILEGE_JOIN_CHANNEL, this.expireTimestamp],
      [PRIVILEGE_PUBLISH_AUDIO, this.expireTimestamp],
      [PRIVILEGE_PUBLISH_VIDEO, this.expireTimestamp],
      [PRIVILEGE_PUBLISH_DATA, this.expireTimestamp],
    ]);

    // Pack functions (little-endian)
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

    const packPrivileges = (privs: Map<number, number>): Uint8Array => {
      const parts: Uint8Array[] = [packUint16(privs.size)];
      for (const [key, value] of privs) {
        parts.push(packUint16(key));
        parts.push(packUint32(value));
      }
      return concatArrays(parts);
    };

    const concatArrays = (arrays: Uint8Array[]): Uint8Array => {
      const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
      }
      return result;
    };

    // Build message (privileges)
    const message = concatArrays([
      packUint32(salt),
      packUint32(currentTs),
      packPrivileges(privileges),
    ]);

    // Build content for signing
    const content = concatArrays([
      packString(this.appId),
      packString(this.channelName),
      packUint32(this.uid),
      message,
    ]);

    // Sign with HMAC-SHA256
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(this.appCertificate),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, content.buffer as ArrayBuffer);
    const signature = new Uint8Array(signatureBuffer);

    // Build token
    const token = concatArrays([
      packString(this.appId),
      packUint32(currentTs),
      packUint32(salt),
      packUint16(signature.length),
      signature,
      packUint16(message.length),
      message,
    ]);

    // Base64 encode
    let base64 = btoa(String.fromCharCode(...token));
    // URL-safe base64
    base64 = base64.replace(/\+/g, '*').replace(/\//g, '-').replace(/=+$/, '');
    
    return VERSION + base64;
  }
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
      console.error("Agora credentials not configured. AGORA_APP_ID:", !!appId, "AGORA_APP_CERTIFICATE:", !!appCertificate);
      return new Response(
        JSON.stringify({ error: "Agora credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate App ID format (should be 32 hex characters)
    if (!/^[a-f0-9]{32}$/i.test(appId)) {
      console.error("Invalid AGORA_APP_ID format. Expected 32 hex characters, got:", appId.length, "chars");
      return new Response(
        JSON.stringify({ error: "Invalid Agora App ID format" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert uid to numeric (Agora requires numeric UID for RTC)
    let numericUid = 0;
    if (uid) {
      // Extract numbers from UUID or use as-is if numeric
      const uidStr = String(uid).replace(/\D/g, '');
      numericUid = parseInt(uidStr.slice(0, 9)) || Math.floor(Math.random() * 100000);
    }

    // Token expires in 1 hour
    const expireTimestamp = Math.floor(Date.now() / 1000) + 3600;

    const builder = new RtcTokenBuilder(
      appId,
      appCertificate,
      channelName,
      numericUid,
      expireTimestamp
    );

    const token = await builder.build();

    console.log(`Generated token for channel: ${channelName}, uid: ${numericUid}, appId: ${appId.slice(0, 8)}...`);

    return new Response(
      JSON.stringify({ token, appId, channelName, uid: numericUid }),
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
