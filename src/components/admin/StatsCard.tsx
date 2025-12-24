import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
}

export function StatsCard({
  title,
  value,
  change,
  changeLabel = 'vs. last 30 days',
  icon: Icon,
  iconBgColor = 'bg-cyan-500/20',
  iconColor = 'text-cyan-400',
}: StatsCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-white">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            {change !== undefined && (
              <span
                className={cn(
                  'text-sm font-medium px-2 py-0.5 rounded',
                  isPositive && 'text-emerald-400 bg-emerald-400/10',
                  isNegative && 'text-rose-400 bg-rose-400/10',
                  !isPositive && !isNegative && 'text-slate-400 bg-slate-700'
                )}
              >
                {isPositive ? '↗' : isNegative ? '↘' : ''}
                {Math.abs(change)}%
              </span>
            )}
          </div>
          {changeLabel && (
            <p className="text-xs text-slate-500 mt-1">{changeLabel}</p>
          )}
        </div>
        <div className={cn('p-3 rounded-lg', iconBgColor)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
      </div>
    </div>
  );
}
