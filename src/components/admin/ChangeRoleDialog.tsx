import { useState, useEffect } from 'react';
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
import { useUserRole, useChangeUserRole } from '@/hooks/use-admin-users';
import { Skeleton } from '@/components/ui/skeleton';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface ChangeRoleDialogProps {
  user: {
    id: string;
    display_name: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roles: { value: AppRole; label: string; description: string }[] = [
  { value: 'user', label: 'User', description: 'Standard user with no admin privileges' },
  { value: 'moderator', label: 'Moderator', description: 'Can view and manage reports' },
  { value: 'admin', label: 'Admin', description: 'Full access to all admin features' },
];

export function ChangeRoleDialog({ user, open, onOpenChange }: ChangeRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<AppRole>('user');
  
  const { data: currentRole, isLoading: roleLoading } = useUserRole(user?.id || '');
  const { mutate: changeRole, isPending } = useChangeUserRole();

  useEffect(() => {
    if (currentRole) {
      setSelectedRole(currentRole as AppRole);
    }
  }, [currentRole]);

  if (!user) return null;

  const handleSave = () => {
    changeRole(
      { userId: user.id, role: selectedRole },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Change User Role</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-slate-400 text-sm mb-4">
            Change role for <span className="text-white font-medium">{user.display_name || 'this user'}</span>
          </p>

          {roleLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 bg-slate-800" />
              ))}
            </div>
          ) : (
            <RadioGroup value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
              <div className="space-y-3">
                {roles.map((role) => (
                  <Label
                    key={role.value}
                    htmlFor={role.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedRole === role.value
                        ? 'border-primary bg-primary/10'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <RadioGroupItem value={role.value} id={role.value} className="mt-0.5" />
                    <div>
                      <p className="font-medium">{role.label}</p>
                      <p className="text-sm text-slate-400">{role.description}</p>
                    </div>
                  </Label>
                ))}
              </div>
            </RadioGroup>
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
            disabled={isPending || roleLoading}
          >
            {isPending ? 'Saving...' : 'Save Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
