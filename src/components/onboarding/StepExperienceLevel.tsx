import { motion } from "framer-motion";
import { SelectableCard } from "@/components/ui/selectable-card";
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
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {experienceLevels.map((level, index) => {
        const Icon = level.icon;
        const isSelected = experience === level.value;

        return (
          <motion.div
            key={level.value}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <SelectableCard
              selected={isSelected}
              onClick={() => setExperience(level.value)}
              className="p-6"
            >
              {/* Icon */}
              <motion.div 
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  isSelected ? 'bg-primary/20' : 'bg-muted'
                }`}
                animate={{
                  scale: isSelected ? [1, 1.1, 1] : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                <Icon className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
              </motion.div>

              {/* Content */}
              <h3 className="font-semibold text-foreground mb-2 pr-8">{level.label}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {level.description}
              </p>
            </SelectableCard>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
