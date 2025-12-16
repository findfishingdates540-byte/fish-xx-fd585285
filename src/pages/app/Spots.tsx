import { MapPin } from 'lucide-react';

export default function Spots() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-4">
      <MapPin className="h-16 w-16 text-muted-foreground mb-4" />
      <h2 className="text-xl font-semibold mb-2">Fishing Spots</h2>
      <p className="text-muted-foreground text-center">
        Discover fishing spots near you. Map coming soon!
      </p>
    </div>
  );
}
