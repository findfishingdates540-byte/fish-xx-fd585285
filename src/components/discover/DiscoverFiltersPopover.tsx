import { useState } from 'react';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface DiscoverFilters {
  minAge: number;
  maxAge: number;
  maxDistance: number;
}

interface DiscoverFiltersPopoverProps {
  filters: DiscoverFilters;
  onFiltersChange: (filters: DiscoverFilters) => void;
  defaultFilters: DiscoverFilters;
}

export function DiscoverFiltersPopover({
  filters,
  onFiltersChange,
  defaultFilters,
}: DiscoverFiltersPopoverProps) {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleReset = () => {
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const hasChanges = 
    localFilters.minAge !== defaultFilters.minAge ||
    localFilters.maxAge !== defaultFilters.maxAge ||
    localFilters.maxDistance !== defaultFilters.maxDistance;

  const isFiltered = 
    filters.minAge !== defaultFilters.minAge ||
    filters.maxAge !== defaultFilters.maxAge ||
    filters.maxDistance !== defaultFilters.maxDistance;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2 text-muted-foreground hover:text-foreground relative"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {isFiltered && (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 bg-background border border-border shadow-lg z-50" 
        align="start"
        sideOffset={8}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground">Filters</h4>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleReset}
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>

          {/* Age Range */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Age Range</Label>
              <span className="text-sm text-muted-foreground">
                {localFilters.minAge} - {localFilters.maxAge}
              </span>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Min: {localFilters.minAge}</span>
                </div>
                <Slider
                  value={[localFilters.minAge]}
                  onValueChange={([value]) => 
                    setLocalFilters(prev => ({ 
                      ...prev, 
                      minAge: Math.min(value, prev.maxAge - 1) 
                    }))
                  }
                  min={18}
                  max={65}
                  step={1}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Max: {localFilters.maxAge}</span>
                </div>
                <Slider
                  value={[localFilters.maxAge]}
                  onValueChange={([value]) => 
                    setLocalFilters(prev => ({ 
                      ...prev, 
                      maxAge: Math.max(value, prev.minAge + 1) 
                    }))
                  }
                  min={18}
                  max={65}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Distance */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Maximum Distance</Label>
              <span className="text-sm text-muted-foreground">
                {localFilters.maxDistance >= 500 ? 'Unlimited' : `${localFilters.maxDistance} mi`}
              </span>
            </div>
            <Slider
              value={[localFilters.maxDistance]}
              onValueChange={([value]) => 
                setLocalFilters(prev => ({ ...prev, maxDistance: value }))
              }
              min={5}
              max={500}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5 mi</span>
              <span>Unlimited</span>
            </div>
          </div>

          {/* Apply Button */}
          <Button 
            onClick={handleApply} 
            className="w-full"
            disabled={!hasChanges && !isFiltered}
          >
            Apply Filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
