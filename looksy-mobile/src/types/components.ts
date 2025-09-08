/**
 * Type definitions for enhanced analysis components
 * Ensures type safety and better developer experience
 */

export interface AnimatedScoreCircleProps {
  score: number;
  maxScore?: number;
  size?: 'small' | 'medium' | 'large';
  showAnimation?: boolean;
  onPress?: () => void;
  label?: string;
  subtitle?: string;
}

export interface StyleInsightsDashboardProps {
  analysis: import('./index').OutfitAnalysis | import('./index').ClinicalAnalysis;
  userStyleHistory?: any[];
}

export interface ActionableRecommendationsProps {
  analysis: import('./index').OutfitAnalysis | import('./index').ClinicalAnalysis;
  onRecommendationAction?: (action: string, recommendation: any) => void;
}

export interface ClosetIntegratedRecommendationsProps {
  analysis: import('./index').OutfitAnalysis | import('./index').ClinicalAnalysis;
  navigation: any;
  outfitId: string;
  onRecommendationAction?: (action: string, recommendation: any) => void;
}

export interface ComponentTestScreenProps {
  // No props required for test screen
}

// Internal component interfaces
export interface StyleDNA {
  colorProfile: string;
  fitPreference: string;
  stylePersonality: string;
  confidenceLevel: 'Conservative' | 'Balanced' | 'Bold';
}

export interface InsightCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'strength' | 'opportunity' | 'trend' | 'recommendation';
}

export interface RecommendationCard {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'moderate' | 'challenging';
  category: 'immediate' | 'shopping' | 'technique' | 'mindset';
  actionable: boolean;
  icon: string;
  priority: number;
}

export interface ClosetRecommendation {
  id: string;
  title: string;
  description: string;
  type: 'from_closet' | 'add_to_closet' | 'styling_tip' | 'shopping_suggestion';
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  icon: string;
  closetAction?: 'confirm_items' | 'view_alternatives' | 'add_wishlist';
}

// Animation and performance types
export interface AnimationConfig {
  duration: number;
  useNativeDriver: boolean;
  toValue: number;
}

export interface PerformanceMetrics {
  renderTime: number;
  animationFrameRate: number;
  memoryUsage: number;
}

// Test data types
export interface TestScenario {
  name: string;
  data: import('./index').OutfitAnalysis | import('./index').ClinicalAnalysis | null;
}

export type ScoreRange = 'perfect' | 'high' | 'medium' | 'low';

export type ComponentType = 'circle' | 'dashboard' | 'recommendations' | 'closet';