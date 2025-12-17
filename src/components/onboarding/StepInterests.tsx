import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Fish, Sailboat, Anchor, Snowflake, UtensilsCrossed, Tent, Ship, Camera, Plane, TreePine, Sun, Mountain, Utensils, Footprints } from "lucide-react";

interface StepInterestsProps {
  selectedStyles: string[];
  setSelectedStyles: (styles: string[]) => void;
  selectedActivities: string[];
  setSelectedActivities: (activities: string[]) => void;
}

const fishingStyles = [
  { id: 'fly_fishing', label: 'Fly Fishing', icon: Fish },
  { id: 'deep_sea', label: 'Deep Sea', icon: Sailboat },
  { id: 'kayak_fishing', label: 'Kayak Fishing', icon: Anchor },
  { id: 'catch_and_cook', label: 'Catch & Cook', icon: UtensilsCrossed },
  { id: 'ice_fishing', label: 'Ice Fishing', icon: Snowflake },
  { id: 'bass_fishing', label: 'Bass Fishing', icon: Fish },
];

const beyondWater = [
  { id: 'camping', label: 'Camping', icon: Tent },
  { id: 'boating', label: 'Boating', icon: Ship },
  { id: 'photography', label: 'Photography', icon: Camera },
  { id: 'travel', label: 'Travel', icon: Plane },
  { id: 'conservation', label: 'Conservation', icon: TreePine },
  { id: 'early_mornings', label: 'Early Mornings', icon: Sun },
  { id: 'seafood_cooking', label: 'Seafood Cooking', icon: Utensils },
  { id: 'hiking', label: 'Hiking', icon: Footprints },
];

export function StepInterests({
  selectedStyles,
  setSelectedStyles,
  selectedActivities,
  setSelectedActivities,
}: StepInterestsProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const toggleStyle = (id: string) => {
    if (selectedStyles.includes(id)) {
      setSelectedStyles(selectedStyles.filter((s) => s !== id));
    } else {
      setSelectedStyles([...selectedStyles, id]);
    }
  };

  const toggleActivity = (id: string) => {
    if (selectedActivities.includes(id)) {
      setSelectedActivities(selectedActivities.filter((a) => a !== id));
    } else {
      setSelectedActivities([...selectedActivities, id]);
    }
  };

  const filteredStyles = fishingStyles.filter((s) =>
    s.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredActivities = beyondWater.filter((a) =>
    a.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search for interests..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-12 pl-12 rounded-xl border-border bg-background"
        />
      </div>

      {/* Fishing Styles */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Fish className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Fishing Styles</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {filteredStyles.map((style) => {
            const Icon = style.icon;
            const isSelected = selectedStyles.includes(style.id);

            return (
              <button
                key={style.id}
                type="button"
                onClick={() => toggleStyle(style.id)}
                className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:border-primary/50 text-foreground'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-foreground flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 12 12">
                      <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                    </svg>
                  </div>
                )}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
                  isSelected ? 'bg-primary-foreground/20' : 'bg-muted'
                }`}>
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                </div>
                <span className="text-sm font-medium">{style.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Beyond the Water */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Mountain className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Beyond the Water</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {filteredActivities.map((activity) => {
            const Icon = activity.icon;
            const isSelected = selectedActivities.includes(activity.id);

            return (
              <button
                key={activity.id}
                type="button"
                onClick={() => toggleActivity(activity.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:border-primary/50 text-foreground'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                <span className="text-sm font-medium">{activity.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Select at least 3 interests to help us find your perfect catch or spot.
      </p>
    </div>
  );
}
