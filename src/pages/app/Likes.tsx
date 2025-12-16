import { Heart } from 'lucide-react';

export default function Likes() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-4">
      <Heart className="h-16 w-16 text-muted-foreground mb-4" />
      <h2 className="text-xl font-semibold mb-2">No likes yet</h2>
      <p className="text-muted-foreground text-center">
        When someone likes your profile, they'll appear here.
      </p>
    </div>
  );
}
