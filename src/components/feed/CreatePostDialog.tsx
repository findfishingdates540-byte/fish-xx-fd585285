import { useState, useEffect, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImagePlus, MapPin, X, Loader2, User, Video } from 'lucide-react';
import { useCreatePost, useMentionSuggestions } from '@/hooks/use-feed';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence, motion } from 'framer-motion';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { user } = useAuth();
  const createPost = useCreatePost();
  const mentionSuggestions = useMentionSuggestions();

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
      onClose();
      
      // Reset form
      setContent('');
      setLocationName('');
      setPhotos([]);
      setPhotoPreview([]);
      removeVideo();
    } catch (error) {
      console.error('Failed to create post:', error);
      toast.error('Failed to create post');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Photo upload */}
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">
              Photos (max 5)
            </Label>
            
            {photoPreview.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {photoPreview.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {photos.length < 5 && !videoFile && (
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-foreground/50 transition-colors">
                <ImagePlus className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Add Photos</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
              </label>
            )}
          </div>

          {/* Video upload */}
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">
              Video (max 100MB)
            </Label>
            
            {videoPreview ? (
              <div className="relative">
                <video
                  src={videoPreview}
                  className="w-full h-40 object-cover rounded-lg"
                  controls
                />
                <button
                  onClick={removeVideo}
                  className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              photos.length === 0 && (
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-foreground/50 transition-colors">
                  <Video className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Add Video</span>
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleVideoSelect}
                  />
                </label>
              )
            )}
          </div>

          {/* Caption with mentions */}
          <div className="relative">
            <Label htmlFor="content" className="text-sm text-muted-foreground">
              Caption (type @ to mention someone)
            </Label>
            <Textarea
              ref={textareaRef}
              id="content"
              value={content}
              onChange={handleContentChange}
              onKeyUp={handleContentKeyUp}
              onClick={handleContentClick}
              placeholder="Share your fishing story... @mention friends"
              rows={3}
              className="mt-1.5"
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
                {mentionSuggestions.data.map((profile) => (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => insertMention(profile.display_name || 'User', {
                        id: profile.id,
                        display_name: profile.display_name,
                        photos: profile.photos
                      })}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted transition-colors text-left"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={profile.photos?.[0]} alt={profile.display_name || 'User'} />
                        <AvatarFallback>
                          <User className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{profile.display_name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mention preview chips */}
            <AnimatePresence>
              {mentionedUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-2 mt-2"
                >
                  {mentionedUsers.map(({ username, profile }) => (
                    <Badge
                      key={username}
                      variant="secondary"
                      className="flex items-center gap-1.5 pr-1 cursor-pointer hover:bg-secondary/80"
                      onClick={() => removeMention(username)}
                    >
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={profile?.photos?.[0]} alt={username} />
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
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location" className="text-sm text-muted-foreground">
              Location
            </Label>
            <div className="relative mt-1.5">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Where did you catch it?"
                className="pl-10"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isUploading || createPost.isPending}
              className="flex-1"
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
