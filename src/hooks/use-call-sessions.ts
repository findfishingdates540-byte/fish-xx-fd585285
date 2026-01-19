import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface CallSession {
  id: string;
  caller_id: string;
  callee_id: string;
  channel_name: string;
  call_type: 'voice' | 'video';
  status: 'ringing' | 'accepted' | 'declined' | 'ended' | 'missed' | 'busy';
  started_at: string;
  answered_at: string | null;
  ended_at: string | null;
  caller?: {
    id: string;
    display_name: string;
    photos: string[] | null;
  };
}

interface UseCallSessionsOptions {
  onIncomingCall?: (session: CallSession) => void;
  onCallEnded?: (session: CallSession) => void;
}

export function useCallSessions(options: UseCallSessionsOptions = {}) {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);

  // Create a new call session
  const createCallSession = useCallback(async (
    calleeId: string,
    channelName: string,
    callType: 'voice' | 'video'
  ): Promise<CallSession | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('call_sessions')
        .insert({
          caller_id: user.id,
          callee_id: calleeId,
          channel_name: channelName,
          call_type: callType,
          status: 'ringing',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating call session:', error);
        return null;
      }

      setActiveCall(data as CallSession);
      return data as CallSession;
    } catch (err) {
      console.error('Failed to create call session:', err);
      return null;
    }
  }, [user]);

  // Update call session status
  const updateCallStatus = useCallback(async (
    sessionId: string,
    status: CallSession['status'],
    additionalFields?: Partial<CallSession>
  ): Promise<boolean> => {
    try {
      const updateData: Record<string, unknown> = { status, ...additionalFields };
      
      if (status === 'accepted') {
        updateData.answered_at = new Date().toISOString();
      }
      if (status === 'ended' || status === 'declined' || status === 'missed') {
        updateData.ended_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('call_sessions')
        .update(updateData)
        .eq('id', sessionId);

      if (error) {
        console.error('Error updating call status:', error);
        return false;
      }

      if (status === 'ended' || status === 'declined' || status === 'missed') {
        setActiveCall(null);
        setIncomingCall(null);
      }

      return true;
    } catch (err) {
      console.error('Failed to update call status:', err);
      return false;
    }
  }, []);

  // Accept incoming call
  const acceptCall = useCallback(async (sessionId: string): Promise<boolean> => {
    const success = await updateCallStatus(sessionId, 'accepted');
    if (success && incomingCall) {
      setActiveCall(incomingCall);
      setIncomingCall(null);
    }
    return success;
  }, [updateCallStatus, incomingCall]);

  // Decline incoming call
  const declineCall = useCallback(async (sessionId: string): Promise<boolean> => {
    const success = await updateCallStatus(sessionId, 'declined');
    if (success) {
      setIncomingCall(null);
    }
    return success;
  }, [updateCallStatus]);

  // End active call
  const endCall = useCallback(async (sessionId: string): Promise<boolean> => {
    const success = await updateCallStatus(sessionId, 'ended');
    if (success) {
      setActiveCall(null);
    }
    return success;
  }, [updateCallStatus]);

  // Listen for incoming calls via realtime subscription
  useEffect(() => {
    if (!user) return;

    let channel: RealtimeChannel;

    const setupSubscription = async () => {
      channel = supabase
        .channel('call_sessions_incoming')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'call_sessions',
            filter: `callee_id=eq.${user.id}`,
          },
          async (payload) => {
            const session = payload.new as CallSession;
            
            // Fetch caller info
            const { data: callerData } = await supabase
              .from('profiles')
              .select('id, display_name, photos')
              .eq('id', session.caller_id)
              .single();

            const sessionWithCaller: CallSession = {
              ...session,
              caller: callerData || undefined,
            };

            setIncomingCall(sessionWithCaller);
            options.onIncomingCall?.(sessionWithCaller);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'call_sessions',
            filter: `callee_id=eq.${user.id}`,
          },
          (payload) => {
            const session = payload.new as CallSession;
            
            // If the call was ended/cancelled by the caller
            if (['ended', 'missed'].includes(session.status)) {
              setIncomingCall(null);
              options.onCallEnded?.(session);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'call_sessions',
            filter: `caller_id=eq.${user.id}`,
          },
          (payload) => {
            const session = payload.new as CallSession;
            
            // If the callee declined or the call ended
            if (['declined', 'ended'].includes(session.status)) {
              setActiveCall(null);
              options.onCallEnded?.(session);
            } else if (session.status === 'accepted') {
              setActiveCall(session);
            }
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user, options]);

  // Auto-expire ringing calls after 30 seconds
  useEffect(() => {
    if (!incomingCall || incomingCall.status !== 'ringing') return;

    const timeout = setTimeout(async () => {
      await updateCallStatus(incomingCall.id, 'missed');
      setIncomingCall(null);
    }, 30000);

    return () => clearTimeout(timeout);
  }, [incomingCall, updateCallStatus]);

  return {
    incomingCall,
    activeCall,
    createCallSession,
    updateCallStatus,
    acceptCall,
    declineCall,
    endCall,
  };
}
