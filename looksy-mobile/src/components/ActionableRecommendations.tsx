import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { theme, getScoreColor } from '../theme';
import { OutfitAnalysis, ClinicalAnalysis } from '../types';

interface ActionableRecommendationsProps {
  analysis: OutfitAnalysis | ClinicalAnalysis;
  onRecommendationAction?: (action: string, recommendation: any) => void;
}

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

export const ActionableRecommendations: React.FC<ActionableRecommendationsProps> = ({
  analysis,
  onRecommendationAction
}) => {
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const generateRecommendationCards = (): RecommendationCard[] => {
    const cards: RecommendationCard[] = [];
    let priorityCounter = 1;

    // Process strengths into positive reinforcement cards
    if (analysis.detailed_feedback.strengths) {
      analysis.detailed_feedback.strengths.slice(0, 2).forEach((strength, index) => {
        cards.push({
          id: `strength_${index}`,
          title: '✅ Keep This Up!',
          description: strength,
          impact: 'medium',
          difficulty: 'easy',
          category: 'mindset',
          actionable: false,
          icon: '🎯',
          priority: priorityCounter++
        });
      });
    }

    // Process improvements into actionable recommendations
    if (analysis.detailed_feedback.improvements) {
      analysis.detailed_feedback.improvements.forEach((improvement, index) => {
        const isColorRelated = improvement.toLowerCase().includes('color');
        const isFitRelated = improvement.toLowerCase().includes('fit') || improvement.toLowerCase().includes('size');
        const isStyleRelated = improvement.toLowerCase().includes('style') || improvement.toLowerCase().includes('pattern');

        cards.push({
          id: `improvement_${index}`,
          title: getImprovementTitle(improvement),
          description: improvement,
          impact: isColorRelated || isFitRelated ? 'high' : 'medium',
          difficulty: isFitRelated ? 'moderate' : 'easy',
          category: isFitRelated ? 'technique' : isColorRelated ? 'shopping' : 'immediate',
          actionable: true,
          icon: getImprovementIcon(improvement),
          priority: priorityCounter++
        });
      });
    }

    // Process clinical recommendations if available
    if ('recommendations' in analysis && analysis.recommendations) {
      // Minor adjustments - immediate actions
      if (analysis.recommendations.minor_adjustments) {
        analysis.recommendations.minor_adjustments.forEach((adjustment, index) => {
          cards.push({
            id: `minor_${index}`,
            title: '⚡ Quick Fix',
            description: adjustment,
            impact: 'medium',
            difficulty: 'easy',
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
            impact: 'high',
            difficulty: 'easy',
            category: 'shopping',
            actionable: true,
            icon: '🏠',
            priority: priorityCounter++
          });
        });
      }
    }

    // Generate smart technique recommendations based on scores
    if (analysis.color_score < 70) {
      cards.push({
        id: 'color_technique',
        title: '🎨 Color Mastery',
        description: 'Learn the 60-30-10 color rule: 60% dominant color, 30% secondary, 10% accent.',
        impact: 'high',
        difficulty: 'moderate',
        category: 'technique',
        actionable: true,
        icon: '📚',
        priority: priorityCounter++
      });
    }

    if (analysis.fit_score < 70) {
      cards.push({
        id: 'fit_technique',
        title: '📏 Perfect Fit Guide',
        description: 'Schedule a fitting session or learn key measurement points for better garment selection.',
        impact: 'high',
        difficulty: 'challenging',
        category: 'technique',
        actionable: true,
        icon: '🎯',
        priority: priorityCounter++
      });
    }

    return cards.sort((a, b) => a.priority - b.priority);
  };

  const getImprovementTitle = (improvement: string): string => {
    if (improvement.toLowerCase().includes('color')) return '🌈 Color Enhancement';
    if (improvement.toLowerCase().includes('fit')) return '📏 Fit Adjustment';
    if (improvement.toLowerCase().includes('pattern')) return '🎨 Pattern Play';
    if (improvement.toLowerCase().includes('accessory')) return '✨ Accessory Addition';
    return '💫 Style Refinement';
  };

  const getImprovementIcon = (improvement: string): string => {
    if (improvement.toLowerCase().includes('color')) return '🌈';
    if (improvement.toLowerCase().includes('fit')) return '📏';
    if (improvement.toLowerCase().includes('pattern')) return '🎨';
    if (improvement.toLowerCase().includes('accessory')) return '💎';
    return '✨';
  };

  const getImpactColor = (impact: string): string => {
    switch (impact) {
      case 'high': return '#22c55e';
      case 'medium': return '#f59e0b';
      case 'low': return '#6b7280';
      default: return theme.colors.primary;
    }
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy': return '#22c55e';
      case 'moderate': return '#f59e0b';
      case 'challenging': return '#ef4444';
      default: return theme.colors.primary;
    }
  };

  const handleActionPress = (card: RecommendationCard) => {
    if (!card.actionable) return;

    Alert.alert(
      card.title,
      `Would you like to mark this recommendation as completed?\n\n"${card.description}"`,
      [
        { text: 'Not Yet', style: 'cancel' },
        { 
          text: 'Mark Complete', 
          style: 'default',
          onPress: () => {
            setCompletedActions(prev => [...prev, card.id]);
            onRecommendationAction?.('complete', card);
          }
        },
        {
          text: 'Learn More',
          style: 'default',
          onPress: () => onRecommendationAction?.('learn_more', card)
        }
      ]
    );
  };

  const recommendationCards = generateRecommendationCards();
  
  const categories = [
    { key: 'all', label: 'All', icon: '🎯' },
    { key: 'immediate', label: 'Quick Wins', icon: '⚡' },
    { key: 'shopping', label: 'Shopping', icon: '🛍️' },
    { key: 'technique', label: 'Learn', icon: '📚' },
    { key: 'mindset', label: 'Mindset', icon: '🧠' }
  ];

  const filteredCards = selectedCategory === 'all' 
    ? recommendationCards 
    : recommendationCards.filter(card => card.category === selectedCategory);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Smart Recommendations</Text>
        <Text style={styles.subtitle}>
          {filteredCards.filter(c => c.actionable).length} actionable insights
        </Text>
      </View>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.key}
            style={[
              styles.categoryChip,
              selectedCategory === category.key && styles.activeCategoryChip
            ]}
            onPress={() => setSelectedCategory(category.key)}
          >
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text style={[
              styles.categoryLabel,
              selectedCategory === category.key && styles.activeCategoryLabel
            ]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Recommendation Cards */}
      <ScrollView 
        style={styles.cardsContainer}
        showsVerticalScrollIndicator={false}
      >
        {filteredCards.map((card) => {
          const isCompleted = completedActions.includes(card.id);
          
          return (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.recommendationCard,
                isCompleted && styles.completedCard,
                { borderLeftColor: getImpactColor(card.impact) }
              ]}
              onPress={() => handleActionPress(card)}
              disabled={!card.actionable}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardIcon}>{card.icon}</Text>
                  <Text style={[styles.cardTitle, isCompleted && styles.completedText]}>
                    {card.title}
                  </Text>
                  {isCompleted && <Text style={styles.checkmark}>✅</Text>}
                </View>
                
                <View style={styles.badgeContainer}>
                  <View style={[styles.impactBadge, { backgroundColor: getImpactColor(card.impact) + '20' }]}>
                    <Text style={[styles.badgeText, { color: getImpactColor(card.impact) }]}>
                      {card.impact.toUpperCase()}
                    </Text>
                  </View>
                  
                  <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(card.difficulty) + '20' }]}>
                    <Text style={[styles.badgeText, { color: getDifficultyColor(card.difficulty) }]}>
                      {card.difficulty.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={[styles.cardDescription, isCompleted && styles.completedText]}>
                {card.description}
              </Text>

              {card.actionable && !isCompleted && (
                <View style={styles.actionHint}>
                  <Text style={styles.actionText}>Tap to take action →</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Progress Summary */}
      <View style={styles.progressSummary}>
        <Text style={styles.progressText}>
          {completedActions.length} of {recommendationCards.filter(c => c.actionable).length} recommendations completed
        </Text>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { 
                width: `${(completedActions.length / Math.max(recommendationCards.filter(c => c.actionable).length, 1)) * 100}%` 
              }
            ]} 
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  
  header: {
    marginBottom: theme.spacing.lg,
  },
  
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  
  subtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
  },
  
  // Category Filter
  categoryScroll: {
    marginBottom: theme.spacing.lg,
  },
  
  categoryContainer: {
    paddingHorizontal: 4,
    gap: theme.spacing.sm,
  },
  
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: '#f8f9fa',
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
  },
  
  activeCategoryChip: {
    backgroundColor: theme.colors.primary,
  },
  
  categoryIcon: {
    fontSize: 16,
    marginRight: theme.spacing.xs,
  },
  
  categoryLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  
  activeCategoryLabel: {
    color: 'white',
    fontWeight: '600',
  },
  
  // Recommendation Cards
  cardsContainer: {
    maxHeight: 400,
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
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  
  completedCard: {
    backgroundColor: '#f8fdf8',
    opacity: 0.8,
  },
  
  cardHeader: {
    marginBottom: theme.spacing.md,
  },
  
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  
  cardIcon: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  
  cardTitle: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
  },
  
  checkmark: {
    fontSize: 20,
  },
  
  completedText: {
    textDecorationLine: 'line-through',
    color: theme.colors.text.secondary,
  },
  
  badgeContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  
  impactBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  
  difficultyBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  
  badgeText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    letterSpacing: 0.5,
  },
  
  cardDescription: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  
  actionHint: {
    alignSelf: 'flex-end',
  },
  
  actionText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.primary,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  
  // Progress Summary
  progressSummary: {
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  
  progressText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  
  progressBarContainer: {
    height: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
});