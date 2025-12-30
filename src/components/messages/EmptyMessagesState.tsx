import { Heart } from 'lucide-react';

export function EmptyMessagesState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      {/* Card Stack Illustration */}
      <div className="relative w-48 h-56 mb-6">
        {/* Back cards (stacked effect) */}
        <div className="absolute top-4 left-4 w-36 h-48 bg-muted rounded-2xl transform rotate-6 border border-border" />
        <div className="absolute top-2 left-2 w-36 h-48 bg-muted/80 rounded-2xl transform rotate-3 border border-border" />
        
        {/* Main card */}
        <div className="absolute top-0 left-0 w-36 h-48 bg-gradient-to-b from-muted to-muted/60 rounded-2xl flex items-center justify-center overflow-hidden border border-border">
          {/* Abstract profile silhouette */}
          <div className="w-20 h-20 rounded-full bg-muted-foreground/20 mt-[-20px]" />
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-muted-foreground/10" />
          
          {/* LIKE stamp */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="transform -rotate-12 border-4 border-green-500 text-green-500 text-xl font-black px-4 py-1 rounded-lg tracking-wider">
              LIKE
            </div>
          </div>
        </div>
        
        {/* Floating hearts */}
        <Heart className="absolute -top-2 -right-2 h-6 w-6 text-pink-500 fill-pink-500 animate-pulse" />
        <Heart className="absolute top-8 -right-4 h-4 w-4 text-pink-400 fill-pink-400 animate-pulse delay-100" />
      </div>
      
      {/* Text */}
      <h2 className="text-xl font-bold mb-2">Get Swiping</h2>
      <p className="text-muted-foreground text-center max-w-xs text-sm leading-relaxed">
        When you match with other anglers they'll appear here where you can send them a message.
      </p>
    </div>
  );
}
