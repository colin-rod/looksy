/**
 * Custom hook for score circle animations
 */

import { useRef, useEffect, useCallback } from 'react';
import { Animated, Platform, Vibration } from 'react-native';
import { ANIMATION_DURATIONS, VIBRATION_PATTERNS } from '../constants/components';
import { shouldShowCelebration } from '../utils/scoreUtils';

interface UseScoreAnimationProps {
  score: number;
  showAnimation: boolean;
  percentage: number;
}

export const useScoreAnimation = ({ score, showAnimation, percentage }: UseScoreAnimationProps) => {
  const animatedScore = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0.8)).current;
  const opacityAnimation = useRef(new Animated.Value(0)).current;
  const isMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const triggerCelebration = useCallback(() => {
    if (shouldShowCelebration(score) && Platform.OS !== 'web') {
      try {
        Vibration.vibrate(VIBRATION_PATTERNS.CELEBRATION);
      } catch {
        // Vibration not available, silently fail
      }
    }
  }, [score]);

  const startAnimation = useCallback(() => {
    if (!isMounted.current) return;
    
    try {
      if (showAnimation) {
        // Initial entrance animation
        Animated.parallel([
          Animated.spring(scaleAnimation, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }),
          Animated.timing(opacityAnimation, {
            toValue: 1,
            duration: ANIMATION_DURATIONS.ENTRANCE,
            useNativeDriver: true,
          }),
        ]).start((finished) => {
          if (!finished || !isMounted.current) return;
          
          // Score animation after entrance
          Animated.timing(animatedScore, {
            toValue: percentage,
            duration: ANIMATION_DURATIONS.SCORE_REVEAL,
            useNativeDriver: false,
          }).start((finished) => {
            if (!finished || !isMounted.current) return;
            triggerCelebration();
          });
        });
      } else {
        // No animation - set final values immediately
        scaleAnimation.setValue(1);
        opacityAnimation.setValue(1);
        animatedScore.setValue(percentage);
      }
    } catch (error) {
      // Fallback to non-animated state if animations fail
      scaleAnimation.setValue(1);
      opacityAnimation.setValue(1);
      animatedScore.setValue(percentage);
    }
  }, [showAnimation, percentage, animatedScore, scaleAnimation, opacityAnimation, triggerCelebration]);

  const triggerPressAnimation = useCallback(() => {
    if (!isMounted.current) return;
    
    try {
      // Haptic feedback
      if (Platform.OS !== 'web') {
        try {
          Vibration.vibrate(VIBRATION_PATTERNS.LIGHT_TAP);
        } catch {
          // Vibration not available, silently continue
        }
      }
      
      // Quick scale animation
      Animated.sequence([
        Animated.timing(scaleAnimation, {
          toValue: 0.95,
          duration: ANIMATION_DURATIONS.FAST,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: ANIMATION_DURATIONS.FAST,
          useNativeDriver: true,
        }),
      ]).start();
    } catch {
      // If animation fails, continue silently
    }
  }, [scaleAnimation]);

  useEffect(() => {
    startAnimation();
  }, [startAnimation]);

  return {
    animatedScore,
    scaleAnimation,
    opacityAnimation,
    triggerPressAnimation,
  };
};