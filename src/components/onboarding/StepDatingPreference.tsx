import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { SelectableCard, SelectableChip } from "@/components/ui/selectable-card";
import { Heart, Users, Sparkles, UserPlus } from "lucide-react";

type Gender = 'male' | 'female' | 'non_binary' | 'other' | 'prefer_not_to_say';
type LookingFor = 'relationship' | 'casual' | 'friends' | 'fishing_buddy';

interface StepDatingPreferenceProps {
  interestedIn: Gender[];
  setInterestedIn: (value: Gender[]) => void;
  lookingFor: LookingFor[];
  setLookingFor: (value: LookingFor[]) => void;
  ageRange: [number, number];
  setAgeRange: (value: [number, number]) => void;
  maxDistance: number;
  setMaxDistance: (value: number) => void;
}

const genderOptions: { value: Gender | 'everyone'; label: string }[] = [
  { value: 'male', label: 'Men' },
  { value: 'female', label: 'Women' },
  { value: 'everyone', label: 'Everyone' },
];

const lookingForOptions: { value: LookingFor; label: string; icon: typeof Heart }[] = [
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
}: StepDatingPreferenceProps) {
  const toggleGenderPreference = (value: Gender | 'everyone') => {
    if (value === 'everyone') {
      setInterestedIn(['male', 'female', 'non_binary', 'other']);
    } else {
      if (interestedIn.includes(value)) {
        setInterestedIn(interestedIn.filter((g) => g !== value));
      } else {
        setInterestedIn([...interestedIn, value]);
      }
    }
  };

  const toggleLookingFor = (value: LookingFor) => {
    if (lookingFor.includes(value)) {
      setLookingFor(lookingFor.filter((l) => l !== value));
    } else {
      setLookingFor([...lookingFor, value]);
    }
  };

  const isEveryoneSelected = 
    interestedIn.includes('male') && 
    interestedIn.includes('female') && 
    interestedIn.includes('non_binary');

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Gender Preference */}
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Label className="text-sm font-medium text-foreground">
          Who are you interested in?
        </Label>
        <div className="grid grid-cols-3 gap-3">
          {genderOptions.map((option, index) => {
            const isSelected = option.value === 'everyone' 
              ? isEveryoneSelected 
              : interestedIn.includes(option.value as Gender);

            return (
              <motion.button
                key={option.value}
                type="button"
                onClick={() => toggleGenderPreference(option.value)}
                className={`py-3 px-4 rounded-xl border-2 font-medium transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:border-primary/50 text-foreground'
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {option.label}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Looking For */}
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Label className="text-sm font-medium text-foreground">
          What are you looking for?
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {lookingForOptions.map((option, index) => {
            const Icon = option.icon;
            const isSelected = lookingFor.includes(option.value);

            return (
              <motion.div
                key={option.value}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <SelectableCard
                  selected={isSelected}
                  onClick={() => toggleLookingFor(option.value)}
                  className="flex items-center gap-3 p-4"
                >
                  <motion.div 
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-primary/20' : 'bg-muted'
                    }`}
                    animate={{
                      scale: isSelected ? [1, 1.1, 1] : 1,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  </motion.div>
                  <span className={`font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {option.label}
                  </span>
                </SelectableCard>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Age Range */}
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex justify-between items-center">
          <Label className="text-sm font-medium text-foreground">Age Range</Label>
          <motion.span 
            className="text-sm font-medium text-primary"
            key={`${ageRange[0]}-${ageRange[1]}`}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
          >
            {ageRange[0]} - {ageRange[1]} years
          </motion.span>
        </div>
        <Slider
          value={ageRange}
          onValueChange={(value) => setAgeRange(value as [number, number])}
          min={18}
          max={80}
          step={1}
          className="w-full"
        />
      </motion.div>

      {/* Distance */}
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex justify-between items-center">
          <Label className="text-sm font-medium text-foreground">Maximum Distance</Label>
          <motion.span 
            className="text-sm font-medium text-primary"
            key={maxDistance}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
          >
            {maxDistance} km
          </motion.span>
        </div>
        <Slider
          value={[maxDistance]}
          onValueChange={(value) => setMaxDistance(value[0])}
          min={5}
          max={200}
          step={5}
          className="w-full"
        />
      </motion.div>
    </motion.div>
  );
}
