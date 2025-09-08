/**
 * Custom hook for generating closet-integrated recommendations
 */

import { useState, useEffect, useCallback } from 'react';
import { OutfitAnalysis, ClinicalAnalysis } from '../types';
import { CLOSET_RECOMMENDATION_TYPES, CLOSET_PRIORITIES, SCORE_THRESHOLDS } from '../constants/components';
import { hasGarmentDetection } from '../utils/scoreUtils';

interface ClosetRecommendation {
  id: string;
  title: string;
  description: string;
  type: 'from_closet' | 'add_to_closet' | 'styling_tip' | 'shopping_suggestion';
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  icon: string;
  closetAction?: 'confirm_items' | 'view_alternatives' | 'add_wishlist';
}

export const useClosetRecommendations = (analysis: OutfitAnalysis | ClinicalAnalysis | null) => {
  const [recommendations, setRecommendations] = useState<ClosetRecommendation[]>([]);
  const [completedActions, setCompletedActions] = useState<string[]>([]);

  const generateClosetRecommendations = useCallback((): ClosetRecommendation[] => {
    if (!analysis) return [];
    
    const recs: ClosetRecommendation[] = [];

    try {
      // 1. Closet Confirmation for Detected Items
      if (hasGarmentDetection(analysis) && analysis.garment_detection.length > 0) {
        recs.push({
          id: 'confirm_closet_items',
          title: '👕 Confirm Your Closet Items',
          description: `We detected ${analysis.garment_detection.length} items in your outfit. Help us learn your wardrobe for personalized recommendations.`,
          type: CLOSET_RECOMMENDATION_TYPES.ADD_TO_CLOSET,
          priority: CLOSET_PRIORITIES.HIGH,
          actionable: true,
          icon: '🏠',
          closetAction: 'confirm_items'
        });
      }

      // 2. Closet-Based Recommendations from Analysis
      if ('recommendations' in analysis && analysis.recommendations?.closet_recommendations) {
        analysis.recommendations.closet_recommendations.forEach((closetRec, index) => {
          recs.push({
            id: `closet_rec_${index}`,
            title: '✨ From Your Closet',
            description: closetRec,
            type: CLOSET_RECOMMENDATION_TYPES.FROM_CLOSET,
            priority: CLOSET_PRIORITIES.HIGH,
            actionable: true,
            icon: '👔',
            closetAction: 'view_alternatives'
          });
        });
      }

      // 3. Smart Closet Building Suggestions
      if (analysis.color_score < SCORE_THRESHOLDS.GOOD) {
        recs.push({
          id: 'color_closet_audit',
          title: '🌈 Color Closet Audit',
          description: 'Review your closet colors to identify gaps and build a more cohesive color palette.',
          type: CLOSET_RECOMMENDATION_TYPES.STYLING_TIP,
          priority: CLOSET_PRIORITIES.MEDIUM,
          actionable: true,
          icon: '🎨',
          closetAction: 'view_alternatives'
        });
      }

      if (analysis.fit_score < SCORE_THRESHOLDS.GOOD) {
        recs.push({
          id: 'fit_investment_guide',
          title: '📏 Fit Investment Guide',
          description: 'Identify key pieces in your closet that would benefit from tailoring or replacement.',
          type: CLOSET_RECOMMENDATION_TYPES.STYLING_TIP,
          priority: CLOSET_PRIORITIES.MEDIUM,
          actionable: true,
          icon: '✂️'
        });
      }

      // 4. Closet Gap Analysis
      const detectedCategories = hasGarmentDetection(analysis)
        ? analysis.garment_detection.map(item => item.category.toLowerCase())
        : [];

      const essentialCategories = ['shirt', 'pants', 'jacket', 'shoes'];
      const missingCategories = essentialCategories.filter(cat => 
        !detectedCategories.some(detected => detected.includes(cat))
      );

      if (missingCategories.length > 0) {
        recs.push({
          id: 'closet_gap_analysis',
          title: '🎯 Closet Gap Analysis',
          description: `Consider adding ${missingCategories.join(', ')} to your closet for more styling versatility.`,
          type: CLOSET_RECOMMENDATION_TYPES.SHOPPING_SUGGESTION,
          priority: CLOSET_PRIORITIES.LOW,
          actionable: true,
          icon: '🛍️',
          closetAction: 'add_wishlist'
        });
      }

      // 5. Seasonal Closet Recommendations
      if (analysis.overall_score > SCORE_THRESHOLDS.HIGH) {
        recs.push({
          id: 'closet_optimization',
          title: '🚀 Closet Optimization',
          description: 'Your style is on point! Consider organizing your closet to showcase your best pieces and create more outfit combinations.',
          type: CLOSET_RECOMMENDATION_TYPES.STYLING_TIP,
          priority: CLOSET_PRIORITIES.LOW,
          actionable: true,
          icon: '⭐'
        });
      }

      return recs;
    } catch (error) {
      // Return basic recommendation if generation fails
      return [{
        id: 'basic_closet_rec',
        title: '📊 Closet Integration Ready',
        description: 'Your outfit analysis is complete. Connect with your closet for personalized recommendations.',
        type: CLOSET_RECOMMENDATION_TYPES.STYLING_TIP,
        priority: CLOSET_PRIORITIES.MEDIUM,
        actionable: false,
        icon: '📊'
      }];
    }
  }, [analysis]);

  useEffect(() => {
    const recs = generateClosetRecommendations();
    setRecommendations(recs);
  }, [generateClosetRecommendations]);

  const markCompleted = useCallback((recommendationId: string) => {
    setCompletedActions(prev => [...prev, recommendationId]);
  }, []);

  const resetCompleted = useCallback(() => {
    setCompletedActions([]);
  }, []);

  const getDetectedItems = useCallback(() => {
    if (!analysis || !hasGarmentDetection(analysis)) return [];
    
    return analysis.garment_detection.map(item => ({
      id: item.item_id,
      category: item.category,
      attributes: item.attributes,
      confidence: Object.values(item.confidence_scores).reduce((a, b) => a + b, 0) / Object.values(item.confidence_scores).length,
      existsInCloset: false
    }));
  }, [analysis]);

  return {
    recommendations,
    completedActions,
    markCompleted,
    resetCompleted,
    getDetectedItems,
  };
};