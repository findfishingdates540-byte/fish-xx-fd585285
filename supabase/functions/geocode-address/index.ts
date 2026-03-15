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
      p_key: `geocode:${ip}`,
      p_max_requests: 30,
      p_window_seconds: 60,
    });
    if (allowed === false) {
      return new Response(
        JSON.stringify({ error: 'Too many requests' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { city, state, zipCode } = await req.json();
    
    if (!city && !state && !zipCode) {
      return new Response(
        JSON.stringify({ error: 'At least one of city, state, or zipCode is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Input length validation
    if ((city && city.length > 100) || (state && state.length > 50) || (zipCode && zipCode.length > 10)) {
      return new Response(
        JSON.stringify({ error: 'Input too long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const mapboxToken = Deno.env.get('MAPBOX_PUBLIC_TOKEN');
    if (!mapboxToken) {
      console.error('MAPBOX_PUBLIC_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Geocoding service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const addressParts = [city, state, zipCode].filter(Boolean);
    const query = encodeURIComponent(addressParts.join(', '));
    
    console.log(`Geocoding address: ${addressParts.join(', ')}`);

    const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${mapboxToken}&country=US&types=place,postcode,region&limit=1`;
    
    const response = await fetch(geocodeUrl);
    
    if (!response.ok) {
      console.error('Mapbox API error:', response.status, await response.text());
      return new Response(
        JSON.stringify({ error: 'Geocoding request failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    if (!data.features || data.features.length === 0) {
      console.log('No geocoding results found');
      return new Response(
        JSON.stringify({ error: 'Address not found', lat: null, lng: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const [lng, lat] = data.features[0].center;
    const placeName = data.features[0].place_name;
    
    console.log(`Geocoded to: ${lat}, ${lng} (${placeName})`);

    return new Response(
      JSON.stringify({ lat, lng, placeName, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Geocode error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
