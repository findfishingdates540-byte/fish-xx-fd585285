import { FC, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Link2, Share2, Plus, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getShareBaseUrl } from '@/lib/config';

interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  shareTitle: string;
  shareText?: string;
  onAddToStory?: () => void;
}

interface Follower {
  id: string;
  display_name: string | null;
  photos: string[] | null;
}

export const ShareSheet: FC<ShareSheetProps> = ({
  isOpen,
  onClose,
  shareUrl,
  shareTitle,
  shareText,
  onAddToStory,
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch followers/following when sheet opens
  useEffect(() => {
    if (isOpen && user?.id) {
      fetchFollowers();
    }
  }, [isOpen, user?.id]);

  const fetchFollowers = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      // Get users the current user follows
      const { data: following } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (following && following.length > 0) {
        const followingIds = following.map(f => f.following_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, photos')
          .in('id', followingIds);
        
        setFollowers(profiles || []);
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFollowers = followers.filter(f => 
    f.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard');
      onClose();
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        onClose();
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText || shareTitle} ${shareUrl}`)}`;
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSendToUsers = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Select at least one person to share with');
      return;
    }
    // For now, just show a success message
    // In a real implementation, this would send a message to selected users
    toast.success(`Shared with ${selectedUsers.length} ${selectedUsers.length === 1 ? 'person' : 'people'}`);
    setSelectedUsers([]);
    onClose();
  };

  const getAvatarUrl = (photos: string[] | null) => {
    return photos?.[0] || null;
  };

  const getInitials = (name: string | null) => {
    return name?.charAt(0)?.toUpperCase() || '?';
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="fixed inset-0 bg-black/60 z-[100000]"
          />
          
          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="fixed bottom-0 left-0 right-0 z-[100001] bg-card rounded-t-2xl overflow-hidden"
            style={{ maxHeight: '70vh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Search Bar */}
            <div className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-muted/50 border-0 rounded-full"
                />
              </div>
            </div>

            {/* Scrollable Friends/Followers Grid */}
            <div className="px-4 overflow-y-auto" style={{ maxHeight: 'calc(70vh - 200px)' }}>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : filteredFollowers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No users found' : 'Follow people to share with them'}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4 pb-4">
                  {filteredFollowers.map((follower) => (
                    <button
                      key={follower.id}
                      onClick={() => toggleUserSelection(follower.id)}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className="relative">
                        <Avatar className={`h-16 w-16 border-2 transition-colors ${
                          selectedUsers.includes(follower.id) 
                            ? 'border-primary' 
                            : 'border-transparent'
                        }`}>
                          <AvatarImage src={getAvatarUrl(follower.photos) || undefined} />
                          <AvatarFallback className="bg-muted text-lg">
                            {getInitials(follower.display_name)}
                          </AvatarFallback>
                        </Avatar>
                        {selectedUsers.includes(follower.id) && (
                          <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center">
                            <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-foreground text-center line-clamp-2 max-w-[70px]">
                        {follower.display_name || 'User'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Send Button (shows when users selected) */}
            {selectedUsers.length > 0 && (
              <div className="px-4 pb-2">
                <button
                  onClick={handleSendToUsers}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-full font-medium"
                >
                  Send
                </button>
              </div>
            )}

            {/* Fixed Bottom Share Options */}
            <div className="border-t border-border px-4 py-4">
              <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide pb-2">
                {/* WhatsApp */}
                <button
                  onClick={handleWhatsAppShare}
                  className="flex flex-col items-center gap-2 min-w-[60px]"
                >
                  <div className="h-12 w-12 rounded-full bg-[#25D366] flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <span className="text-xs text-foreground">WhatsApp</span>
                </button>

                {/* Copy Link */}
                <button
                  onClick={handleCopyLink}
                  className="flex flex-col items-center gap-2 min-w-[60px]"
                >
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <Link2 className="h-5 w-5 text-foreground" />
                  </div>
                  <span className="text-xs text-foreground">Copy link</span>
                </button>

                {/* Share */}
                <button
                  onClick={handleNativeShare}
                  className="flex flex-col items-center gap-2 min-w-[60px]"
                >
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <Share2 className="h-5 w-5 text-foreground" />
                  </div>
                  <span className="text-xs text-foreground">Share</span>
                </button>

                {/* Add to Story */}
                {onAddToStory && (
                  <button
                    onClick={() => {
                      onAddToStory();
                      onClose();
                    }}
                    className="flex flex-col items-center gap-2 min-w-[60px]"
                  >
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <Plus className="h-5 w-5 text-foreground" />
                    </div>
                    <span className="text-xs text-foreground text-center">Add to story</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
