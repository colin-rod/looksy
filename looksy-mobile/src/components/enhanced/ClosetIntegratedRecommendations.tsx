import React from 'react';
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
import { useClosetRecommendations } from '../../hooks/useClosetRecommendations';

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
  const {
    recommendations,
    completedActions,
    markCompleted,
    getDetectedItems,
  } = useClosetRecommendations(analysis);

  // Validate required props
  if (!analysis || !navigation || !outfitId) {
    return (
      <View style={styles.container}>
        <ErrorState />
      </View>
    );
  }

  const handleRecommendationPress = (rec: ClosetRecommendation) => {
    switch (rec.closetAction) {
      case 'confirm_items':
        navigation.navigate('CLOSET_CONFIRMATION', {
          outfitId,
          detectedItems: getDetectedItems()
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
                markCompleted(rec.id);
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
                markCompleted(rec.id);
                onRecommendationAction?.('complete', rec);
              }
            }
          ]
        );
    }
  };

  return (
    <View style={styles.container}>
      <Header />
      
      <RecommendationsList
        recommendations={recommendations}
        completedActions={completedActions}
        onRecommendationPress={handleRecommendationPress}
      />

      <ProgressSummary
        completedCount={completedActions.length}
        totalCount={recommendations.length}
      />
    </View>
  );
});

// Error State Component
const ErrorState: React.FC = React.memo(() => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorTitle}>Closet Integration Unavailable</Text>
    <Text style={styles.errorText}>Missing required data for closet recommendations.</Text>
  </View>
));

// Header Component
const Header: React.FC = React.memo(() => (
  <View style={styles.header}>
    <Text style={styles.title}>Closet-Smart Recommendations</Text>
    <Text style={styles.subtitle}>
      Personalized suggestions based on your style and wardrobe
    </Text>
  </View>
));

// Recommendations List Component
interface RecommendationsListProps {
  recommendations: ClosetRecommendation[];
  completedActions: string[];
  onRecommendationPress: (rec: ClosetRecommendation) => void;
}

const RecommendationsList: React.FC<RecommendationsListProps> = React.memo(({
  recommendations,
  completedActions,
  onRecommendationPress
}) => (
  <ScrollView 
    style={styles.recommendationsContainer}
    showsVerticalScrollIndicator={false}
  >
    {recommendations.map((rec) => (
      <RecommendationCard
        key={rec.id}
        recommendation={rec}
        isCompleted={completedActions.includes(rec.id)}
        onPress={onRecommendationPress}
      />
    ))}
  </ScrollView>
));

// Individual Recommendation Card Component
interface RecommendationCardProps {
  recommendation: ClosetRecommendation;
  isCompleted: boolean;
  onPress: (rec: ClosetRecommendation) => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = React.memo(({
  recommendation,
  isCompleted,
  onPress
}) => (
  <TouchableOpacity
    style={[
      styles.recommendationCard,
      isCompleted && styles.completedCard,
      { borderLeftColor: getPriorityColor(recommendation.priority) }
    ]}
    onPress={() => onPress(recommendation)}
    accessible={true}
    accessibilityRole="button"
    accessibilityLabel={`${recommendation.title}. ${recommendation.description}. Priority: ${recommendation.priority}. Type: ${recommendation.type}. ${isCompleted ? 'Completed' : getActionText(recommendation.closetAction)}`}
  >
    <CardHeader 
      recommendation={recommendation}
      isCompleted={isCompleted}
    />

    <Text style={[styles.description, isCompleted && styles.completedText]}>
      {recommendation.description}
    </Text>

    {!isCompleted && (
      <ActionIndicator closetAction={recommendation.closetAction} />
    )}
  </TouchableOpacity>
));

// Card Header Component
interface CardHeaderProps {
  recommendation: ClosetRecommendation;
  isCompleted: boolean;
}

const CardHeader: React.FC<CardHeaderProps> = React.memo(({
  recommendation,
  isCompleted
}) => (
  <View style={styles.cardHeader}>
    <TitleRow 
      recommendation={recommendation}
      isCompleted={isCompleted}
    />
    
    <BadgeContainer 
      priority={recommendation.priority}
      type={recommendation.type}
    />
  </View>
));

// Title Row Component
interface TitleRowProps {
  recommendation: ClosetRecommendation;
  isCompleted: boolean;
}

const TitleRow: React.FC<TitleRowProps> = React.memo(({
  recommendation,
  isCompleted
}) => (
  <View style={styles.titleRow}>
    <Text style={styles.icon}>{recommendation.icon}</Text>
    <Text style={[styles.cardTitle, isCompleted && styles.completedText]}>
      {recommendation.title}
    </Text>
    {isCompleted && <Text style={styles.checkmark}>✅</Text>}
  </View>
));

// Badge Container Component
interface BadgeContainerProps {
  priority: string;
  type: string;
}

const BadgeContainer: React.FC<BadgeContainerProps> = React.memo(({
  priority,
  type
}) => (
  <View style={styles.badgeContainer}>
    <Badge 
      label={priority.toUpperCase()}
      color={getPriorityColor(priority)}
      style={styles.priorityBadge}
    />
    
    <Badge 
      label={type.replace('_', ' ').toUpperCase()}
      color={getTypeColor(type)}
      style={styles.typeBadge}
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

// Action Indicator Component
interface ActionIndicatorProps {
  closetAction?: string;
}

const ActionIndicator: React.FC<ActionIndicatorProps> = React.memo(({
  closetAction
}) => (
  <View style={styles.actionIndicator}>
    <Text style={styles.actionText}>
      {getActionText(closetAction)}
    </Text>
  </View>
));

// Progress Summary Component
interface ProgressSummaryProps {
  completedCount: number;
  totalCount: number;
}

const ProgressSummary: React.FC<ProgressSummaryProps> = React.memo(({
  completedCount,
  totalCount
}) => {
  const progressPercentage = totalCount > 0 
    ? (completedCount / totalCount) * 100 
    : 0;

  return (
    <View style={styles.progressSummary}>
      <Text style={styles.progressText}>
        {completedCount} of {totalCount} closet actions completed
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

const getActionText = (closetAction?: string): string => {
  switch (closetAction) {
    case 'confirm_items': return 'Tap to confirm items →';
    case 'view_alternatives': return 'Tap to browse closet →';
    case 'add_wishlist': return 'Tap to add to wishlist →';
    default: return 'Tap to take action →';
  }
};

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