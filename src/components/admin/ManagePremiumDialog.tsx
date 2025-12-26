import { useState, useEffect } from 'react';
import { format, addMonths, addYears } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useManagePremium } from '@/hooks/use-admin-users';
import { CalendarIcon, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ManagePremiumDialogProps {
  user: {
    id: string;
    display_name: string | null;
    is_premium: boolean | null;
    premium_expires_at: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DurationOption = '1month' | '3months' | '6months' | '1year' | 'custom' | 'lifetime';

const durationOptions: { value: DurationOption; label: string }[] = [
  { value: '1month', label: '1 Month' },
  { value: '3months', label: '3 Months' },
  { value: '6months', label: '6 Months' },
  { value: '1year', label: '1 Year' },
  { value: 'lifetime', label: 'Lifetime' },
  { value: 'custom', label: 'Custom Date' },
];

export function ManagePremiumDialog({ user, open, onOpenChange }: ManagePremiumDialogProps) {
  const [isPremium, setIsPremium] = useState(false);
  const [duration, setDuration] = useState<DurationOption>('1month');
  const [customDate, setCustomDate] = useState<Date | undefined>();
  
  const { mutate: managePremium, isPending } = useManagePremium();

  useEffect(() => {
    if (user) {
      setIsPremium(!!user.is_premium);
      if (user.premium_expires_at) {
        setCustomDate(new Date(user.premium_expires_at));
        setDuration('custom');
      }
    }
  }, [user]);

  if (!user) return null;

  const calculateExpiryDate = (): string | null => {
    if (!isPremium) return null;
    
    const now = new Date();
    switch (duration) {
      case '1month':
        return addMonths(now, 1).toISOString();
      case '3months':
        return addMonths(now, 3).toISOString();
      case '6months':
        return addMonths(now, 6).toISOString();
      case '1year':
        return addYears(now, 1).toISOString();
      case 'lifetime':
        return addYears(now, 100).toISOString(); // Effectively lifetime
      case 'custom':
        return customDate?.toISOString() || addMonths(now, 1).toISOString();
      default:
        return addMonths(now, 1).toISOString();
    }
  };

  const handleSave = () => {
    managePremium(
      { 
        userId: user.id, 
        isPremium, 
        expiresAt: calculateExpiryDate() 
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            Manage Premium Status
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <p className="text-slate-400 text-sm">
            Managing premium for <span className="text-white font-medium">{user.display_name || 'this user'}</span>
          </p>

          {/* Premium Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-slate-700 bg-slate-800/50">
            <div>
              <Label htmlFor="premium-toggle" className="text-base font-medium">
                Premium Status
              </Label>
              <p className="text-sm text-slate-400">
                {isPremium ? 'User has premium access' : 'User does not have premium'}
              </p>
            </div>
            <Switch
              id="premium-toggle"
              checked={isPremium}
              onCheckedChange={setIsPremium}
            />
          </div>

          {/* Duration Selection */}
          {isPremium && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Premium Duration</Label>
              <RadioGroup value={duration} onValueChange={(v) => setDuration(v as DurationOption)}>
                <div className="grid grid-cols-2 gap-2">
                  {durationOptions.map((option) => (
                    <Label
                      key={option.value}
                      htmlFor={option.value}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                        duration === option.value
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <RadioGroupItem value={option.value} id={option.value} />
                      <span className="text-sm">{option.label}</span>
                    </Label>
                  ))}
                </div>
              </RadioGroup>

              {/* Custom Date Picker */}
              {duration === 'custom' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-slate-800 border-slate-700",
                        !customDate && "text-slate-400"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDate ? format(customDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700" align="start">
                    <Calendar
                      mode="single"
                      selected={customDate}
                      onSelect={setCustomDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
          )}

          {/* Current Status */}
          {user.is_premium && user.premium_expires_at && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <p className="text-sm text-amber-400">
                Current premium expires: {format(new Date(user.premium_expires_at), 'PPP')}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
