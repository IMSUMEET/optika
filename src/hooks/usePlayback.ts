import { useState, useCallback, useRef, useEffect } from 'react';
import type { PlaybackState } from '../types';

interface UsePlaybackOptions<T> {
  steps: T[];
  onStep: (step: T, index: number) => void;
  onComplete?: () => void;
  onReset?: () => void;
}

export function usePlayback<T>({ steps, onStep, onComplete, onReset }: UsePlaybackOptions<T>) {
  const [state, setState] = useState<PlaybackState>('idle');
  const [currentStep, setCurrentStep] = useState(-1);
  const [speed, setSpeed] = useState(5);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  const speedToMs = (s: number) => Math.max(10, 1000 - s * 95);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const executeStep = useCallback(
    (index: number) => {
      if (index >= stepsRef.current.length) {
        setState('complete');
        onComplete?.();
        return;
      }
      setCurrentStep(index);
      onStep(stepsRef.current[index], index);
    },
    [onStep, onComplete]
  );

  const scheduleNext = useCallback(
    (fromIndex: number) => {
      clearTimer();
      timerRef.current = setTimeout(() => {
        const next = fromIndex + 1;
        if (next >= stepsRef.current.length) {
          setState('complete');
          onComplete?.();
          return;
        }
        executeStep(next);
        scheduleNext(next);
      }, speedToMs(speed));
    },
    [speed, executeStep, clearTimer, onComplete]
  );

  const play = useCallback(() => {
    if (stepsRef.current.length === 0) return;
    setState('playing');
    const startFrom = currentStep < 0 ? 0 : currentStep;
    if (currentStep < 0) executeStep(0);
    scheduleNext(startFrom);
  }, [currentStep, executeStep, scheduleNext]);

  const pause = useCallback(() => {
    setState('paused');
    clearTimer();
  }, [clearTimer]);

  const step = useCallback(() => {
    clearTimer();
    setState('stepping');
    const next = currentStep + 1;
    if (next < stepsRef.current.length) {
      executeStep(next);
    } else {
      setState('complete');
      onComplete?.();
    }
  }, [currentStep, executeStep, clearTimer, onComplete]);

  const stepBack = useCallback(() => {
    clearTimer();
    setState('stepping');
    const prev = currentStep - 1;
    if (prev >= 0) {
      executeStep(prev);
    }
  }, [currentStep, executeStep, clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setState('idle');
    setCurrentStep(-1);
    onReset?.();
  }, [clearTimer, onReset]);

  const seekTo = useCallback(
    (targetStep: number) => {
      clearTimer();
      if (targetStep >= 0 && targetStep < stepsRef.current.length) {
        executeStep(targetStep);
        setState('paused');
      }
    },
    [executeStep, clearTimer]
  );

  useEffect(() => {
    if (state === 'playing') {
      clearTimer();
      scheduleNext(currentStep);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed]);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  return {
    state,
    speed,
    currentStep,
    totalSteps: steps.length,
    play,
    pause,
    step,
    stepBack,
    reset,
    setSpeed,
    seekTo,
  };
}
