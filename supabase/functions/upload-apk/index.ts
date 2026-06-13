const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-upload-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const token = req.headers.get("x-upload-token");
  if (token !== "70818dcaa7d6c76099592488adf2ae9ce01bd379d3baa94e") {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const bytes = new Uint8Array(await req.arrayBuffer());

  const form = new FormData();
  form.append(
    "file",
    new Blob([bytes], { type: "application/vnd.android.package-archive" }),
    "Fish-X.apk"
  );

  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/apk-downloads/Fish-X.apk`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY,
        "x-upsert": "true",
      },
      body: form,
    }
  );

  const text = await res.text();
  return new Response(JSON.stringify({ status: res.status, body: text, size: bytes.length }), {
    status: res.ok ? 200 : 500,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});