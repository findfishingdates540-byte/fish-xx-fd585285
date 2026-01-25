import { FC } from 'react';
import { Image } from 'lucide-react';
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
    <div 
      className="bg-card rounded-xl border shadow-sm p-3 flex items-center gap-3 cursor-pointer hover:bg-accent/50"
      onClick={onOpenCreatePost}
    >
      <Avatar className="h-9 w-9 flex-shrink-0">
        <AvatarImage src={profile?.photos?.[0]} alt={profile?.display_name || ''} />
        <AvatarFallback>{profile?.display_name?.charAt(0) || 'U'}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 text-left px-3 py-2 rounded-full bg-muted text-muted-foreground text-sm">
        What's on your mind, {firstName}?
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:bg-muted"
        onClick={(e) => {
          e.stopPropagation();
          onOpenCreatePost();
        }}
      >
        <Image className="h-5 w-5 text-green-500" />
      </Button>
    </div>
  );
};
