import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LikesCardProps {
  likesCount?: number;
}

export function LikesCard({ likesCount = 0 }: LikesCardProps) {
  return (
    <Link
      to="/app/likes"
      className="flex flex-col items-center gap-1 group flex-shrink-0"
    >
      <div className="relative w-16 h-20 rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 flex items-end justify-center pb-2 overflow-hidden transition-transform group-hover:scale-105">
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse" />
        
        {/* Heart icon */}
        <Heart className="h-6 w-6 text-white fill-white drop-shadow-lg" />
        
        {/* Count badge */}
        {likesCount > 0 && (
          <div className="absolute top-1 right-1 bg-white text-amber-600 text-xs font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
            {likesCount > 99 ? '99+' : likesCount}
          </div>
        )}
      </div>
      <span className="text-xs text-slate-400 font-medium">Likes</span>
    </Link>
  );
}
