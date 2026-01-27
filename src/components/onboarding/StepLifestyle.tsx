import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Ruler, Briefcase, Wine, Cigarette, Star } from 'lucide-react';

interface StepLifestyleProps {
  bio: string;
  setBio: (value: string) => void;
  occupation: string;
  setOccupation: (value: string) => void;
  heightCm: number | null;
  setHeightCm: (value: number | null) => void;
  smoking: string;
  setSmoking: (value: string) => void;
  drinking: string;
  setDrinking: (value: string) => void;
  zodiacSign: string;
  setZodiacSign: (value: string) => void;
}

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

const SMOKING_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: 'socially', label: 'Socially' },
  { value: 'regularly', label: 'Regularly' },
];

const DRINKING_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: 'socially', label: 'Socially' },
  { value: 'regularly', label: 'Regularly' },
];

// Generate height options from 4'8" to 7'0"
const generateHeightOptions = () => {
  const options: { value: number; label: string }[] = [];
  for (let feet = 4; feet <= 7; feet++) {
    const maxInches = feet === 7 ? 0 : 11;
    const minInches = feet === 4 ? 8 : 0;
    for (let inches = minInches; inches <= maxInches; inches++) {
      const cm = Math.round((feet * 30.48) + (inches * 2.54));
      options.push({
        value: cm,
        label: `${feet}'${inches}" (${cm} cm)`,
      });
    }
  }
  return options;
};

const HEIGHT_OPTIONS = generateHeightOptions();

export function StepLifestyle({
  bio,
  setBio,
  occupation,
  setOccupation,
  heightCm,
  setHeightCm,
  smoking,
  setSmoking,
  drinking,
  setDrinking,
  zodiacSign,
  setZodiacSign,
}: StepLifestyleProps) {
  return (
    <div className="space-y-5">
      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="bio" className="text-sm font-medium">
          About You <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="bio"
          placeholder="Write a short bio about yourself..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="min-h-[100px] resize-none"
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground text-right">
          {bio.length}/500
        </p>
      </div>

      {/* Occupation */}
      <div className="space-y-2">
        <Label htmlFor="occupation" className="text-sm font-medium flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          Occupation <span className="text-destructive">*</span>
        </Label>
        <Input
          id="occupation"
          placeholder="e.g., Software Engineer, Teacher, Nurse..."
          value={occupation}
          onChange={(e) => setOccupation(e.target.value)}
          maxLength={100}
        />
      </div>

      {/* Height */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Ruler className="h-4 w-4" />
          Height <span className="text-destructive">*</span>
        </Label>
        <Select
          value={heightCm?.toString() || ''}
          onValueChange={(value) => setHeightCm(parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select your height" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {HEIGHT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Smoking */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Cigarette className="h-4 w-4" />
            Smoking <span className="text-destructive">*</span>
          </Label>
          <Select value={smoking} onValueChange={setSmoking}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {SMOKING_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Drinking */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Wine className="h-4 w-4" />
            Drinking <span className="text-destructive">*</span>
          </Label>
          <Select value={drinking} onValueChange={setDrinking}>
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {DRINKING_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Zodiac Sign */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Star className="h-4 w-4" />
          Zodiac Sign <span className="text-destructive">*</span>
        </Label>
        <Select value={zodiacSign} onValueChange={setZodiacSign}>
          <SelectTrigger>
            <SelectValue placeholder="Select your zodiac sign" />
          </SelectTrigger>
          <SelectContent>
            {ZODIAC_SIGNS.map((sign) => (
              <SelectItem key={sign} value={sign}>
                {sign}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
