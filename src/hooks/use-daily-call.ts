import { useState, useCallback, useRef, useEffect } from 'react';
import DailyIframe, { DailyCall, DailyParticipant, DailyEventObjectParticipant, DailyEventObjectParticipantLeft, DailyEventObjectTrack } from '@daily-co/daily-js';
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
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const audioElementsRef = useRef<HTMLAudioElement[]>([]);

  // Cleanup call object
  const cleanupCall = useCallback(async () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    // Remove any audio elements we created
    audioElementsRef.current.forEach(el => {
      el.srcObject = null;
      el.remove();
    });
    audioElementsRef.current = [];

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
      // Add timestamp to room name to make it unique per call session
      const uniqueRoomName = `${roomName}-${Date.now()}`;
      
      const { data, error } = await supabase.functions.invoke('create-daily-room', {
        body: { roomName: uniqueRoomName, callType: type },
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

  // Play remote audio for a participant
  const playRemoteAudio = useCallback((participant: DailyParticipant) => {
    if (participant.local) return;
    
    const audioTrack = participant.tracks?.audio;
    if (audioTrack?.persistentTrack && audioTrack.state === 'playable') {
      // Check if we already have an audio element for this participant
      const existingEl = document.getElementById(`audio-${participant.session_id}`);
      if (existingEl) return;

      const audioEl = document.createElement('audio');
      audioEl.id = `audio-${participant.session_id}`;
      audioEl.autoplay = true;
      audioEl.setAttribute('playsinline', 'true');
      
      const stream = new MediaStream([audioTrack.persistentTrack]);
      audioEl.srcObject = stream;
      document.body.appendChild(audioEl);
      audioElementsRef.current.push(audioEl);
      
      console.log('[Daily] Playing audio for participant:', participant.session_id);
    }
  }, []);

  // Update remote video display
  const updateRemoteVideo = useCallback(() => {
    if (!callObjectRef.current || !remoteVideoRef.current) return;
    
    const participants = callObjectRef.current.participants();
    const remote = Object.values(participants).find(p => !p.local);
    
    if (remote?.tracks?.video?.persistentTrack && remote.tracks.video.state === 'playable') {
      const stream = new MediaStream([remote.tracks.video.persistentTrack]);
      remoteVideoRef.current.srcObject = stream;
      console.log('[Daily] Playing video for remote participant');
    }
  }, []);

  // Update local video display  
  const updateLocalVideo = useCallback(() => {
    if (!callObjectRef.current || !localVideoRef.current) return;
    
    const local = callObjectRef.current.participants().local;
    if (local?.tracks?.video?.persistentTrack && local.tracks.video.state === 'playable') {
      const stream = new MediaStream([local.tracks.video.persistentTrack]);
      localVideoRef.current.srcObject = stream;
      console.log('[Daily] Playing local video');
    }
  }, []);

  // Start a call
  const startCall = useCallback(async (channelName: string, type: CallType, _userId: string) => {
    try {
      setCallStatus('connecting');
      setCallType(type);
      setIsVideoEnabled(type === 'video');

      // Create room with unique name
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

        // Update local video if this is a video call
        if (type === 'video') {
          setTimeout(updateLocalVideo, 500);
        }
      });

      callObject.on('participant-joined', (event?: DailyEventObjectParticipant) => {
        if (event?.participant && !event.participant.local) {
          console.log('[Daily] Remote participant joined:', event.participant.session_id);
          setRemoteParticipants(prev => {
            const exists = prev.find(p => p.session_id === event.participant.session_id);
            if (exists) return prev;
            return [...prev, event.participant];
          });
          options.onRemoteUserJoined?.(event.participant);
        }
      });

      callObject.on('participant-updated', (event?: DailyEventObjectParticipant) => {
        if (event?.participant && !event.participant.local) {
          // Update our participant list
          setRemoteParticipants(prev => 
            prev.map(p => p.session_id === event.participant.session_id ? event.participant : p)
          );
          
          // Handle audio track becoming available
          playRemoteAudio(event.participant);
          
          // Handle video track becoming available
          updateRemoteVideo();
        } else if (event?.participant?.local) {
          // Local participant updated - update local video
          updateLocalVideo();
        }
      });

      callObject.on('participant-left', (event: DailyEventObjectParticipantLeft) => {
        const participant = event?.participant;
        if (participant && !participant.local) {
          console.log('[Daily] Remote participant left:', participant.session_id);
          
          // Remove audio element for this participant
          const audioEl = document.getElementById(`audio-${participant.session_id}`);
          if (audioEl) {
            (audioEl as HTMLAudioElement).srcObject = null;
            audioEl.remove();
            audioElementsRef.current = audioElementsRef.current.filter(
              el => el.id !== `audio-${participant.session_id}`
            );
          }
          
          setRemoteParticipants(prev => 
            prev.filter(p => p.session_id !== participant.session_id)
          );
          options.onRemoteUserLeft?.(participant);
        }
      });

      callObject.on('track-started', (event) => {
        console.log('[Daily] Track started:', event?.track?.kind, event?.participant?.local ? 'local' : 'remote');
        
        if (event?.participant) {
          if (!event.participant.local) {
            if (event.track?.kind === 'audio') {
              playRemoteAudio(event.participant);
            } else if (event.track?.kind === 'video') {
              setTimeout(updateRemoteVideo, 100);
            }
          } else {
            if (event.track?.kind === 'video') {
              setTimeout(updateLocalVideo, 100);
            }
          }
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
      console.log('[Daily] Joining room:', roomData.roomUrl);
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
  }, [createRoom, options, cleanupCall, playRemoteAudio, updateRemoteVideo, updateLocalVideo]);

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

  // Attach local video element ref
  const attachLocalVideo = useCallback((videoElement: HTMLVideoElement | null) => {
    localVideoRef.current = videoElement;
    if (videoElement && callObjectRef.current) {
      updateLocalVideo();
    }
  }, [updateLocalVideo]);

  // Attach remote video element ref
  const attachRemoteVideo = useCallback((videoElement: HTMLVideoElement | null, _participantId?: string) => {
    remoteVideoRef.current = videoElement;
    if (videoElement && callObjectRef.current) {
      updateRemoteVideo();
    }
  }, [updateRemoteVideo]);

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
