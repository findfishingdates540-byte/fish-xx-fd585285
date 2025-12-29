import { useState, useEffect, useCallback } from 'react';

const TUTORIAL_KEY = 'dating_tutorial_completed';

export function useDatingTutorial() {
  const [isRunning, setIsRunning] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(true);

  useEffect(() => {
    const completed = localStorage.getItem(TUTORIAL_KEY) === 'true';
    setHasCompleted(completed);
  }, []);

  const startTutorial = useCallback(() => {
    setIsRunning(true);
  }, []);

  const stopTutorial = useCallback(() => {
    setIsRunning(false);
  }, []);

  const completeTutorial = useCallback(() => {
    localStorage.setItem(TUTORIAL_KEY, 'true');
    setHasCompleted(true);
    setIsRunning(false);
  }, []);

  const resetTutorial = useCallback(() => {
    localStorage.removeItem(TUTORIAL_KEY);
    setHasCompleted(false);
  }, []);

  const shouldShowTutorial = !hasCompleted;

  return {
    isRunning,
    hasCompleted,
    shouldShowTutorial,
    startTutorial,
    stopTutorial,
    completeTutorial,
    resetTutorial,
  };
}
