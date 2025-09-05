import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { AIService } from '../services/aiService';
import { UploadService } from '../services/uploadService';
import { ScoreBar, ItemCard, FeedbackGroup, AnimatedScoreCircle, StyleInsightsDashboard, ActionableRecommendations, ClosetIntegratedRecommendations } from '../components';
import { 
  OutfitAnalysis, 
  ClinicalAnalysis, 
  BaseScreenProps,
  PROCESSING_MESSAGES 
} from '../types';
import { 
  theme, 
  getScoreColor, 
  getScoreLabel, 
  commonStyles 
} from '../theme';
import { 
  handleError, 
  showErrorAlert, 
  ErrorCode 
} from '../utils/errorHandler';
import { SCREEN_NAMES } from '../navigation/types';

interface ResultsScreenProps {
  route: {
    params: {
      outfitId: string;
      imagePath: string;
    };
  };
  navigation: any;
  user: any;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ 
  route, 
  navigation, 
  user 
}) => {
  const { outfitId, imagePath } = route.params;
  const [analysis, setAnalysis] = useState<OutfitAnalysis | ClinicalAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState('processing');
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);

  useEffect(() => {
    loadAnalysisResults();
    loadImageUrl();
  }, []);

  const loadAnalysisResults = async () => {
    try {
      setLoading(true);
      
      // First check if analysis is already completed
      const existingAnalysis = await AIService.getOutfitAnalysis(outfitId);
      
      if (existingAnalysis) {
        setAnalysis(existingAnalysis);
        setProcessingStatus('completed');
        setLoading(false);
        return;
      }

      // If not completed, start polling
      const result = await AIService.pollForCompletion(
        outfitId,
        (status) => {
          setProcessingStatus(status);
        }
      );

      if (result) {
        setAnalysis(result);
        setProcessingStatus('completed');
      }
    } catch (error: any) {
      const appError = handleError(error, 'ResultsScreen.loadAnalysisResults');
      showErrorAlert(appError, 'Analysis Error');
    } finally {
      setLoading(false);
    }
  };

  const loadImageUrl = async () => {
    try {
      const url = await UploadService.getImageUrl(imagePath);
      setImageUrl(url);
    } catch (error) {
      console.error('Error loading image URL:', error);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#22c55e'; // Green
    if (score >= 60) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Needs Work';
  };

  const handleRetry = () => {
    navigation.goBack();
  };

  const handleDone = () => {
    navigation.navigate(SCREEN_NAMES.MAIN_TABS, { screen: SCREEN_NAMES.HOME });
  };

  const handleScorePress = () => {
    setShowScoreBreakdown(!showScoreBreakdown);
  };

  const getScoreExplanation = (scoreType: string, score: number) => {
    const explanations = {
      overall: {
        excellent: "Outstanding style execution with perfect balance across all elements",
        good: "Strong style foundation with minor areas for refinement",
        fair: "Decent style base but several areas need attention",
        poor: "Significant style improvements needed across multiple areas"
      },
      style: {
        excellent: "Perfect harmony between pieces creating a cohesive, intentional look",
        good: "Well-coordinated elements with clear style direction",
        fair: "Some style coordination but lacking clear direction",
        poor: "Conflicting style elements need better coordination"
      },
      fit: {
        excellent: "All garments fit perfectly, enhancing your silhouette",
        good: "Most pieces fit well with minor adjustments needed",
        fair: "Some fit issues affecting overall appearance",
        poor: "Significant fit problems requiring alterations or size changes"
      },
      color: {
        excellent: "Colors create beautiful harmony and complement your features",
        good: "Good color coordination with pleasing combinations",
        fair: "Colors work but could be more intentional",
        poor: "Color combinations clash or don't enhance your look"
      },
      occasion: {
        excellent: "Perfect appropriateness for the intended setting",
        good: "Well-suited for the occasion with good judgment",
        fair: "Generally appropriate but could be more refined",
        poor: "Doesn't match the occasion's dress code expectations"
      }
    };

    const category = score >= 90 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'fair' : 'poor';
    return explanations[scoreType as keyof typeof explanations]?.[category] || "Style analysis complete";
  };

  if (loading || !analysis) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingTitle}>Analyzing Your Outfit</Text>
          <Text style={styles.loadingSubtitle}>
            {processingStatus === 'processing' ? 
              PROCESSING_MESSAGES.processing : 
              PROCESSING_MESSAGES.preparing}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Your Style Score</Text>
        </View>

        {/* Image Preview */}
        {imageUrl && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUrl }} style={styles.outfitImage} />
          </View>
        )}

        {/* Overall Score */}
        <View style={styles.overallScoreContainer}>
          <AnimatedScoreCircle
            score={analysis.overall_score}
            size="large"
            onPress={handleScorePress}
            label={getScoreLabel(analysis.overall_score)}
            subtitle={analysis.style_category}
          />
          <Text style={styles.scoreExplanation}>
            {getScoreExplanation('overall', analysis.overall_score)}
          </Text>
        </View>

        {/* Detailed Scores */}
        <View style={commonStyles.card}>
          <TouchableOpacity 
            style={styles.scoreBreakdownHeader}
            onPress={handleScorePress}
          >
            <Text style={commonStyles.sectionTitle}>Score Breakdown</Text>
            <Text style={styles.toggleHint}>
              {showScoreBreakdown ? '▲ Hide Details' : '▼ Tap for Details'}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.mainScoresContainer}>
            <TouchableOpacity 
              style={styles.scoreItem}
              onPress={() => {}}
            >
              <ScoreBar label="Style" score={analysis.style_score} />
              {showScoreBreakdown && (
                <Text style={styles.scoreExplanationSmall}>
                  {getScoreExplanation('style', analysis.style_score)}
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.scoreItem}
              onPress={() => {}}
            >
              <ScoreBar label="Fit" score={analysis.fit_score} />
              {showScoreBreakdown && (
                <Text style={styles.scoreExplanationSmall}>
                  {getScoreExplanation('fit', analysis.fit_score)}
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.scoreItem}
              onPress={() => {}}
            >
              <ScoreBar label="Color" score={analysis.color_score} />
              {showScoreBreakdown && (
                <Text style={styles.scoreExplanationSmall}>
                  {getScoreExplanation('color', analysis.color_score)}
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.scoreItem}
              onPress={() => {}}
            >
              <ScoreBar label="Occasion" score={analysis.occasion_appropriateness} />
              {showScoreBreakdown && (
                <Text style={styles.scoreExplanationSmall}>
                  {getScoreExplanation('occasion', analysis.occasion_appropriateness)}
                </Text>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Clinical Sub-Scores if available */}
          {'sub_scores' in analysis && analysis.sub_scores && (
            <>
              <Text style={[commonStyles.sectionTitle, { marginTop: theme.spacing.lg }]}>
                Clinical Analysis
              </Text>
              <ScoreBar label="Proportion" score={analysis.sub_scores.proportion_silhouette} size="small" />
              <ScoreBar label="Technical Fit" score={analysis.sub_scores.fit_technical} size="small" />
              <ScoreBar label="Color Harmony" score={analysis.sub_scores.color_harmony} size="small" />
              <ScoreBar label="Pattern/Texture" score={analysis.sub_scores.pattern_texture} size="small" />
              <ScoreBar label="Layering" score={analysis.sub_scores.layering_logic} size="small" />
              <ScoreBar label="Formality" score={analysis.sub_scores.formality_occasion} size="small" />
              <ScoreBar label="Footwear" score={analysis.sub_scores.footwear_cohesion} size="small" />
            </>
          )}
        </View>

        {/* Style Insights Dashboard */}
        <StyleInsightsDashboard analysis={analysis} />

        {/* Actionable Recommendations */}
        <ActionableRecommendations 
          analysis={analysis}
          onRecommendationAction={(action, recommendation) => {
            console.log('Recommendation action:', action, recommendation);
            // Future: Track user engagement with recommendations
          }}
        />

        {/* Clinical Garment Detection if available */}
        {'garment_detection' in analysis && analysis.garment_detection && analysis.garment_detection.length > 0 && (
          <View style={commonStyles.card}>
            <Text style={commonStyles.sectionTitle}>Detailed Item Analysis</Text>
            {analysis.garment_detection.map((item, index) => {
              const avgConfidence = Object.values(item.confidence_scores).reduce((a, b) => a + b, 0) / Object.values(item.confidence_scores).length;
              return (
                <ItemCard
                  key={index}
                  category={item.category}
                  attributes={item.attributes}
                  confidence={avgConfidence}
                  variant="clinical"
                />
              );
            })}
          </View>
        )}
        
        {/* Fallback to legacy detected items */}
        {!('garment_detection' in analysis) && analysis.items_detected.length > 0 && (
          <View style={commonStyles.card}>
            <Text style={commonStyles.sectionTitle}>Detected Items</Text>
            {analysis.items_detected.map((item, index) => (
              <ItemCard
                key={index}
                category={item.category}
                description={item.description}
                attributes={{ fit: item.fit_assessment }}
                variant="basic"
              />
            ))}
          </View>
        )}
        
        {/* Analysis Quality Indicators */}
        {'confidence_flags' in analysis && analysis.confidence_flags && analysis.confidence_flags.length > 0 && (
          <View style={styles.qualitySection}>
            <Text style={styles.sectionTitle}>Analysis Notes</Text>
            {'analysis_completeness' in analysis && analysis.analysis_completeness && analysis.analysis_completeness < 100 && (
              <View style={styles.completenessIndicator}>
                <Text style={styles.completenessLabel}>Analysis Completeness:</Text>
                <Text style={[styles.completenessValue, { 
                  color: analysis.analysis_completeness > 80 ? '#22c55e' : 
                         analysis.analysis_completeness > 60 ? '#f59e0b' : '#ef4444' 
                }]}>
                  {analysis.analysis_completeness}%
                </Text>
              </View>
            )}
            {analysis.confidence_flags.map((flag, index) => (
              <Text key={index} style={styles.flagItem}>⚠️ {flag}</Text>
            ))}
          </View>
        )}

        {/* Closet-Integrated Recommendations */}
        <ClosetIntegratedRecommendations
          analysis={analysis}
          navigation={navigation}
          outfitId={outfitId}
          onRecommendationAction={(action, recommendation) => {
            console.log('Closet recommendation action:', action, recommendation);
            // Future: Track closet-related user actions
          }}
        />

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>📷 Try Another</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: commonStyles.container,
  scrollContent: {
    padding: theme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 20,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3b82f6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  outfitImage: {
    width: 200,
    height: 250,
    borderRadius: 16,
  },
  overallScoreContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    marginBottom: 16,
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  scoreOutOf: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: -8,
  },
  scoreLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  styleCategory: {
    fontSize: 16,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  detailedScores: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreRowLabel: {
    fontSize: 16,
    color: '#1f2937',
    width: 60,
  },
  scoreBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    marginHorizontal: 12,
  },
  scoreBar: {
    height: '100%',
    borderRadius: 4,
  },
  scoreRowValue: {
    fontSize: 16,
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  feedbackSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  feedbackGroup: {
    marginBottom: 20,
  },
  feedbackGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  feedbackItem: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 4,
  },
  itemsSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  itemCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  itemCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  itemFit: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  retryButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  retryButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Clinical Analysis Styles
  subScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  subScoreLabel: {
    fontSize: 14,
    color: '#6b7280',
    width: 90,
  },
  subScoreBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    marginHorizontal: 12,
  },
  subScoreBar: {
    height: '100%',
    borderRadius: 3,
  },
  subScoreValue: {
    fontSize: 14,
    fontWeight: '500',
    width: 32,
    textAlign: 'right',
  },
  
  // Clinical Item Detection Styles
  clinicalItemCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  attributeRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  attributeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    width: 70,
  },
  attributeValue: {
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
    textTransform: 'capitalize',
  },
  confidenceRow: {
    flexDirection: 'row',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
  },
  confidenceValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Quality Indicators Styles
  qualitySection: {
    backgroundColor: '#fef3c7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  completenessIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  completenessLabel: {
    fontSize: 14,
    color: '#92400e',
    flex: 1,
  },
  completenessValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  flagItem: {
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
    marginBottom: 4,
  },
  
  // Closet Section Styles
  closetSection: {
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  closetButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  closetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  closetDescription: {
    fontSize: 13,
    color: '#1e40af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Enhanced Score UI Styles
  scoreExplanation: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    lineHeight: 20,
  },
  
  scoreBreakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  
  toggleHint: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  
  mainScoresContainer: {
    gap: theme.spacing.sm,
  },
  
  scoreItem: {
    paddingVertical: theme.spacing.xs,
  },
  
  scoreExplanationSmall: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    marginLeft: 80,
    lineHeight: 16,
    fontStyle: 'italic',
  },
});