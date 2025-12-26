import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

export function NewAdventureCard() {
  const navigate = useNavigate();

  return (
    <div className="bg-card rounded-xl border border-dashed border-muted-foreground/30 p-6 flex flex-col items-center justify-center text-center min-h-[280px]">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <MapPin className="h-6 w-6 text-foreground" />
      </div>
      <h3 className="font-medium text-muted-foreground mb-2">New Adventure</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Have a match but no date yet?<br />
        Plan your next combo trip now.
      </p>
      <Button 
        variant="outline" 
        onClick={() => navigate("/app/trips/new")}
      >
        Find a Spot
      </Button>
    </div>
  );
}
