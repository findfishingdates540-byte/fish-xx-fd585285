import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceMessagePlayerProps {
  audioUrl: string;
  isMine: boolean;
}

export function VoiceMessagePlayer({ audioUrl, isMine }: VoiceMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    return () => {
      audio.pause();
      audio.src = '';
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
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn(
      'flex items-center gap-2 min-w-[160px]',
      isMine ? 'flex-row-reverse' : 'flex-row'
    )}>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'h-8 w-8 rounded-full',
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
        {/* Waveform visualization (simplified as progress bar) */}
        <div className={cn(
          'h-2 rounded-full overflow-hidden',
          isMine ? 'bg-background/20' : 'bg-foreground/10'
        )}>
          <div 
            className={cn(
              'h-full transition-all duration-100',
              isMine ? 'bg-background/60' : 'bg-foreground/40'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        
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
