import { Users } from 'lucide-react';

export default function Buddies() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-4">
      <Users className="h-16 w-16 text-muted-foreground mb-4" />
      <h2 className="text-xl font-semibold mb-2">Fishing Buddies</h2>
      <p className="text-muted-foreground text-center">
        Find fishing buddies in your area to fish together.
      </p>
    </div>
  );
}
