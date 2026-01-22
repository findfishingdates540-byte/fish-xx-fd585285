import { FC } from 'react';
import { Image, Video, Smile } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FeedComposerBarProps {
  onOpenCreatePost: () => void;
}

export const FeedComposerBar: FC<FeedComposerBarProps> = ({ onOpenCreatePost }) => {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['user-profile-composer', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('display_name, photos')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  if (!user) return null;

  const firstName = profile?.display_name?.split(' ')[0] || 'there';

  return (
    <div className="bg-card rounded-xl border shadow-sm">
      {/* Main input row */}
      <div className="p-3 flex items-center gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={profile?.photos?.[0]} alt={profile?.display_name || ''} />
          <AvatarFallback>{profile?.display_name?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        
        <button
          onClick={onOpenCreatePost}
          className="flex-1 text-left px-4 py-2.5 rounded-full bg-muted hover:bg-muted/80 transition-colors text-muted-foreground text-sm"
        >
          What's on your mind, {firstName}?
        </button>
      </div>

      {/* Divider */}
      <div className="border-t mx-3" />

      {/* Action buttons */}
      <div className="p-2 flex items-center justify-around">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-2 text-muted-foreground hover:bg-muted"
          onClick={onOpenCreatePost}
        >
          <Image className="h-5 w-5 text-green-500" />
          <span className="hidden sm:inline text-sm font-medium">Photo</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-2 text-muted-foreground hover:bg-muted"
          onClick={onOpenCreatePost}
        >
          <Video className="h-5 w-5 text-red-500" />
          <span className="hidden sm:inline text-sm font-medium">Video</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex-1 gap-2 text-muted-foreground hover:bg-muted"
          onClick={onOpenCreatePost}
        >
          <Smile className="h-5 w-5 text-yellow-500" />
          <span className="hidden sm:inline text-sm font-medium">Feeling</span>
        </Button>
      </div>
    </div>
  );
};
