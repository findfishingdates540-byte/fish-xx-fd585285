import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { city, state, zipCode } = await req.json();
    
    if (!city && !state && !zipCode) {
      return new Response(
        JSON.stringify({ error: 'At least one of city, state, or zipCode is required' }),
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

    // Build address query
    const addressParts = [city, state, zipCode].filter(Boolean);
    const query = encodeURIComponent(addressParts.join(', '));
    
    console.log(`Geocoding address: ${addressParts.join(', ')}`);

    // Call Mapbox Geocoding API
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
      JSON.stringify({ 
        lat, 
        lng, 
        placeName,
        success: true 
      }),
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
