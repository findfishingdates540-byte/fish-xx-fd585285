import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedInput } from "@/components/ui/animated-input";
import { Search, Fish, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FishSpecies {
  id: string;
  name: string;
  scientific_name: string | null;
  image_url: string | null;
}

interface StepTargetSpeciesProps {
  selectedSpecies: string[];
  setSelectedSpecies: (species: string[]) => void;
}

export function StepTargetSpecies({
  selectedSpecies,
  setSelectedSpecies,
}: StepTargetSpeciesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [species, setSpecies] = useState<FishSpecies[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpecies = async () => {
      const { data, error } = await supabase
        .from('fish_species')
        .select('id, name, scientific_name, image_url')
        .order('name');
      
      if (!error && data) {
        setSpecies(data);
      }
      setLoading(false);
    };

    fetchSpecies();
  }, []);

  const toggleSpecies = (name: string) => {
    if (selectedSpecies.includes(name)) {
      setSelectedSpecies(selectedSpecies.filter((s) => s !== name));
    } else {
      setSelectedSpecies([...selectedSpecies, name]);
    }
  };

  const filteredSpecies = species.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.scientific_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div 
      className="space-y-6"
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
          placeholder="Search for fish species..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Search className="w-5 h-5" />}
        />
      </motion.div>

      {/* Species Header */}
      <div className="flex items-center gap-2">
        <Fish className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Target Species</h3>
        <span className="text-sm text-muted-foreground ml-auto">
          {selectedSpecies.length} selected
        </span>
      </div>

      {/* Species Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto pr-2">
          <AnimatePresence>
            {filteredSpecies.map((fish, index) => {
              const isSelected = selectedSpecies.includes(fish.name);

              return (
                <motion.button
                  key={fish.id}
                  type="button"
                  onClick={() => toggleSpecies(fish.name)}
                  className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground shadow-lg'
                      : 'border-border bg-background hover:border-primary/50 text-foreground hover:shadow-md'
                  }`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.02 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Selected Checkmark */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div 
                        className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-foreground flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Check className="w-3 h-3 text-primary" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Fish Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
                    isSelected ? 'bg-primary-foreground/20' : 'bg-muted'
                  }`}>
                    <Fish className={`w-5 h-5 ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                  </div>
                  
                  {/* Species Name */}
                  <span className="text-sm font-medium text-center leading-tight">
                    {fish.name}
                  </span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Selection Counter */}
      <motion.p 
        className={`text-sm text-center ${
          selectedSpecies.length >= 1 ? 'text-green-600' : 'text-muted-foreground'
        }`}
        animate={{
          scale: selectedSpecies.length >= 1 ? [1, 1.05, 1] : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        {selectedSpecies.length >= 1 ? (
          <span className="flex items-center justify-center gap-2">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"
            >
              <Check className="w-3 h-3 text-white" />
            </motion.span>
            Great! You've selected {selectedSpecies.length} species.
          </span>
        ) : (
          'Select the species you like to target'
        )}
      </motion.p>
    </motion.div>
  );
}
