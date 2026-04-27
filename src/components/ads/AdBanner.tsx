import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Megaphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useActiveAds, useTrackAdClick, type Advertisement } from '@/hooks/use-admin-ads';
import { useIsPremium } from '@/hooks/use-is-premium';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface AdBannerProps {
  variant?: 'inline' | 'compact';
  className?: string;
  /** Optional pre-fetched ad. If not provided, the banner picks one from the active pool. */
  ad?: Advertisement;
}

/**
 * Compact sponsored banner for sidebars and detail pages.
 * - Hidden for premium users
 * - Picks a random targeted ad from the active pool
 * - Tracks impression (IntersectionObserver) + click
 */
export function AdBanner({ variant = 'inline', className, ad: providedAd }: AdBannerProps) {
  const { user } = useAuth();
  const { isPremium } = useIsPremium();
  const ref = useRef<HTMLDivElement>(null);
  const [tracked, setTracked] = useState(false);
  const trackClick = useTrackAdClick();

  const { data: userProfile } = useQuery({
    queryKey: ['user-profile-for-ads', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('gender, date_of_birth, fishing_experience, interests, location_lat, location_lng')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id && !providedAd,
  });

  const { data: ads = [] } = useActiveAds(userProfile);

  // Stable ad selection per mount
  const [pickedIndex] = useState(() => Math.floor(Math.random() * 1000));
  const ad = providedAd || (ads.length > 0 ? ads[pickedIndex % ads.length] : null);

  useEffect(() => {
    if (!ad || tracked || !ref.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          supabase
            .from('advertisements')
            .select('impressions')
            .eq('id', ad.id)
            .single()
            .then(({ data }) => {
              if (data) {
                supabase
                  .from('advertisements')
                  .update({ impressions: data.impressions + 1 })
                  .eq('id', ad.id)
                  .then(() => setTracked(true));
              }
            });
        }
      },
      { threshold: 0.5 },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ad, tracked]);

  if (isPremium || !ad) return null;

  const handleClick = () => {
    trackClick.mutate(ad.id);
    const url = ad.cta_url || ad.website_url;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const cover = ad.photos?.[0] || ad.sponsor_logo;

  if (variant === 'compact') {
    return (
      <div
        ref={ref}
        onClick={handleClick}
        className={cn(
          'group flex gap-3 items-center rounded-xl border bg-card p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow',
          className,
        )}
      >
        {cover ? (
          <img src={cover} alt={ad.title} className="w-16 h-16 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Megaphone className="h-6 w-6 text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 leading-none">Sponsored</Badge>
            <span className="text-xs text-muted-foreground truncate">{ad.sponsor_name}</span>
          </div>
          <p className="text-sm font-semibold leading-tight truncate">{ad.title}</p>
          {ad.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{ad.description}</p>
          )}
        </div>
        <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={cn(
        'relative overflow-hidden rounded-xl border bg-gradient-to-br from-card to-primary/5 shadow-sm',
        className,
      )}
    >
      <div className="flex gap-3 p-3">
        {cover && (
          <img
            src={cover}
            alt={ad.title}
            onClick={handleClick}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg object-cover shrink-0 cursor-pointer"
          />
        )}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center gap-1.5 mb-1">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 leading-none">Sponsored</Badge>
            <span className="text-xs text-muted-foreground truncate">{ad.sponsor_name}</span>
          </div>
          <h4 className="font-semibold text-sm leading-tight line-clamp-2">{ad.title}</h4>
          {ad.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{ad.description}</p>
          )}
          <Button size="sm" className="mt-auto self-start gap-1.5 h-7 text-xs" onClick={handleClick}>
            {ad.cta_text || 'Learn More'}
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}