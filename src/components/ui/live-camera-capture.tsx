import { useRef, useState, useCallback } from "react";
import { Camera, MapPin, Clock, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { applyWatermark } from "@/utils/photo-watermark";
import { reverseGeocode } from "@/utils/reverse-geocode";

export interface CaptureMetadata {
  file: File;
  capturedAt: string; // ISO string
  locationLat: number | null;
  locationLng: number | null;
}

interface LiveCameraCaptureProps {
  onCapture: (data: CaptureMetadata) => void;
  preview?: string | null;
  onClear?: () => void;
  label?: string;
  sublabel?: string;
  disabled?: boolean;
  className?: string;
  aspectRatio?: string;
}

export function LiveCameraCapture({
  onCapture,
  preview,
  onClear,
  label = "Take a Live Photo",
  sublabel = "Camera only — gallery uploads are not allowed",
  disabled = false,
  className = "",
  aspectRatio = "aspect-[16/10]",
}: LiveCameraCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [watermarkedPreview, setWatermarkedPreview] = useState<string | null>(null);

  const getLocation = useCallback((): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {
          toast.warning("Location unavailable — photo will be saved without GPS.");
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, []);

  const handleCapture = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setProcessing(true);
      const capturedAt = new Date().toISOString();

      try {
        const location = await getLocation();

        // Reverse geocode if we have coords
        const locData = location
          ? await reverseGeocode(location.lat, location.lng)
          : undefined;

        // Apply watermark
        const { file: watermarkedFile, previewUrl } = await applyWatermark(
          file,
          capturedAt,
          locData
        );

        setWatermarkedPreview(previewUrl);

        onCapture({
          file: watermarkedFile,
          capturedAt,
          locationLat: location?.lat ?? null,
          locationLng: location?.lng ?? null,
        });
      } catch (err) {
        console.error("Watermark failed, using original:", err);
        // Fallback: return original file without watermark
        onCapture({
          file,
          capturedAt,
          locationLat: null,
          locationLng: null,
        });
      } finally {
        setProcessing(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [getLocation, onCapture]
  );

  const handleClear = useCallback(() => {
    setWatermarkedPreview(null);
    onClear?.();
  }, [onClear]);

  // Use watermarked preview if available, otherwise fall back to passed preview
  const displayPreview = watermarkedPreview || preview;

  return (
    <div className={className}>
      <div
        className={`relative w-full ${aspectRatio} rounded-xl overflow-hidden bg-muted border border-border`}
      >
        {displayPreview ? (
          <>
            <img src={displayPreview} alt="Captured" className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
              <button
                type="button"
                disabled={disabled || processing}
                onClick={() => inputRef.current?.click()}
                className="flex flex-col items-center gap-1 text-white hover:text-white/80 transition-colors"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm font-medium">Processing...</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-5 w-5" />
                    <span className="text-sm font-medium">Retake Photo</span>
                  </>
                )}
              </button>
            </div>
            {onClear && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-3 right-3 w-7 h-7 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            )}
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
                <span className="text-sm font-medium">Adding watermark...</span>
              </>
            ) : (
              <>
                <Camera className="h-10 w-10 mb-2" />
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
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCapture}
      />
    </div>
  );
}
