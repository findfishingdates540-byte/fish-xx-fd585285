import { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, Fish } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface FishSpecies {
  id: string;
  name: string;
  scientific_name: string | null;
  image_url: string | null;
}

interface SpeciesComboboxProps {
  species: FishSpecies[];
  value: string;
  onSelect: (speciesId: string | null, speciesName: string) => void;
}

export function SpeciesCombobox({ species, value, onSelect }: SpeciesComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const filteredSpecies = species.filter((s) =>
    s.name.toLowerCase().includes(inputValue.toLowerCase()) ||
    s.scientific_name?.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleSelect = (selectedName: string) => {
    const selectedSpecies = species.find(s => s.name === selectedName);
    if (selectedSpecies) {
      onSelect(selectedSpecies.id, selectedSpecies.name);
      setInputValue(selectedSpecies.name);
    }
    setOpen(false);
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    // Check if the input exactly matches a species name
    const matchingSpecies = species.find(s => s.name.toLowerCase() === newValue.toLowerCase());
    if (matchingSpecies) {
      onSelect(matchingSpecies.id, matchingSpecies.name);
    } else {
      // Custom species name
      onSelect(null, newValue);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="flex items-center gap-2 truncate">
            <Fish className="h-4 w-4 shrink-0 text-muted-foreground" />
            {inputValue || 'Search or type species...'}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            ref={inputRef}
            placeholder="Search or type species name..."
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            {filteredSpecies.length === 0 && inputValue && (
              <div className="py-3 px-4 text-sm">
                <p className="text-muted-foreground mb-2">No species found</p>
                <button
                  type="button"
                  className="flex items-center gap-2 text-primary hover:underline"
                  onClick={() => {
                    onSelect(null, inputValue);
                    setOpen(false);
                  }}
                >
                  <Fish className="h-4 w-4" />
                  Use "{inputValue}" as custom species
                </button>
              </div>
            )}
            {filteredSpecies.length === 0 && !inputValue && (
              <CommandEmpty>Start typing to search species...</CommandEmpty>
            )}
            <CommandGroup>
              {filteredSpecies.map((s) => (
                <CommandItem
                  key={s.id}
                  value={s.name}
                  onSelect={handleSelect}
                  className="flex items-center gap-2"
                >
                  <Check
                    className={cn(
                      'h-4 w-4',
                      value === s.name ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span>{s.name}</span>
                  {s.scientific_name && (
                    <span className="text-xs text-muted-foreground italic ml-1">
                      ({s.scientific_name})
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
