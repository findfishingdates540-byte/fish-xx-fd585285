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
import { useDeleteSpot } from '@/hooks/use-admin-spots';

interface DeleteSpotDialogProps {
  spot: {
    id: string;
    name: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteSpotDialog({ spot, open, onOpenChange }: DeleteSpotDialogProps) {
  const { mutate: deleteSpot, isPending } = useDeleteSpot();

  if (!spot) return null;

  const handleConfirm = () => {
    deleteSpot(spot.id, { 
      onSuccess: () => onOpenChange(false) 
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-slate-900 border-slate-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Delete Fishing Spot</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400">
            Are you sure you want to delete <span className="text-white font-medium">"{spot.name}"</span>? 
            This action cannot be undone. All ratings and reviews for this spot will also be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending ? 'Deleting...' : 'Delete Spot'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
