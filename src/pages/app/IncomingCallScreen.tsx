import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCallSessions, CallSession } from '@/hooks/use-call-sessions';
import { useCall } from '@/components/call';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

type CallStatus = 'loading' | 'ringing' | 'ended' | 'error';

export default function IncomingCallScreen() {
  const { callId } = useParams<{ callId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { acceptCall, declineCall } = useCallSessions();
  const { startCall } = useCall();
  
  const [status, setStatus] = useState<CallStatus>('loading');
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [caller, setCaller] = useState<{ id: string; display_name: string; photos: string[] | null } | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  // Fetch call session on mount
  useEffect(() => {
    if (!callId || !user) return;

    const fetchCallSession = async () => {
      try {
        const { data: session, error } = await supabase
          .from('call_sessions')
          .select('*')
          .eq('id', callId)
          .single();

        if (error || !session) {
          console.error('Failed to fetch call session:', error);
          setStatus('error');
          return;
        }

        // Check if user is the callee
        if (session.callee_id !== user.id) {
          console.error('User is not the callee for this call');
          setStatus('error');
          return;
        }

        // Fetch caller profile
        const { data: callerData } = await supabase
          .from('profiles')
          .select('id, display_name, photos')
          .eq('id', session.caller_id)
          .single();

        setCaller(callerData);
        setCallSession(session as CallSession);

        if (session.status === 'ringing') {
          setStatus('ringing');
        } else {
          setStatus('ended');
        }
      } catch (err) {
        console.error('Error fetching call session:', err);
        setStatus('error');
      }
    };

    fetchCallSession();
  }, [callId, user]);

  // Subscribe to call status changes
  useEffect(() => {
    if (!callId) return;

    const channel = supabase
      .channel(`call_screen_${callId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'call_sessions',
          filter: `id=eq.${callId}`,
        },
        (payload) => {
          const updated = payload.new as CallSession;
          setCallSession(updated);
          
          if (['ended', 'declined', 'missed'].includes(updated.status)) {
            setStatus('ended');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [callId]);

  // Play ringtone
  useEffect(() => {
    if (status !== 'ringing') return;

    const audio = new Audio('/ringtone.mp3');
    audio.loop = true;
    audio.play().catch(() => {});

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [status]);

  const handleAccept = async () => {
    if (!callSession || !caller) return;
    
    setIsAccepting(true);
    const success = await acceptCall(callSession.id);
    
    if (success) {
      // Start the call using CallProvider - note: startCall args are (calleeId, calleeName, calleePhoto, channelName, callType)
      const callType: 'voice' | 'video' = callSession.call_type === 'video' ? 'video' : 'voice';
      await startCall(
        caller.id,
        caller.display_name,
        caller.photos?.[0] || undefined,
        callSession.channel_name,
        callType
      );
      navigate('/app/messages');
    } else {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!callSession) return;
    await declineCall(callSession.id);
    navigate(-1);
  };

  const callerPhoto = caller?.photos?.[0];
  const callerName = caller?.display_name || 'Unknown';
  const isVideoCall = callSession?.call_type === 'video';

  if (status === 'loading') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <p className="text-lg text-muted-foreground">Call not found or you don't have access.</p>
        <Button onClick={() => navigate('/app/messages')}>Go to Messages</Button>
      </div>
    );
  }

  if (status === 'ended') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <Avatar className="h-24 w-24">
          <AvatarImage src={callerPhoto} alt={callerName} />
          <AvatarFallback className="text-2xl">{callerName[0]}</AvatarFallback>
        </Avatar>
        <p className="text-xl font-medium">{callerName}</p>
        <p className="text-muted-foreground">Call ended</p>
        <div className="mt-4 flex gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
          <Button onClick={() => navigate('/app/call-history')}>Call History</Button>
        </div>
      </div>
    );
  }

  // Ringing state - full screen incoming call UI
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-primary/20 via-background to-background"
      >
        <div className="flex flex-col items-center gap-6 p-6">
          {/* Caller Avatar with pulse animation */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="relative"
          >
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
            <Avatar className="h-32 w-32 border-4 border-primary/50">
              <AvatarImage src={callerPhoto} alt={callerName} />
              <AvatarFallback className="text-4xl bg-primary/20">{callerName[0]}</AvatarFallback>
            </Avatar>
          </motion.div>

          {/* Caller name and status */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold">{callerName}</h2>
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="mt-1 text-muted-foreground"
            >
              Incoming {isVideoCall ? 'video' : 'voice'} call...
            </motion.p>
          </div>

          {/* Action buttons */}
          <div className="mt-8 flex items-center gap-8">
            {/* Decline */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDecline}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg"
            >
              <PhoneOff className="h-7 w-7" />
            </motion.button>

            {/* Accept */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAccept}
              disabled={isAccepting}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white shadow-lg disabled:opacity-50"
            >
              {isAccepting ? (
                <Loader2 className="h-7 w-7 animate-spin" />
              ) : isVideoCall ? (
                <Video className="h-7 w-7" />
              ) : (
                <Phone className="h-7 w-7" />
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
