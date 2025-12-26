import { Ban } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeletedMessagePlaceholderProps {
  isMine: boolean;
  timestamp: string;
}

export function DeletedMessagePlaceholder({ isMine, timestamp }: DeletedMessagePlaceholderProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-4 py-2.5 rounded-2xl italic",
      isMine 
        ? "bg-primary/50 text-primary-foreground/70 rounded-br-sm" 
        : "bg-muted/50 text-muted-foreground rounded-bl-sm"
    )}>
      <Ban className="w-4 h-4" />
      <span className="text-sm">This message was deleted</span>
    </div>
  );
}
