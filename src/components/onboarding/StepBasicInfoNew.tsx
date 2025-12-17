import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Calendar } from "lucide-react";

type Gender = 'male' | 'female' | 'non_binary' | 'other' | 'prefer_not_to_say';

interface StepBasicInfoNewProps {
  firstName: string;
  setFirstName: (value: string) => void;
  dateOfBirth: string;
  setDateOfBirth: (value: string) => void;
  gender: Gender | null;
  setGender: (value: Gender) => void;
  showGender?: boolean;
}

const genderOptions: { value: Gender; label: string; icon: string }[] = [
  { value: 'male', label: 'Male', icon: '♂' },
  { value: 'female', label: 'Female', icon: '♀' },
  { value: 'other', label: 'Other', icon: '⚥' },
];

export function StepBasicInfoNew({
  firstName,
  setFirstName,
  dateOfBirth,
  setDateOfBirth,
  gender,
  setGender,
  showGender = true,
}: StepBasicInfoNewProps) {
  const today = new Date();
  const minAge = 18;
  const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate())
    .toISOString()
    .split('T')[0];

  return (
    <div className="space-y-6">
      {/* First Name */}
      <div className="space-y-2">
        <Label htmlFor="firstName" className="text-sm font-medium text-foreground">
          First Name
        </Label>
        <div className="relative">
          <Input
            id="firstName"
            type="text"
            placeholder="e.g. River"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="h-12 pl-4 pr-12 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground"
          />
          <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
        </div>
      </div>

      {/* Date of Birth */}
      <div className="space-y-2">
        <Label htmlFor="dob" className="text-sm font-medium text-foreground">
          Date of Birth
        </Label>
        <div className="relative">
          <Input
            id="dob"
            type="date"
            max={maxDate}
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="h-12 pl-4 pr-12 rounded-xl border-border bg-background text-foreground"
          />
        </div>
        <p className="text-xs text-primary">
          You must be at least 18 years old to use FindFish Date.
        </p>
      </div>

      {/* Gender Selection */}
      {showGender && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">
            I identify as...
          </Label>
          <div className="grid grid-cols-3 gap-3">
            {genderOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setGender(option.value)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
                  gender === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="text-2xl text-primary mb-1">{option.icon}</span>
                <span className="text-sm font-medium text-foreground">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
