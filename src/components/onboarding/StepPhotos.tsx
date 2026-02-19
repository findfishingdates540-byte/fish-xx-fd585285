import { useRef, useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ImageCropModal } from "@/components/ui/image-crop-modal";

interface StepPhotosProps {
  photos: string[];
  setPhotos: (photos: string[]) => void;
  userId: string;
  maxPhotos?: number;
  minPhotos?: number;
}

export function StepPhotos({
  photos,
  setPhotos,
  userId,
  maxPhotos = 6,
  minPhotos = 1,
}: StepPhotosProps) {
  const [uploading, setUploading] = useState<number | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<number>(0);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file type", description: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image under 5MB", variant: "destructive" });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setUploading(activeSlot);
    try {
      const fileName = `${userId}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, croppedBlob, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      const newPhotos = [...photos];
      newPhotos[activeSlot] = publicUrl;
      setPhotos(newPhotos.filter(Boolean));

      toast({ title: "Photo uploaded", description: "Your photo has been added successfully" });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message || "Failed to upload photo", variant: "destructive" });
    } finally {
      setUploading(null);
      if (cropSrc) URL.revokeObjectURL(cropSrc);
      setCropSrc(null);
    }
  };

  const handleRemovePhoto = async (index: number) => {
    const photoUrl = photos[index];
    if (!photoUrl) return;

    try {
      // Extract file path from URL
      const urlParts = photoUrl.split('/profile-photos/');
      if (urlParts[1]) {
        await supabase.storage
          .from('profile-photos')
          .remove([urlParts[1]]);
      }

      const newPhotos = photos.filter((_, i) => i !== index);
      setPhotos(newPhotos);
    } catch (error) {
      console.error('Error removing photo:', error);
    }
  };

  const handleSlotClick = (index: number) => {
    setActiveSlot(index);
    fileInputRef.current?.click();
  };

  return (
    <>
      {cropSrc && (
        <ImageCropModal
          open={!!cropSrc}
          onClose={() => { if (cropSrc) URL.revokeObjectURL(cropSrc); setCropSrc(null); }}
          imageSrc={cropSrc}
          onCropComplete={handleCropComplete}
          aspectRatio={3 / 4}
          title="Position Your Photo"
        />
      )}
      <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Add at least {minPhotos} photo{minPhotos > 1 ? 's' : ''} (up to {maxPhotos})
        </p>
        <p className="text-sm font-medium text-foreground">
          {photos.length}/{maxPhotos}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: maxPhotos }).map((_, index) => {
          const photo = photos[index];
          const isUploading = uploading === index;

          return (
            <div
              key={index}
              className={cn(
                "relative aspect-[3/4] rounded-lg border-2 border-dashed overflow-hidden transition-all duration-200",
                photo ? "border-transparent" : "border-border hover:border-foreground/50",
                index === 0 && "col-span-2 row-span-2"
              )}
            >
              {photo ? (
                <>
                  <img
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background transition-colors"
                  >
                    <X className="w-4 h-4 text-foreground" />
                  </button>
                  {index === 0 && (
                    <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-foreground text-background text-xs font-medium">
                      Main photo
                    </div>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSlotClick(index)}
                  disabled={isUploading}
                  className="w-full h-full flex flex-col items-center justify-center gap-2 hover:bg-secondary/50 transition-colors"
                >
                  {isUploading ? (
                    <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-8 h-8 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {index === 0 ? 'Add main photo' : 'Add photo'}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-xs text-muted-foreground text-center">
        Tip: Your first photo will be shown prominently on your profile
      </p>
    </div>
    </>
  );
}
