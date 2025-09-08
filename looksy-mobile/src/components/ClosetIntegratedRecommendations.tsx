import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { theme } from '../theme';
import { OutfitAnalysis, ClinicalAnalysis } from '../types';

interface ClosetIntegratedRecommendationsProps {
  analysis: OutfitAnalysis | ClinicalAnalysis;
  navigation: any;
  outfitId: string;
  onRecommendationAction?: (action: string, recommendation: any) => void;
}

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

export const ClosetIntegratedRecommendations: React.FC<ClosetIntegratedRecommendationsProps> = React.memo(({
  analysis,
  navigation,
  outfitId,
  onRecommendationAction
}) => {
  const [recommendations, setRecommendations] = useState<ClosetRecommendation[]>([]);
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  
  // Validate required props
  if (!analysis || !navigation || !outfitId) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Closet Integration Unavailable</Text>
          <Text style={styles.errorText}>Missing required data for closet recommendations.</Text>
        </View>
      </View>
    );
  }

  useEffect(() => {
    generateClosetRecommendations();
  }, [analysis]);

  const generateClosetRecommendations = () => {
    const recs: ClosetRecommendation[] = [];

    // 1. Closet Confirmation for Detected Items
    if ('garment_detection' in analysis && analysis.garment_detection && analysis.garment_detection.length > 0) {
      recs.push({
        id: 'confirm_closet_items',
        title: '👕 Confirm Your Closet Items',
        description: `We detected ${analysis.garment_detection.length} items in your outfit. Help us learn your wardrobe for personalized recommendations.`,
        type: 'add_to_closet',
        priority: 'high',
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
          type: 'from_closet',
          priority: 'high',
          actionable: true,
          icon: '👔',
          closetAction: 'view_alternatives'
        });
      });
    }

    // 3. Smart Closet Building Suggestions
    if (analysis.color_score < 70) {
      recs.push({
        id: 'color_closet_audit',
        title: '🌈 Color Closet Audit',
        description: 'Review your closet colors to identify gaps and build a more cohesive color palette.',
        type: 'styling_tip',
        priority: 'medium',
        actionable: true,
        icon: '🎨',
        closetAction: 'view_alternatives'
      });
    }

    if (analysis.fit_score < 70) {
      recs.push({
        id: 'fit_investment_guide',
        title: '📏 Fit Investment Guide',
        description: 'Identify key pieces in your closet that would benefit from tailoring or replacement.',
        type: 'styling_tip',
        priority: 'medium',
        actionable: true,
        icon: '✂️'
      });
    }

    // 4. Closet Gap Analysis
    const detectedCategories = 'garment_detection' in analysis && analysis.garment_detection 
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
        type: 'shopping_suggestion',
        priority: 'low',
        actionable: true,
        icon: '🛍️',
        closetAction: 'add_wishlist'
      });
    }

    // 5. Seasonal Closet Recommendations
    if (analysis.overall_score > 80) {
      recs.push({
        id: 'closet_optimization',
        title: '🚀 Closet Optimization',
        description: 'Your style is on point! Consider organizing your closet to showcase your best pieces and create more outfit combinations.',
        type: 'styling_tip',
        priority: 'low',
        actionable: true,
        icon: '⭐'
      });
    }

    setRecommendations(recs);
  };

  const handleRecommendationPress = (rec: ClosetRecommendation) => {
    switch (rec.closetAction) {
      case 'confirm_items':
        navigation.navigate('CLOSET_CONFIRMATION', {
          outfitId,
          detectedItems: 'garment_detection' in analysis && analysis.garment_detection 
            ? analysis.garment_detection.map(item => ({
                id: item.item_id,
                category: item.category,
                attributes: item.attributes,
                confidence: Object.values(item.confidence_scores).reduce((a, b) => a + b, 0) / Object.values(item.confidence_scores).length,
                existsInCloset: false
              }))
            : []
        });
        break;
      
      case 'view_alternatives':
        // Future: Navigate to closet browser with filters
        Alert.alert(
          'Closet Browser',
          'This will open your closet browser with relevant filters. (Feature coming soon!)',
          [{ text: 'OK' }]
        );
        break;
      
      case 'add_wishlist':
        Alert.alert(
          'Add to Wishlist',
          'Would you like to add these items to your shopping wishlist?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Add to Wishlist', 
              onPress: () => {
                setCompletedActions(prev => [...prev, rec.id]);
                onRecommendationAction?.('add_wishlist', rec);
              }
            }
          ]
        );
        break;
      
      default:
        Alert.alert(
          rec.title,
          rec.description,
          [
            { text: 'Not Now', style: 'cancel' },
            { 
              text: 'Mark Complete', 
              onPress: () => {
                setCompletedActions(prev => [...prev, rec.id]);
                onRecommendationAction?.('complete', rec);
              }
            }
          ]
        );
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#22c55e';
      default: return theme.colors.primary;
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'from_closet': return '#22c55e';
      case 'add_to_closet': return '#3b82f6';
      case 'styling_tip': return '#8b5cf6';
      case 'shopping_suggestion': return '#f59e0b';
      default: return theme.colors.primary;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Closet-Smart Recommendations</Text>
        <Text style={styles.subtitle}>
          Personalized suggestions based on your style and wardrobe
        </Text>
      </View>

      <ScrollView 
        style={styles.recommendationsContainer}
        showsVerticalScrollIndicator={false}
      >
        {recommendations.map((rec) => {
          const isCompleted = completedActions.includes(rec.id);
          
          return (
            <TouchableOpacity
              key={rec.id}
              style={[
                styles.recommendationCard,
                isCompleted && styles.completedCard,
                { borderLeftColor: getPriorityColor(rec.priority) }
              ]}
              onPress={() => handleRecommendationPress(rec)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.titleRow}>
                  <Text style={styles.icon}>{rec.icon}</Text>
                  <Text style={[styles.cardTitle, isCompleted && styles.completedText]}>
                    {rec.title}
                  </Text>
                  {isCompleted && <Text style={styles.checkmark}>✅</Text>}
                </View>
                
                <View style={styles.badgeContainer}>
                  <View style={[
                    styles.priorityBadge, 
                    { backgroundColor: getPriorityColor(rec.priority) + '20' }
                  ]}>
                    <Text style={[styles.badgeText, { color: getPriorityColor(rec.priority) }]}>
                      {rec.priority.toUpperCase()}
                    </Text>
                  </View>
                  
                  <View style={[
                    styles.typeBadge,
                    { backgroundColor: getTypeColor(rec.type) + '20' }
                  ]}>
                    <Text style={[styles.badgeText, { color: getTypeColor(rec.type) }]}>
                      {rec.type.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={[styles.description, isCompleted && styles.completedText]}>
                {rec.description}
              </Text>

              {!isCompleted && (
                <View style={styles.actionIndicator}>
                  <Text style={styles.actionText}>
                    {rec.closetAction === 'confirm_items' && 'Tap to confirm items →'}
                    {rec.closetAction === 'view_alternatives' && 'Tap to browse closet →'}
                    {rec.closetAction === 'add_wishlist' && 'Tap to add to wishlist →'}
                    {!rec.closetAction && 'Tap to take action →'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Progress Summary */}
      <View style={styles.progressSummary}>
        <Text style={styles.progressText}>
          {completedActions.length} of {recommendations.length} closet actions completed
        </Text>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { 
                width: `${(completedActions.length / Math.max(recommendations.length, 1)) * 100}%` 
              }
            ]} 
          />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9ff',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 2,
    borderColor: '#e0e7ff',
  },
  
  // Error States
  errorContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  errorTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  
  header: {
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: '#3730a3',
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  
  subtitle: {
    fontSize: theme.typography.sizes.sm,
    color: '#6366f1',
    textAlign: 'center',
  },
  
  recommendationsContainer: {
    maxHeight: 500,
    marginBottom: theme.spacing.lg,
  },
  
  recommendationCard: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  completedCard: {
    backgroundColor: '#f0f9ff',
    opacity: 0.8,
  },
  
  cardHeader: {
    marginBottom: theme.spacing.md,
  },
  
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  
  icon: {
    fontSize: 24,
    marginRight: theme.spacing.sm,
  },
  
  cardTitle: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
  },
  
  checkmark: {
    fontSize: 24,
  },
  
  completedText: {
    textDecorationLine: 'line-through',
    color: theme.colors.text.secondary,
  },
  
  badgeContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  
  priorityBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  
  typeBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  
  badgeText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    letterSpacing: 0.5,
  },
  
  description: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  
  actionIndicator: {
    alignSelf: 'flex-end',
  },
  
  actionText: {
    fontSize: theme.typography.sizes.xs,
    color: '#6366f1',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  
  progressSummary: {
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#e0e7ff',
  },
  
  progressText: {
    fontSize: theme.typography.sizes.sm,
    color: '#6366f1',
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    fontWeight: '500',
  },
  
  progressBarContainer: {
    height: 6,
    backgroundColor: '#e0e7ff',
    borderRadius: 3,
    overflow: 'hidden',
  },
  
  progressBar: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 3,
  },
});