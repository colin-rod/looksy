/**
 * Custom hook for generating actionable recommendations
 */

import { useState, useMemo, useCallback } from 'react';
import { OutfitAnalysis, ClinicalAnalysis } from '../types';
import { RECOMMENDATION_IMPACTS, RECOMMENDATION_DIFFICULTIES, SCORE_THRESHOLDS } from '../constants/components';
import { hasSubScores, getScoreCategory } from '../utils/scoreUtils';

interface RecommendationCard {
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

export const useRecommendations = (analysis: OutfitAnalysis | ClinicalAnalysis | null) => {
  const [completedActions, setCompletedActions] = useState<string[]>([]);

  const generateRecommendationCards = useCallback((): RecommendationCard[] => {
    if (!analysis) return [];
    
    const cards: RecommendationCard[] = [];
    let priorityCounter = 1;

    try {
      // Process strengths into positive reinforcement cards
      if (analysis.detailed_feedback?.strengths) {
        analysis.detailed_feedback.strengths.slice(0, 2).forEach((strength, index) => {
          cards.push({
            id: `strength_${index}`,
            title: '✅ Keep This Up!',
            description: strength,
            impact: RECOMMENDATION_IMPACTS.MEDIUM,
            difficulty: RECOMMENDATION_DIFFICULTIES.EASY,
            category: 'mindset',
            actionable: false,
            icon: '🎯',
            priority: priorityCounter++
          });
        });
      }

      // Process improvements into actionable recommendations
      if (analysis.detailed_feedback?.improvements) {
        analysis.detailed_feedback.improvements.forEach((improvement, index) => {
          const recommendation = categorizeImprovement(improvement, priorityCounter++);
          cards.push(recommendation);
        });
      }

      // Process clinical recommendations if available
      if (hasSubScores(analysis) && 'recommendations' in analysis && analysis.recommendations) {
        // Minor adjustments - immediate actions
        if (analysis.recommendations.minor_adjustments) {
          analysis.recommendations.minor_adjustments.forEach((adjustment, index) => {
            cards.push({
              id: `minor_${index}`,
              title: '⚡ Quick Fix',
              description: adjustment,
              impact: RECOMMENDATION_IMPACTS.MEDIUM,
              difficulty: RECOMMENDATION_DIFFICULTIES.EASY,
              category: 'immediate',
              actionable: true,
              icon: '🔧',
              priority: priorityCounter++
            });
          });
        }

        // Closet recommendations - shopping actions
        if (analysis.recommendations.closet_recommendations) {
          analysis.recommendations.closet_recommendations.forEach((closetRec, index) => {
            cards.push({
              id: `closet_${index}`,
              title: '👕 From Your Closet',
              description: closetRec,
              impact: RECOMMENDATION_IMPACTS.HIGH,
              difficulty: RECOMMENDATION_DIFFICULTIES.EASY,
              category: 'shopping',
              actionable: true,
              icon: '🏠',
              priority: priorityCounter++
            });
          });
        }
      }

      // Generate smart technique recommendations based on scores
      cards.push(...generateTechniqueRecommendations(analysis, priorityCounter));

      return cards.sort((a, b) => a.priority - b.priority);
    } catch (error) {
      // Return basic recommendation if generation fails
      return [{
        id: 'basic_rec',
        title: '📊 Analysis Complete',
        description: 'Your outfit analysis is ready. Review your scores for detailed insights.',
        impact: RECOMMENDATION_IMPACTS.MEDIUM,
        difficulty: RECOMMENDATION_DIFFICULTIES.EASY,
        category: 'immediate',
        actionable: false,
        icon: '📊',
        priority: 1
      }];
    }
  }, [analysis]);

  const recommendationCards = useMemo(() => generateRecommendationCards(), [generateRecommendationCards]);

  const markCompleted = useCallback((recommendationId: string) => {
    setCompletedActions(prev => [...prev, recommendationId]);
  }, []);

  const resetCompleted = useCallback(() => {
    setCompletedActions([]);
  }, []);

  const getFilteredCards = useCallback((category: string) => {
    return category === 'all' 
      ? recommendationCards 
      : recommendationCards.filter(card => card.category === category);
  }, [recommendationCards]);

  return {
    recommendationCards,
    completedActions,
    markCompleted,
    resetCompleted,
    getFilteredCards,
  };
};

// Helper functions
const categorizeImprovement = (improvement: string, priority: number): RecommendationCard => {
  const lowerImprovement = improvement.toLowerCase();
  
  if (lowerImprovement.includes('color')) {
    return {
      id: `improvement_color_${priority}`,
      title: '🌈 Color Enhancement',
      description: improvement,
      impact: RECOMMENDATION_IMPACTS.HIGH,
      difficulty: RECOMMENDATION_DIFFICULTIES.EASY,
      category: 'shopping',
      actionable: true,
      icon: '🌈',
      priority
    };
  }
  
  if (lowerImprovement.includes('fit')) {
    return {
      id: `improvement_fit_${priority}`,
      title: '📏 Fit Adjustment',
      description: improvement,
      impact: RECOMMENDATION_IMPACTS.HIGH,
      difficulty: RECOMMENDATION_DIFFICULTIES.MODERATE,
      category: 'technique',
      actionable: true,
      icon: '📏',
      priority
    };
  }
  
  if (lowerImprovement.includes('pattern')) {
    return {
      id: `improvement_pattern_${priority}`,
      title: '🎨 Pattern Play',
      description: improvement,
      impact: RECOMMENDATION_IMPACTS.MEDIUM,
      difficulty: RECOMMENDATION_DIFFICULTIES.EASY,
      category: 'shopping',
      actionable: true,
      icon: '🎨',
      priority
    };
  }
  
  if (lowerImprovement.includes('accessory')) {
    return {
      id: `improvement_accessory_${priority}`,
      title: '✨ Accessory Addition',
      description: improvement,
      impact: RECOMMENDATION_IMPACTS.MEDIUM,
      difficulty: RECOMMENDATION_DIFFICULTIES.EASY,
      category: 'shopping',
      actionable: true,
      icon: '💎',
      priority
    };
  }

  return {
    id: `improvement_general_${priority}`,
    title: '💫 Style Refinement',
    description: improvement,
    impact: RECOMMENDATION_IMPACTS.MEDIUM,
    difficulty: RECOMMENDATION_DIFFICULTIES.MODERATE,
    category: 'technique',
    actionable: true,
    icon: '✨',
    priority
  };
};

const generateTechniqueRecommendations = (analysis: OutfitAnalysis | ClinicalAnalysis, startPriority: number): RecommendationCard[] => {
  const cards: RecommendationCard[] = [];
  let priority = startPriority;

  if (analysis.color_score < SCORE_THRESHOLDS.GOOD) {
    cards.push({
      id: 'color_technique',
      title: '🎨 Color Mastery',
      description: 'Learn the 60-30-10 color rule: 60% dominant color, 30% secondary, 10% accent.',
      impact: RECOMMENDATION_IMPACTS.HIGH,
      difficulty: RECOMMENDATION_DIFFICULTIES.MODERATE,
      category: 'technique',
      actionable: true,
      icon: '📚',
      priority: priority++
    });
  }

  if (analysis.fit_score < SCORE_THRESHOLDS.GOOD) {
    cards.push({
      id: 'fit_technique',
      title: '📏 Perfect Fit Guide',
      description: 'Schedule a fitting session or learn key measurement points for better garment selection.',
      impact: RECOMMENDATION_IMPACTS.HIGH,
      difficulty: RECOMMENDATION_DIFFICULTIES.CHALLENGING,
      category: 'technique',
      actionable: true,
      icon: '🎯',
      priority: priority++
    });
  }

  return cards;
};