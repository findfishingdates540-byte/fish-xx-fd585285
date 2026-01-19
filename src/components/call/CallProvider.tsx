import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useCallSessions, CallSession } from '@/hooks/use-call-sessions';
import { useAuth } from '@/contexts/AuthContext';
import { IncomingCallOverlay } from './IncomingCallOverlay';
import { VoiceCallModal } from './VoiceCallModal';
import { VideoCallModal } from './VideoCallModal';
import { toast } from 'sonner';

interface CallContextType {
  startCall: (calleeId: string, calleeName: string, calleePhoto: string | undefined, channelName: string, callType: 'voice' | 'video') => Promise<void>;
  isInCall: boolean;
}

const CallContext = createContext<CallContextType | null>(null);

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}

interface CallProviderProps {
  children: ReactNode;
}

export function CallProvider({ children }: CallProviderProps) {
  const { user } = useAuth();
  const [outgoingCallOpen, setOutgoingCallOpen] = useState(false);
  const [outgoingCallType, setOutgoingCallType] = useState<'voice' | 'video'>('voice');
  const [outgoingCallChannel, setOutgoingCallChannel] = useState('');
  const [outgoingCalleeInfo, setOutgoingCalleeInfo] = useState<{ name: string; photo?: string }>({ name: '' });
  const [activeSession, setActiveSession] = useState<CallSession | null>(null);
  
  // Incoming call state (answered)
  const [answeredCallOpen, setAnsweredCallOpen] = useState(false);
  const [answeredCallType, setAnsweredCallType] = useState<'voice' | 'video'>('voice');
  const [answeredCallChannel, setAnsweredCallChannel] = useState('');
  const [answeredCallerInfo, setAnsweredCallerInfo] = useState<{ name: string; photo?: string }>({ name: '' });

  const handleIncomingCall = useCallback((session: CallSession) => {
    // Play notification sound
    try {
      const audio = new Audio();
      audio.src = 'data:audio/wav;base64,UklGRl9vT19teleRBJAQEZXRhAAAA';
      audio.play().catch(() => {});
    } catch {}
  }, []);

  const handleCallEnded = useCallback((session: CallSession) => {
    if (session.status === 'declined') {
      toast.error('Call was declined');
    } else if (session.status === 'missed') {
      toast.info('Call was not answered');
    }
    setOutgoingCallOpen(false);
    setAnsweredCallOpen(false);
    setActiveSession(null);
  }, []);

  const {
    incomingCall,
    activeCall,
    createCallSession,
    acceptCall,
    declineCall,
    endCall,
  } = useCallSessions({
    onIncomingCall: handleIncomingCall,
    onCallEnded: handleCallEnded,
  });

  // Start an outgoing call
  const startCall = useCallback(async (
    calleeId: string,
    calleeName: string,
    calleePhoto: string | undefined,
    channelName: string,
    callType: 'voice' | 'video'
  ) => {
    if (!user) {
      toast.error('You must be logged in to make calls');
      return;
    }

    // Create call session in database
    const session = await createCallSession(calleeId, channelName, callType);
    if (!session) {
      toast.error('Failed to initiate call');
      return;
    }

    setActiveSession(session);
    setOutgoingCallType(callType);
    setOutgoingCallChannel(channelName);
    setOutgoingCalleeInfo({ name: calleeName, photo: calleePhoto });
    setOutgoingCallOpen(true);
  }, [user, createCallSession]);

  // Handle accepting incoming call
  const handleAcceptCall = useCallback(async () => {
    if (!incomingCall) return;

    const success = await acceptCall(incomingCall.id);
    if (success) {
      setAnsweredCallType(incomingCall.call_type);
      setAnsweredCallChannel(incomingCall.channel_name);
      setAnsweredCallerInfo({
        name: incomingCall.caller?.display_name || 'Unknown',
        photo: incomingCall.caller?.photos?.[0],
      });
      setActiveSession(incomingCall);
      setAnsweredCallOpen(true);
    } else {
      toast.error('Failed to accept call');
    }
  }, [incomingCall, acceptCall]);

  // Handle declining incoming call
  const handleDeclineCall = useCallback(async () => {
    if (!incomingCall) return;
    await declineCall(incomingCall.id);
  }, [incomingCall, declineCall]);

  // Handle ending outgoing call
  const handleEndOutgoingCall = useCallback(async (open: boolean) => {
    if (!open && activeSession) {
      await endCall(activeSession.id);
    }
    setOutgoingCallOpen(open);
    if (!open) {
      setActiveSession(null);
    }
  }, [activeSession, endCall]);

  // Handle ending answered call
  const handleEndAnsweredCall = useCallback(async (open: boolean) => {
    if (!open && activeSession) {
      await endCall(activeSession.id);
    }
    setAnsweredCallOpen(open);
    if (!open) {
      setActiveSession(null);
    }
  }, [activeSession, endCall]);

  const isInCall = outgoingCallOpen || answeredCallOpen || !!incomingCall;

  return (
    <CallContext.Provider value={{ startCall, isInCall }}>
      {children}

      {/* Incoming Call Overlay */}
      <IncomingCallOverlay
        call={incomingCall}
        onAccept={handleAcceptCall}
        onDecline={handleDeclineCall}
      />

      {/* Outgoing Call Modals */}
      {outgoingCallType === 'voice' ? (
        <VoiceCallModal
          open={outgoingCallOpen}
          onOpenChange={handleEndOutgoingCall}
          channelName={outgoingCallChannel}
          userId={user?.id || ''}
          remoteUserName={outgoingCalleeInfo.name}
          remoteUserPhoto={outgoingCalleeInfo.photo}
        />
      ) : (
        <VideoCallModal
          open={outgoingCallOpen}
          onOpenChange={handleEndOutgoingCall}
          channelName={outgoingCallChannel}
          userId={user?.id || ''}
          remoteUserName={outgoingCalleeInfo.name}
          remoteUserPhoto={outgoingCalleeInfo.photo}
        />
      )}

      {/* Answered Call Modals */}
      {answeredCallType === 'voice' ? (
        <VoiceCallModal
          open={answeredCallOpen}
          onOpenChange={handleEndAnsweredCall}
          channelName={answeredCallChannel}
          userId={user?.id || ''}
          remoteUserName={answeredCallerInfo.name}
          remoteUserPhoto={answeredCallerInfo.photo}
        />
      ) : (
        <VideoCallModal
          open={answeredCallOpen}
          onOpenChange={handleEndAnsweredCall}
          channelName={answeredCallChannel}
          userId={user?.id || ''}
          remoteUserName={answeredCallerInfo.name}
          remoteUserPhoto={answeredCallerInfo.photo}
        />
      )}
    </CallContext.Provider>
  );
}
