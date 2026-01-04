import { useState } from "react";
import { motion } from "framer-motion";
import { AnimatedInput } from "@/components/ui/animated-input";
import { MapPin, Heart, Navigation, Shield } from "lucide-react";

interface StepLocationProps {
  city: string;
  setCity: (value: string) => void;
  state: string;
  setState: (value: string) => void;
  zipCode: string;
  setZipCode: (value: string) => void;
  locationLat?: number | null;
  setLocationLat?: (value: number | null) => void;
  locationLng?: number | null;
  setLocationLng?: (value: number | null) => void;
  onEnableLocation?: () => void;
}

const benefits = [
  {
    icon: Heart,
    title: 'Find your Catch',
    desc: 'In Dating mode, we show you profiles of other fishing enthusiasts near you.',
  },
  {
    icon: Navigation,
    title: 'Discover Local Spots',
    desc: 'Unlock hidden gems, boat ramps, and top-rated fishing holes in your vicinity.',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    desc: 'Your exact coordinates are never shared with other users, only your approximate distance.',
  },
];

export function StepLocation({
  city,
  setCity,
  state,
  setState,
  zipCode,
  setZipCode,
  setLocationLat,
  setLocationLng,
  onEnableLocation,
}: StepLocationProps) {
  const [locationLoading, setLocationLoading] = useState(false);
  const [cityTouched, setCityTouched] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);

  const handleEnableLocation = async () => {
    if (!navigator.geolocation) {
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Pass coordinates to parent
        setLocationLat?.(latitude);
        setLocationLng?.(longitude);
        setLocationGranted(true);
        
        // Try to reverse geocode to get city/state/zip
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=postcode,place,region&access_token=${await getMapboxToken()}`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.features && data.features.length > 0) {
              // Extract city, state, and zip from response
              const placeFeature = data.features.find((f: any) => f.place_type?.includes('place'));
              const regionFeature = data.features.find((f: any) => f.place_type?.includes('region'));
              const postcodeFeature = data.features.find((f: any) => f.place_type?.includes('postcode'));
              
              if (placeFeature) {
                setCity(placeFeature.text || '');
              }
              if (regionFeature) {
                setState(regionFeature.text || '');
              }
              if (postcodeFeature) {
                setZipCode(postcodeFeature.text || '');
              }
            }
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
        }
        
        onEnableLocation?.();
        setLocationLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationLoading(false);
      }
    );
  };

  // Helper to get mapbox token
  const getMapboxToken = async (): Promise<string> => {
    try {
      const response = await fetch('https://zjmnlelqoiclkbrqefyv.supabase.co/functions/v1/get-mapbox-token');
      if (response.ok) {
        const data = await response.json();
        return data.token || '';
      }
    } catch (error) {
      console.error('Error fetching mapbox token:', error);
    }
    return '';
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Location Form */}
        <div className="flex-1 space-y-6">
          {/* Enable Location Button */}
          <motion.button
            onClick={handleEnableLocation}
            disabled={locationLoading || locationGranted}
            className={`w-full p-4 rounded-xl border-2 border-dashed transition-colors flex items-center gap-4 ${
              locationGranted 
                ? 'border-green-500/50 bg-green-500/10 cursor-default' 
                : 'border-primary/30 bg-primary/5 hover:bg-primary/10'
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={locationGranted ? {} : { scale: 1.02 }}
            whileTap={locationGranted ? {} : { scale: 0.98 }}
          >
            <motion.div 
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                locationGranted ? 'bg-green-500/20' : 'bg-primary/20'
              }`}
              animate={locationLoading ? { rotate: 360 } : {}}
              transition={locationLoading ? { repeat: Infinity, duration: 1, ease: "linear" } : {}}
            >
              <MapPin className={`w-6 h-6 ${locationGranted ? 'text-green-600' : 'text-primary'}`} />
            </motion.div>
            <div className="text-left">
              <p className={`font-semibold ${locationGranted ? 'text-green-600' : 'text-primary'}`}>
                {locationGranted ? 'Location Enabled ✓' : 'Enable Location Services'}
              </p>
              <p className="text-sm text-muted-foreground">
                {locationLoading 
                  ? 'Getting your location...' 
                  : locationGranted 
                    ? 'Your coordinates have been saved'
                    : 'Automatically find your spot'}
              </p>
            </div>
          </motion.button>

          {/* Divider */}
          <motion.div 
            className="flex items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex-1 border-t border-border" />
            <span className="text-sm text-muted-foreground">or enter manually</span>
            <div className="flex-1 border-t border-border" />
          </motion.div>

          {/* Manual Entry */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <AnimatedInput
              label="City"
              type="text"
              placeholder="e.g. Miami"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onBlur={() => setCityTouched(true)}
              success={cityTouched && city.length >= 2}
            />

            <div className="grid grid-cols-2 gap-4">
              <AnimatedInput
                label="State / Region"
                type="text"
                placeholder="e.g. Florida"
                value={state}
                onChange={(e) => setState(e.target.value)}
                success={state.length >= 2}
              />
              <AnimatedInput
                label="Zip Code"
                type="text"
                placeholder="e.g. 33101"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                success={zipCode.length >= 4}
              />
            </div>
          </motion.div>
        </div>

        {/* Benefits */}
        <motion.div 
          className="lg:w-80 p-5 rounded-2xl bg-primary/5 border border-primary/10"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Why we need this</h3>
          </div>
          
          <div className="space-y-4">
            {benefits.map((item, i) => (
              <motion.div 
                key={i} 
                className="flex gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
