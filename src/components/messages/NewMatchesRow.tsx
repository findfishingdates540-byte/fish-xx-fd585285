import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { LikesCard } from './LikesCard';
import { ExpirationTimer } from './ExpirationTimer';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface NewMatch {
  id: string;
  name: string;
  photo: string;
  isNew?: boolean;
  expiration?: {
    formattedTime: string;
    isExpiringSoon: boolean;
    isUrgent: boolean;
  };
}

interface NewMatchesRowProps {
  matches: NewMatch[];
  likesCount?: number;
  onSelect: (id: string) => void;
}

export function NewMatchesRow({ matches, likesCount = 0, onSelect }: NewMatchesRowProps) {
  // Show placeholder cards if fewer than 4 matches
  const placeholderCount = Math.max(0, 4 - matches.length);
  const totalMatchCount = matches.length;
  
  return (
    <div className="px-4 py-3 bg-background">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          New Matches
        </h3>
        {totalMatchCount > 0 && (
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {totalMatchCount} {totalMatchCount === 1 ? 'match' : 'matches'}
          </span>
        )}
      </div>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 pb-2">
          {/* Likes Card - Always First */}
          <LikesCard likesCount={likesCount} />
          
          {/* Match Cards */}
          {matches.map((match, index) => (
            <motion.button
              key={match.id}
              onClick={() => onSelect(match.id)}
              className="flex flex-col items-center gap-1 group flex-shrink-0"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 0.3, 
                delay: index * 0.05,
                type: 'spring',
                stiffness: 200,
                damping: 20
              }}
            >
              <div className={cn(
                "relative w-16 h-20 rounded-lg overflow-hidden transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg",
                match.isNew && "ring-2 ring-amber-400 ring-offset-2 ring-offset-background"
              )}>
                <img
                  src={match.photo}
                  alt={match.name}
                  className="w-full h-full object-cover"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                
                {/* Online indicator */}
                <div className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background shadow-sm" />
                
                {/* New badge */}
                {match.isNew && (
                  <motion.div 
                    className="absolute top-1 right-1 bg-amber-400 text-slate-900 text-[10px] font-bold rounded-full h-4 px-1.5 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.05 + 0.2, type: 'spring', stiffness: 300 }}
                  >
                    NEW
                  </motion.div>
                )}
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs text-muted-foreground truncate max-w-[64px] group-hover:text-foreground transition-colors">
                  {(match.name ?? '').split(' ')[0] || 'Unknown'}
                </span>
                {match.expiration && (
                  <ExpirationTimer
                    formattedTime={match.expiration.formattedTime}
                    isExpiringSoon={match.expiration.isExpiringSoon}
                    isUrgent={match.expiration.isUrgent}
                  />
                )}
              </div>
            </motion.button>
          ))}
          
          {/* Placeholder Cards */}
          {Array.from({ length: placeholderCount }).map((_, i) => (
            <div
              key={`placeholder-${i}`}
              className="flex flex-col items-center gap-1 flex-shrink-0 opacity-50"
            >
              <div className="w-16 h-20 rounded-lg bg-muted border border-border border-dashed flex items-center justify-center">
                <span className="text-muted-foreground text-lg">?</span>
              </div>
              <span className="text-xs text-muted-foreground/50">—</span>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
