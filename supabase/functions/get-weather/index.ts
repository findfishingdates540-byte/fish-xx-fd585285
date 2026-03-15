import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { data: allowed } = await supabase.rpc('check_rate_limit', {
      p_key: `weather:${ip}`,
      p_max_requests: 30,
      p_window_seconds: 60,
    });
    if (allowed === false) {
      return new Response(
        JSON.stringify({ error: 'Too many requests' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { lat, lng } = await req.json();
    
    const apiKey = Deno.env.get('OPENWEATHERMAP_API_KEY');
    if (!apiKey) {
      console.error('OPENWEATHERMAP_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Weather API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate lat/lng are numbers in valid range
    const latitude = Number(lat) || 25.7617;
    const longitude = Number(lng) || -80.1918;
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return new Response(
        JSON.stringify({ error: 'Invalid coordinates' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching weather for lat: ${latitude}, lng: ${longitude}`);

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=imperial`;
    
    const weatherResponse = await fetch(weatherUrl);
    
    if (!weatherResponse.ok) {
      const errorText = await weatherResponse.text();
      console.error('Weather API error:', weatherResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch weather data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const weatherData = await weatherResponse.json();
    
    const result = {
      temperature: Math.round(weatherData.main.temp),
      condition: weatherData.weather[0]?.main || 'Unknown',
      description: weatherData.weather[0]?.description || '',
      icon: weatherData.weather[0]?.icon || '01d',
      wind: {
        speed: Math.round(weatherData.wind?.speed || 0),
        direction: weatherData.wind?.deg || 0,
      },
      humidity: weatherData.main?.humidity || 0,
      pressure: weatherData.main?.pressure || 0,
      visibility: Math.round((weatherData.visibility || 10000) / 1609.34),
      sunrise: weatherData.sys?.sunrise,
      sunset: weatherData.sys?.sunset,
      location: weatherData.name || 'Unknown',
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in get-weather function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
