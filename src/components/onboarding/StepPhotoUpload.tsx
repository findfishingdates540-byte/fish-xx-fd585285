import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Camera, Check, X, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StepPhotoUploadProps {
  photos: string[];
  setPhotos: (photos: string[]) => void;
  userId: string;
}

const guidelines = {
  do: [
    { title: 'Clear face view', desc: 'Make sure your smile is visible!' },
    { title: 'Good lighting', desc: 'Natural sunlight works best.' },
  ],
  dont: [
    { title: 'No group photos', desc: 'It should be clear who you are.' },
    { title: 'No sunglasses or hats', desc: "Unless you're holding a really big fish!" },
  ],
};

export function StepPhotoUpload({ photos, setPhotos, userId }: StepPhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0 || !userId) return;

    const file = files[0];
    
    if (!file.type.startsWith('image/')) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be less than 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      setPhotos([...photos, publicUrl]);
      toast({ title: "Photo uploaded successfully!" });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async (index: number) => {
    const photoUrl = photos[index];
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);

    try {
      const path = photoUrl.split('/profile-photos/')[1];
      if (path) {
        await supabase.storage.from('profile-photos').remove([path]);
      }
    } catch (error) {
      console.error('Error removing photo:', error);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Upload Area */}
        <div className="flex-1">
          {photos.length > 0 ? (
            <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-border">
              <img
                src={photos[0]}
                alt="Profile photo"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => handleRemovePhoto(0)}
                className="absolute top-3 right-3 p-2 bg-background/80 rounded-full hover:bg-background transition-colors"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>
          ) : (
            <div
              className={`relative aspect-square rounded-2xl border-2 border-dashed transition-all duration-200 ${
                dragActive ? 'border-primary bg-primary/5' : 'border-border'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1 text-center">
                  Drag & drop your photo
                </h3>
                <p className="text-sm text-muted-foreground mb-6 text-center">
                  Supports JPG, PNG (Max 5MB)
                </p>
                <div className="flex flex-col gap-3 w-full max-w-[220px]">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
                  >
                    <Upload className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{uploading ? 'Uploading...' : 'Upload from Computer'}</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full"
                  >
                    <Camera className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>Take a New Photo</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Guidelines */}
        <div className="lg:w-80 p-5 rounded-2xl bg-primary/5 border border-primary/10">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Photo Guidelines</h3>
          </div>
          
          <div className="space-y-4">
            {guidelines.do.map((item, i) => (
              <div key={i} className="flex gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
            
            <div className="border-t border-border my-3" />
            
            {guidelines.dont.map((item, i) => (
              <div key={i} className="flex gap-3">
                <X className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
