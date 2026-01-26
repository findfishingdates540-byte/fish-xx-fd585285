import { useState } from 'react';
import { AlertTriangle, Flag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ReportProfileSheetProps {
  profileId: string;
  profileName: string;
  trigger?: React.ReactNode;
}

const REPORT_REASONS = [
  { value: 'inappropriate_photos', label: 'Inappropriate photos' },
  { value: 'fake_profile', label: 'Fake profile / Scam' },
  { value: 'underage', label: 'User appears underage' },
  { value: 'offensive_behavior', label: 'Offensive behavior' },
  { value: 'spam', label: 'Spam or solicitation' },
  { value: 'other', label: 'Other' },
];

export function ReportProfileSheet({ profileId, profileName, trigger }: ReportProfileSheetProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason || !user?.id) {
      toast.error('Please select a reason');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        reported_user_id: profileId,
        reason,
        description: description || null,
        status: 'pending',
      });

      if (error) throw error;

      toast.success('Report submitted', {
        description: 'Thank you for helping keep our community safe.',
      });
      setOpen(false);
      setReason('');
      setDescription('');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors">
            <Flag className="h-3 w-3" />
            <span>Block and report</span>
          </button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85dvh] rounded-t-xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Report {profileName}
          </SheetTitle>
          <SheetDescription>
            Help us understand what's wrong with this profile. Your report is anonymous.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto pb-6">
          <RadioGroup value={reason} onValueChange={setReason} className="space-y-3">
            {REPORT_REASONS.map((item) => (
              <div
                key={item.value}
                className={cn(
                  "flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors",
                  reason === item.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-accent"
                )}
                onClick={() => setReason(item.value)}
              >
                <RadioGroupItem value={item.value} id={item.value} />
                <Label htmlFor={item.value} className="flex-1 cursor-pointer font-medium">
                  {item.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {reason === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="description">Additional details</Label>
              <Textarea
                id="description"
                placeholder="Please describe the issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!reason || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
