import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const INTEREST_OPTIONS = [
  // Outdoor & Adventure
  "Hiking", "Camping", "Kayaking", "Surfing", "Rock Climbing", "Skiing",
  // Fishing specific
  "Bass Fishing", "Fly Fishing", "Deep Sea", "Ice Fishing", "Catch & Release",
  // Sports
  "Golf", "Tennis", "Running", "Yoga", "Gym", "Swimming",
  // Social
  "Travel", "Cooking", "Photography", "Music", "Movies", "Gaming",
  // Lifestyle
  "Wine Tasting", "Craft Beer", "Coffee", "Reading", "Art", "Dancing",
  // Nature
  "Birdwatching", "Gardening", "Beach", "Mountains", "Wildlife",
];

interface InterestSelectorProps {
  selected: string[];
  onChange: (interests: string[]) => void;
  maxSelections?: number;
}

export function InterestSelector({ 
  selected, 
  onChange, 
  maxSelections = 10 
}: InterestSelectorProps) {
  const toggleInterest = (interest: string) => {
    if (selected.includes(interest)) {
      onChange(selected.filter((i) => i !== interest));
    } else if (selected.length < maxSelections) {
      onChange([...selected, interest]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {INTEREST_OPTIONS.map((interest) => {
          const isSelected = selected.includes(interest);
          return (
            <Badge
              key={interest}
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-colors py-1.5 px-3",
                isSelected 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                  : "hover:bg-muted"
              )}
              onClick={() => toggleInterest(interest)}
            >
              {interest}
            </Badge>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {selected.length}/{maxSelections} selected
      </p>
    </div>
  );
}

interface InterestDisplayProps {
  interests: string[];
  className?: string;
}

export function InterestDisplay({ interests, className }: InterestDisplayProps) {
  if (!interests || interests.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {interests.map((interest) => (
        <Badge key={interest} variant="secondary" className="py-1.5 px-3">
          {interest}
        </Badge>
      ))}
    </div>
  );
}
