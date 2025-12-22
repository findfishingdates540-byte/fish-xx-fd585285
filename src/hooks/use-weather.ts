import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface WeatherData {
  temperature: number;
  condition: string;
  description: string;
  icon: string;
  wind: {
    speed: number;
    direction: number;
  };
  humidity: number;
  pressure: number;
  visibility: number;
  sunrise: number;
  sunset: number;
  location: string;
}

export function useWeather(lat?: number | null, lng?: number | null) {
  return useQuery({
    queryKey: ['weather', lat, lng],
    queryFn: async (): Promise<WeatherData> => {
      const { data, error } = await supabase.functions.invoke('get-weather', {
        body: { lat, lng }
      });

      if (error) {
        console.error('Weather fetch error:', error);
        throw new Error('Failed to fetch weather data');
      }

      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 15 * 60 * 1000, // Refetch every 15 minutes
    retry: 2,
  });
}

// Helper to get wind direction as text
export function getWindDirection(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

// Helper to get fishing conditions based on weather
export function getFishingConditions(weather: WeatherData): {
  rating: 'Poor' | 'Fair' | 'Good' | 'Excellent';
  color: string;
} {
  const { wind, pressure, condition } = weather;
  
  // Simple heuristic for fishing conditions
  let score = 0;
  
  // Wind conditions (lower is better for fishing)
  if (wind.speed < 5) score += 3;
  else if (wind.speed < 10) score += 2;
  else if (wind.speed < 15) score += 1;
  
  // Pressure (higher/stable is generally better)
  if (pressure >= 1015 && pressure <= 1025) score += 3;
  else if (pressure >= 1010 && pressure <= 1030) score += 2;
  else score += 1;
  
  // Weather conditions
  const goodConditions = ['Clear', 'Clouds', 'Few clouds', 'Scattered clouds'];
  const fairConditions = ['Mist', 'Haze', 'Overcast'];
  
  if (goodConditions.some(c => condition.includes(c))) score += 2;
  else if (fairConditions.some(c => condition.includes(c))) score += 1;
  
  if (score >= 7) return { rating: 'Excellent', color: 'text-green-500' };
  if (score >= 5) return { rating: 'Good', color: 'text-emerald-500' };
  if (score >= 3) return { rating: 'Fair', color: 'text-yellow-500' };
  return { rating: 'Poor', color: 'text-red-500' };
}
