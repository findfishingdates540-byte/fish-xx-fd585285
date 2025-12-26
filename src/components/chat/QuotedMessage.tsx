import { cn } from '@/lib/utils';

interface QuotedMessageProps {
  senderName: string;
  content: string;
  isMine: boolean;
  isOwnQuote: boolean; // Whether the quoted message is from the current user
}

export function QuotedMessage({ senderName, content, isMine, isOwnQuote }: QuotedMessageProps) {
  // Truncate content if too long
  const truncatedContent = content.length > 100 ? content.substring(0, 97) + '...' : content;
  
  // Check for special message types
  const isVoiceMessage = content === '🎤 Voice message';
  const isPhoto = content === '📷 Photo';
  const isSpot = content.startsWith('[SPOT:');
  const isCatch = content.startsWith('[CATCH:');
  
  let displayContent = truncatedContent;
  if (isVoiceMessage) displayContent = '🎤 Voice message';
  if (isPhoto) displayContent = '📷 Photo';
  if (isSpot) displayContent = '📍 Fishing spot';
  if (isCatch) displayContent = '🐟 Catch';

  return (
    <div
      className={cn(
        'mb-2 pl-2 border-l-2 rounded-sm text-xs',
        isMine 
          ? 'border-primary-foreground/50' 
          : 'border-primary/50',
        isOwnQuote
          ? (isMine ? 'bg-primary-foreground/10' : 'bg-primary/10')
          : (isMine ? 'bg-primary-foreground/5' : 'bg-muted/50')
      )}
    >
      <p className={cn(
        'font-medium text-[11px]',
        isMine ? 'text-primary-foreground/80' : 'text-primary'
      )}>
        {senderName}
      </p>
      <p className={cn(
        'line-clamp-2',
        isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'
      )}>
        {displayContent}
      </p>
    </div>
  );
}
