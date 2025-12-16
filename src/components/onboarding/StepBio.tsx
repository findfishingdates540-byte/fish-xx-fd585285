import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type LookingFor = 'relationship' | 'casual' | 'friends' | 'fishing_buddy';

interface StepBioProps {
  bio: string;
  setBio: (value: string) => void;
  lookingFor: LookingFor[];
  setLookingFor: (value: LookingFor[]) => void;
  showLookingFor?: boolean;
  lookingForOptions?: { value: LookingFor; label: string; description: string }[];
}

const defaultLookingForOptions: { value: LookingFor; label: string; description: string }[] = [
  { value: 'relationship', label: 'Relationship', description: 'Looking for something serious' },
  { value: 'casual', label: 'Casual', description: 'Keep it light and fun' },
  { value: 'friends', label: 'Friends', description: 'Just looking for friends' },
];

const fishingLookingForOptions: { value: LookingFor; label: string; description: string }[] = [
  { value: 'fishing_buddy', label: 'Fishing Buddy', description: 'Someone to fish with' },
  { value: 'friends', label: 'Friends', description: 'Casual fishing friends' },
];

export function StepBio({
  bio,
  setBio,
  lookingFor,
  setLookingFor,
  showLookingFor = true,
  lookingForOptions = defaultLookingForOptions,
}: StepBioProps) {
  const maxBioLength = 500;

  const toggleLookingFor = (value: LookingFor) => {
    if (lookingFor.includes(value)) {
      setLookingFor(lookingFor.filter((v) => v !== value));
    } else {
      setLookingFor([...lookingFor, value]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="bio" className="text-foreground font-medium">
          About You
        </Label>
        <Textarea
          id="bio"
          placeholder="Tell others about yourself..."
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, maxBioLength))}
          className="bg-background border-border min-h-[120px] resize-none"
        />
        <div className="flex justify-between">
          <p className="text-xs text-muted-foreground">
            Share your interests, hobbies, or what makes you unique
          </p>
          <p className={cn(
            "text-xs",
            bio.length >= maxBioLength ? "text-destructive" : "text-muted-foreground"
          )}>
            {bio.length}/{maxBioLength}
          </p>
        </div>
      </div>

      {showLookingFor && (
        <div className="space-y-3">
          <Label className="text-foreground font-medium">What are you looking for?</Label>
          <p className="text-xs text-muted-foreground">Select all that apply</p>
          <div className="space-y-2">
            {lookingForOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleLookingFor(option.value)}
                className={cn(
                  "w-full p-4 rounded-lg border text-left transition-all duration-200",
                  lookingFor.includes(option.value)
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-foreground border-border hover:border-foreground"
                )}
              >
                <div className="font-medium">{option.label}</div>
                <div className={cn(
                  "text-sm",
                  lookingFor.includes(option.value) ? "text-background/70" : "text-muted-foreground"
                )}>
                  {option.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { fishingLookingForOptions };
