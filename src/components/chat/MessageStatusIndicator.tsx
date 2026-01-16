import { cn } from '@/lib/utils';
import { Check, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MessageStatusIndicatorProps {
  status: 'sent' | 'delivered' | 'read';
  readAt?: string | null;
  className?: string;
}

export function MessageStatusIndicator({ status, readAt, className }: MessageStatusIndicatorProps) {
  const formatReadTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return `Read at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return `Read ${formatDistanceToNow(date, { addSuffix: true })}`;
  };

  if (status === 'read' && readAt) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn('inline-flex items-center cursor-default', className)}>
              <CheckCheck className="h-3.5 w-3.5 text-primary" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {formatReadTime(readAt)}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

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