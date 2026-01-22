import { FC, useState, useRef } from 'react';
import { X, Image, Type, Upload, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCreateStory } from '@/hooks/use-stories';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CreateStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BACKGROUND_COLORS = [
  '#1877F2', // Facebook blue
  '#E4405F', // Instagram pink
  '#25D366', // WhatsApp green
  '#FF6B35', // Orange
  '#7C3AED', // Purple
  '#059669', // Emerald
  '#DC2626', // Red
  '#0891B2', // Cyan
  '#000000', // Black
];

export const CreateStoryDialog: FC<CreateStoryDialogProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const createStory = useCreateStory();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [mode, setMode] = useState<'select' | 'photo' | 'text'>('select');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [textContent, setTextContent] = useState('');
  const [backgroundColor, setBackgroundColor] = useState(BACKGROUND_COLORS[0]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('catch-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('catch-photos')
        .getPublicUrl(fileName);

      setSelectedImage(publicUrl);
      setMode('photo');
    } catch (error) {
      toast.error('Failed to upload image');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (mode === 'photo' && selectedImage) {
      await createStory.mutateAsync({
        media_url: selectedImage,
        media_type: 'image',
        text_overlay: textContent || undefined,
      });
    } else if (mode === 'text' && textContent.trim()) {
      await createStory.mutateAsync({
        media_type: 'text',
        text_overlay: textContent,
        background_color: backgroundColor,
      });
    }

    handleClose();
  };

  const handleClose = () => {
    setMode('select');
    setSelectedImage(null);
    setTextContent('');
    setBackgroundColor(BACKGROUND_COLORS[0]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-center">Create Story</DialogTitle>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {mode === 'select' && (
          <div className="p-6 space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Your story will be visible for 24 hours
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-colors"
              >
                {isUploading ? (
                  <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                ) : (
                  <Image className="h-10 w-10 text-green-500" />
                )}
                <span className="font-medium text-sm">Add Photo</span>
              </button>

              <button
                onClick={() => setMode('text')}
                className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <Type className="h-10 w-10 text-purple-500" />
                <span className="font-medium text-sm">Text Story</span>
              </button>
            </div>
          </div>
        )}

        {mode === 'photo' && selectedImage && (
          <div className="space-y-4">
            {/* Preview */}
            <div className="relative aspect-[9/16] max-h-[400px] mx-4 rounded-xl overflow-hidden bg-black">
              <img
                src={selectedImage}
                alt="Story preview"
                className="w-full h-full object-contain"
              />
              {textContent && (
                <div className="absolute bottom-4 left-4 right-4 bg-black/50 rounded-lg p-2">
                  <p className="text-white text-sm text-center">{textContent}</p>
                </div>
              )}
            </div>

            {/* Text overlay input */}
            <div className="px-4">
              <Textarea
                placeholder="Add text to your story... (optional)"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="resize-none"
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="p-4 border-t flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleSubmit}
                disabled={createStory.isPending}
              >
                {createStory.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Share Story'
                )}
              </Button>
            </div>
          </div>
        )}

        {mode === 'text' && (
          <div className="space-y-4">
            {/* Preview */}
            <div 
              className="relative aspect-[9/16] max-h-[400px] mx-4 rounded-xl overflow-hidden flex items-center justify-center p-6"
              style={{ backgroundColor }}
            >
              <Textarea
                placeholder="Type something..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="bg-transparent border-none text-white text-center text-xl font-medium placeholder:text-white/60 resize-none focus-visible:ring-0"
                rows={6}
              />
            </div>

            {/* Color picker */}
            <div className="px-4">
              <div className="flex gap-2 justify-center">
                {BACKGROUND_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setBackgroundColor(color)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                      backgroundColor === color ? "border-primary ring-2 ring-primary/30" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setMode('select')}>
                Back
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleSubmit}
                disabled={!textContent.trim() || createStory.isPending}
              >
                {createStory.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Share Story'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
