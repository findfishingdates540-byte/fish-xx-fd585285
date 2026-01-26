import { useState, useEffect } from 'react';
import { Filter, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface QuickFiltersSheetProps {
  trigger?: React.ReactNode;
  className?: string;
}

export function QuickFiltersSheet({ trigger, className }: QuickFiltersSheetProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filter state
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 45]);
  const [distance, setDistance] = useState(50);
  
  // Load current preferences
  useEffect(() => {
    if (!user?.id || !open) return;
    
    const loadPreferences = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('min_age_preference, max_age_preference, max_distance_miles')
        .eq('id', user.id)
        .single();
      
      if (data && !error) {
        setAgeRange([data.min_age_preference || 18, data.max_age_preference || 45]);
        setDistance(data.max_distance_miles || 50);
      }
    };
    
    loadPreferences();
  }, [user?.id, open]);

  const handleApply = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          min_age_preference: ageRange[0],
          max_age_preference: ageRange[1],
          max_distance_miles: distance,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Invalidate discover profiles to trigger refetch with new preferences
      await queryClient.invalidateQueries({ queryKey: ['user-preferences', user.id] });
      await queryClient.invalidateQueries({ queryKey: ['discover-profiles', user.id] });
      
      toast.success('Filters updated');
      setOpen(false);
    } catch (error) {
      console.error('Error updating filters:', error);
      toast.error('Failed to update filters');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAgeRange([18, 45]);
    setDistance(50);
  };

  // Check if filters are non-default
  const hasActiveFilters = ageRange[0] !== 18 || ageRange[1] !== 45 || distance !== 50;
  const activeFilterCount = (ageRange[0] !== 18 || ageRange[1] !== 45 ? 1 : 0) + (distance !== 50 ? 1 : 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button 
            variant={hasActiveFilters ? "default" : "outline"}
            size="sm" 
            className={cn(
              "gap-2 rounded-full px-4 transition-all",
              hasActiveFilters && "bg-primary text-primary-foreground",
              className
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 h-5 w-5 rounded-full bg-background text-foreground text-xs font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="h-auto max-h-[70dvh] rounded-t-xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Quick Filters
          </SheetTitle>
          <SheetDescription>
            Adjust your discovery preferences
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8 pb-4">
          {/* Age Range */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Age Range</Label>
              <span className="text-sm text-muted-foreground font-medium">
                {ageRange[0]} - {ageRange[1]}
              </span>
            </div>
            <Slider
              value={ageRange}
              onValueChange={(value) => setAgeRange(value as [number, number])}
              min={18}
              max={65}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>18</span>
              <span>65+</span>
            </div>
          </div>

          {/* Distance */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Maximum Distance</Label>
              <span className="text-sm text-muted-foreground font-medium">
                {distance >= 100 ? 'Any' : `${distance} miles`}
              </span>
            </div>
            <Slider
              value={[distance]}
              onValueChange={(value) => setDistance(value[0])}
              min={5}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5 mi</span>
              <span>Any</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleReset}
          >
            Reset
          </Button>
          <Button
            className="flex-1"
            onClick={handleApply}
            disabled={isLoading}
          >
            {isLoading ? 'Applying...' : 'Apply Filters'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
