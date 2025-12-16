import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FishingExperience = 'beginner' | 'intermediate' | 'advanced' | 'expert';

interface StepFishingProfileProps {
  experience: FishingExperience;
  setExperience: (value: FishingExperience) => void;
  preferredSpecies: string[];
  setPreferredSpecies: (value: string[]) => void;
  fishingGear: string[];
  setFishingGear: (value: string[]) => void;
}

const experienceOptions: { value: FishingExperience; label: string; description: string }[] = [
  { value: 'beginner', label: 'Beginner', description: 'Just getting started' },
  { value: 'intermediate', label: 'Intermediate', description: 'I know the basics' },
  { value: 'advanced', label: 'Advanced', description: 'Years of experience' },
  { value: 'expert', label: 'Expert', description: 'Fishing is my life' },
];

const speciesOptions = [
  'Bass', 'Trout', 'Salmon', 'Catfish', 'Pike', 'Carp', 
  'Walleye', 'Perch', 'Bluegill', 'Crappie', 'Muskie', 'Other'
];

const gearOptions = [
  'Spinning Rod', 'Baitcasting Rod', 'Fly Rod', 'Ice Fishing',
  'Trolling Setup', 'Kayak/Canoe', 'Boat', 'Shore Fishing'
];

export function StepFishingProfile({
  experience,
  setExperience,
  preferredSpecies,
  setPreferredSpecies,
  fishingGear,
  setFishingGear,
}: StepFishingProfileProps) {
  const toggleSpecies = (species: string) => {
    if (preferredSpecies.includes(species)) {
      setPreferredSpecies(preferredSpecies.filter((s) => s !== species));
    } else {
      setPreferredSpecies([...preferredSpecies, species]);
    }
  };

  const toggleGear = (gear: string) => {
    if (fishingGear.includes(gear)) {
      setFishingGear(fishingGear.filter((g) => g !== gear));
    } else {
      setFishingGear([...fishingGear, gear]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-foreground font-medium">Fishing Experience</Label>
        <div className="grid grid-cols-2 gap-2">
          {experienceOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setExperience(option.value)}
              className={cn(
                "p-3 rounded-lg border text-left transition-all duration-200",
                experience === option.value
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-foreground border-border hover:border-foreground"
              )}
            >
              <div className="font-medium text-sm">{option.label}</div>
              <div className={cn(
                "text-xs",
                experience === option.value ? "text-background/70" : "text-muted-foreground"
              )}>
                {option.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-foreground font-medium">Preferred Species</Label>
        <p className="text-xs text-muted-foreground">Select all that you enjoy fishing for</p>
        <div className="flex flex-wrap gap-2">
          {speciesOptions.map((species) => (
            <button
              key={species}
              type="button"
              onClick={() => toggleSpecies(species)}
              className={cn(
                "px-3 py-1.5 rounded-full border text-sm transition-all duration-200",
                preferredSpecies.includes(species)
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-foreground border-border hover:border-foreground"
              )}
            >
              {species}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-foreground font-medium">Fishing Gear</Label>
        <p className="text-xs text-muted-foreground">What equipment do you use?</p>
        <div className="flex flex-wrap gap-2">
          {gearOptions.map((gear) => (
            <button
              key={gear}
              type="button"
              onClick={() => toggleGear(gear)}
              className={cn(
                "px-3 py-1.5 rounded-full border text-sm transition-all duration-200",
                fishingGear.includes(gear)
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-foreground border-border hover:border-foreground"
              )}
            >
              {gear}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
