import { useState, useCallback, useRef, useEffect } from 'react';
import DailyIframe, { DailyCall, DailyParticipant, DailyEventObject } from '@daily-co/daily-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type CallType = 'voice' | 'video';
export type CallStatus = 'idle' | 'connecting' | 'connected' | 'ended' | 'error';

interface UseDailyCallOptions {
  onRemoteUserJoined?: (participant: DailyParticipant) => void;
  onRemoteUserLeft?: (participant: DailyParticipant) => void;
}

export function useDailyCall(options: UseDailyCallOptions = {}) {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [callType, setCallType] = useState<CallType | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [remoteParticipants, setRemoteParticipants] = useState<DailyParticipant[]>([]);
  const [callDuration, setCallDuration] = useState(0);

  const callObjectRef = useRef<DailyCall | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  // Cleanup call object
  const cleanupCall = useCallback(async () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (callObjectRef.current) {
      try {
        await callObjectRef.current.leave();
        await callObjectRef.current.destroy();
      } catch (e) {
        console.error('Error cleaning up Daily call:', e);
      }
      callObjectRef.current = null;
    }
  }, []);

  // Create room and get token from edge function
  const createRoom = useCallback(async (
    roomName: string,
    type: CallType
  ): Promise<{ roomUrl: string; token: string } | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('create-daily-room', {
        body: { roomName, callType: type },
      });

      if (error) {
        console.error('Error creating Daily room:', error);
        toast.error('Failed to create call room');
        return null;
      }

      return { roomUrl: data.roomUrl, token: data.token };
    } catch (err) {
      console.error('Failed to create Daily room:', err);
      toast.error('Failed to reach call service');
      return null;
    }
  }, []);

  // Start a call
  const startCall = useCallback(async (channelName: string, type: CallType, _userId: string) => {
    try {
      setCallStatus('connecting');
      setCallType(type);
      setIsVideoEnabled(type === 'video');

      // Create room
      const roomData = await createRoom(channelName, type);
      if (!roomData) {
        setCallStatus('error');
        return false;
      }

      // Create Daily call object
      const callObject = DailyIframe.createCallObject({
        audioSource: true,
        videoSource: type === 'video',
      });

      callObjectRef.current = callObject;

      // Set up event handlers
      callObject.on('joined-meeting', () => {
        console.log('[Daily] Joined meeting');
        setCallStatus('connected');
        
        // Start duration timer
        durationIntervalRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);
      });

      callObject.on('participant-joined', (event: DailyEventObject) => {
        if (event?.participant && !event.participant.local) {
          console.log('[Daily] Remote participant joined:', event.participant.user_id);
          setRemoteParticipants(prev => [...prev, event.participant!]);
          options.onRemoteUserJoined?.(event.participant);
        }
      });

      callObject.on('participant-left', (event: DailyEventObject) => {
        if (event?.participant && !event.participant.local) {
          console.log('[Daily] Remote participant left:', event.participant.user_id);
          setRemoteParticipants(prev => 
            prev.filter(p => p.session_id !== event.participant!.session_id)
          );
          options.onRemoteUserLeft?.(event.participant);
        }
      });

      callObject.on('left-meeting', () => {
        console.log('[Daily] Left meeting');
        setCallStatus('ended');
      });

      callObject.on('error', (event) => {
        console.error('[Daily] Error:', event);
        toast.error('Call error occurred');
        setCallStatus('error');
      });

      // Join the room with token
      await callObject.join({
        url: roomData.roomUrl,
        token: roomData.token,
        startVideoOff: type === 'voice',
        startAudioOff: false,
      });

      return true;
    } catch (error) {
      console.error('Error starting Daily call:', error);
      toast.error('Failed to start call');
      setCallStatus('error');
      await cleanupCall();
      return false;
    }
  }, [createRoom, options, cleanupCall]);

  // End call
  const endCall = useCallback(async () => {
    try {
      await cleanupCall();
      setCallStatus('ended');
      setRemoteParticipants([]);
      setCallDuration(0);
      setCallType(null);
      setIsMuted(false);
      setIsVideoEnabled(true);

      // Reset to idle after a brief delay
      setTimeout(() => setCallStatus('idle'), 500);
    } catch (error) {
      console.error('Error ending call:', error);
    }
  }, [cleanupCall]);

  // Toggle mute
  const toggleMute = useCallback(async () => {
    if (callObjectRef.current) {
      const newMuted = !isMuted;
      callObjectRef.current.setLocalAudio(!newMuted);
      setIsMuted(newMuted);
    }
  }, [isMuted]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    if (callObjectRef.current) {
      const newEnabled = !isVideoEnabled;
      callObjectRef.current.setLocalVideo(newEnabled);
      setIsVideoEnabled(newEnabled);
    }
  }, [isVideoEnabled]);

  // Get local video track for display
  const attachLocalVideo = useCallback((videoElement: HTMLVideoElement | null) => {
    localVideoRef.current = videoElement;
    if (callObjectRef.current && videoElement) {
      const localParticipant = callObjectRef.current.participants().local;
      if (localParticipant?.tracks?.video?.persistentTrack) {
        const stream = new MediaStream([localParticipant.tracks.video.persistentTrack]);
        videoElement.srcObject = stream;
      }
    }
  }, []);

  // Get remote video track for display
  const attachRemoteVideo = useCallback((videoElement: HTMLVideoElement | null, participantId?: string) => {
    if (callObjectRef.current && videoElement) {
      const participants = callObjectRef.current.participants();
      const remote = participantId 
        ? Object.values(participants).find(p => p.session_id === participantId && !p.local)
        : Object.values(participants).find(p => !p.local);
      
      if (remote?.tracks?.video?.persistentTrack) {
        const stream = new MediaStream([remote.tracks.video.persistentTrack]);
        videoElement.srcObject = stream;
      }
    }
  }, []);

  // Attach remote audio automatically
  useEffect(() => {
    if (callObjectRef.current && callStatus === 'connected') {
      const participants = callObjectRef.current.participants();
      Object.values(participants).forEach(participant => {
        if (!participant.local && participant.tracks?.audio?.persistentTrack) {
          const audioEl = document.createElement('audio');
          audioEl.autoplay = true;
          const stream = new MediaStream([participant.tracks.audio.persistentTrack]);
          audioEl.srcObject = stream;
          document.body.appendChild(audioEl);
        }
      });
    }
  }, [callStatus, remoteParticipants]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupCall();
    };
  }, [cleanupCall]);

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    callStatus,
    callType,
    isMuted,
    isVideoEnabled,
    remoteParticipants,
    callDuration,
    formattedDuration: formatDuration(callDuration),
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    attachLocalVideo,
    attachRemoteVideo,
  };
}
