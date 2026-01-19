import { useState, useCallback, useRef, useEffect } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  ILocalAudioTrack,
} from 'agora-rtc-sdk-ng';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type CallType = 'voice' | 'video';
export type CallStatus = 'idle' | 'connecting' | 'connected' | 'ended' | 'error';

interface UseAgoraCallOptions {
  onRemoteUserJoined?: (user: IAgoraRTCRemoteUser) => void;
  onRemoteUserLeft?: (user: IAgoraRTCRemoteUser) => void;
}

export function useAgoraCall(options: UseAgoraCallOptions = {}) {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [callType, setCallType] = useState<CallType | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [channelName, setChannelName] = useState<string | null>(null);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup tracks
  const cleanupTracks = useCallback(async () => {
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.stop();
      localAudioTrackRef.current.close();
      localAudioTrackRef.current = null;
    }
    if (localVideoTrackRef.current) {
      localVideoTrackRef.current.stop();
      localVideoTrackRef.current.close();
      localVideoTrackRef.current = null;
    }
  }, []);

  // Get Agora token from edge function
  const getAgoraToken = useCallback(async (channel: string, uid: string): Promise<{ token: string; appId: string } | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-agora-token', {
        body: { channelName: channel, uid }
      });

      if (error) {
        console.error('Error getting Agora token:', error);
        return null;
      }

      return { token: data.token, appId: data.appId };
    } catch (err) {
      console.error('Failed to get Agora token:', err);
      return null;
    }
  }, []);

  // Start a call
  const startCall = useCallback(async (channel: string, type: CallType, userId: string) => {
    try {
      setCallStatus('connecting');
      setCallType(type);
      setChannelName(channel);

      // Get token
      const tokenData = await getAgoraToken(channel, userId);
      if (!tokenData) {
        toast.error('Failed to initialize call');
        setCallStatus('error');
        return false;
      }

      // Create Agora client
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      // Set up event handlers
      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        
        if (mediaType === 'video') {
          setRemoteUsers(prev => {
            const exists = prev.find(u => u.uid === user.uid);
            if (exists) return prev;
            return [...prev, user];
          });
        }
        
        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
        
        options.onRemoteUserJoined?.(user);
      });

      client.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'video') {
          setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        }
      });

      client.on('user-left', (user) => {
        setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        options.onRemoteUserLeft?.(user);
      });

      // Join channel
      const uid = parseInt(userId.replace(/\D/g, '').slice(0, 9)) || Math.floor(Math.random() * 100000);
      await client.join(tokenData.appId, channel, tokenData.token, uid);

      // Create and publish tracks based on call type
      if (type === 'video') {
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        localAudioTrackRef.current = audioTrack;
        localVideoTrackRef.current = videoTrack;
        await client.publish([audioTrack, videoTrack]);
      } else {
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localAudioTrackRef.current = audioTrack;
        await client.publish(audioTrack);
      }

      setCallStatus('connected');
      
      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      return true;
    } catch (error) {
      console.error('Error starting call:', error);
      toast.error('Failed to start call');
      setCallStatus('error');
      await cleanupTracks();
      return false;
    }
  }, [getAgoraToken, options, cleanupTracks]);

  // End call
  const endCall = useCallback(async () => {
    try {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      await cleanupTracks();

      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current = null;
      }

      setCallStatus('ended');
      setRemoteUsers([]);
      setCallDuration(0);
      setChannelName(null);
      setCallType(null);
      setIsMuted(false);
      setIsVideoEnabled(true);

      // Reset to idle after a brief delay
      setTimeout(() => setCallStatus('idle'), 500);
    } catch (error) {
      console.error('Error ending call:', error);
    }
  }, [cleanupTracks]);

  // Toggle mute
  const toggleMute = useCallback(async () => {
    if (localAudioTrackRef.current) {
      await localAudioTrackRef.current.setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  // Toggle video
  const toggleVideo = useCallback(async () => {
    if (localVideoTrackRef.current) {
      await localVideoTrackRef.current.setEnabled(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  }, [isVideoEnabled]);

  // Get local video track for display
  const getLocalVideoTrack = useCallback(() => {
    return localVideoTrackRef.current;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      cleanupTracks();
      if (clientRef.current) {
        clientRef.current.leave();
      }
    };
  }, [cleanupTracks]);

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
    remoteUsers,
    callDuration,
    formattedDuration: formatDuration(callDuration),
    channelName,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    getLocalVideoTrack,
  };
}
