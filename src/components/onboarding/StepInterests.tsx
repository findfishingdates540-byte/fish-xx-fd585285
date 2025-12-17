import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedInput } from "@/components/ui/animated-input";
import { SelectableChip } from "@/components/ui/selectable-card";
import { Search, Fish, Sailboat, Anchor, Snowflake, UtensilsCrossed, Tent, Ship, Camera, Plane, TreePine, Sun, Mountain, Utensils, Footprints } from "lucide-react";

interface StepInterestsProps {
  selectedStyles: string[];
  setSelectedStyles: (styles: string[]) => void;
  selectedActivities: string[];
  setSelectedActivities: (activities: string[]) => void;
}

const fishingStyles = [
  { id: 'fly_fishing', label: 'Fly Fishing', icon: Fish },
  { id: 'deep_sea', label: 'Deep Sea', icon: Sailboat },
  { id: 'kayak_fishing', label: 'Kayak Fishing', icon: Anchor },
  { id: 'catch_and_cook', label: 'Catch & Cook', icon: UtensilsCrossed },
  { id: 'ice_fishing', label: 'Ice Fishing', icon: Snowflake },
  { id: 'bass_fishing', label: 'Bass Fishing', icon: Fish },
];

const beyondWater = [
  { id: 'camping', label: 'Camping', icon: Tent },
  { id: 'boating', label: 'Boating', icon: Ship },
  { id: 'photography', label: 'Photography', icon: Camera },
  { id: 'travel', label: 'Travel', icon: Plane },
  { id: 'conservation', label: 'Conservation', icon: TreePine },
  { id: 'early_mornings', label: 'Early Mornings', icon: Sun },
  { id: 'seafood_cooking', label: 'Seafood Cooking', icon: Utensils },
  { id: 'hiking', label: 'Hiking', icon: Footprints },
];

export function StepInterests({
  selectedStyles,
  setSelectedStyles,
  selectedActivities,
  setSelectedActivities,
}: StepInterestsProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const toggleStyle = (id: string) => {
    if (selectedStyles.includes(id)) {
      setSelectedStyles(selectedStyles.filter((s) => s !== id));
    } else {
      setSelectedStyles([...selectedStyles, id]);
    }
  };

  const toggleActivity = (id: string) => {
    if (selectedActivities.includes(id)) {
      setSelectedActivities(selectedActivities.filter((a) => a !== id));
    } else {
      setSelectedActivities([...selectedActivities, id]);
    }
  };

  const filteredStyles = fishingStyles.filter((s) =>
    s.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredActivities = beyondWater.filter((a) =>
    a.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSelected = selectedStyles.length + selectedActivities.length;

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <AnimatedInput
          type="text"
          placeholder="Search for interests..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Search className="w-5 h-5" />}
        />
      </motion.div>

      {/* Fishing Styles */}
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2">
          <Fish className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Fishing Styles</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <AnimatePresence>
            {filteredStyles.map((style, index) => {
              const Icon = style.icon;
              const isSelected = selectedStyles.includes(style.id);

              return (
                <motion.button
                  key={style.id}
                  type="button"
                  onClick={() => toggleStyle(style.id)}
                  className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background hover:border-primary/50 text-foreground'
                  }`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div 
                        className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-foreground flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 12 12">
                          <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                        </svg>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
                    isSelected ? 'bg-primary-foreground/20' : 'bg-muted'
                  }`}>
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                  </div>
                  <span className="text-sm font-medium">{style.label}</span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Beyond the Water */}
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2">
          <Mountain className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Beyond the Water</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <AnimatePresence>
            {filteredActivities.map((activity, index) => {
              const Icon = activity.icon;
              const isSelected = selectedActivities.includes(activity.id);

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <SelectableChip
                    selected={isSelected}
                    onClick={() => toggleActivity(activity.id)}
                    icon={<Icon className="w-4 h-4" />}
                  >
                    {activity.label}
                  </SelectableChip>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Selection Counter */}
      <motion.p 
        className={`text-sm text-center ${
          totalSelected >= 3 ? 'text-green-600' : 'text-muted-foreground'
        }`}
        animate={{
          scale: totalSelected >= 3 ? [1, 1.05, 1] : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        {totalSelected >= 3 ? (
          <span className="flex items-center justify-center gap-2">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"
            >
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
              </svg>
            </motion.span>
            Great! You've selected {totalSelected} interests.
          </span>
        ) : (
          `Select at least 3 interests (${totalSelected}/3)`
        )}
      </motion.p>
    </motion.div>
  );
}
