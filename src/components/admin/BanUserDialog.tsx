import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useBanUser } from '@/hooks/use-admin-users';

interface BanUserDialogProps {
  user: {
    id: string;
    display_name: string | null;
    is_banned: boolean | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BanUserDialog({ user, open, onOpenChange }: BanUserDialogProps) {
  const { mutate: banUser, isPending } = useBanUser();

  if (!user) return null;

  const isBanned = user.is_banned;

  const handleConfirm = () => {
    banUser(
      { userId: user.id, banned: !isBanned },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-slate-900 border-slate-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            {isBanned ? 'Unban User' : 'Ban User'}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400">
            {isBanned 
              ? `Are you sure you want to unban ${user.display_name || 'this user'}? They will regain access to the platform.`
              : `Are you sure you want to ban ${user.display_name || 'this user'}? They will lose access to the platform and won't be visible to other users.`
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className={isBanned 
              ? 'bg-emerald-600 hover:bg-emerald-700' 
              : 'bg-red-600 hover:bg-red-700'
            }
          >
            {isPending ? 'Processing...' : isBanned ? 'Unban User' : 'Ban User'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
