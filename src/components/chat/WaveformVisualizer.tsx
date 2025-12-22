import { cn } from '@/lib/utils';

interface WaveformVisualizerProps {
  levels: number[];
  isPlaying?: boolean;
  progress?: number;
  className?: string;
  barClassName?: string;
  activeBarClassName?: string;
}

export function WaveformVisualizer({ 
  levels, 
  isPlaying = false,
  progress = 0,
  className,
  barClassName,
  activeBarClassName
}: WaveformVisualizerProps) {
  const bars = levels.length > 0 ? levels : Array(20).fill(0.1);
  const activeBarIndex = Math.floor((progress / 100) * bars.length);

  return (
    <div className={cn('flex items-center gap-[2px] h-8', className)}>
      {bars.map((level, index) => {
        const height = Math.max(0.15, Math.min(1, level)) * 100;
        const isActive = index < activeBarIndex;
        
        return (
          <div
            key={index}
            className={cn(
              'w-1 rounded-full transition-all duration-75',
              isActive ? activeBarClassName || 'bg-primary' : barClassName || 'bg-muted-foreground/40',
              isPlaying && !isActive && 'animate-pulse'
            )}
            style={{ 
              height: `${height}%`,
              minHeight: '4px'
            }}
          />
        );
      })}
    </div>
  );
}
