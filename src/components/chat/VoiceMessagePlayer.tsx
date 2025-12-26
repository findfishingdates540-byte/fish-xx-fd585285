import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { WaveformVisualizer } from './WaveformVisualizer';

interface VoiceMessagePlayerProps {
  audioUrl: string;
  isMine: boolean;
}

export function VoiceMessagePlayer({ audioUrl, isMine }: VoiceMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [waveformLevels, setWaveformLevels] = useState<number[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    // Generate pseudo-random waveform based on audio URL (for visual consistency)
    const generateWaveform = () => {
      const seed = audioUrl.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const bars = 24;
      const levels: number[] = [];
      
      for (let i = 0; i < bars; i++) {
        // Create a varied but consistent waveform pattern
        const base = 0.3;
        const variation = Math.sin((seed + i * 7) * 0.5) * 0.3 + 
                         Math.sin((seed + i * 13) * 0.3) * 0.2 +
                         Math.cos((seed + i * 5) * 0.7) * 0.15;
        levels.push(Math.max(0.15, Math.min(0.95, base + variation + 0.3)));
      }
      
      setWaveformLevels(levels);
    };

    generateWaveform();

    audio.addEventListener('loadedmetadata', () => {
      if (isFinite(audio.duration)) {
        setDuration(audio.duration);
      } else {
        // WebM files often lack duration metadata - force calculation by seeking
        audio.currentTime = 1e101;
      }
    });

    audio.addEventListener('seeked', () => {
      if (audio.currentTime === 1e101 || !isFinite(audio.currentTime)) {
        audio.currentTime = 0;
      }
      if (isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    });

    audio.addEventListener('durationchange', () => {
      if (isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      // Capture duration from currentTime if still unknown
      if (!isFinite(duration) && isFinite(audio.currentTime) && audio.currentTime > 0) {
        setDuration(audio.currentTime);
      }
      setCurrentTime(0);
    });

    return () => {
      audio.pause();
      audio.src = '';
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time)) {
      return '--:--';
    }
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn(
      'flex items-center gap-2 min-w-[180px]',
      isMine ? 'flex-row-reverse' : 'flex-row'
    )}>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'h-9 w-9 rounded-full flex-shrink-0',
          isMine 
            ? 'bg-background/20 hover:bg-background/30 text-background' 
            : 'bg-foreground/10 hover:bg-foreground/20'
        )}
        onClick={togglePlay}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4 ml-0.5" />
        )}
      </Button>
      
      <div className="flex-1 flex flex-col gap-1">
        <WaveformVisualizer
          levels={waveformLevels}
          isPlaying={isPlaying}
          progress={progress}
          className="h-6"
          barClassName={isMine ? 'bg-background/30' : 'bg-foreground/20'}
          activeBarClassName={isMine ? 'bg-background/80' : 'bg-foreground/60'}
        />
        
        <span className={cn(
          'text-[10px]',
          isMine ? 'text-background/70' : 'text-muted-foreground'
        )}>
          {formatTime(currentTime)} / {formatTime(duration || 0)}
        </span>
      </div>
    </div>
  );
}
