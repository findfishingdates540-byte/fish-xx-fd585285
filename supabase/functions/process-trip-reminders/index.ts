import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Trip {
  id: string;
  title: string;
  trip_date: string;
  start_time: string | null;
  user_id: string;
  departure_reminder: boolean;
  weather_alert: boolean;
  location_lat: number | null;
  location_lng: number | null;
  location_name: string | null;
  fishing_spot_id: string | null;
}

interface FishingSpot {
  location_lat: number;
  location_lng: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openWeatherApiKey = Deno.env.get("OPENWEATHERMAP_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const todayDate = now.toISOString().split("T")[0];
    const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    console.log(`Processing reminders at ${now.toISOString()}`);

    // Fetch trips for today and tomorrow that have reminders enabled
    const { data: trips, error: tripsError } = await supabase
      .from("fishing_trips")
      .select("id, title, trip_date, start_time, user_id, departure_reminder, weather_alert, location_lat, location_lng, location_name, fishing_spot_id")
      .in("trip_date", [todayDate, tomorrowDate])
      .eq("status", "planned")
      .or("departure_reminder.eq.true,weather_alert.eq.true");

    if (tripsError) {
      console.error("Error fetching trips:", tripsError);
      throw tripsError;
    }

    console.log(`Found ${trips?.length || 0} trips to process`);

    const results = {
      departureReminders: 0,
      weatherAlerts: 0,
      errors: [] as string[],
    };

    for (const trip of trips || []) {
      try {
        // Process departure reminders (1 hour before)
        if (trip.departure_reminder && trip.start_time && trip.trip_date === todayDate) {
          const tripDateTime = new Date(`${trip.trip_date}T${trip.start_time}`);
          const timeDiff = tripDateTime.getTime() - now.getTime();
          const minutesUntilTrip = timeDiff / (1000 * 60);

          // Send reminder if trip is 55-65 minutes away (to account for cron timing)
          if (minutesUntilTrip >= 55 && minutesUntilTrip <= 65) {
            console.log(`Sending departure reminder for trip ${trip.id}`);
            
            await sendPushNotification(supabase, supabaseUrl, supabaseServiceKey, {
              userId: trip.user_id,
              title: "🎣 Trip Starting Soon!",
              body: `"${trip.title}" starts in about 1 hour. Time to get ready!`,
              url: `/app/trips/${trip.id}`,
              tag: `departure-${trip.id}`,
            });

            results.departureReminders++;
          }
        }

        // Process weather alerts for tomorrow's trips
        if (trip.weather_alert && trip.trip_date === tomorrowDate && openWeatherApiKey) {
          let lat = trip.location_lat;
          let lng = trip.location_lng;

          // If no direct coordinates, try to get from fishing spot
          if (!lat || !lng) {
            if (trip.fishing_spot_id) {
              const { data: spot } = await supabase
                .from("fishing_spots")
                .select("location_lat, location_lng")
                .eq("id", trip.fishing_spot_id)
                .single();

              if (spot) {
                lat = spot.location_lat;
                lng = spot.location_lng;
              }
            }
          }

          if (lat && lng) {
            // Fetch weather forecast
            const weatherResponse = await fetch(
              `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${openWeatherApiKey}&units=imperial`
            );

            if (weatherResponse.ok) {
              const weatherData = await weatherResponse.json();
              
              // Check forecast for trip date
              const tripDateForecasts = weatherData.list?.filter((item: any) => {
                const forecastDate = new Date(item.dt * 1000).toISOString().split("T")[0];
                return forecastDate === trip.trip_date;
              }) || [];

              // Check for rain in any forecast period
              const hasRain = tripDateForecasts.some((forecast: any) => {
                const rainProb = forecast.pop || 0; // Probability of precipitation
                const weatherMain = forecast.weather?.[0]?.main?.toLowerCase() || "";
                return rainProb > 0.5 || weatherMain.includes("rain") || weatherMain.includes("storm");
              });

              if (hasRain) {
                console.log(`Sending weather alert for trip ${trip.id}`);
                
                await sendPushNotification(supabase, supabaseUrl, supabaseServiceKey, {
                  userId: trip.user_id,
                  title: "🌧️ Weather Alert",
                  body: `Rain expected for "${trip.title}" tomorrow. Consider checking the forecast!`,
                  url: `/app/trips/${trip.id}`,
                  tag: `weather-${trip.id}`,
                });

                results.weatherAlerts++;
              }
            }
          }
        }
      } catch (tripError) {
        console.error(`Error processing trip ${trip.id}:`, tripError);
        results.errors.push(`Trip ${trip.id}: ${tripError}`);
      }
    }

    console.log("Processing complete:", results);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing trip reminders:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function sendPushNotification(
  supabase: any,
  supabaseUrl: string,
  serviceKey: string,
  payload: {
    userId: string;
    title: string;
    body: string;
    url?: string;
    tag?: string;
  }
) {
  // Also create a notification record
  await supabase.from("notifications").insert({
    user_id: payload.userId,
    type: "trip_reminder",
    title: payload.title,
    body: payload.body,
    data: { url: payload.url, tag: payload.tag },
  });

  // Call the push notification function
  const response = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Push notification failed:", errorText);
  }

  return response;
}
