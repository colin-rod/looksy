import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { theme } from '../../theme';
import { OutfitAnalysis, ClinicalAnalysis } from '../../types';
import { useRecommendations } from '../../hooks/useRecommendations';
import { RECOMMENDATION_CATEGORIES } from '../../constants/components';

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

export const ActionableRecommendations: React.FC<ActionableRecommendationsProps> = React.memo(({
  analysis,
  onRecommendationAction
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { 
    recommendationCards, 
    completedActions, 
    markCompleted, 
    getFilteredCards 
  } = useRecommendations(analysis);

  // Validate analysis data
  if (!analysis) {
    return (
      <View style={styles.container}>
        <ErrorState />
      </View>
    );
  }

  const filteredCards = getFilteredCards(selectedCategory);

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
            markCompleted(card.id);
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

  return (
    <View style={styles.container}>
      <Header 
        actionableCount={filteredCards.filter(c => c.actionable).length}
      />

      <CategoryFilter 
        categories={RECOMMENDATION_CATEGORIES}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />

      <RecommendationsList
        cards={filteredCards}
        completedActions={completedActions}
        onCardPress={handleActionPress}
      />

      <ProgressSummary
        completedCount={completedActions.length}
        totalActionable={recommendationCards.filter(c => c.actionable).length}
      />
    </View>
  );
});

// Error State Component
const ErrorState: React.FC = React.memo(() => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorTitle}>No Recommendations Available</Text>
    <Text style={styles.errorText}>
      Complete an outfit analysis to receive personalized recommendations.
    </Text>
  </View>
));

// Header Component
interface HeaderProps {
  actionableCount: number;
}

const Header: React.FC<HeaderProps> = React.memo(({ actionableCount }) => (
  <View style={styles.header}>
    <Text style={styles.title}>Smart Recommendations</Text>
    <Text style={styles.subtitle}>
      {actionableCount} actionable insights
    </Text>
  </View>
));

