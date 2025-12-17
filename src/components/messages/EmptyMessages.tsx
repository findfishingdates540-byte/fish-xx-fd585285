import { Fish, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export function EmptyMessages() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-accent/20">
      {/* Fish illustration */}
      <div className="relative mb-8">
        <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
            <Fish className="h-12 w-12 text-primary" />
          </div>
        </div>
        <div className="absolute -top-1 -right-1 bg-primary rounded-full p-1.5">
          <Heart className="h-4 w-4 text-primary-foreground fill-current" />
        </div>
      </div>

      {/* Text */}
      <h2 className="text-2xl font-bold mb-3">Reel in a connection!</h2>
      <p className="text-muted-foreground text-center max-w-sm mb-6">
        Select a match from the left to start chatting or plan your next fishing date. 
        There are plenty of fish in the sea!
      </p>

      {/* CTA Button */}
      <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground px-6">
        <Link to="/app/discover">
          <Fish className="h-4 w-4 mr-2" />
          Find New Matches
        </Link>
      </Button>
    </div>
  );
}
