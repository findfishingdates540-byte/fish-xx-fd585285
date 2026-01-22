import { FC, useState } from 'react';
import { Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useStories, type GroupedStories } from '@/hooks/use-stories';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CreateStoryDialog } from './CreateStoryDialog';
import { StoryViewer } from './StoryViewer';
import { cn } from '@/lib/utils';

export const StoriesRow: FC = () => {
  const { user } = useAuth();
  const { data: groupedStories = [], isLoading } = useStories();
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [viewingStories, setViewingStories] = useState<GroupedStories | null>(null);
  const [viewingIndex, setViewingIndex] = useState(0);

  const { data: profile } = useQuery({
    queryKey: ['user-profile-story', user?.id],
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

  const hasOwnStory = groupedStories.some(g => g.user_id === user?.id);

  const handleStoryClick = (group: GroupedStories, index: number) => {
    setViewingStories(group);
    setViewingIndex(index);
  };

  const handleNextUser = () => {
    const currentIdx = groupedStories.findIndex(g => g.user_id === viewingStories?.user_id);
    if (currentIdx < groupedStories.length - 1) {
      setViewingStories(groupedStories[currentIdx + 1]);
      setViewingIndex(0);
    } else {
      setViewingStories(null);
    }
  };

  const handlePrevUser = () => {
    const currentIdx = groupedStories.findIndex(g => g.user_id === viewingStories?.user_id);
    if (currentIdx > 0) {
      setViewingStories(groupedStories[currentIdx - 1]);
      setViewingIndex(0);
    }
  };

  if (!user) return null;

  return (
    <>
      <div className="bg-card rounded-xl border p-4 overflow-hidden">
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {/* Create Story Card */}
          <button
            onClick={() => setShowCreateStory(true)}
            className="flex-shrink-0 w-[110px] group"
          >
            <div className="relative h-[160px] rounded-xl overflow-hidden bg-muted border-2 border-dashed border-border hover:border-primary/50 transition-colors">
              {/* Background - user's photo or gradient */}
              {profile?.photos?.[0] ? (
                <img
                  src={profile.photos[0]}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
              )}
              
              {/* Plus icon */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-xs font-medium text-foreground">Create Story</span>
              </div>
            </div>
          </button>

          {/* Loading state */}
          {isLoading && (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-shrink-0 w-[110px]">
                  <div className="h-[160px] rounded-xl bg-muted animate-pulse" />
                </div>
              ))}
            </>
          )}

          {/* Story cards */}
          {groupedStories.map((group, groupIdx) => (
            <button
              key={group.user_id}
              onClick={() => handleStoryClick(group, 0)}
              className="flex-shrink-0 w-[110px] group"
            >
              <div className="relative h-[160px] rounded-xl overflow-hidden">
                {/* Story preview image */}
                {group.stories[0]?.media_url ? (
                  <img
                    src={group.stories[0].media_url}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div 
                    className="absolute inset-0"
                    style={{ backgroundColor: group.stories[0]?.background_color || '#1877F2' }}
                  >
                    {group.stories[0]?.text_overlay && (
                      <div className="absolute inset-0 flex items-center justify-center p-2">
                        <p className="text-white text-xs text-center font-medium line-clamp-4">
                          {group.stories[0].text_overlay}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* User avatar with ring */}
                <div className="absolute top-2 left-2">
                  <div className={cn(
                    "p-0.5 rounded-full",
                    group.has_unviewed 
                      ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600" 
                      : "bg-muted-foreground/50"
                  )}>
                    <Avatar className="h-8 w-8 border-2 border-background">
                      <AvatarImage src={group.photo || undefined} />
                      <AvatarFallback className="text-xs">
                        {group.display_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>

                {/* User name */}
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-white text-xs font-medium truncate">
                    {group.user_id === user.id ? 'Your Story' : group.display_name}
                  </p>
                </div>
              </div>
            </button>
          ))}

          {/* Empty state */}
          {!isLoading && groupedStories.length === 0 && (
            <div className="flex items-center justify-center w-full py-4 text-muted-foreground text-sm">
              No stories yet. Be the first to share!
            </div>
          )}
        </div>
      </div>

      <CreateStoryDialog 
        open={showCreateStory} 
        onOpenChange={setShowCreateStory} 
      />

      {viewingStories && (
        <StoryViewer
          stories={viewingStories}
          initialIndex={viewingIndex}
          onClose={() => setViewingStories(null)}
          onNextUser={handleNextUser}
          onPrevUser={handlePrevUser}
          isFirstUser={groupedStories.findIndex(g => g.user_id === viewingStories.user_id) === 0}
          isLastUser={groupedStories.findIndex(g => g.user_id === viewingStories.user_id) === groupedStories.length - 1}
        />
      )}
    </>
  );
};
