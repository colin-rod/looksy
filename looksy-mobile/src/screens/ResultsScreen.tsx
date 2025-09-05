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
import { ScoreBar, ItemCard, FeedbackGroup } from '../components';
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
          <View style={[styles.scoreCircle, { borderColor: getScoreColor(analysis.overall_score) }]}>
            <Text style={[styles.scoreNumber, { color: getScoreColor(analysis.overall_score) }]}>
              {analysis.overall_score.toFixed(1)}
            </Text>
            <Text style={styles.scoreOutOf}>/ 100</Text>
          </View>
          <Text style={styles.scoreLabel}>
            {getScoreLabel(analysis.overall_score)}
          </Text>
          <Text style={styles.styleCategory}>
            Style: {analysis.style_category}
          </Text>
        </View>

        {/* Detailed Scores */}
        <View style={commonStyles.card}>
          <Text style={commonStyles.sectionTitle}>Score Breakdown</Text>
          
          <ScoreBar label="Style" score={analysis.style_score} />
          <ScoreBar label="Fit" score={analysis.fit_score} />
          <ScoreBar label="Color" score={analysis.color_score} />
          <ScoreBar label="Occasion" score={analysis.occasion_appropriateness} />
          
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

        {/* Feedback */}
        <View style={commonStyles.card}>
          <Text style={commonStyles.sectionTitle}>Feedback</Text>
          
          <FeedbackGroup 
            title="✅ What's Working" 
            items={analysis.detailed_feedback.strengths} 
          />
          
          <FeedbackGroup 
            title="💡 Suggestions" 
            items={analysis.detailed_feedback.improvements} 
          />
          
          <FeedbackGroup 
            title="🎯 Style Match" 
            items={[analysis.detailed_feedback.style_alignment]} 
            icon=""
          />
          
          {/* Clinical Recommendations if available */}
          {'recommendations' in analysis && analysis.recommendations && (
            <>
              {analysis.recommendations.minor_adjustments && analysis.recommendations.minor_adjustments.length > 0 && (
                <FeedbackGroup 
                  title="📏 Quick Adjustments" 
                  items={analysis.recommendations.minor_adjustments} 
                />
              )}
              
              {analysis.recommendations.closet_recommendations && analysis.recommendations.closet_recommendations.length > 0 && (
                <FeedbackGroup 
                  title="👕 From Your Closet" 
                  items={analysis.recommendations.closet_recommendations} 
                />
              )}
            </>
          )}
        </View>

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

        {/* Closet Confirmation Button - Only show if clinical analysis has detected items */}
        {'garment_detection' in analysis && analysis.garment_detection && analysis.garment_detection.length > 0 && (
          <View style={styles.closetSection}>
            <Text style={styles.sectionTitle}>Build Your Closet</Text>
            <TouchableOpacity 
              style={styles.closetButton} 
              onPress={() => navigation.navigate(SCREEN_NAMES.CLOSET_CONFIRMATION, {
                outfitId,
                detectedItems: analysis.garment_detection?.map(item => ({
                  id: item.item_id,
                  category: item.category,
                  attributes: item.attributes,
                  confidence: Object.values(item.confidence_scores).reduce((a, b) => a + b, 0) / Object.values(item.confidence_scores).length,
                  existsInCloset: false
                })) || []
              })}
            >
              <Text style={styles.closetButtonText}>
                👕 Confirm Closet Items ({analysis.garment_detection.length})
              </Text>
            </TouchableOpacity>
            <Text style={styles.closetDescription}>
              Help us learn your wardrobe for better recommendations
            </Text>
          </View>
        )}

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
});