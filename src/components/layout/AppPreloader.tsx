import fishxLogo from '@/assets/fishx-logo.png';

interface AppPreloaderProps {
  label?: string;
}

export function AppPreloader({ label = 'Loading Fish-X...' }: AppPreloaderProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center" aria-live="polite">
      <div className="flex flex-col items-center gap-4 px-6 text-center">
        <img
          src={fishxLogo}
          alt="Fish-X"
          className="h-16 w-auto animate-pulse"
          loading="eager"
          decoding="async"
        />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}