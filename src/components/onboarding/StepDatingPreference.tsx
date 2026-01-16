import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { SelectableCard } from "@/components/ui/selectable-card";
import { Heart, Users, Sparkles, UserPlus } from "lucide-react";

type Gender = 'male' | 'female';
type LookingFor = 'relationship' | 'casual' | 'friends' | 'fishing_buddy';
type AccountMode = 'dating' | 'fishing' | 'both';

interface StepDatingPreferenceProps {
  interestedIn: Gender[];
  setInterestedIn: (value: Gender[]) => void;
  lookingFor: LookingFor[];
  setLookingFor: (value: LookingFor[]) => void;
  ageRange: [number, number];
  setAgeRange: (value: [number, number]) => void;
  maxDistance: number;
  setMaxDistance: (value: number) => void;
  accountMode: AccountMode;
}

const genderOptions: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Men' },
  { value: 'female', label: 'Women' },
];

const allLookingForOptions: { value: LookingFor; label: string; icon: typeof Heart }[] = [
  { value: 'relationship', label: 'Relationship', icon: Heart },
  { value: 'casual', label: 'Something Casual', icon: Sparkles },
  { value: 'friends', label: 'Friends', icon: Users },
  { value: 'fishing_buddy', label: 'Fishing Buddy', icon: UserPlus },
];

export function StepDatingPreference({
  interestedIn,
  setInterestedIn,
  lookingFor,
  setLookingFor,
  ageRange,
  setAgeRange,
  maxDistance,
  setMaxDistance,
  accountMode,
}: StepDatingPreferenceProps) {
  // Filter out 'fishing_buddy' for dating-only mode
  const lookingForOptions = accountMode === 'dating'
    ? allLookingForOptions.filter(opt => opt.value !== 'fishing_buddy')
    : allLookingForOptions;

  const selectGenderPreference = (value: Gender) => {
    // Single selection only - replace the current selection
    setInterestedIn([value]);
  };

  const toggleLookingFor = (value: LookingFor) => {
    if (lookingFor.includes(value)) {
      setLookingFor(lookingFor.filter((l) => l !== value));
    } else {
      setLookingFor([...lookingFor, value]);
    }
  };

  return (
    <div className="space-y-8">
      {/* Gender Preference */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-foreground">
          Who are you interested in?
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {genderOptions.map((option) => {
            const isSelected = interestedIn.includes(option.value);

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => selectGenderPreference(option.value)}
                className={`py-3 px-4 rounded-xl border-2 font-medium transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:border-primary/50 text-foreground'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Looking For */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-foreground">
          What are you looking for?
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {lookingForOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = lookingFor.includes(option.value);

            return (
              <SelectableCard
                key={option.value}
                selected={isSelected}
                onClick={() => toggleLookingFor(option.value)}
                className="flex items-center gap-3 p-4"
              >
                <div 
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-primary/20' : 'bg-muted'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <span className={`font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                  {option.label}
                </span>
              </SelectableCard>
            );
          })}
        </div>
      </div>

      {/* Age Range */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-medium text-foreground">Age Range</Label>
          <span className="text-sm font-medium text-primary">
            {ageRange[0]} - {ageRange[1]} years
          </span>
        </div>
        <div className="px-2">
          <Slider
            value={ageRange}
            onValueChange={(value) => setAgeRange(value as [number, number])}
            min={18}
            max={80}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      {/* Distance */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-medium text-foreground">Maximum Distance</Label>
          <span className="text-sm font-medium text-primary">
            {maxDistance >= 500 ? 'Unlimited' : `${maxDistance} miles`}
          </span>
        </div>
        <div className="px-2">
          <Slider
            value={[maxDistance]}
            onValueChange={(value) => setMaxDistance(value[0])}
            min={5}
            max={500}
            step={5}
            className="w-full"
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>5 miles</span>
          <span>Unlimited</span>
        </div>
      </div>
    </div>
  );
}