// Category Filter Component
interface CategoryFilterProps {
  categories: readonly { key: string; label: string; icon: string; }[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = React.memo(({
  categories,
  selectedCategory,
  onCategorySelect
}) => (
  <ScrollView 
    horizontal 
    showsHorizontalScrollIndicator={false} 
    style={styles.categoryScroll}
    contentContainerStyle={styles.categoryContainer}
  >
    {categories.map((category) => (
      <CategoryChip
        key={category.key}
        category={category}
        isSelected={selectedCategory === category.key}
        onPress={() => onCategorySelect(category.key)}
      />
    ))}
  </ScrollView>
));

// Category Chip Component
interface CategoryChipProps {
  category: { key: string; label: string; icon: string; };
  isSelected: boolean;
  onPress: () => void;
}

const CategoryChip: React.FC<CategoryChipProps> = React.memo(({
  category,
  isSelected,
  onPress
}) => (
  <TouchableOpacity
    style={[
      styles.categoryChip,
      isSelected && styles.activeCategoryChip
    ]}
    onPress={onPress}
    accessible={true}
    accessibilityRole="tab"
    accessibilityState={{ selected: isSelected }}
    accessibilityLabel={`${category.label} category`}
  >
    <Text style={styles.categoryIcon}>{category.icon}</Text>
    <Text style={[
      styles.categoryLabel,
      isSelected && styles.activeCategoryLabel
    ]}>
      {category.label}
    </Text>
  </TouchableOpacity>
));

// Recommendations List Component
interface RecommendationsListProps {
  cards: RecommendationCard[];
  completedActions: string[];
  onCardPress: (card: RecommendationCard) => void;
}

const RecommendationsList: React.FC<RecommendationsListProps> = React.memo(({
  cards,
  completedActions,
  onCardPress
}) => (
  <ScrollView 
    style={styles.cardsContainer}
    showsVerticalScrollIndicator={false}
  >
    {cards.map((card) => (
      <RecommendationCardComponent
        key={card.id}
        card={card}
        isCompleted={completedActions.includes(card.id)}
        onPress={onCardPress}
      />
    ))}
  </ScrollView>
));

// Individual Recommendation Card Component
interface RecommendationCardComponentProps {
  card: RecommendationCard;
  isCompleted: boolean;
  onPress: (card: RecommendationCard) => void;
}

const RecommendationCardComponent: React.FC<RecommendationCardComponentProps> = React.memo(({
  card,
  isCompleted,
  onPress
}) => (
  <TouchableOpacity
    style={[
      styles.recommendationCard,
      isCompleted && styles.completedCard,
      { borderLeftColor: getImpactColor(card.impact) }
    ]}
    onPress={() => onPress(card)}
    disabled={!card.actionable}
    accessible={true}
    accessibilityRole={card.actionable ? "button" : "text"}
    accessibilityLabel={`${card.title}. ${card.description}. Impact: ${card.impact}. Difficulty: ${card.difficulty}. ${isCompleted ? 'Completed' : card.actionable ? 'Tap to take action' : ''}`}
  >
    <View style={styles.cardHeader}>
      <CardTitleRow 
        card={card}
        isCompleted={isCompleted}
      />
      
      <BadgeContainer 
        impact={card.impact}
        difficulty={card.difficulty}
      />
    </View>

    <Text style={[styles.cardDescription, isCompleted && styles.completedText]}>
      {card.description}
    </Text>

    {card.actionable && !isCompleted && (
      <ActionHint />
    )}
  </TouchableOpacity>
));

// Card Title Row Component
interface CardTitleRowProps {
  card: RecommendationCard;
  isCompleted: boolean;
}

const CardTitleRow: React.FC<CardTitleRowProps> = React.memo(({
  card,
  isCompleted
}) => (
  <View style={styles.cardTitleRow}>
    <Text style={styles.cardIcon}>{card.icon}</Text>
    <Text style={[styles.cardTitle, isCompleted && styles.completedText]}>
      {card.title}
    </Text>
    {isCompleted && <Text style={styles.checkmark}>✅</Text>}
  </View>
));

// Badge Container Component
interface BadgeContainerProps {
  impact: string;
  difficulty: string;
}

const BadgeContainer: React.FC<BadgeContainerProps> = React.memo(({
  impact,
  difficulty
}) => (
  <View style={styles.badgeContainer}>
    <Badge 
      label={impact.toUpperCase()}
      color={getImpactColor(impact)}
      style={styles.impactBadge}
    />
    
    <Badge 
      label={difficulty.toUpperCase()}
      color={getDifficultyColor(difficulty)}
      style={styles.difficultyBadge}
    />
  </View>
));

// Reusable Badge Component
interface BadgeProps {
  label: string;
  color: string;
  style?: object;
}

const Badge: React.FC<BadgeProps> = React.memo(({
  label,
  color,
  style
}) => (
  <View style={[style, { backgroundColor: color + '20' }]}>
    <Text style={[styles.badgeText, { color }]}>
      {label}
    </Text>
  </View>
));

// Action Hint Component
const ActionHint: React.FC = React.memo(() => (
  <View style={styles.actionHint}>
    <Text style={styles.actionText}>Tap to take action →</Text>
  </View>
));

// Progress Summary Component
interface ProgressSummaryProps {
  completedCount: number;
  totalActionable: number;
}

const ProgressSummary: React.FC<ProgressSummaryProps> = React.memo(({
  completedCount,
  totalActionable
}) => {
  const progressPercentage = totalActionable > 0 
    ? (completedCount / totalActionable) * 100 
    : 0;

  return (
    <View style={styles.progressSummary}>
      <Text style={styles.progressText}>
        {completedCount} of {totalActionable} recommendations completed
      </Text>
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar, 
            { width: `${progressPercentage}%` }
          ]} 
          accessible={true}
          accessibilityLabel={`Progress: ${Math.round(progressPercentage)} percent complete`}
        />
      </View>
    </View>
  );
});

// Helper functions
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
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
    borderRadius: 20,
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