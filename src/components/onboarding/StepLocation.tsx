import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AnimatedInput } from "@/components/ui/animated-input";
import { Label } from "@/components/ui/label";
import { MapPin, Heart, Navigation, Shield } from "lucide-react";

interface StepLocationProps {
  city: string;
  setCity: (value: string) => void;
  state: string;
  setState: (value: string) => void;
  zipCode: string;
  setZipCode: (value: string) => void;
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
  onEnableLocation,
}: StepLocationProps) {
  const [locationLoading, setLocationLoading] = useState(false);
  const [cityTouched, setCityTouched] = useState(false);

  const handleEnableLocation = async () => {
    if (!navigator.geolocation) {
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        onEnableLocation?.();
        setLocationLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationLoading(false);
      }
    );
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
            disabled={locationLoading}
            className="w-full p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors flex items-center gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div 
              className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center"
              animate={locationLoading ? { rotate: 360 } : {}}
              transition={locationLoading ? { repeat: Infinity, duration: 1, ease: "linear" } : {}}
            >
              <MapPin className="w-6 h-6 text-primary" />
            </motion.div>
            <div className="text-left">
              <p className="font-semibold text-primary">Enable Location Services</p>
              <p className="text-sm text-muted-foreground">
                {locationLoading ? 'Getting your location...' : 'Automatically find your spot'}
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
