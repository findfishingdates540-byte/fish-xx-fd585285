import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Delete expired stories (older than 24 hours)
    const { data: deletedStories, error: storiesError } = await supabase
      .from("stories")
      .delete()
      .lt("expires_at", new Date().toISOString())
      .select("id, media_url");

    if (storiesError) {
      console.error("Error deleting expired stories:", storiesError);
      throw storiesError;
    }

    // Also delete orphaned story views for deleted stories
    if (deletedStories && deletedStories.length > 0) {
      const deletedIds = deletedStories.map(s => s.id);
      
      await supabase
        .from("story_views")
        .delete()
        .in("story_id", deletedIds);

      // Optionally delete media files from storage
      const mediaUrls = deletedStories
        .filter(s => s.media_url)
        .map(s => {
          // Extract path from URL (assumes format: .../storage/v1/object/public/bucket/path)
          const url = s.media_url;
          const match = url?.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
          if (match) {
            return { bucket: match[1], path: match[2] };
          }
          return null;
        })
        .filter(Boolean);

      for (const file of mediaUrls) {
        if (file) {
          await supabase.storage.from(file.bucket).remove([file.path]);
        }
      }
    }

    console.log(`Cleaned up ${deletedStories?.length || 0} expired stories`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        deleted_count: deletedStories?.length || 0 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Cleanup error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
