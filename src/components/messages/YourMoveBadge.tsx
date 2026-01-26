import { cn } from '@/lib/utils';

interface YourMoveBadgeProps {
  className?: string;
}

export function YourMoveBadge({ className }: YourMoveBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide",
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      className
    )}>
      Your move
    </span>
  );
}
