import { useRef, useState, useCallback } from "react";
import { Video, MapPin, Clock, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getCurrentPosition } from "@/lib/location";

export interface VideoCaptureMetadata {
  file: File;
  capturedAt: string;
  locationLat: number | null;
  locationLng: number | null;
}

interface LiveVideoCaptureProps {
  onCapture: (data: VideoCaptureMetadata) => void;
  preview?: string | null;
  onClear?: () => void;
  label?: string;
  sublabel?: string;
  disabled?: boolean;
  className?: string;
  aspectRatio?: string;
  /** Soft size cap in MB (default 200 ~ short 2K clip) */
  maxSizeMb?: number;
}

export function LiveVideoCapture({
  onCapture,
  preview,
  onClear,
  label = "Record Action Clip",
  sublabel = "Camera only — capture the moment of the catch",
  disabled = false,
  className = "",
  aspectRatio = "aspect-[16/10]",
  maxSizeMb = 200,
}: LiveVideoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const getLocation = useCallback(async (): Promise<{ lat: number; lng: number } | null> => {
    try {
      return await getCurrentPosition();
    } catch {
      return null;
    }
  }, []);

  const handleCapture = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const sizeMb = file.size / (1024 * 1024);
      if (sizeMb > maxSizeMb) {
        toast.error(`Video too large (${sizeMb.toFixed(1)}MB). Max ${maxSizeMb}MB.`);
        if (inputRef.current) inputRef.current.value = "";
        return;
      }

      setProcessing(true);
      const capturedAt = new Date().toISOString();

      try {
        const location = await getLocation();
        const url = URL.createObjectURL(file);
        setLocalPreview(url);

        onCapture({
          file,
          capturedAt,
          locationLat: location?.lat ?? null,
          locationLng: location?.lng ?? null,
        });
      } finally {
        setProcessing(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [getLocation, onCapture, maxSizeMb]
  );

  const handleClear = useCallback(() => {
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
    onClear?.();
  }, [onClear, localPreview]);

  const displayPreview = localPreview || preview;

  return (
    <div className={className}>
      <div
        className={`relative w-full ${aspectRatio} rounded-xl overflow-hidden bg-muted border border-border`}
      >
        {displayPreview ? (
          <>
            <video
              src={displayPreview}
              className="w-full h-full object-cover"
              controls
              playsInline
              preload="metadata"
            />
            {onClear && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-3 right-3 w-7 h-7 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors z-10"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            )}
            <button
              type="button"
              disabled={disabled || processing}
              onClick={() => inputRef.current?.click()}
              className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-black/70 hover:bg-black/90 text-white text-xs font-medium flex items-center gap-1.5 z-10"
            >
              <Video className="h-3.5 w-3.5" />
              Retake
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={disabled || processing}
            onClick={() => inputRef.current?.click()}
            className="w-full h-full flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors"
          >
            {processing ? (
              <>
                <Loader2 className="h-10 w-10 mb-2 animate-spin" />
                <span className="text-sm font-medium">Processing video...</span>
              </>
            ) : (
              <>
                <Video className="h-10 w-10 mb-2" />
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs text-muted-foreground mt-1">{sublabel}</span>
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Auto timestamp
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Auto GPS
                  </span>
                </div>
              </>
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        capture="environment"
        className="hidden"
        onChange={handleCapture}
      />
    </div>
  );
}
