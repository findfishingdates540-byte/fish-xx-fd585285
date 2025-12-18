import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Gender = 'male' | 'female';

interface StepBasicInfoProps {
  dateOfBirth: string;
  setDateOfBirth: (value: string) => void;
  gender: Gender | null;
  setGender: (value: Gender) => void;
  locationName: string;
  setLocationName: (value: string) => void;
  showGender?: boolean;
  showLocation?: boolean;
}

const genderOptions: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Man' },
  { value: 'female', label: 'Woman' },
];

export function StepBasicInfo({
  dateOfBirth,
  setDateOfBirth,
  gender,
  setGender,
  locationName,
  setLocationName,
  showGender = true,
  showLocation = false,
}: StepBasicInfoProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="dob" className="text-foreground font-medium">
          Date of Birth
        </Label>
        <Input
          id="dob"
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          className="bg-background border-border"
          max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
        />
        <p className="text-xs text-muted-foreground">You must be 18 or older to use this app</p>
      </div>

      {showGender && (
        <div className="space-y-3">
          <Label className="text-foreground font-medium">I am a...</Label>
          <div className="flex flex-wrap gap-2">
            {genderOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setGender(option.value)}
                className={cn(
                  "px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200",
                  gender === option.value
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-foreground border-border hover:border-foreground"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {showLocation && (
        <div className="space-y-2">
          <Label htmlFor="location" className="text-foreground font-medium">
            Location
          </Label>
          <Input
            id="location"
            type="text"
            placeholder="City, Country"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            className="bg-background border-border"
          />
          <p className="text-xs text-muted-foreground">Help others find you nearby</p>
        </div>
      )}
    </div>
  );
}
