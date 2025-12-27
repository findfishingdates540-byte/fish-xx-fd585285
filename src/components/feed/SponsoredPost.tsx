import { useState, useEffect, useRef } from 'react';
import { ExternalLink, Megaphone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Advertisement, useTrackAdClick } from '@/hooks/use-admin-ads';
import { supabase } from '@/integrations/supabase/client';

interface SponsoredPostProps {
  ad: Advertisement;
  onImpression?: (id: string) => void;
}

export function SponsoredPost({ ad, onImpression }: SponsoredPostProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);
  const postRef = useRef<HTMLDivElement>(null);
  const trackClick = useTrackAdClick();

  // Track impression when post becomes visible
  useEffect(() => {
    if (hasTrackedImpression) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Track impression
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
                  .then(() => {
                    setHasTrackedImpression(true);
                    onImpression?.(ad.id);
                  });
              }
            });
        }
      },
      { threshold: 0.5 }
    );

    if (postRef.current) {
      observer.observe(postRef.current);
    }

    return () => observer.disconnect();
  }, [ad.id, hasTrackedImpression, onImpression]);

  const handleCtaClick = () => {
    trackClick.mutate(ad.id);
    if (ad.cta_url) {
      window.open(ad.cta_url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleWebsiteClick = () => {
    trackClick.mutate(ad.id);
    if (ad.website_url) {
      window.open(ad.website_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card 
      ref={postRef}
      className="overflow-hidden border-primary/20 bg-gradient-to-br from-background to-primary/5"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            {ad.sponsor_logo ? (
              <AvatarImage src={ad.sponsor_logo} alt={ad.sponsor_name} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary">
                <Megaphone className="h-4 w-4" />
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{ad.sponsor_name}</span>
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                Sponsored
              </Badge>
            </div>
            {ad.website_url && (
              <button 
                onClick={handleWebsiteClick}
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                Visit website
                <ExternalLink className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Image Carousel */}
      {ad.photos.length > 0 && (
        <div className="relative">
          <div className="aspect-[4/3] overflow-hidden">
            <img
              src={ad.photos[currentPhotoIndex]}
              alt={ad.title}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Photo Navigation Dots */}
          {ad.photos.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {ad.photos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPhotoIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentPhotoIndex
                      ? 'bg-white'
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg leading-tight">{ad.title}</h3>
          {ad.description && (
            <p className="text-muted-foreground text-sm mt-1 line-clamp-3">
              {ad.description}
            </p>
          )}
        </div>

        {/* CTA Button */}
        {ad.cta_url && (
          <Button 
            onClick={handleCtaClick}
            className="w-full gap-2"
            size="lg"
          >
            {ad.cta_text || 'Learn More'}
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
