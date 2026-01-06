import { useState, useEffect } from 'react';
import { BadgeCheck, ShieldCheck, Video } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useManageVerification } from '@/hooks/use-manage-verification';
import { format } from 'date-fns';

interface ManageVerificationDialogProps {
  user: {
    id: string;
    display_name: string | null;
    id_verified?: boolean | null;
    id_verified_at?: string | null;
    live_verified?: boolean | null;
    live_verified_at?: string | null;
    verification_notes?: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageVerificationDialog({ user, open, onOpenChange }: ManageVerificationDialogProps) {
  const [idVerified, setIdVerified] = useState(false);
  const [liveVerified, setLiveVerified] = useState(false);
  const [notes, setNotes] = useState('');
  
  const { mutate: updateVerification, isPending } = useManageVerification();

  useEffect(() => {
    if (user) {
      setIdVerified(user.id_verified ?? false);
      setLiveVerified(user.live_verified ?? false);
      setNotes(user.verification_notes ?? '');
    }
  }, [user]);

  const handleSave = () => {
    if (!user) return;
    
    updateVerification({
      userId: user.id,
      idVerified,
      liveVerified,
      notes,
    }, {
      onSuccess: () => onOpenChange(false),
    });
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-500" />
            Manage Verification
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Control verification status for {user.display_name || 'this user'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* ID Verification (White Check) */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-slate-700">
                <BadgeCheck className="h-5 w-5 text-slate-300" />
              </div>
              <div>
                <Label htmlFor="id-verified" className="text-white font-medium">
                  ID Verified
                </Label>
                <p className="text-xs text-slate-400 mt-0.5">
                  User submitted valid ID document
                </p>
                {user.id_verified_at && (
                  <p className="text-xs text-slate-500 mt-1">
                    Verified on {format(new Date(user.id_verified_at), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            </div>
            <Switch
              id="id-verified"
              checked={idVerified}
              onCheckedChange={setIdVerified}
            />
          </div>

          {/* Live Verification (Blue Check) */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-500/20">
                <Video className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <Label htmlFor="live-verified" className="text-white font-medium">
                  Live Verified
                </Label>
                <p className="text-xs text-slate-400 mt-0.5">
                  User completed live verification
                </p>
                {user.live_verified_at && (
                  <p className="text-xs text-slate-500 mt-1">
                    Verified on {format(new Date(user.live_verified_at), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            </div>
            <Switch
              id="live-verified"
              checked={liveVerified}
              onCheckedChange={setLiveVerified}
            />
          </div>

          {/* Verification Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-slate-300">
              Admin Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Add notes about this user's verification..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 min-h-[80px]"
            />
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <BadgeCheck className="h-4 w-4 text-slate-400 fill-slate-100" />
              <span>White = ID</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <BadgeCheck className="h-4 w-4 text-blue-500 fill-blue-100" />
              <span>Blue = Live</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
