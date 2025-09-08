/**
 * Utility functions for score calculations and analysis
 */

import { SCORE_THRESHOLDS } from '../constants/components';
import { OutfitAnalysis, ClinicalAnalysis } from '../types';

export const validateScore = (score: number, maxScore: number = 100): number => {
  return Math.max(0, Math.min(isNaN(score) ? 0 : score, maxScore));
};

export const getScoreCategory = (score: number): 'perfect' | 'excellent' | 'high' | 'good' | 'fair' | 'poor' => {
  if (score >= SCORE_THRESHOLDS.PERFECT) return 'perfect';
  if (score >= SCORE_THRESHOLDS.EXCELLENT) return 'excellent';
  if (score >= SCORE_THRESHOLDS.HIGH) return 'high';
  if (score >= SCORE_THRESHOLDS.GOOD) return 'good';
  if (score >= SCORE_THRESHOLDS.FAIR) return 'fair';
  return 'poor';
};

export const calculatePercentage = (score: number, maxScore: number): number => {
  return (score / maxScore) * 100;
};

export const getScoreExplanations = () => ({
  overall: {
    perfect: "Exceptional style mastery with flawless execution across all elements",
    excellent: "Outstanding style execution with perfect balance across all elements",
    high: "Strong style foundation with minor areas for refinement",
    good: "Solid style base with some areas for improvement", 
    fair: "Decent style base but several areas need attention",
    poor: "Significant style improvements needed across multiple areas"
  },
  style: {
    perfect: "Masterful harmony between pieces creating an iconic, intentional look",
    excellent: "Perfect harmony between pieces creating a cohesive, intentional look",
    high: "Well-coordinated elements with clear style direction",
    good: "Good coordination with mostly clear direction",
    fair: "Some style coordination but lacking clear direction",
    poor: "Conflicting style elements need better coordination"
  },
  fit: {
    perfect: "Every garment fits like it was custom-made for you",
    excellent: "All garments fit perfectly, enhancing your silhouette",
    high: "Most pieces fit well with minor adjustments needed", 
    good: "Generally good fit with some room for improvement",
    fair: "Some fit issues affecting overall appearance",
    poor: "Significant fit problems requiring alterations or size changes"
  },
  color: {
    perfect: "Colors create stunning harmony that enhances your natural beauty",
    excellent: "Colors create beautiful harmony and complement your features",
    high: "Good color coordination with pleasing combinations",
    good: "Decent color choices that generally work well",
    fair: "Colors work but could be more intentional",
    poor: "Color combinations clash or don't enhance your look"
  },
  occasion: {
    perfect: "Absolutely perfect appropriateness exceeding expectations",
    excellent: "Perfect appropriateness for the intended setting",
    high: "Well-suited for the occasion with good judgment",
    good: "Appropriate with minor considerations",
    fair: "Generally appropriate but could be more refined",
    poor: "Doesn't match the occasion's dress code expectations"
  }
});

export const getScoreExplanation = (scoreType: string, score: number): string => {
  const category = getScoreCategory(score);
  const explanations = getScoreExplanations();
  
  const categoryExplanations = explanations[scoreType as keyof typeof explanations];
  return categoryExplanations?.[category] || "Style analysis complete";
};

export const hasSubScores = (analysis: OutfitAnalysis | ClinicalAnalysis): analysis is ClinicalAnalysis => {
  return 'sub_scores' in analysis && analysis.sub_scores != null;
};

export const hasGarmentDetection = (analysis: OutfitAnalysis | ClinicalAnalysis): analysis is ClinicalAnalysis => {
  return 'garment_detection' in analysis && Array.isArray(analysis.garment_detection);
};

export const getAverageConfidence = (confidenceScores: Record<string, number>): number => {
  const values = Object.values(confidenceScores);
  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
};

export const shouldShowCelebration = (score: number): boolean => {
  return score >= SCORE_THRESHOLDS.HIGH;
};

export const shouldShowPerfectBadge = (score: number): boolean => {
  return score >= SCORE_THRESHOLDS.PERFECT;
};

export const shouldShowExcellentBadge = (score: number): boolean => {
  return score >= SCORE_THRESHOLDS.EXCELLENT;
};