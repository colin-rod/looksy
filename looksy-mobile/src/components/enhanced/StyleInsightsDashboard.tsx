import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { theme } from '../../theme';
import { OutfitAnalysis, ClinicalAnalysis } from '../../types';
import { useStyleInsights } from '../../hooks/useStyleInsights';
import { INSIGHT_COLORS } from '../../constants/components';

interface StyleInsightsDashboardProps {
  analysis: OutfitAnalysis | ClinicalAnalysis;
  userStyleHistory?: any[];
}

type TabKey = 'dna' | 'insights' | 'trends';

interface TabConfig {
  key: TabKey;
  label: string;
  icon: string;
}

const TAB_CONFIG: TabConfig[] = [
  { key: 'dna', label: 'Style DNA', icon: '🧬' },
  { key: 'insights', label: 'Insights', icon: '💡' },
  { key: 'trends', label: 'Trends', icon: '📈' },
];

export const StyleInsightsDashboard: React.FC<StyleInsightsDashboardProps> = React.memo(({
  analysis,
  userStyleHistory = []
}) => {
  const [selectedTab, setSelectedTab] = useState<TabKey>('dna');
  const { styleDNA, insights } = useStyleInsights(analysis);

  return (
    <View style={styles.container}>
      <TabNavigation 
        tabs={TAB_CONFIG}
        selectedTab={selectedTab}
        onTabPress={setSelectedTab}
      />

      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        {selectedTab === 'dna' && <StyleDNATab styleDNA={styleDNA} />}
        {selectedTab === 'insights' && <InsightsTab insights={insights} />}
        {selectedTab === 'trends' && <TrendsTab analysis={analysis} />}
      </ScrollView>
    </View>
  );
});

