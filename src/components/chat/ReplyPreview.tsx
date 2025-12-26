import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ReplyPreviewProps {
  senderName: string;
  content: string;
  onCancel: () => void;
  className?: string;
}

export function ReplyPreview({ senderName, content, onCancel, className }: ReplyPreviewProps) {
  // Truncate content if too long
  const truncatedContent = content.length > 80 ? content.substring(0, 77) + '...' : content;
  
  // Check for special message types
  const isVoiceMessage = content === '🎤 Voice message';
  const isPhoto = content === '📷 Photo';
  const isSpot = content.startsWith('[SPOT:');
  const isCatch = content.startsWith('[CATCH:');
  
  let displayContent = truncatedContent;
  if (isVoiceMessage) displayContent = '🎤 Voice message';
  if (isPhoto) displayContent = '📷 Photo';
  if (isSpot) displayContent = '📍 Shared a fishing spot';
  if (isCatch) displayContent = '🐟 Shared a catch';

  return (
    <div className={cn(
      'flex items-start gap-2 p-3 bg-muted/50 rounded-t-lg border-l-4 border-primary',
      className
    )}>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-primary">{senderName}</p>
        <p className="text-sm text-muted-foreground truncate">{displayContent}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={onCancel}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
