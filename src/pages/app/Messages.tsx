import { MessageCircle } from 'lucide-react';

export default function Messages() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-4">
      <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
      <h2 className="text-xl font-semibold mb-2">No messages yet</h2>
      <p className="text-muted-foreground text-center">
        Start swiping to match with others and begin chatting!
      </p>
    </div>
  );
}
