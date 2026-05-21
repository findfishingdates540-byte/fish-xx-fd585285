import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import records from "./records.json" with { type: "json" };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Rec = {
  common_name: string;
  scientific_name: string | null;
  weight_kg: number;
  weight_text: string | null;
  angler: string | null;
  location: string | null;
  country: string | null;
  date: string | null;
};

function norm(s: string | null | undefined): string {
  if (!s) return "";
  return s.toLowerCase().replace(/[(),./]/g, " ").replace(/\s+/g, " ").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: species, error: spErr } = await supabase
    .from("fish_species")
    .select("id, name, scientific_name");
  if (spErr) return new Response(JSON.stringify({ error: spErr.message }), { status: 500, headers: corsHeaders });

  const recs = records as Rec[];

  // Index records by scientific name (normalized) and common name (normalized)
  const bySci = new Map<string, Rec>();
  const byCommon = new Map<string, Rec>();
  for (const r of recs) {
    if (r.scientific_name) {
      const k = norm(r.scientific_name);
      if (!bySci.has(k) || (bySci.get(k)!.weight_kg < r.weight_kg)) bySci.set(k, r);
    }
    if (r.common_name) {
      const k = norm(r.common_name);
      if (!byCommon.has(k) || (byCommon.get(k)!.weight_kg < r.weight_kg)) byCommon.set(k, r);
    }
  }

  function findMatch(name: string, sci: string | null): Rec | null {
    // Scientific name (with "A/B" split, "x" hybrid split)
    if (sci) {
      const cleaned = sci.replace(/\b(spp\.?|family|x)\b/gi, " ");
      const parts = cleaned.split(/[\/,]/).map((p) => norm(p)).filter(Boolean);
      for (const p of parts) if (bySci.has(p)) return bySci.get(p)!;
      // Try first two words (genus + species)
      const words = norm(cleaned).split(" ");
      if (words.length >= 2) {
        const twoWord = `${words[0]} ${words[1]}`;
        if (bySci.has(twoWord)) return bySci.get(twoWord)!;
      }
    }
    // Common name exact
    const cn = norm(name);
    if (byCommon.has(cn)) return byCommon.get(cn)!;
    // "Bass, Largemouth" -> "Largemouth Bass"
    if (name.includes(",")) {
      const [a, b] = name.split(",").map((s) => s.trim());
      const rev = norm(`${b} ${a}`);
      if (byCommon.has(rev)) return byCommon.get(rev)!;
    }
    // Token-superset: every species token present in some record name
    const spTok = new Set(cn.split(" ").filter((t) => t.length > 2));
    if (spTok.size === 0) return null;
    let best: Rec | null = null;
    for (const r of recs) {
      const rTok = new Set(norm(r.common_name).split(" "));
      let allIn = true;
      for (const t of spTok) if (!rTok.has(t)) { allIn = false; break; }
      if (allIn) {
        if (!best || r.weight_kg > best.weight_kg) best = r;
      }
    }
    return best;
  }

  const updates: { id: string; rec: Rec }[] = [];
  const unmatched: string[] = [];
  for (const sp of species ?? []) {
    const m = findMatch(sp.name, sp.scientific_name);
    if (m) updates.push({ id: sp.id, rec: m });
    else unmatched.push(sp.name);
  }

  let updated = 0;
  for (const u of updates) {
    const lbs = Math.round(u.rec.weight_kg * 2.20462 * 100) / 100;
    const { error } = await supabase
      .from("fish_species")
      .update({
        world_record_weight_lbs: lbs,
        world_record_weight_text: u.rec.weight_text,
        world_record_angler: u.rec.angler,
        world_record_location: u.rec.location,
        world_record_country: u.rec.country,
        world_record_date: u.rec.date,
        world_record_source: "IGFA All-Tackle Records",
      })
      .eq("id", u.id);
    if (!error) updated++;
  }

  return new Response(
    JSON.stringify({
      species_total: species?.length ?? 0,
      matched: updates.length,
      updated,
      unmatched_count: unmatched.length,
      unmatched_sample: unmatched.slice(0, 50),
    }, null, 2),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});