import { forwardRef } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { PhotoCarousel } from './PhotoCarousel';
import { Tables } from '@/integrations/supabase/types';

interface SwipeCardProps {
  profile: Tables<'profiles'>;
  onSwipe: (direction: 'left' | 'right') => void;
  isTop: boolean;
  onTap?: () => void;
}

export const SwipeCard = forwardRef<HTMLDivElement, SwipeCardProps>(
  ({ profile, onSwipe, isTop, onTap }, ref) => {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-15, 15]);
    const likeOpacity = useTransform(x, [0, 100], [0, 1]);
    const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);
    let dragStartX = 0;

    const handleDragStart = () => {
      dragStartX = x.get();
    };

    const handleDragEnd = (_: any, info: PanInfo) => {
      const threshold = 100;
      const movedDistance = Math.abs(info.offset.x);
      
      // Only trigger swipe if dragged enough, otherwise treat as tap
      if (movedDistance < 10 && onTap) {
        onTap();
        return;
      }
      
      if (info.offset.x > threshold) {
        onSwipe('right');
      } else if (info.offset.x < -threshold) {
        onSwipe('left');
      }
    };

    const calculateAge = (dateOfBirth: string | null): number | null => {
      if (!dateOfBirth) return null;
      const today = new Date();
      const birth = new Date(dateOfBirth);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    };

    const age = calculateAge(profile.date_of_birth);
    const photos = profile.photos || [];

    return (
      <motion.div
        ref={ref}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{ x, rotate, zIndex: isTop ? 10 : 0 }}
        drag={isTop ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        initial={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.5 }}
        animate={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.5 }}
        exit={{
          x: x.get() > 0 ? 300 : -300,
          opacity: 0,
          transition: { duration: 0.2 },
        }}
      >
        <div className="relative w-full h-full bg-card rounded-2xl overflow-hidden shadow-xl border border-border">
          {/* Photo carousel */}
          <PhotoCarousel photos={photos} name={profile.display_name || 'User'} />

          {/* Like/Nope stamps */}
          <motion.div
            className="absolute top-8 left-8 px-4 py-2 border-4 border-green-500 rounded-lg rotate-[-20deg] z-30"
            style={{ opacity: likeOpacity }}
          >
            <span className="text-green-500 font-black text-3xl tracking-wider">LIKE</span>
          </motion.div>

          <motion.div
            className="absolute top-8 right-8 px-4 py-2 border-4 border-red-500 rounded-lg rotate-[20deg] z-30"
            style={{ opacity: nopeOpacity }}
          >
            <span className="text-red-500 font-black text-3xl tracking-wider">NOPE</span>
          </motion.div>

          {/* Profile info */}
          <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
            <div className="flex items-baseline gap-2 mb-1">
              <h2 className="text-2xl font-bold text-white">
                {profile.display_name || 'Anonymous'}
              </h2>
              {age && <span className="text-xl text-white/90">{age}</span>}
            </div>

            {profile.location_name && (
              <div className="flex items-center gap-1 text-white/80 text-sm mb-2">
                <MapPin className="h-4 w-4" />
                <span>{profile.location_name}</span>
              </div>
            )}

            {profile.bio && (
              <p className="text-white/80 text-sm line-clamp-2">{profile.bio}</p>
            )}

            {profile.fishing_experience && (
              <div className="mt-2 flex gap-2">
                <span className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white">
                  {profile.fishing_experience.replace('_', ' ')}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
);

SwipeCard.displayName = 'SwipeCard';
