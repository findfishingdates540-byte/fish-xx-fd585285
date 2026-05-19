import { Share2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useState } from 'react';

export function InviteFriendsCard() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleShareInvite = async () => {
    const PRODUCTION_URL = 'https://fish-x.com';
    const inviteUrl = `${PRODUCTION_URL}?ref=${user?.id?.slice(0, 8)}`;
    const shareData = {
      title: 'Join me on FishX!',
      text: 'Find fishing buddies and connect with anglers who share your passion.',
      url: inviteUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        toast.success('Invite link copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      // User cancelled share or error occurred
      if ((error as Error).name !== 'AbortError') {
        await navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        toast.success('Invite link copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <div className="bg-background rounded-xl border p-4">
      <div className="flex items-center gap-2 mb-2">
        <Share2 className="h-4 w-4 text-cyan-500" />
        <h3 className="font-semibold text-sm">Invite Friends</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Share the app with your fishing crew!
      </p>
      <Button 
        onClick={handleShareInvite} 
        size="sm" 
        className="w-full gap-2"
        variant="outline"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copy Invite Link
          </>
        )}
      </Button>
    </div>
  );
}
