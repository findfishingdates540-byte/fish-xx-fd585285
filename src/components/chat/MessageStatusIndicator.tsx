import { cn } from '@/lib/utils';
import { Check, CheckCheck } from 'lucide-react';

interface MessageStatusIndicatorProps {
  status: 'sent' | 'delivered' | 'read';
  className?: string;
}

export function MessageStatusIndicator({ status, className }: MessageStatusIndicatorProps) {
  return (
    <span className={cn('inline-flex items-center', className)}>
      {status === 'sent' && (
        <Check className="h-3.5 w-3.5 text-muted-foreground" />
      )}
      {status === 'delivered' && (
        <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />
      )}
      {status === 'read' && (
        <CheckCheck className="h-3.5 w-3.5 text-primary" />
      )}
    </span>
  );
}
