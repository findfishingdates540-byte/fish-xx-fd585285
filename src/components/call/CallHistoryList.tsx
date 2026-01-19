import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCallHistory, CallHistoryItem } from '@/hooks/use-call-history';
import { useCall } from './CallProvider';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface CallHistoryListProps {
  filter?: 'all' | 'voice' | 'video';
}

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatCallDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    }
    if (isYesterday(date)) {
      return `Yesterday, ${format(date, 'h:mm a')}`;
    }
    return format(date, 'MMM d, h:mm a');
  } catch {
    return '';
  }
}

function CallHistoryItemRow({ call, onCallBack }: { call: CallHistoryItem; onCallBack: (call: CallHistoryItem) => void }) {
  const isMissed = call.status === 'missed' || call.status === 'declined';
  const isCompleted = call.status === 'ended' && call.answered_at;
  const isVideo = call.call_type === 'video';

  const getStatusIcon = () => {
    if (isMissed) {
      return <PhoneMissed className="h-4 w-4 text-destructive" />;
    }
    if (call.is_outgoing) {
      return <PhoneOutgoing className="h-4 w-4 text-green-500" />;
    }
    return <PhoneIncoming className="h-4 w-4 text-blue-500" />;
  };

  const getStatusText = () => {
    if (call.status === 'missed') return 'Missed';
    if (call.status === 'declined') return 'Declined';
    if (call.status === 'busy') return 'Busy';
    if (isCompleted) return formatDuration(call.duration_seconds);
    if (call.status === 'ringing') return 'Ringing...';
    return call.status;
  };

  const handleClick = () => {
    if (call.other_user) {
      onCallBack(call);
    }
  };

  return (
    <div 
      className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer active:scale-[0.98]"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* Avatar */}
      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarImage src={call.other_user?.photos?.[0]} alt={call.other_user?.display_name || 'User'} />
          <AvatarFallback>
            {call.other_user?.display_name?.charAt(0)?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        {/* Call type badge */}
        <div className={cn(
          'absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center',
          isVideo ? 'bg-blue-500' : 'bg-green-500'
        )}>
          {isVideo ? (
            <Video className="h-3 w-3 text-white" />
          ) : (
            <Phone className="h-3 w-3 text-white" />
          )}
        </div>
      </div>

      {/* Call Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">
            {call.other_user?.display_name || 'Unknown User'}
          </span>
          {getStatusIcon()}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className={cn(isMissed && 'text-destructive')}>
            {getStatusText()}
          </span>
          <span>•</span>
          <span>{formatCallDate(call.started_at)}</span>
        </div>
      </div>

      {/* Duration badge for completed calls */}
      {isCompleted && call.duration_seconds && call.duration_seconds > 0 && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDuration(call.duration_seconds)}
        </Badge>
      )}

      {/* Call back button indicator */}
      <div className={cn(
        'h-8 w-8 rounded-full flex items-center justify-center transition-colors',
        isVideo ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'
      )}>
        {isVideo ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
      </div>
    </div>
  );
}

export function CallHistoryList({ filter = 'all' }: CallHistoryListProps) {
  const { calls, loading } = useCallHistory();
  const { startCall, isInCall } = useCall();
  
  // Filter calls based on type
  const filteredCalls = filter === 'all' 
    ? calls 
    : calls.filter(call => call.call_type === filter);

  const handleCallBack = async (call: CallHistoryItem) => {
    if (!call.other_user) {
      toast.error('Cannot call this user');
      return;
    }

    if (isInCall) {
      toast.error('You are already in a call');
      return;
    }

    const channelName = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      await startCall(
        call.other_user.id,
        call.other_user.display_name || 'Unknown',
        call.other_user.photos?.[0],
        channelName,
        call.call_type
      );
      toast.success(`Calling ${call.other_user.display_name || 'user'}...`);
    } catch (error) {
      console.error('Failed to start call:', error);
      toast.error('Failed to start call');
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredCalls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Phone className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-lg mb-1">
          {filter === 'all' ? 'No call history' : `No ${filter} calls`}
        </h3>
        <p className="text-sm text-muted-foreground">
          {filter === 'all' 
            ? 'Your voice and video calls will appear here'
            : `Your ${filter} calls will appear here`
          }
        </p>
      </div>
    );
  }

  // Group calls by date
  const groupedCalls: { label: string; calls: CallHistoryItem[] }[] = [];
  let currentLabel = '';

  filteredCalls.forEach((call) => {
    const date = parseISO(call.started_at);
    let label: string;
    
    if (isToday(date)) {
      label = 'Today';
    } else if (isYesterday(date)) {
      label = 'Yesterday';
    } else {
      label = format(date, 'MMMM d, yyyy');
    }

    if (label !== currentLabel) {
      currentLabel = label;
      groupedCalls.push({ label, calls: [call] });
    } else {
      groupedCalls[groupedCalls.length - 1].calls.push(call);
    }
  });

  return (
    <div className="space-y-4">
      {groupedCalls.map((group) => (
        <div key={group.label}>
          <h3 className="text-sm font-medium text-muted-foreground px-4 py-2 sticky top-0 bg-background/95 backdrop-blur-sm">
            {group.label}
          </h3>
          <div className="space-y-1 px-2">
            {group.calls.map((call) => (
              <CallHistoryItemRow 
                key={call.id} 
                call={call} 
                onCallBack={handleCallBack}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
