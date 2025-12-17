import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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

  const handleEnableLocation = async () => {
    if (!navigator.geolocation) {
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // In a real app, you'd reverse geocode these coordinates
        // For now, we'll just notify the parent
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
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Location Form */}
        <div className="flex-1 space-y-6">
          {/* Enable Location Button */}
          <button
            onClick={handleEnableLocation}
            disabled={locationLoading}
            className="w-full p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-primary">Enable Location Services</p>
              <p className="text-sm text-muted-foreground">
                {locationLoading ? 'Getting your location...' : 'Automatically find your spot'}
              </p>
            </div>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 border-t border-border" />
            <span className="text-sm text-muted-foreground">or enter manually</span>
            <div className="flex-1 border-t border-border" />
          </div>

          {/* Manual Entry */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-medium text-foreground">
                City
              </Label>
              <Input
                id="city"
                type="text"
                placeholder="e.g. Miami"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-12 rounded-xl border-border bg-background"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state" className="text-sm font-medium text-foreground">
                  State / Region
                </Label>
                <Input
                  id="state"
                  type="text"
                  placeholder="e.g. Florida"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="h-12 rounded-xl border-border bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip" className="text-sm font-medium text-foreground">
                  Zip Code
                </Label>
                <Input
                  id="zip"
                  type="text"
                  placeholder="e.g. 33101"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="h-12 rounded-xl border-border bg-background"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="lg:w-80 p-5 rounded-2xl bg-primary/5 border border-primary/10">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Why we need this</h3>
          </div>
          
          <div className="space-y-4">
            {benefits.map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
