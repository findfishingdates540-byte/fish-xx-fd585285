// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find all expired matches (expires_at is in the past, has messages = false)
    const now = new Date().toISOString();
    
    // Get matches that have expired
    const { data: expiredMatches, error: fetchError } = await supabase
      .from("matches")
      .select("id, user1_id, user2_id, expires_at")
      .eq("is_match", true)
      .lt("expires_at", now)
      .not("expires_at", "is", null);

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${expiredMatches?.length || 0} expired matches`);

    if (expiredMatches && expiredMatches.length > 0) {
      // For each expired match, check if there are any messages
      const matchesToExpire: string[] = [];
      
      for (const match of expiredMatches) {
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("match_id", match.id);
        
        // If no messages, this match should expire
        if (count === 0) {
          matchesToExpire.push(match.id);
        } else {
          // Has messages, clear the expiration
          await supabase
            .from("matches")
            .update({ expires_at: null })
            .eq("id", match.id);
        }
      }

      if (matchesToExpire.length > 0) {
        // Mark expired matches as no longer a match (soft delete)
        const { error: updateError } = await supabase
          .from("matches")
          .update({ 
            is_match: false, 
            expires_at: null 
          })
          .in("id", matchesToExpire);

        if (updateError) {
          throw updateError;
        }

        console.log(`Expired ${matchesToExpire.length} matches`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: expiredMatches?.length || 0 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing match expirations:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
