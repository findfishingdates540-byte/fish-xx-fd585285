import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { medium, thumb } from "@/lib/image-url";

export interface LightboxPhoto {
  url: string;
  label?: string;
}

interface PhotoLightboxProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string | null;
  photos: LightboxPhoto[];
  stats?: { label: string; value: string }[];
  notes?: string | null;
  footer?: React.ReactNode;
}

export function PhotoLightbox({
  open,
  onClose,
  title,
  subtitle,
  photos,
  stats = [],
  notes,
  footer,
}: PhotoLightboxProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open, title]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setIndex((i) => (photos.length ? (i + 1) % photos.length : 0));
      if (e.key === "ArrowLeft") setIndex((i) => (photos.length ? (i - 1 + photos.length) % photos.length : 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, photos.length]);

  const current = photos[index];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-6xl w-[96vw] p-0 overflow-hidden border-border/60 bg-background/95 backdrop-blur-xl animate-scale-in">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Stage */}
          <div className="relative bg-black flex items-center justify-center min-h-[46vh] lg:min-h-[72vh]">
            {current ? (
              <img
                key={current.url}
                src={medium(current.url)}
                alt={current.label || title}
                className="max-h-[46vh] lg:max-h-[72vh] w-full object-contain animate-fade-in"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-white/60 py-24">
                <ImageOff className="h-10 w-10" />
                <p className="text-sm">No photos for this entry</p>
              </div>
            )}

            {photos.length > 1 && (
              <>
                <button
                  onClick={() => setIndex((i) => (i - 1 + photos.length) % photos.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setIndex((i) => (i + 1) % photos.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                  aria-label="Next photo"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {current?.label && (
              <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                {current.label}
              </span>
            )}
            {photos.length > 1 && (
              <span className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-1 text-[11px] font-medium text-white">
                {index + 1} / {photos.length}
              </span>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col gap-4 p-5 max-h-[72vh] overflow-y-auto">
            <div>
              <h2 className="text-lg font-bold leading-tight pr-8">{title}</h2>
              {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>

            {stats.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-xl border bg-card px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                      {s.label}
                    </p>
                    <p className="text-sm font-bold mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            {notes && (
              <div className="rounded-xl border bg-card p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                  Notes
                </p>
                <p className="text-sm">{notes}</p>
              </div>
            )}

            {photos.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {photos.map((p, i) => (
                  <button
                    key={p.url + i}
                    onClick={() => setIndex(i)}
                    className={`relative rounded-lg overflow-hidden border transition-all ${
                      i === index ? "ring-2 ring-primary border-primary" : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={thumb(p.url)} alt={p.label || ""} loading="lazy" className="h-16 w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {footer}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}