/**
 * Custom hook for generating style insights and DNA
 */

import { useMemo, useCallback } from 'react';
import { OutfitAnalysis, ClinicalAnalysis } from '../types';
import { STYLE_DNA_PROFILES, SCORE_THRESHOLDS } from '../constants/components';
import { getScoreCategory, hasSubScores } from '../utils/scoreUtils';

interface StyleDNA {
  colorProfile: string;
  fitPreference: string;
  stylePersonality: string;
  confidenceLevel: 'Conservative' | 'Balanced' | 'Bold';
}

interface InsightCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'strength' | 'opportunity' | 'trend' | 'recommendation';
}

export const useStyleInsights = (analysis: OutfitAnalysis | ClinicalAnalysis | null) => {
  const generateStyleDNA = useCallback((): StyleDNA => {
    if (!analysis) {
      return {
        colorProfile: STYLE_DNA_PROFILES.COLOR.LEARNER,
        fitPreference: STYLE_DNA_PROFILES.FIT.FIT_EXPLORER,
        stylePersonality: 'Eclectic',
        confidenceLevel: 'Conservative'
      };
    }

    try {
      const colorScore = Math.max(0, Math.min(100, analysis?.color_score || 0));
      const fitScore = Math.max(0, Math.min(100, analysis?.fit_score || 0));
      const styleScore = Math.max(0, Math.min(100, analysis?.style_score || 0));

      return {
        colorProfile: colorScore >= SCORE_THRESHOLDS.HIGH 
          ? STYLE_DNA_PROFILES.COLOR.HARMONIST
          : colorScore >= SCORE_THRESHOLDS.GOOD 
          ? STYLE_DNA_PROFILES.COLOR.EXPLORER 
          : STYLE_DNA_PROFILES.COLOR.LEARNER,
        
        fitPreference: fitScore >= SCORE_THRESHOLDS.HIGH 
          ? STYLE_DNA_PROFILES.FIT.PRECISION_FITTER
          : fitScore >= SCORE_THRESHOLDS.GOOD 
          ? STYLE_DNA_PROFILES.FIT.COMFORT_SEEKER 
          : STYLE_DNA_PROFILES.FIT.FIT_EXPLORER,
        
        stylePersonality: analysis?.style_category || 'Eclectic',
        
        confidenceLevel: styleScore >= SCORE_THRESHOLDS.HIGH 
          ? STYLE_DNA_PROFILES.CONFIDENCE.BOLD
          : styleScore >= SCORE_THRESHOLDS.GOOD 
          ? STYLE_DNA_PROFILES.CONFIDENCE.BALANCED 
          : STYLE_DNA_PROFILES.CONFIDENCE.CONSERVATIVE
      };
    } catch (error) {
      // Return default values if generation fails
      return {
        colorProfile: STYLE_DNA_PROFILES.COLOR.LEARNER,
        fitPreference: STYLE_DNA_PROFILES.FIT.FIT_EXPLORER,
        stylePersonality: 'Eclectic',
        confidenceLevel: 'Conservative'
      };
    }
  }, [analysis]);

  const generateInsights = useCallback((): InsightCard[] => {
    if (!analysis) return [];
    
    const insights: InsightCard[] = [];
    
    try {
      // Strength insights
      const scores = [
        { type: 'style', value: analysis.style_score, label: 'Style Coordination Master' },
        { type: 'fit', value: analysis.fit_score, label: 'Perfect Fit Finder' },
        { type: 'color', value: analysis.color_score, label: 'Color Harmony Expert' },
        { type: 'occasion', value: analysis.occasion_appropriateness, label: 'Occasion Master' }
      ];

      const topScore = Math.max(...scores.map(s => s.value));
      const topScoreType = scores.find(s => s.value === topScore);

      if (topScoreType && topScore >= SCORE_THRESHOLDS.HIGH) {
        insights.push({
          id: `${topScoreType.type}_strength`,
          title: topScoreType.label,
          description: getStrengthDescription(topScoreType.type, topScore),
          icon: getStrengthIcon(topScoreType.type),
          category: 'strength'
        });
      }

      // Opportunity insights
      const lowestScore = Math.min(...scores.map(s => s.value));
      const lowestScoreType = scores.find(s => s.value === lowestScore);

      if (lowestScoreType && lowestScore < SCORE_THRESHOLDS.GOOD) {
        insights.push({
          id: `${lowestScoreType.type}_opportunity`,
          title: 'Growth Zone',
          description: getOpportunityDescription(lowestScoreType.type, lowestScore),
          icon: '🌱',
          category: 'opportunity'
        });
      }

      // Clinical insights
      if (hasSubScores(analysis) && analysis.sub_scores) {
        if (analysis.sub_scores.layering_logic > SCORE_THRESHOLDS.HIGH) {
          insights.push({
            id: 'layering_master',
            title: 'Layering Expert',
            description: 'You have mastered the art of layering - this is your signature strength!',
            icon: '🏆',
            category: 'strength'
          });
        }
      }

      // Trend insights
      if (analysis.overall_score > SCORE_THRESHOLDS.EXCELLENT) {
        insights.push({
          id: 'trendsetter',
          title: 'Style Trendsetter',
          description: 'Your style sense puts you ahead of the curve. Others look to you for inspiration.',
          icon: '🚀',
          category: 'trend'
        });
      }

      return insights;
    } catch (error) {
      return [{
        id: 'basic_insight',
        title: 'Style Analysis Complete',
        description: 'Your outfit has been analyzed. Check your score breakdown for details.',
        icon: '📊',
        category: 'trend'
      }];
    }
  }, [analysis]);

  const styleDNA = useMemo(() => generateStyleDNA(), [generateStyleDNA]);
  const insights = useMemo(() => generateInsights(), [generateInsights]);

  return {
    styleDNA,
    insights,
  };
};

// Helper functions
const getStrengthDescription = (type: string, score: number): string => {
  const descriptions = {
    style: 'Your pieces work beautifully together, showing excellent style intuition.',
    fit: 'You have a great eye for garments that flatter your silhouette.',
    color: 'Your color coordination demonstrates sophisticated understanding.',
    occasion: 'You excel at dressing appropriately for any setting.'
  };
  return descriptions[type as keyof typeof descriptions] || 'Great strength identified in your styling.';
};

const getStrengthIcon = (type: string): string => {
  const icons = {
    style: '🎨',
    fit: '👔',
    color: '🌈',
    occasion: '🎯'
  };
  return icons[type as keyof typeof icons] || '✨';
};

const getOpportunityDescription = (type: string, score: number): string => {
  const descriptions = {
    style: 'Exploring style coordination could elevate your looks significantly.',
    fit: 'Small fit adjustments could make a big impact on your overall appearance.',
    color: 'Exploring complementary colors could enhance your outfits beautifully.',
    occasion: 'Fine-tuning occasion appropriateness will boost your confidence.'
  };
  return descriptions[type as keyof typeof descriptions] || 'Area identified for style growth and improvement.';
};