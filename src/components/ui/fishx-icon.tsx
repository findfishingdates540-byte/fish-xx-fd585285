import { cn } from '@/lib/utils';
import achievement from '@/assets/icons/fishx_icon_achievement.png';
import gear from '@/assets/icons/fishx_icon_gear.png';
import leaderboard from '@/assets/icons/fishx_icon_leaderboard.png';
import level from '@/assets/icons/fishx_icon_level.png';
import events from '@/assets/icons/fishx_icon_events.png';
import chat from '@/assets/icons/fishx_icon_chat.png';
import team from '@/assets/icons/fishx_icon_team.png';
import catchlog from '@/assets/icons/fishx_icon_catchlog.png';
import logout from '@/assets/icons/fishx_icon_logout.png';
import map from '@/assets/icons/fishx_icon_map.png';
import notifications from '@/assets/icons/fishx_icon_notifications.png';
import photo from '@/assets/icons/fishx_icon_photo.png';
import plus from '@/assets/icons/fishx_icon_plus.png';
import profile from '@/assets/icons/fishx_icon_profile.png';
import weather from '@/assets/icons/fishx_icon_weather.png';
import video from '@/assets/icons/fishx_icon_video.png';
import tournament from '@/assets/icons/fishx_icon_tournament.png';
import team2 from '@/assets/icons/fishx_icon_team2.png';
import species from '@/assets/icons/fishx_icon_species.png';
import search from '@/assets/icons/fishx_icon_search.png';
import social from '@/assets/icons/fishx_icon_social.png';

/**
 * FishXIcon — themed 3D brand icons (chrome + electric blue).
 * Add new icons by dropping the PNG into src/assets/icons and extending the map below.
 */
export const FISHX_ICONS = {
  achievement,
  gear,
  leaderboard,
  level,
  events,
  chat,
  team,
  catchlog,
  logout,
  map,
  notifications,
  photo,
  plus,
  profile,
  weather,
  video,
  tournament,
  team2,
  species,
  search,
  social,
} as const;

export type FishXIconName = keyof typeof FISHX_ICONS;

interface FishXIconProps {
  name: FishXIconName;
  size?: number;
  className?: string;
  alt?: string;
}

export function FishXIcon({ name, size = 24, className, alt }: FishXIconProps) {
  const src = FISHX_ICONS[name];
  return (
    <img
      src={src}
      alt={alt ?? `${name} icon`}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={cn('inline-block object-contain select-none', className)}
      style={{ width: size, height: size }}
    />
  );
}