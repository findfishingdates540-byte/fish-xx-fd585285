import { FC, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Link2, Share2, Plus, X, Facebook, Twitter, Linkedin, Send, Mail, MessageSquare } from 'lucide-react';
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
  postId?: string;
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
  postId,
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const recordShare = async (channel: string, recipientId?: string) => {
    if (!postId || !user?.id) return;
    try {
      await supabase.from('post_shares').insert({
        post_id: postId,
        user_id: user.id,
        recipient_id: recipientId ?? null,
        channel,
      });
    } catch (e) {
      console.error('Failed to record share', e);
    }
  };

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
          .from('profiles_safe')
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
      await recordShare('copy_link');
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
        await recordShare('native');
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
    void recordShare('whatsapp');
    onClose();
  };

  const openShare = (channel: string, url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    void recordShare(channel);
    onClose();
  };

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(shareTitle);
  const encodedText = encodeURIComponent(shareText || shareTitle);
  const encodedCombined = encodeURIComponent(`${shareText || shareTitle} ${shareUrl}`);

  const handleFacebookShare = () =>
    openShare('facebook', `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`);
  const handleMessengerShare = () =>
    openShare('messenger', `https://www.facebook.com/dialog/send?link=${encodedUrl}&app_id=291494419107518&redirect_uri=${encodedUrl}`);
  const handleTwitterShare = () =>
    openShare('twitter', `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`);
  const handleTelegramShare = () =>
    openShare('telegram', `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`);
  const handleLinkedInShare = () =>
    openShare('linkedin', `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`);
  const handleRedditShare = () =>
    openShare('reddit', `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`);
  const handlePinterestShare = () =>
    openShare('pinterest', `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedText}`);
  const handleEmailShare = () =>
    openShare('email', `mailto:?subject=${encodedTitle}&body=${encodedCombined}`);
  const handleSmsShare = () =>
    openShare('sms', `sms:?&body=${encodedCombined}`);
  const handleSnapchatShare = () =>
    openShare('snapchat', `https://www.snapchat.com/scan?attachmentUrl=${encodedUrl}`);

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
    await Promise.all(selectedUsers.map((rid) => recordShare('direct', rid)));
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

                {/* Facebook */}
                <button onClick={handleFacebookShare} className="flex flex-col items-center gap-2 min-w-[60px]">
                  <div className="h-12 w-12 rounded-full bg-[#1877F2] flex items-center justify-center">
                    <Facebook className="h-6 w-6 text-white" fill="white" />
                  </div>
                  <span className="text-xs text-foreground">Facebook</span>
                </button>

                {/* Messenger */}
                <button onClick={handleMessengerShare} className="flex flex-col items-center gap-2 min-w-[60px]">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#00B2FF] to-[#006AFF] flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.17.16.14.26.34.27.56l.05 1.78c.02.57.6.94 1.12.71l1.99-.88c.17-.07.36-.09.54-.04 1.61.45 3.32.46 4.94.03 5.64-1.49 8.95-7.06 7.46-12.7C20.5 4.69 16.51 2 12 2zm6.01 7.6l-2.94 4.66a1.5 1.5 0 01-2.17.4l-2.34-1.75a.6.6 0 00-.72 0l-3.16 2.4c-.42.32-.97-.18-.69-.62l2.94-4.66a1.5 1.5 0 012.17-.4l2.34 1.75c.21.16.51.16.72 0l3.16-2.4c.42-.32.97.18.69.62z"/></svg>
                  </div>
                  <span className="text-xs text-foreground">Messenger</span>
                </button>

                {/* X / Twitter */}
                <button onClick={handleTwitterShare} className="flex flex-col items-center gap-2 min-w-[60px]">
                  <div className="h-12 w-12 rounded-full bg-black flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </div>
                  <span className="text-xs text-foreground">X</span>
                </button>

                {/* Telegram */}
                <button onClick={handleTelegramShare} className="flex flex-col items-center gap-2 min-w-[60px]">
                  <div className="h-12 w-12 rounded-full bg-[#229ED9] flex items-center justify-center">
                    <Send className="h-5 w-5 text-white" fill="white" />
                  </div>
                  <span className="text-xs text-foreground">Telegram</span>
                </button>

                {/* LinkedIn */}
                <button onClick={handleLinkedInShare} className="flex flex-col items-center gap-2 min-w-[60px]">
                  <div className="h-12 w-12 rounded-full bg-[#0A66C2] flex items-center justify-center">
                    <Linkedin className="h-6 w-6 text-white" fill="white" />
                  </div>
                  <span className="text-xs text-foreground">LinkedIn</span>
                </button>

                {/* Reddit */}
                <button onClick={handleRedditShare} className="flex flex-col items-center gap-2 min-w-[60px]">
                  <div className="h-12 w-12 rounded-full bg-[#FF4500] flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 01-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 01.042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 014.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 01.14-.197.35.35 0 01.238-.042l2.906.617a1.214 1.214 0 011.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 00-.231.094.33.33 0 000 .463c.842.842 2.484.91 2.961.91.477 0 2.105-.056 2.961-.91a.361.361 0 00.029-.463.33.33 0 00-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 00-.232-.095z"/></svg>
                  </div>
                  <span className="text-xs text-foreground">Reddit</span>
                </button>

                {/* Pinterest */}
                <button onClick={handlePinterestShare} className="flex flex-col items-center gap-2 min-w-[60px]">
                  <div className="h-12 w-12 rounded-full bg-[#E60023] flex items-center justify-center">
                    <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
                  </div>
                  <span className="text-xs text-foreground">Pinterest</span>
                </button>

                {/* Snapchat */}
                <button onClick={handleSnapchatShare} className="flex flex-col items-center gap-2 min-w-[60px]">
                  <div className="h-12 w-12 rounded-full bg-[#FFFC00] flex items-center justify-center">
                    <svg className="h-6 w-6 text-black" viewBox="0 0 24 24" fill="currentColor"><path d="M12.166 0c4.69 0 6.96 3.527 7.062 6.36.034 1.027-.066 2.06-.166 3.087 0 .032-.034.193.165.295.13.064.45.064.715-.064.265-.13.397-.193.595-.193.265 0 .53.064.728.193.397.224.464.595.397.86-.198.86-1.587 1.058-1.984 1.388-.265.265.595 2.182 2.314 3.041.265.13.728.265 1.058.264.165 0 .264.066.33.231.13.397-.165.728-.728 1.058-1.058.595-2.314.661-2.413.86-.066.165 0 .264-.198.628-.297.595-1.058 2.51-3.638 2.51-1.388 0-2.116.661-3.638.661s-2.281-.661-3.704-.661c-2.51 0-3.34-1.917-3.638-2.51-.165-.397-.13-.463-.198-.628-.099-.198-1.354-.265-2.412-.86-.595-.33-.86-.661-.729-1.058.066-.165.165-.231.33-.231.33 0 .793-.13 1.058-.264 1.719-.86 2.58-2.776 2.314-3.041-.397-.33-1.785-.529-1.983-1.388-.066-.265 0-.595.396-.86.198-.13.464-.193.728-.193.198 0 .53.064.595.193.265.13.595.13.715.066.198-.103.165-.265.165-.296-.099-1.028-.198-2.06-.165-3.087C5.205 3.527 7.476 0 12.165 0z"/></svg>
                  </div>
                  <span className="text-xs text-foreground">Snapchat</span>
                </button>

                {/* Email */}
                <button onClick={handleEmailShare} className="flex flex-col items-center gap-2 min-w-[60px]">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <Mail className="h-5 w-5 text-foreground" />
                  </div>
                  <span className="text-xs text-foreground">Email</span>
                </button>

                {/* SMS */}
                <button onClick={handleSmsShare} className="flex flex-col items-center gap-2 min-w-[60px]">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-foreground" />
                  </div>
                  <span className="text-xs text-foreground">SMS</span>
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
