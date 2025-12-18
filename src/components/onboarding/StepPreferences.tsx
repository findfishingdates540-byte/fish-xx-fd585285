import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

type Gender = 'male' | 'female';

interface StepPreferencesProps {
  interestedIn: Gender[];
  setInterestedIn: (value: Gender[]) => void;
  ageRange: [number, number];
  setAgeRange: (value: [number, number]) => void;
  maxDistance: number;
  setMaxDistance: (value: number) => void;
  showGenderPreference?: boolean;
  showAgeRange?: boolean;
}

const genderOptions: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Men' },
  { value: 'female', label: 'Women' },
];

export function StepPreferences({
  interestedIn,
  setInterestedIn,
  ageRange,
  setAgeRange,
  maxDistance,
  setMaxDistance,
  showGenderPreference = true,
  showAgeRange = true,
}: StepPreferencesProps) {
  const toggleGenderPreference = (value: Gender) => {
    if (interestedIn.includes(value)) {
      setInterestedIn(interestedIn.filter((v) => v !== value));
    } else {
      setInterestedIn([...interestedIn, value]);
    }
  };

  return (
    <div className="space-y-8">
      {showGenderPreference && (
        <div className="space-y-3">
          <Label className="text-foreground font-medium">Show me...</Label>
          <div className="flex flex-wrap gap-2">
            {genderOptions.map((option) => {
              const isSelected = interestedIn.includes(option.value);
              
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleGenderPreference(option.value)}
                  className={cn(
                    "px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200",
                    isSelected
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background text-foreground border-border hover:border-foreground"
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showAgeRange && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-foreground font-medium">Age Range</Label>
            <span className="text-sm font-medium text-foreground">
              {ageRange[0]} - {ageRange[1]}
            </span>
          </div>
          <Slider
            value={ageRange}
            onValueChange={(value) => setAgeRange(value as [number, number])}
            min={18}
            max={99}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>18</span>
            <span>99+</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-foreground font-medium">Maximum Distance</Label>
          <span className="text-sm font-medium text-foreground">
            {maxDistance} km
          </span>
        </div>
        <Slider
          value={[maxDistance]}
          onValueChange={(value) => setMaxDistance(value[0])}
          min={5}
          max={200}
          step={5}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>5 km</span>
          <span>200 km</span>
        </div>
      </div>
    </div>
  );
}
