import { Fish, Anchor, Sailboat, Trophy } from "lucide-react";

type FishingExperience = 'beginner' | 'intermediate' | 'advanced' | 'expert';

interface StepExperienceLevelProps {
  experience: FishingExperience;
  setExperience: (value: FishingExperience) => void;
}

const experienceLevels: {
  value: FishingExperience;
  label: string;
  icon: typeof Fish;
  description: string;
}[] = [
  {
    value: 'beginner',
    label: 'Beginner',
    icon: Fish,
    description: "I'm just getting started or fish occasionally. I might need to borrow some gear.",
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    icon: Anchor,
    description: 'I know the basics, have my own gear, and can tie my own knots.',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    icon: Sailboat,
    description: 'I fish regularly, target specific species, and master various techniques.',
  },
  {
    value: 'expert',
    label: 'Expert',
    icon: Trophy,
    description: "I'm a pro, guide, or tournament angler. I live and breathe fishing.",
  },
];

export function StepExperienceLevel({ experience, setExperience }: StepExperienceLevelProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {experienceLevels.map((level) => {
        const Icon = level.icon;
        const isSelected = experience === level.value;

        return (
          <button
            key={level.value}
            type="button"
            onClick={() => setExperience(level.value)}
            className={`relative p-6 rounded-2xl border-2 text-left transition-all duration-200 ${
              isSelected
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 bg-background'
            }`}
          >
            {/* Selection indicator */}
            <div
              className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                isSelected
                  ? 'border-primary bg-primary'
                  : 'border-border bg-background'
              }`}
            >
              {isSelected && (
                <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 12 12">
                  <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                </svg>
              )}
            </div>

            {/* Icon */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
              isSelected ? 'bg-primary/20' : 'bg-muted'
            }`}>
              <Icon className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>

            {/* Content */}
            <h3 className="font-semibold text-foreground mb-2">{level.label}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {level.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
