/**
 * Constants for enhanced analysis components
 */

// Score Circle Configuration
export const SCORE_CIRCLE_SIZES = {
  small: { radius: 40, strokeWidth: 6, fontSize: 16, containerSize: 100 },
  medium: { radius: 60, strokeWidth: 8, fontSize: 24, containerSize: 140 },
  large: { radius: 80, strokeWidth: 10, fontSize: 32, containerSize: 180 },
} as const;

export const SCORE_THRESHOLDS = {
  PERFECT: 95,
  EXCELLENT: 90,
  HIGH: 80,
  GOOD: 70,
  FAIR: 50,
} as const;

export const ANIMATION_DURATIONS = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
  ENTRANCE: 500,
  SCORE_REVEAL: 1500,
} as const;

// Recommendation Categories
export const RECOMMENDATION_CATEGORIES = [
  { key: 'all', label: 'All', icon: '🎯' },
  { key: 'immediate', label: 'Quick Wins', icon: '⚡' },
  { key: 'shopping', label: 'Shopping', icon: '🛍️' },
  { key: 'technique', label: 'Learn', icon: '📚' },
  { key: 'mindset', label: 'Mindset', icon: '🧠' },
] as const;

export const RECOMMENDATION_IMPACTS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

export const RECOMMENDATION_DIFFICULTIES = {
  EASY: 'easy',
  MODERATE: 'moderate',
  CHALLENGING: 'challenging',
} as const;

// Style DNA Categories
export const STYLE_DNA_PROFILES = {
  COLOR: {
    HARMONIST: 'Color Harmonist',
    EXPLORER: 'Color Explorer',
    LEARNER: 'Color Learner',
  },
  FIT: {
    PRECISION_FITTER: 'Precision Fitter',
    COMFORT_SEEKER: 'Comfort Seeker',
    FIT_EXPLORER: 'Fit Explorer',
  },
  CONFIDENCE: {
    BOLD: 'Bold',
    BALANCED: 'Balanced',
    CONSERVATIVE: 'Conservative',
  },
} as const;

// Dashboard Tab Configuration
export const DASHBOARD_TABS = [
  { key: 'dna', label: 'Style DNA', icon: '🧬' },
  { key: 'insights', label: 'Insights', icon: '💡' },
  { key: 'trends', label: 'Trends', icon: '📈' },
] as const;

// Closet Integration Types
export const CLOSET_RECOMMENDATION_TYPES = {
  FROM_CLOSET: 'from_closet',
  ADD_TO_CLOSET: 'add_to_closet',
  STYLING_TIP: 'styling_tip',
  SHOPPING_SUGGESTION: 'shopping_suggestion',
} as const;

export const CLOSET_PRIORITIES = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

// Achievement Badges
export const ACHIEVEMENT_EMOJIS = {
  STAR: '🌟',
  PERFECT: 'PERFECT!',
  TROPHY: '🏆',
  SPARKLES: '✨',
} as const;

// Vibration Patterns
export const VIBRATION_PATTERNS = {
  LIGHT_TAP: 50,
  CELEBRATION: [0, 100, 50, 100],
} as const;

// Insight Colors
export const INSIGHT_COLORS = {
  strength: '#22c55e',
  opportunity: '#f59e0b',
  trend: '#8b5cf6',
  recommendation: '#3b82f6',
} as const;