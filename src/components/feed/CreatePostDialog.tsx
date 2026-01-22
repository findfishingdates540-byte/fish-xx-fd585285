import { useState, useEffect, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImagePlus, MapPin, X, Loader2, User, Video, Smile, Users } from 'lucide-react';
import { useCreatePost, useMentionSuggestions } from '@/hooks/use-feed';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface MentionedUser {
  username: string;
  profile?: {
    id: string;
    display_name: string | null;
    photos: string[] | null;
  };
}

interface CreatePostDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMOJI_LIST = ['😀', '😂', '❤️', '🔥', '👍', '🎣', '🐟', '🐠', '🦈', '🌊', '🚤', '🎉', '💪', '🏆', '📸', '🌅'];

export function CreatePostDialog({ isOpen, onClose }: CreatePostDialogProps) {
  const [content, setContent] = useState('');
  const [locationName, setLocationName] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionedUsers, setMentionedUsers] = useState<MentionedUser[]>([]);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const { user } = useAuth();
  const createPost = useCreatePost();
  const mentionSuggestions = useMentionSuggestions();

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['profile-create-post', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('display_name, photos')
        .eq('id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id && isOpen,
  });

  const firstName = profile?.display_name?.split(' ')[0] || 'there';

  // Extract mentions from content
  const extractedMentions = useMemo(() => {
    const mentionRegex = /@(\w+)/g;
    const matches = content.match(mentionRegex) || [];
    return [...new Set(matches.map(m => m.slice(1)))];
  }, [content]);

  // Update mentioned users when a suggestion is selected
  const updateMentionedUsers = (displayName: string, profile?: MentionedUser['profile']) => {
    const username = displayName.replace(/\s+/g, '');
    setMentionedUsers(prev => {
      if (prev.some(u => u.username === username)) return prev;
      return [...prev, { username, profile }];
    });
  };

  // Filter out mentioned users that are no longer in content
  useEffect(() => {
    setMentionedUsers(prev => prev.filter(u => extractedMentions.includes(u.username)));
  }, [extractedMentions]);

  // Handle @ mention detection
  useEffect(() => {
    const lastAtIndex = content.lastIndexOf('@', cursorPosition);
    if (lastAtIndex !== -1) {
      const textAfterAt = content.slice(lastAtIndex + 1, cursorPosition);
      if (!textAfterAt.includes(' ') && textAfterAt.length >= 0) {
        setMentionSearch(textAfterAt);
        setShowMentions(true);
        if (textAfterAt.length >= 2) {
          mentionSuggestions.mutate(textAfterAt);
        }
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  }, [content, cursorPosition]);

  const insertMention = (displayName: string, profile?: MentionedUser['profile']) => {
    const lastAtIndex = content.lastIndexOf('@', cursorPosition);
    if (lastAtIndex !== -1) {
      const before = content.slice(0, lastAtIndex);
      const after = content.slice(cursorPosition);
      const mentionText = `@${displayName.replace(/\s+/g, '')} `;
      setContent(before + mentionText + after);
      setShowMentions(false);
      updateMentionedUsers(displayName, profile);
      textareaRef.current?.focus();
    }
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.slice(0, start) + emoji + content.slice(end);
      setContent(newContent);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setContent(prev => prev + emoji);
    }
  };

  const removeMention = (username: string) => {
    const regex = new RegExp(`@${username}\\s?`, 'g');
    setContent(prev => prev.replace(regex, ''));
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setCursorPosition(e.target.selectionStart || 0);
  };

  const handleContentKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    setCursorPosition((e.target as HTMLTextAreaElement).selectionStart || 0);
  };

  const handleContentClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    setCursorPosition((e.target as HTMLTextAreaElement).selectionStart || 0);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + photos.length > 5) {
      toast.error('Maximum 5 photos allowed');
      return;
    }

    setPhotos(prev => [...prev, ...files]);
    
    // Create preview URLs
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video must be under 100MB');
      return;
    }
    
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const removeVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoFile(null);
    setVideoPreview(null);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user || (!content.trim() && photos.length === 0 && !videoFile)) {
      toast.error('Please add some content, photos, or video');
      return;
    }

    setIsUploading(true);

    try {
      // Upload photos
      const uploadedUrls: string[] = [];
      
      for (const photo of photos) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('catch-photos')
          .upload(fileName, photo);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('catch-photos')
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
      }

      // Upload video if present
      let videoUrl: string | undefined;
      if (videoFile) {
        const fileExt = videoFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('catch-photos')
          .upload(fileName, videoFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('catch-photos')
          .getPublicUrl(fileName);

        videoUrl = urlData.publicUrl;
      }

      // Create post
      await createPost.mutateAsync({
        content: content.trim() || undefined,
        photos: uploadedUrls.length > 0 ? uploadedUrls : undefined,
        videoUrl,
        locationName: locationName.trim() || undefined
      });

      toast.success('Post created!');
      handleClose();
    } catch (error) {
      console.error('Failed to create post:', error);
      toast.error('Failed to create post');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setContent('');
    setLocationName('');
    setPhotos([]);
    setPhotoPreview([]);
    setShowLocationInput(false);
    removeVideo();
    onClose();
  };

  const hasContent = content.trim() || photos.length > 0 || videoFile;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-4 border-b text-center">
          <DialogTitle className="text-xl font-semibold">Create post</DialogTitle>
        </DialogHeader>

        <div className="p-4">
          {/* User profile section */}
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.photos?.[0]} alt={profile?.display_name || ''} />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{profile?.display_name || 'User'}</p>
              <Badge variant="secondary" className="text-xs px-2 py-0.5 mt-0.5">
                🌍 Public
              </Badge>
            </div>
          </div>

          {/* Main textarea */}
          <div className="relative min-h-[120px]">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onKeyUp={handleContentKeyUp}
              onClick={handleContentClick}
              placeholder={`What's on your mind, ${firstName}?`}
              className="w-full min-h-[120px] resize-none bg-transparent border-0 focus:outline-none focus:ring-0 text-lg placeholder:text-muted-foreground/60"
            />
            
            {/* Mention suggestions dropdown */}
            <AnimatePresence>
              {showMentions && mentionSuggestions.data && mentionSuggestions.data.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50"
                >
                  {mentionSuggestions.data.map((suggestionProfile) => (
                    <button
                      key={suggestionProfile.id}
                      type="button"
                      onClick={() => insertMention(suggestionProfile.display_name || 'User', {
                        id: suggestionProfile.id,
                        display_name: suggestionProfile.display_name,
                        photos: suggestionProfile.photos
                      })}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted transition-colors text-left"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={suggestionProfile.photos?.[0]} alt={suggestionProfile.display_name || 'User'} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{suggestionProfile.display_name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mention preview chips */}
          <AnimatePresence>
            {mentionedUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2 mb-3"
              >
                {mentionedUsers.map(({ username, profile: mentionProfile }) => (
                  <Badge
                    key={username}
                    variant="secondary"
                    className="flex items-center gap-1.5 pr-1 cursor-pointer hover:bg-secondary/80"
                    onClick={() => removeMention(username)}
                  >
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={mentionProfile?.photos?.[0]} alt={username} />
                      <AvatarFallback className="text-[8px]">
                        <User className="h-2 w-2" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">@{username}</span>
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </Badge>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Media previews */}
          <AnimatePresence>
            {(photoPreview.length > 0 || videoPreview) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                {/* Photo previews */}
                {photoPreview.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-2">
                    {photoPreview.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Video preview */}
                {videoPreview && (
                  <div className="relative group">
                    <video
                      src={videoPreview}
                      className="w-full h-48 object-cover rounded-lg"
                      controls
                    />
                    <button
                      onClick={removeVideo}
                      className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1.5"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Location input (shown when toggled) */}
          <AnimatePresence>
            {showLocationInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
                  <Input
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="Add location..."
                    className="pl-10 pr-8"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setShowLocationInput(false);
                      setLocationName('');
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Add to your post action bar */}
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
            <span className="text-sm font-medium text-muted-foreground">Add to your post</span>
            <div className="flex items-center gap-1">
              {/* Photo */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={photos.length >= 5 || !!videoFile}
                    className="p-2 rounded-full hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ImagePlus className="h-6 w-6 text-green-500" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Photo</TooltipContent>
              </Tooltip>

              {/* Video */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={photos.length > 0 || !!videoFile}
                    className="p-2 rounded-full hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Video className="h-6 w-6 text-purple-500" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Video</TooltipContent>
              </Tooltip>

              {/* Tag people */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      setContent(prev => prev + '@');
                      textareaRef.current?.focus();
                    }}
                    className="p-2 rounded-full hover:bg-muted transition-colors"
                  >
                    <Users className="h-6 w-6 text-blue-500" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Tag people</TooltipContent>
              </Tooltip>

              {/* Emoji */}
              <Popover>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="p-2 rounded-full hover:bg-muted transition-colors"
                      >
                        <Smile className="h-6 w-6 text-yellow-500" />
                      </button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Emoji</TooltipContent>
                </Tooltip>
                <PopoverContent className="w-64 p-2" align="end">
                  <div className="grid grid-cols-8 gap-1">
                    {EMOJI_LIST.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        className="p-1.5 text-lg hover:bg-muted rounded transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Location */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setShowLocationInput(true)}
                    className={`p-2 rounded-full hover:bg-muted transition-colors ${locationName ? 'bg-red-500/10' : ''}`}
                  >
                    <MapPin className="h-6 w-6 text-red-500" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Location</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Hidden file inputs */}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePhotoSelect}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleVideoSelect}
          />
        </div>

        {/* Post button */}
        <div className="p-4 pt-0">
          <Button 
            onClick={handleSubmit} 
            disabled={isUploading || createPost.isPending || !hasContent}
            className="w-full"
            size="lg"
          >
            {isUploading || createPost.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              'Post'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
