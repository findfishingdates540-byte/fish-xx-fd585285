import { motion } from 'framer-motion';
import { Check, Anchor, Box, Radar, Ship, Footprints, Bug, Sparkles, Snowflake, Target, Wind, Waves } from 'lucide-react';
import { AnimatedInput } from '@/components/ui/animated-input';
import { useState } from 'react';

interface StepFishingGearProps {
  selectedGear: string[];
  setSelectedGear: (gear: string[]) => void;
}

const gearOptions = [
  { id: 'spinning_rod', label: 'Spinning Rod', icon: Target },
  { id: 'baitcasting_rod', label: 'Baitcasting Rod', icon: Target },
  { id: 'fly_rod', label: 'Fly Rod', icon: Wind },
  { id: 'trolling_setup', label: 'Trolling Setup', icon: Anchor },
  { id: 'ice_fishing_gear', label: 'Ice Fishing Gear', icon: Snowflake },
  { id: 'tackle_box', label: 'Tackle Box', icon: Box },
  { id: 'fish_finder', label: 'Fish Finder', icon: Radar },
  { id: 'kayak', label: 'Kayak', icon: Waves },
  { id: 'boat', label: 'Boat', icon: Ship },
  { id: 'waders', label: 'Waders', icon: Footprints },
  { id: 'live_bait', label: 'Live Bait', icon: Bug },
  { id: 'lures', label: 'Lures', icon: Sparkles },
];

export const StepFishingGear = ({ selectedGear, setSelectedGear }: StepFishingGearProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const toggleGear = (id: string) => {
    if (selectedGear.includes(id)) {
      setSelectedGear(selectedGear.filter(g => g !== id));
    } else {
      setSelectedGear([...selectedGear, id]);
    }
  };

  const filteredGear = gearOptions.filter(gear =>
    gear.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <AnimatedInput
        type="text"
        placeholder="Search gear..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-4"
      />

      <div className="flex items-center gap-2 mb-4">
        <Box className="h-5 w-5 text-primary" />
        <span className="text-sm text-muted-foreground">
          {selectedGear.length} gear item{selectedGear.length !== 1 ? 's' : ''} selected
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2">
        {filteredGear.map((gear, index) => {
          const isSelected = selectedGear.includes(gear.id);
          const Icon = gear.icon;
          
          return (
            <motion.button
              key={gear.id}
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => toggleGear(gear.id)}
              className={`
                relative p-4 rounded-xl border-2 transition-all duration-200
                flex flex-col items-center gap-2 text-center
                ${isSelected 
                  ? 'border-primary bg-primary/10 shadow-md' 
                  : 'border-border hover:border-primary/50 hover:bg-accent/50'
                }
              `}
            >
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2"
                >
                  <Check className="h-4 w-4 text-primary" />
                </motion.div>
              )}
              
              <Icon className={`h-8 w-8 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                {gear.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {selectedGear.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-primary"
        >
          <Check className="h-4 w-4" />
          <span>Great selection!</span>
        </motion.div>
      )}
    </motion.div>
  );
};
