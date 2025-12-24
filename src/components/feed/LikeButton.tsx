import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
  isLiked: boolean;
  likesCount: number;
  onLike: () => void;
  disabled?: boolean;
}

export function LikeButton({ isLiked, likesCount, onLike, disabled }: LikeButtonProps) {
  return (
    <button
      onClick={onLike}
      disabled={disabled}
      className={cn(
        "flex items-center gap-1.5 transition-colors",
        isLiked ? "text-destructive" : "text-muted-foreground hover:text-destructive"
      )}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isLiked ? 'liked' : 'not-liked'}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.8 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <Heart
            className={cn("h-5 w-5", isLiked && "fill-current")}
          />
        </motion.div>
      </AnimatePresence>
      <span className="text-sm font-medium">{likesCount}</span>
    </button>
  );
}
