import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { useIsMobile } from '@/hooks/use-mobile';
import { datingTutorialSteps, mobileTutorialSteps } from './DatingTutorialSteps';

interface DatingTutorialProps {
  isRunning: boolean;
  onComplete: () => void;
  onStop: () => void;
}

export function DatingTutorial({ isRunning, onComplete, onStop }: DatingTutorialProps) {
  const isMobile = useIsMobile();
  const steps = isMobile ? mobileTutorialSteps : datingTutorialSteps;

  const handleCallback = (data: CallBackProps) => {
    const { status } = data;
    
    if (status === STATUS.FINISHED) {
      onComplete();
    } else if (status === STATUS.SKIPPED) {
      onStop();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={isRunning}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableOverlayClose
      callback={handleCallback}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Got it!',
        next: 'Next',
        skip: 'Skip',
      }}
      styles={{
        options: {
          arrowColor: 'hsl(var(--background))',
          backgroundColor: 'hsl(var(--background))',
          overlayColor: 'rgba(0, 0, 0, 0.7)',
          primaryColor: 'hsl(var(--foreground))',
          textColor: 'hsl(var(--foreground))',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 12,
          padding: 20,
        },
        tooltipTitle: {
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 8,
        },
        tooltipContent: {
          fontSize: 14,
          lineHeight: 1.5,
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--foreground))',
          color: 'hsl(var(--background))',
          borderRadius: 8,
          padding: '10px 20px',
          fontSize: 14,
          fontWeight: 500,
        },
        buttonBack: {
          color: 'hsl(var(--muted-foreground))',
          marginRight: 10,
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
        },
        spotlight: {
          borderRadius: 16,
        },
      }}
      floaterProps={{
        styles: {
          arrow: {
            length: 8,
            spread: 16,
          },
        },
      }}
    />
  );
}
