import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { LikesCard } from './LikesCard';
import { cn } from '@/lib/utils';

interface NewMatch {
  id: string;
  name: string;
  photo: string;
  isNew?: boolean;
}

interface NewMatchesRowProps {
  matches: NewMatch[];
  likesCount?: number;
  onSelect: (id: string) => void;
}

export function NewMatchesRow({ matches, likesCount = 0, onSelect }: NewMatchesRowProps) {
  // Show placeholder cards if fewer than 4 matches
  const placeholderCount = Math.max(0, 4 - matches.length);
  
  return (
    <div className="px-4 py-3">
      <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wide">
        New Matches
      </h3>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 pb-2">
          {/* Likes Card - Always First */}
          <LikesCard likesCount={likesCount} />
          
          {/* Match Cards */}
          {matches.map((match) => (
            <button
              key={match.id}
              onClick={() => onSelect(match.id)}
              className="flex flex-col items-center gap-1 group flex-shrink-0"
            >
              <div className={cn(
                "relative w-16 h-20 rounded-lg overflow-hidden transition-transform group-hover:scale-105",
                match.isNew && "ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900"
              )}>
                <img
                  src={match.photo}
                  alt={match.name}
                  className="w-full h-full object-cover"
                />
                {/* New badge */}
                {match.isNew && (
                  <div className="absolute top-1 right-1 bg-amber-400 text-slate-900 text-[10px] font-bold rounded-full h-4 px-1.5 flex items-center justify-center">
                    NEW
                  </div>
                )}
              </div>
              <span className="text-xs text-slate-400 truncate max-w-[64px]">
                {match.name.split(' ')[0]}
              </span>
            </button>
          ))}
          
          {/* Placeholder Cards */}
          {Array.from({ length: placeholderCount }).map((_, i) => (
            <div
              key={`placeholder-${i}`}
              className="flex flex-col items-center gap-1 flex-shrink-0"
            >
              <div className="w-16 h-20 rounded-lg bg-slate-800 border border-slate-700 border-dashed" />
              <span className="text-xs text-slate-600">—</span>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="bg-slate-800" />
      </ScrollArea>
    </div>
  );
}
