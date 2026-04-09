import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, MapPin, Clock, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
  const [gettingLocation, setGettingLocation] = useState(false);

  const getLocation = useCallback((): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      setGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGettingLocation(false);
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          setGettingLocation(false);
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

      const capturedAt = new Date().toISOString();
      const location = await getLocation();

      onCapture({
        file,
        capturedAt,
        locationLat: location?.lat ?? null,
        locationLng: location?.lng ?? null,
      });

      // Reset input so same file can be re-captured
      if (inputRef.current) inputRef.current.value = "";
    },
    [getLocation, onCapture]
  );

  return (
    <div className={className}>
      <div
        className={`relative w-full ${aspectRatio} rounded-xl overflow-hidden bg-muted border border-border`}
      >
        {preview ? (
          <>
            <img src={preview} alt="Captured" className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
              <button
                type="button"
                disabled={disabled || gettingLocation}
                onClick={() => inputRef.current?.click()}
                className="flex flex-col items-center gap-1 text-white hover:text-white/80 transition-colors"
              >
                <Camera className="h-5 w-5" />
                <span className="text-sm font-medium">Retake Photo</span>
              </button>
            </div>
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="absolute top-3 right-3 w-7 h-7 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            disabled={disabled || gettingLocation}
            onClick={() => inputRef.current?.click()}
            className="w-full h-full flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors"
          >
            {gettingLocation ? (
              <>
                <Loader2 className="h-10 w-10 mb-2 animate-spin" />
                <span className="text-sm font-medium">Getting location...</span>
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
      {/* 
        capture="environment" forces the device camera (rear-facing).
        On desktop browsers this falls back to file picker, but mobile 
        devices will only open the camera — no gallery access.
      */}
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
