import { supabase } from './supabase';
import { 
  OutfitAnalysis, 
  ClinicalAnalysis, 
  AnalysisResult, 
  ProcessingStatus,
  ServiceResponse 
} from '../types';
import { 
  handleError, 
  withErrorBoundary, 
  createServiceResponse,
  withRetry,
  ErrorCode 
} from '../utils/errorHandler';

export class AIService {
  
  /**
   * Trigger outfit analysis using OpenAI Vision API
   */
  static analyzeOutfit = withErrorBoundary(async (
    outfitId: string,
    imagePath: string,
    userId: string,
    userStylePreferences: string[] = []
  ): Promise<AnalysisResult> => {
    console.log('Starting outfit analysis:', { outfitId, imagePath, userId });
    
    // Call Supabase Edge Function with retry
    const { data, error } = await withRetry(async () => {
      return await supabase.functions.invoke('analyze-outfit', {
        body: {
          outfitId,
          imagePath,
          userId,
          userStylePreferences
        }
      });
    }, 2); // Retry up to 2 times

    if (error) {
      throw new Error(`Analysis failed: ${error.message}`);
    }

    const source = data.source || 'unknown';
    console.log(`Analysis completed from ${source.toUpperCase()}:`, data);
    
    if (source === 'fallback') {
      console.log('⚠️  Using fallback analysis - check OpenAI API key configuration');
    } else if (source === 'openai') {
      console.log('✅ Real OpenAI Vision analysis received');
    }

    return {
      success: true,
      analysis: data.analysis,
      outfitId: data.outfitId,
      source: source as 'openai' | 'fallback'
    };
  }, 'AIService.analyzeOutfit')

  /**
   * Get analysis results for an outfit
   */
  static async getOutfitAnalysis(outfitId: string): Promise<OutfitAnalysis | ClinicalAnalysis | null> {
    try {
      const { data, error } = await supabase
        .from('outfits')
        .select('analysis_result')
        .eq('id', outfitId)
        .single();

      if (error) {
        console.error('Error fetching analysis:', error);
        return null;
      }

      return data.analysis_result;
    } catch (error) {
      console.error('Error getting outfit analysis:', error);
      return null;
    }
  }

  /**
   * Get processing status of an outfit
   */
  static async getProcessingStatus(outfitId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('outfits')
        .select('processing_status')
        .eq('id', outfitId)
        .single();

      if (error) {
        console.error('Error fetching processing status:', error);
        return null;
      }

      return data.processing_status;
    } catch (error) {
      console.error('Error getting processing status:', error);
      return null;
    }
  }

  /**
   * Poll for analysis completion
   */
  static async pollForCompletion(
    outfitId: string,
    onStatusUpdate?: (status: string) => void,
    maxAttempts: number = 30,
    intervalMs: number = 2000
  ): Promise<OutfitAnalysis | ClinicalAnalysis | null> {
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.getProcessingStatus(outfitId);
      
      onStatusUpdate?.(status || 'unknown');
      
      if (status === 'completed') {
        return await this.getOutfitAnalysis(outfitId);
      }
      
      if (status === 'failed') {
        throw new Error('Analysis failed');
      }
      
      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    
    throw new Error('Analysis timeout - taking longer than expected');
  }

  /**
   * Get user's style preferences for analysis context
   */
  static async getUserStylePreferences(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('style_preferences')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching style preferences:', error);
        // Return default style preferences if column doesn't exist or other error
        return ['casual', 'minimalist'];
      }

      return data?.style_preferences || ['casual', 'minimalist'];
    } catch (error) {
      console.error('Error getting user style preferences:', error);
      // Fallback to default preferences
      return ['casual', 'minimalist'];
    }
  }
}