import { supabase } from "@/integrations/supabase/client";
import type { WatermarkLocation } from "./photo-watermark";

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<WatermarkLocation> {
  const fallback: WatermarkLocation = { lat, lng };

  try {
    // Get Mapbox token from edge function
    const { data: tokenData, error: tokenErr } = await supabase.functions.invoke(
      "get-mapbox-token"
    );
    if (tokenErr || !tokenData?.token) return fallback;

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${tokenData.token}&types=address,place,district,region&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return fallback;

    const json = await res.json();
    const feature = json.features?.[0];
    if (!feature) return fallback;

    // Extract structured address from context array
    const contextMap: Record<string, string> = {};
    if (feature.context) {
      for (const c of feature.context) {
        const type = c.id.split(".")[0]; // e.g. "place", "district", "region"
        contextMap[type] = c.text;
      }
    }

    // Street = feature text + address number if present
    const street = feature.address
      ? `${feature.address} ${feature.text}`
      : feature.place_type?.includes("address")
        ? feature.text
        : undefined;

    return {
      street,
      city: contextMap["place"] || contextMap["locality"],
      county: contextMap["district"],
      state: contextMap["region"],
      lat,
      lng,
    };
  } catch (err) {
    console.error("Reverse geocode failed:", err);
    return fallback;
  }
}
