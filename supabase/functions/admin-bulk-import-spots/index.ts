import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-import-token",
};

const IMPORT_TOKEN = "fishx-onetime-spot-import-2026-06";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (req.headers.get("x-import-token") !== IMPORT_TOKEN) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const body = await req.json();
    const spots = body.spots as any[];
    if (!Array.isArray(spots)) {
      return new Response(JSON.stringify({ error: "spots must be array" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const batchSize = 500;
    let inserted = 0;
    const errors: any[] = [];
    for (let i = 0; i < spots.length; i += batchSize) {
      const batch = spots.slice(i, i + batchSize);
      const { error, count } = await supabase.from("fishing_spots").insert(batch, { count: "exact" });
      if (error) {
        errors.push({ batch: i, message: error.message });
      } else {
        inserted += count ?? batch.length;
      }
    }
    return new Response(JSON.stringify({ inserted, errors }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});