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
      console.error("DAILY_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Daily.co API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { roomName, callType } = await req.json();

    // Generate a unique room name if not provided
    const finalRoomName = roomName || `call-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Create room via Daily.co REST API
    const response = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: finalRoomName,
        privacy: "private",
        properties: {
          // Room expires in 1 hour
          exp: Math.floor(Date.now() / 1000) + 3600,
          // Enable/disable video based on call type
          enable_chat: true,
          enable_screenshare: false,
          start_video_off: callType === "voice",
          start_audio_off: false,
          // Max 2 participants for 1:1 calls
          max_participants: 2,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Daily.co API error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to create room", details: errorText }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const roomData = await response.json();

    // Now create a meeting token for the user
    const tokenResponse = await fetch("https://api.daily.co/v1/meeting-tokens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        properties: {
          room_name: roomData.name,
          // Token expires when room expires
          exp: Math.floor(Date.now() / 1000) + 3600,
          enable_screenshare: false,
          start_video_off: callType === "voice",
          start_audio_off: false,
        },
      }),
    });

    if (!tokenResponse.ok) {
      const tokenErrorText = await tokenResponse.text();
      console.error("Daily.co token error:", tokenResponse.status, tokenErrorText);
      return new Response(JSON.stringify({ error: "Failed to create meeting token" }), {
        status: tokenResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tokenData = await tokenResponse.json();

    return new Response(
      JSON.stringify({
        roomUrl: roomData.url,
        roomName: roomData.name,
        token: tokenData.token,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("create-daily-room error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
