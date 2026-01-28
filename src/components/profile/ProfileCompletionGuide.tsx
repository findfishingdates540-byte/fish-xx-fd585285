import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from 'react-joyride';
import { useTheme } from 'next-themes';
import { useMemo } from 'react';
import type { MissingField } from '@/hooks/use-profile-completion-guide';

interface ProfileCompletionGuideProps {
  isRunning: boolean;
  missingFields: MissingField[];
  onComplete: () => void;
  onStop: () => void;
}

export function ProfileCompletionGuide({
  isRunning,
  missingFields,
  onComplete,
  onStop,
}: ProfileCompletionGuideProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const steps: Step[] = useMemo(() => {
    return missingFields.map((field, index) => ({
      target: field.selector,
      title: `Step ${index + 1}: ${field.label}`,
      content: field.description,
      placement: 'auto' as const,
      disableBeacon: true,
      spotlightClicks: true,
      hideCloseButton: false,
    }));
  }, [missingFields]);

  const handleCallback = (data: CallBackProps) => {
    const { status, action, type } = data;
    
    if (status === STATUS.FINISHED) {
      onComplete();
    } else if (status === STATUS.SKIPPED || action === ACTIONS.CLOSE) {
      onStop();
    }
  };

  if (!isRunning || steps.length === 0) return null;

  return (
    <Joyride
      steps={steps}
      run={isRunning}
      continuous
      showSkipButton
      showProgress
      scrollToFirstStep
      spotlightClicks
      disableOverlayClose
      callback={handleCallback}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Done',
        next: 'Next',
        skip: 'Skip',
      }}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: 'hsl(var(--primary))',
          backgroundColor: isDark ? 'hsl(var(--card))' : 'hsl(var(--background))',
          textColor: isDark ? 'hsl(var(--foreground))' : 'hsl(var(--foreground))',
          arrowColor: isDark ? 'hsl(var(--card))' : 'hsl(var(--background))',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
        },
        tooltip: {
          borderRadius: '12px',
          padding: '16px',
        },
        tooltipTitle: {
          fontSize: '16px',
          fontWeight: 600,
        },
        tooltipContent: {
          fontSize: '14px',
          lineHeight: 1.5,
        },
        buttonNext: {
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '14px',
          fontWeight: 500,
        },
        buttonBack: {
          color: isDark ? 'hsl(var(--muted-foreground))' : 'hsl(var(--muted-foreground))',
          marginRight: '8px',
        },
        buttonSkip: {
          color: isDark ? 'hsl(var(--muted-foreground))' : 'hsl(var(--muted-foreground))',
        },
        spotlight: {
          borderRadius: '8px',
        },
      }}
    />
  );
}
