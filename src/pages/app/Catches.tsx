import { Fish } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function Catches() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-4">
      <Fish className="h-16 w-16 text-muted-foreground mb-4" />
      <h2 className="text-xl font-semibold mb-2">Your Catches</h2>
      <p className="text-muted-foreground text-center mb-6">
        Log your catches and track your fishing journey.
      </p>
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Log a Catch
      </Button>
    </div>
  );
}