// Tab Navigation Component
interface TabNavigationProps {
  tabs: TabConfig[];
  selectedTab: TabKey;
  onTabPress: (tab: TabKey) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = React.memo(({
  tabs,
  selectedTab,
  onTabPress
}) => (
  <View style={styles.tabContainer}>
    {tabs.map((tab) => (
      <TouchableOpacity
        key={tab.key}
        style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
        onPress={() => onTabPress(tab.key)}
        accessible={true}
        accessibilityRole="tab"
        accessibilityState={{ selected: selectedTab === tab.key }}
        accessibilityLabel={`${tab.label} tab`}
      >
        <Text style={styles.tabIcon}>{tab.icon}</Text>
        <Text style={[styles.tabLabel, selectedTab === tab.key && styles.activeTabLabel]}>
          {tab.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
));

// Style DNA Tab Component
interface StyleDNATabProps {
  styleDNA: {
    colorProfile: string;
    fitPreference: string;
    stylePersonality: string;
    confidenceLevel: 'Conservative' | 'Balanced' | 'Bold';
  };
}

const StyleDNATab: React.FC<StyleDNATabProps> = React.memo(({ styleDNA }) => (
  <View style={styles.dnaContainer}>
    <Text style={styles.dnaTitle}>Your Style DNA</Text>
    
    <View style={styles.dnaCard}>
      <DNARow label="Color Profile" value={styleDNA.colorProfile} />
      <DNARow label="Fit Style" value={styleDNA.fitPreference} />
      <DNARow label="Style Personality" value={styleDNA.stylePersonality} />
      <DNARow 
        label="Risk Level" 
        value={styleDNA.confidenceLevel}
        valueStyle={{
          color: styleDNA.confidenceLevel === 'Bold' ? '#ef4444' : 
                 styleDNA.confidenceLevel === 'Balanced' ? '#f59e0b' : '#22c55e'
        }}
      />
    </View>

    <Text style={styles.dnaDescription}>
      Your Style DNA is a unique fingerprint of your fashion preferences, 
      helping you understand what works best for your personal style journey.
    </Text>
  </View>
));

// DNA Row Component
interface DNARowProps {
  label: string;
  value: string;
  valueStyle?: object;
}

const DNARow: React.FC<DNARowProps> = React.memo(({ label, value, valueStyle }) => (
  <View style={styles.dnaRow}>
    <Text style={styles.dnaLabel}>{label}</Text>
    <Text style={[styles.dnaValue, valueStyle]} accessibilityLabel={`${label}: ${value}`}>
      {value}
    </Text>
  </View>
));

// Insights Tab Component
interface InsightsTabProps {
  insights: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    category: 'strength' | 'opportunity' | 'trend' | 'recommendation';
  }>;
}

const InsightsTab: React.FC<InsightsTabProps> = React.memo(({ insights }) => (
  <View style={styles.insightsContainer}>
    <Text style={styles.insightsTitle}>Smart Insights</Text>
    
    {insights.map((insight) => (
      <InsightCard key={insight.id} insight={insight} />
    ))}
  </View>
));

// Individual Insight Card Component
interface InsightCardProps {
  insight: {
    id: string;
    title: string;
    description: string;
    icon: string;
    category: 'strength' | 'opportunity' | 'trend' | 'recommendation';
  };
}

const InsightCard: React.FC<InsightCardProps> = React.memo(({ insight }) => {
  const categoryColor = INSIGHT_COLORS[insight.category] || theme.colors.primary;
  
  return (
    <TouchableOpacity 
      style={[styles.insightCard, { borderLeftColor: categoryColor }]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${insight.title}. ${insight.description}. Category: ${insight.category}`}
    >
      <View style={styles.insightHeader}>
        <Text style={styles.insightIcon}>{insight.icon}</Text>
        <Text style={styles.insightTitle}>{insight.title}</Text>
      </View>
      <Text style={styles.insightDescription}>{insight.description}</Text>
      <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
        <Text style={[styles.categoryText, { color: categoryColor }]}>
          {insight.category.toUpperCase()}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

// Trends Tab Component
interface TrendsTabProps {
  analysis: OutfitAnalysis | ClinicalAnalysis;
}

const TrendsTab: React.FC<TrendsTabProps> = React.memo(({ analysis }) => (
  <View style={styles.trendsContainer}>
    <Text style={styles.trendsTitle}>Your Style Evolution</Text>
    
    <ProgressCard analysis={analysis} />
    <EvolutionCard analysis={analysis} />
  </View>
));

// Progress Card Component
interface ProgressCardProps {
  analysis: OutfitAnalysis | ClinicalAnalysis;
}

const ProgressCard: React.FC<ProgressCardProps> = React.memo(({ analysis }) => (
  <View style={styles.progressCard}>
    <Text style={styles.progressLabel}>Style Confidence</Text>
    <View style={styles.progressBar}>
      <View 
        style={[
          styles.progressFill, 
          { 
            width: `${analysis.overall_score}%`, 
            backgroundColor: theme.colors.primary 
          }
        ]} 
        accessible={true}
        accessibilityLabel={`Style confidence progress: ${analysis.overall_score.toFixed(1)} percent`}
      />
    </View>
    <Text style={styles.progressText}>{analysis.overall_score.toFixed(1)}% Complete</Text>
  </View>
));

// Evolution Card Component
interface EvolutionCardProps {
  analysis: OutfitAnalysis | ClinicalAnalysis;
}

const EvolutionCard: React.FC<EvolutionCardProps> = React.memo(({ analysis }) => {
  const goals = generateGoals(analysis);
  
  return (
    <View style={styles.evolutionCard}>
      <Text style={styles.evolutionTitle}>🎯 Next Level Goals</Text>
      <View style={styles.goalsList}>
        {goals.map((goal, index) => (
          <Text key={index} style={styles.goalItem}>• {goal}</Text>
        ))}
      </View>
    </View>
  );
});

// Helper function to generate goals
const generateGoals = (analysis: OutfitAnalysis | ClinicalAnalysis): string[] => {
  const goals: string[] = [];
  
  if (analysis.overall_score < 70) {
    goals.push('Master color coordination basics');
  }
  if (analysis.fit_score < 80) {
    goals.push('Refine fit preferences');
  }
  if (analysis.overall_score >= 70 && analysis.overall_score < 85) {
    goals.push('Experiment with advanced styling techniques');
  }
  if (analysis.overall_score >= 85) {
    goals.push('Share your style expertise with others!');
  }
  
  return goals;
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