import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const token = req.headers.get("x-upload-token");
  if (token !== Deno.env.get("APK_UPLOAD_TOKEN")) {
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const bytes = new Uint8Array(await req.arrayBuffer());
  const path = "Fish-X.apk";
  const { error } = await supabase.storage
    .from("apk-downloads")
    .upload(path, bytes, {
      contentType: "application/vnd.android.package-archive",
      upsert: true,
    });
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const { data } = supabase.storage.from("apk-downloads").getPublicUrl(path);
  return new Response(JSON.stringify({ url: data.publicUrl, size: bytes.length }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});