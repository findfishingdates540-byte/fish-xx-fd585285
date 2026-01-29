import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DAILY_API_KEY = Deno.env.get("DAILY_API_KEY");
    if (!DAILY_API_KEY) {
      return new Response(JSON.stringify({ error: "Daily.co API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { roomUrl } = await req.json();
    
    if (!roomUrl) {
      return new Response(JSON.stringify({ error: "roomUrl is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract room name from URL (e.g., https://domain.daily.co/room-name)
    const urlParts = roomUrl.split('/');
    const roomName = urlParts[urlParts.length - 1];

    if (!roomName) {
      return new Response(JSON.stringify({ error: "Invalid roomUrl format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Deleting room: ${roomName}`);

    const deleteResponse = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
    });

    if (deleteResponse.ok || deleteResponse.status === 404) {
      // 404 means room already deleted, which is fine
      console.log(`Room deleted successfully: ${roomName}`);
      return new Response(
        JSON.stringify({ success: true, roomName }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      const errorText = await deleteResponse.text();
      console.error(`Failed to delete room: ${roomName}`, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to delete room", details: errorText }),
        { status: deleteResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("delete-daily-room error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
