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

    // Get all rooms
    const listResponse = await fetch("https://api.daily.co/v1/rooms", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
    });

    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      return new Response(JSON.stringify({ error: "Failed to list rooms", details: errorText }), {
        status: listResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: rooms } = await listResponse.json();
    console.log(`Found ${rooms?.length || 0} rooms to delete`);

    const deletedRooms: string[] = [];
    const failedRooms: string[] = [];

    // Delete each room
    for (const room of rooms || []) {
      const deleteResponse = await fetch(`https://api.daily.co/v1/rooms/${room.name}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${DAILY_API_KEY}`,
        },
      });

      if (deleteResponse.ok) {
        deletedRooms.push(room.name);
        console.log(`Deleted room: ${room.name}`);
      } else {
        failedRooms.push(room.name);
        console.error(`Failed to delete room: ${room.name}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        deletedCount: deletedRooms.length,
        deletedRooms,
        failedRooms,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("delete-daily-rooms error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
