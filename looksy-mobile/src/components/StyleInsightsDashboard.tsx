import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { theme } from '../theme';
import { OutfitAnalysis, ClinicalAnalysis } from '../types';

interface StyleInsightsDashboardProps {
  analysis: OutfitAnalysis | ClinicalAnalysis;
  userStyleHistory?: any[];
}

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

export const StyleInsightsDashboard: React.FC<StyleInsightsDashboardProps> = ({
  analysis,
  userStyleHistory = []
}) => {
  const [selectedTab, setSelectedTab] = useState<'dna' | 'insights' | 'trends'>('dna');

  const generateStyleDNA = (): StyleDNA => {
    const colorScore = analysis.color_score;
    const fitScore = analysis.fit_score;
    const styleScore = analysis.style_score;

    return {
      colorProfile: colorScore >= 80 ? 'Color Harmonist' : 
                   colorScore >= 60 ? 'Color Explorer' : 'Color Learner',
      fitPreference: fitScore >= 80 ? 'Precision Fitter' : 
                    fitScore >= 60 ? 'Comfort Seeker' : 'Fit Explorer',
      stylePersonality: analysis.style_category || 'Eclectic',
      confidenceLevel: styleScore >= 80 ? 'Bold' : 
                      styleScore >= 60 ? 'Balanced' : 'Conservative'
    };
  };

  const generateInsights = (): InsightCard[] => {
    const insights: InsightCard[] = [];
    
    // Strength insights
    const topScore = Math.max(
      analysis.style_score,
      analysis.fit_score,
      analysis.color_score,
      analysis.occasion_appropriateness
    );

    if (analysis.style_score === topScore) {
      insights.push({
        id: 'style_strength',
        title: 'Style Coordination Master',
        description: 'Your pieces work beautifully together, showing excellent style intuition.',
        icon: '🎨',
        category: 'strength'
      });
    }

    if (analysis.fit_score === topScore) {
      insights.push({
        id: 'fit_strength',
        title: 'Perfect Fit Finder',
        description: 'You have a great eye for garments that flatter your silhouette.',
        icon: '👔',
        category: 'strength'
      });
    }

    // Opportunity insights
    const lowestScore = Math.min(
      analysis.style_score,
      analysis.fit_score,
      analysis.color_score,
      analysis.occasion_appropriateness
    );

    if (analysis.color_score === lowestScore && lowestScore < 70) {
      insights.push({
        id: 'color_opportunity',
        title: 'Color Growth Zone',
        description: 'Exploring complementary colors could elevate your looks significantly.',
        icon: '🌈',
        category: 'opportunity'
      });
    }

    if (analysis.fit_score === lowestScore && lowestScore < 70) {
      insights.push({
        id: 'fit_opportunity',
        title: 'Fit Refinement',
        description: 'Small fit adjustments could make a big impact on your overall appearance.',
        icon: '📏',
        category: 'opportunity'
      });
    }

    // Smart recommendations based on clinical analysis
    if ('sub_scores' in analysis && analysis.sub_scores) {
      if (analysis.sub_scores.proportion_silhouette < 70) {
        insights.push({
          id: 'proportion_rec',
          title: 'Proportion Magic',
          description: 'Try high-waisted bottoms or tucked tops to enhance your silhouette.',
          icon: '✨',
          category: 'recommendation'
        });
      }

      if (analysis.sub_scores.layering_logic > 80) {
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
    if (analysis.overall_score > 85) {
      insights.push({
        id: 'trendsetter',
        title: 'Style Trendsetter',
        description: 'Your style sense puts you ahead of the curve. Others look to you for inspiration.',
        icon: '🚀',
        category: 'trend'
      });
    }

    return insights;
  };

  const styleDNA = generateStyleDNA();
  const insights = generateInsights();

  const renderDNATab = () => (
    <View style={styles.dnaContainer}>
      <Text style={styles.dnaTitle}>Your Style DNA</Text>
      
      <View style={styles.dnaCard}>
        <View style={styles.dnaRow}>
          <Text style={styles.dnaLabel}>Color Profile</Text>
          <Text style={styles.dnaValue}>{styleDNA.colorProfile}</Text>
        </View>
        <View style={styles.dnaRow}>
          <Text style={styles.dnaLabel}>Fit Style</Text>
          <Text style={styles.dnaValue}>{styleDNA.fitPreference}</Text>
        </View>
        <View style={styles.dnaRow}>
          <Text style={styles.dnaLabel}>Style Personality</Text>
          <Text style={styles.dnaValue}>{styleDNA.stylePersonality}</Text>
        </View>
        <View style={styles.dnaRow}>
          <Text style={styles.dnaLabel}>Risk Level</Text>
          <Text style={[styles.dnaValue, { 
            color: styleDNA.confidenceLevel === 'Bold' ? '#ef4444' : 
                   styleDNA.confidenceLevel === 'Balanced' ? '#f59e0b' : '#22c55e'
          }]}>
            {styleDNA.confidenceLevel}
          </Text>
        </View>
      </View>

      <Text style={styles.dnaDescription}>
        Your Style DNA is a unique fingerprint of your fashion preferences, 
        helping you understand what works best for your personal style journey.
      </Text>
    </View>
  );

  const renderInsightsTab = () => (
    <View style={styles.insightsContainer}>
      <Text style={styles.insightsTitle}>Smart Insights</Text>
      
      {insights.map((insight) => (
        <TouchableOpacity key={insight.id} style={[
          styles.insightCard,
          { borderLeftColor: getInsightColor(insight.category) }
        ]}>
          <View style={styles.insightHeader}>
            <Text style={styles.insightIcon}>{insight.icon}</Text>
            <Text style={styles.insightTitle}>{insight.title}</Text>
          </View>
          <Text style={styles.insightDescription}>{insight.description}</Text>
          <View style={[styles.categoryBadge, { backgroundColor: getInsightColor(insight.category) + '20' }]}>
            <Text style={[styles.categoryText, { color: getInsightColor(insight.category) }]}>
              {insight.category.toUpperCase()}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTrendsTab = () => (
    <View style={styles.trendsContainer}>
      <Text style={styles.trendsTitle}>Your Style Evolution</Text>
      
      <View style={styles.progressCard}>
        <Text style={styles.progressLabel}>Style Confidence</Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${analysis.overall_score}%`, backgroundColor: theme.colors.primary }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>{analysis.overall_score.toFixed(1)}% Complete</Text>
      </View>

      <View style={styles.evolutionCard}>
        <Text style={styles.evolutionTitle}>🎯 Next Level Goals</Text>
        <View style={styles.goalsList}>
          {analysis.overall_score < 70 && (
            <Text style={styles.goalItem}>• Master color coordination basics</Text>
          )}
          {analysis.fit_score < 80 && (
            <Text style={styles.goalItem}>• Refine fit preferences</Text>
          )}
          {analysis.overall_score >= 70 && analysis.overall_score < 85 && (
            <Text style={styles.goalItem}>• Experiment with advanced styling techniques</Text>
          )}
          {analysis.overall_score >= 85 && (
            <Text style={styles.goalItem}>• Share your style expertise with others!</Text>
          )}
        </View>
      </View>
    </View>
  );

  const getInsightColor = (category: string): string => {
    switch (category) {
      case 'strength': return '#22c55e';
      case 'opportunity': return '#f59e0b';
      case 'trend': return '#8b5cf6';
      case 'recommendation': return '#3b82f6';
      default: return theme.colors.primary;
    }
  };

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'dna', label: 'Style DNA', icon: '🧬' },
          { key: 'insights', label: 'Insights', icon: '💡' },
          { key: 'trends', label: 'Trends', icon: '📈' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
            onPress={() => setSelectedTab(tab.key as any)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, selectedTab === tab.key && styles.activeTabLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {selectedTab === 'dna' && renderDNATab()}
        {selectedTab === 'insights' && renderInsightsTab()}
        {selectedTab === 'trends' && renderTrendsTab()}
      </ScrollView>
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
  
  // Tab Navigation
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: theme.borderRadius.md,
    padding: 4,
    marginBottom: theme.spacing.lg,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabIcon: {
    fontSize: 16,
    marginRight: theme.spacing.xs,
  },
  tabLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  activeTabLabel: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  
  tabContent: {
    flex: 1,
  },
  
  // DNA Tab
  dnaContainer: {
    alignItems: 'center',
  },
  dnaTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  dnaCard: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    width: '100%',
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  dnaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dnaLabel: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  dnaValue: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weights.semibold,
  },
  dnaDescription: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: theme.spacing.md,
  },
  
  // Insights Tab
  insightsContainer: {},
  insightsTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  insightCard: {
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
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  insightIcon: {
    fontSize: 24,
    marginRight: theme.spacing.sm,
  },
  insightTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  insightDescription: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  categoryText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    letterSpacing: 0.5,
  },
  
  // Trends Tab
  trendsContainer: {},
  trendsTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  progressCard: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  progressLabel: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  evolutionCard: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  evolutionTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  goalsList: {
    gap: theme.spacing.sm,
  },
  goalItem: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
});