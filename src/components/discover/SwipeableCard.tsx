import { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Heart, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProfileCard, ProfileData } from './ProfileCard';

interface SwipeableCardProps {
  profile: ProfileData;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onInfoClick?: () => void;
}

export function SwipeableCard({
  profile,
  onSwipeLeft,
  onSwipeRight,
  onInfoClick,
}: SwipeableCardProps) {
  const [exitX, setExitX] = useState(0);
  const x = useMotionValue(0);
  
  // Transform values based on drag position
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);
  const scale = useTransform(x, [-200, 0, 200], [0.95, 1, 0.95]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 100;
    
    if (info.offset.x > threshold) {
      setExitX(300);
      onSwipeRight();
    } else if (info.offset.x < -threshold) {
      setExitX(-300);
      onSwipeLeft();
    }
  };

  return (
    <motion.div
      className="absolute w-full cursor-grab active:cursor-grabbing"
      style={{ x, rotate, scale }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, x: 0 }}
      exit={{ x: exitX, opacity: 0, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Like Indicator */}
      <motion.div
        className="absolute top-8 right-8 z-10 rotate-12"
        style={{ opacity: likeOpacity }}
      >
        <div className="border-4 border-green-500 rounded-lg px-4 py-2 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-green-500 fill-green-500" />
            <span className="text-2xl font-bold text-green-500">LIKE</span>
          </div>
        </div>
      </motion.div>

      {/* Nope Indicator */}
      <motion.div
        className="absolute top-8 left-8 z-10 -rotate-12"
        style={{ opacity: nopeOpacity }}
      >
        <div className="border-4 border-destructive rounded-lg px-4 py-2 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <X className="h-6 w-6 text-destructive" />
            <span className="text-2xl font-bold text-destructive">NOPE</span>
          </div>
        </div>
      </motion.div>

      <ProfileCard profile={profile} onInfoClick={onInfoClick} />
    </motion.div>
  );
}
