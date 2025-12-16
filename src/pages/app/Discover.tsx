import { Heart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Discover() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-4">
      <div className="w-full max-w-sm aspect-[3/4] bg-muted rounded-2xl flex items-center justify-center border border-border">
        <p className="text-muted-foreground">Swipe cards coming soon</p>
      </div>
      
      <div className="flex items-center gap-6 mt-6">
        <Button
          size="lg"
          variant="outline"
          className="h-16 w-16 rounded-full border-2"
        >
          <X className="h-8 w-8" />
        </Button>
        <Button
          size="lg"
          className="h-16 w-16 rounded-full"
        >
          <Heart className="h-8 w-8" />
        </Button>
      </div>
    </div>
  );
}
