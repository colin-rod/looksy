import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { 
  AnimatedScoreCircle, 
  StyleInsightsDashboard, 
  ActionableRecommendations, 
  ClosetIntegratedRecommendations 
} from '../components';
import { theme } from '../theme';
import { testScenarios, getTestAnalysisByScoreRange } from '../utils/mockData';

/**
 * Development screen for testing enhanced analysis components
 * This screen should only be used during development and testing
 */
export const ComponentTestScreen: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState(0);
  const [activeComponent, setActiveComponent] = useState<'circle' | 'dashboard' | 'recommendations' | 'closet'>('circle');

  const currentAnalysis = testScenarios[selectedScenario]?.data;

  const mockNavigation = {
    navigate: (screen: string, params?: any) => {
      console.log('Mock Navigation:', screen, params);
    },
    goBack: () => {
      console.log('Mock Navigation: Go Back');
    }
  };

  const renderComponentTest = () => {
    if (!currentAnalysis) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No analysis data available for testing</Text>
        </View>
      );
    }

    switch (activeComponent) {
      case 'circle':
        return (
          <View style={styles.componentContainer}>
            <Text style={styles.componentTitle}>AnimatedScoreCircle Test</Text>
            <View style={styles.circleTestContainer}>
              <AnimatedScoreCircle
                score={currentAnalysis.overall_score || 0}
                size="small"
                onPress={() => console.log('Small circle pressed')}
                label="Small"
              />
              <AnimatedScoreCircle
                score={currentAnalysis.overall_score || 0}
                size="medium"
                onPress={() => console.log('Medium circle pressed')}
                label="Medium"
                subtitle={currentAnalysis.style_category}
              />
              <AnimatedScoreCircle
                score={currentAnalysis.overall_score || 0}
                size="large"
                onPress={() => console.log('Large circle pressed')}
                label="Large"
                subtitle={currentAnalysis.style_category}
              />
            </View>
          </View>
        );

      case 'dashboard':
        return (
          <View style={styles.componentContainer}>
            <Text style={styles.componentTitle}>StyleInsightsDashboard Test</Text>
            <StyleInsightsDashboard analysis={currentAnalysis} />
          </View>
        );

      case 'recommendations':
        return (
          <View style={styles.componentContainer}>
            <Text style={styles.componentTitle}>ActionableRecommendations Test</Text>
            <ActionableRecommendations
              analysis={currentAnalysis}
              onRecommendationAction={(action, rec) => {
                console.log('Recommendation Action:', action, rec);
              }}
            />
          </View>
        );

      case 'closet':
        return (
          <View style={styles.componentContainer}>
            <Text style={styles.componentTitle}>ClosetIntegratedRecommendations Test</Text>
            <ClosetIntegratedRecommendations
              analysis={currentAnalysis}
              navigation={mockNavigation}
              outfitId="test_outfit_001"
              onRecommendationAction={(action, rec) => {
                console.log('Closet Action:', action, rec);
              }}
            />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Component Testing</Text>
        <Text style={styles.subtitle}>Test enhanced analysis components</Text>
      </View>

      {/* Scenario Selector */}
      <View style={styles.selectorContainer}>
        <Text style={styles.selectorTitle}>Test Scenario:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {testScenarios.map((scenario, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.scenarioButton,
                selectedScenario === index && styles.activeScenarioButton
              ]}
              onPress={() => setSelectedScenario(index)}
            >
              <Text style={[
                styles.scenarioButtonText,
                selectedScenario === index && styles.activeScenarioButtonText
              ]}>
                {scenario.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Component Selector */}
      <View style={styles.selectorContainer}>
        <Text style={styles.selectorTitle}>Component:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'circle', label: 'Score Circle' },
            { key: 'dashboard', label: 'Dashboard' },
            { key: 'recommendations', label: 'Recommendations' },
            { key: 'closet', label: 'Closet Integration' }
          ].map((component) => (
            <TouchableOpacity
              key={component.key}
              style={[
                styles.componentButton,
                activeComponent === component.key && styles.activeComponentButton
              ]}
              onPress={() => setActiveComponent(component.key as any)}
            >
              <Text style={[
                styles.componentButtonText,
                activeComponent === component.key && styles.activeComponentButtonText
              ]}>
                {component.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Component Test Area */}
      <ScrollView style={styles.testArea} showsVerticalScrollIndicator={false}>
        {renderComponentTest()}
      </ScrollView>

      {/* Debug Info */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Debug Info:</Text>
        <Text style={styles.debugText}>
          Scenario: {testScenarios[selectedScenario]?.name || 'None'}
        </Text>
        <Text style={styles.debugText}>
          Score: {currentAnalysis?.overall_score?.toFixed(1) || 'N/A'}
        </Text>
        <Text style={styles.debugText}>
          Component: {activeComponent}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  header: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
  },
  
  subtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  
  selectorContainer: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  
  selectorTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  
  scenarioButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: '#f3f4f6',
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
  },
  
  activeScenarioButton: {
    backgroundColor: theme.colors.primary,
  },
  
  scenarioButtonText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
  },
  
  activeScenarioButtonText: {
    color: 'white',
    fontWeight: theme.typography.weights.semibold,
  },
  
  componentButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: '#f3f4f6',
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
  },
  
  activeComponentButton: {
    backgroundColor: theme.colors.secondary,
  },
  
  componentButtonText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
  },
  
  activeComponentButtonText: {
    color: 'white',
    fontWeight: theme.typography.weights.semibold,
  },
  
  testArea: {
    flex: 1,
    padding: theme.spacing.md,
  },
  
  componentContainer: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  
  componentTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  
  circleTestContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  
  errorContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  
  errorText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.error,
    textAlign: 'center',
  },
  
  debugContainer: {
    backgroundColor: '#f3f4f6',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  
  debugTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  
  debugText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.secondary,
  },
});