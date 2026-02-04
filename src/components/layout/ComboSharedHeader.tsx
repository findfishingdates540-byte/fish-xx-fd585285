import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

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
        
        <Link to="/app/dashboard" className="flex items-center">
          <img src={logo} alt="FFD" className="h-10 w-auto" />
        </Link>
      </div>
    </header>
  );
}
