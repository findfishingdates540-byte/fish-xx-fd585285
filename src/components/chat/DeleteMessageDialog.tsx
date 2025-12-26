import { useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface DeleteMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (deleteForEveryone: boolean) => void;
  isMine: boolean;
  isDeleting?: boolean;
}

export function DeleteMessageDialog({
  open,
  onOpenChange,
  onDelete,
  isMine,
  isDeleting = false,
}: DeleteMessageDialogProps) {
  const [deleteOption, setDeleteOption] = useState<'me' | 'everyone'>('me');

  const handleDelete = () => {
    onDelete(deleteOption === 'everyone');
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete message?</AlertDialogTitle>
          <AlertDialogDescription>
            {isMine ? (
              <RadioGroup
                value={deleteOption}
                onValueChange={(value) => setDeleteOption(value as 'me' | 'everyone')}
                className="mt-4 space-y-3"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="me" id="delete-me" />
                  <Label htmlFor="delete-me" className="flex-1 cursor-pointer">
                    <span className="font-medium">Delete for me</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      This message will be deleted from your view only
                    </p>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="everyone" id="delete-everyone" />
                  <Label htmlFor="delete-everyone" className="flex-1 cursor-pointer">
                    <span className="font-medium">Delete for everyone</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      This message will be deleted for all participants
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            ) : (
              <p className="mt-2">
                This message will be deleted from your view only. The other person will still see it.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
