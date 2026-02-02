import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ComboSharedHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background border-b">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <Link to="/app/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        
        <Link to="/app/dashboard" className="font-bold text-xl tracking-tight">
          FFD
        </Link>
      </div>
    </header>
  );
}
