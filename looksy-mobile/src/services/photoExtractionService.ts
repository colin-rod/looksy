import { supabase } from './supabase';
import { 
  handleError, 
  withErrorBoundary, 
  createServiceResponse,
  withRetry 
} from '../utils/errorHandler';

// Types for photo extraction
export interface BoundingBox {
  x1: number; // percentage 0-100
  y1: number; // percentage 0-100  
  x2: number; // percentage 0-100
  y2: number; // percentage 0-100
}

export interface ExtractedItem {
  item_id: string;
  category: string;
  description: string;
  bounding_box: BoundingBox;
  attributes: {
    color: string;
    pattern: string;
    material: string;
    brand?: string;
    size_estimate?: string;
    style_tags: string[];
    formality_level: number;
    season_tags: string[];
  };
  confidence_scores: {
    detection: number;
    isolation: number;
    attributes: number;
  };
  closet_suitability: number;
}

export interface PhotoExtraction {
  id: string;
  user_id: string;
  original_image_path: string;
  extraction_type: 'outfit' | 'individual_items';
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  extracted_items_count: number;
  approved_items_count: number;
  processing_metadata: any;
  user_reviewed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExtractionResult {
  success: boolean;
  extraction_id: string;
  items: ExtractedItem[];
  processing_metadata: {
    image_dimensions: { width: number; height: number };
    processing_time_ms: number;
    ai_model_used: string;
    total_items_detected: number;
    high_confidence_items: number;
  };
}

export interface ExtractedClothingItem {
  id: string;
  photo_extraction_id: string;
  item_id: string;
  bounding_box: BoundingBox;
  item_category: string;
  ai_description: string;
  item_attributes: any;
  confidence_scores: any;
  extraction_confidence: number;
  cropped_image_path?: string;
  image_processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  user_approved: boolean;
  user_rejected: boolean;
  user_edited_attributes?: any;
  created_closet_item_id?: string;
  created_at: string;
  updated_at: string;
}

export class PhotoExtractionService {
  
  /**
   * Extract clothing items from a photo
   */
  static extractItems = withErrorBoundary(async (
    imagePath: string,
    userId: string,
    extractionType: 'outfit' | 'individual_items' = 'outfit'
  ): Promise<ExtractionResult> => {
    console.log('Starting photo extraction:', { imagePath, userId, extractionType });
    
    const { data, error } = await withRetry(async () => {
      return await supabase.functions.invoke('extract-closet-items', {
        body: {
          imagePath,
          userId,
          extractionType
        }
      });
    }, 2);

    if (error) {
      throw new Error(`Extraction failed: ${error.message}`);
    }

    console.log(`✅ Extraction completed: ${data.items?.length || 0} items detected`);
    return data;
  }, 'PhotoExtractionService.extractItems')

  /**
   * Get photo extraction history for user
   */
  static async getUserExtractions(
    userId: string,
    limit = 20,
    offset = 0
  ): Promise<PhotoExtraction[]> {
    try {
      const { data, error } = await supabase
        .from('photo_extractions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Failed to get extractions: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      const appError = handleError(error, 'PhotoExtractionService.getUserExtractions');
      throw appError;
    }
  }

  /**
   * Get extracted items for a specific extraction
   */
  static async getExtractedItems(extractionId: string): Promise<ExtractedClothingItem[]> {
    try {
      const { data, error } = await supabase
        .from('extracted_clothing_items')
        .select('*')
        .eq('photo_extraction_id', extractionId)
        .order('extraction_confidence', { ascending: false });

      if (error) {
        throw new Error(`Failed to get extracted items: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      const appError = handleError(error, 'PhotoExtractionService.getExtractedItems');
      throw appError;
    }
  }

  /**
   * Approve/reject extracted items
   */
  static async updateItemApproval(
    itemId: string,
    approved: boolean,
    userEditedAttributes?: any,
    userFeedback?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        user_approved: approved,
        user_rejected: !approved,
        updated_at: new Date().toISOString()
      };

      if (userEditedAttributes) {
        updateData.user_edited_attributes = userEditedAttributes;
      }

      if (userFeedback) {
        updateData.user_feedback = userFeedback;
      }

      const { error } = await supabase
        .from('extracted_clothing_items')
        .update(updateData)
        .eq('id', itemId);

      if (error) {
        throw new Error(`Failed to update item approval: ${error.message}`);
      }
    } catch (error: any) {
      const appError = handleError(error, 'PhotoExtractionService.updateItemApproval');
      throw appError;
    }
  }

  /**
   * Create closet items from approved extracted items
   */
  static async createClosetItemsFromExtracted(
    extractionId: string,
    userId: string,
    approvedItemIds: string[]
  ): Promise<string[]> {
    try {
      // Get approved extracted items
      const { data: extractedItems, error: fetchError } = await supabase
        .from('extracted_clothing_items')
        .select('*')
        .eq('photo_extraction_id', extractionId)
        .in('id', approvedItemIds)
        .eq('user_approved', true);

      if (fetchError) {
        throw new Error(`Failed to fetch extracted items: ${fetchError.message}`);
      }

      if (!extractedItems || extractedItems.length === 0) {
        return [];
      }

      // Create closet items from extracted items
      const closetItemInserts = extractedItems.map(item => ({
        user_id: userId,
        category: item.item_category,
        color: item.item_attributes?.color,
        pattern: item.item_attributes?.pattern,
        material: item.item_attributes?.material,
        brand: item.item_attributes?.brand,
        size: item.item_attributes?.size_estimate,
        style_tags: item.item_attributes?.style_tags || [],
        formality_level: item.item_attributes?.formality_level,
        season_tags: item.item_attributes?.season_tags || [],
        condition: 'good',
        source: 'photo_extraction',
        extraction_source_id: extractionId,
        extracted_item_id: item.id,
        ai_description: item.ai_description,
        detection_confidence: item.extraction_confidence,
        image_paths: item.cropped_image_path ? [item.cropped_image_path] : [],
        extraction_metadata: {
          bounding_box: item.bounding_box,
          confidence_scores: item.confidence_scores,
          original_attributes: item.item_attributes
        }
      }));

      const { data: newClosetItems, error: insertError } = await supabase
        .from('closet_items')
        .insert(closetItemInserts)
        .select('id');

      if (insertError) {
        throw new Error(`Failed to create closet items: ${insertError.message}`);
      }

      // Update extracted items with closet item references
      if (newClosetItems) {
        const updates = extractedItems.map((item, index) => ({
          id: item.id,
          created_closet_item_id: newClosetItems[index].id
        }));

        for (const update of updates) {
          await supabase
            .from('extracted_clothing_items')
            .update({ created_closet_item_id: update.created_closet_item_id })
            .eq('id', update.id);
        }
      }

      // Update extraction summary
      await supabase
        .from('photo_extractions')
        .update({ 
          approved_items_count: approvedItemIds.length,
          user_reviewed: true,
          user_review_date: new Date().toISOString()
        })
        .eq('id', extractionId);

      return newClosetItems?.map(item => item.id) || [];
    } catch (error: any) {
      const appError = handleError(error, 'PhotoExtractionService.createClosetItemsFromExtracted');
      throw appError;
    }
  }

  /**
   * Process item images (crop and optimize)
   */
  static async processItemImages(
    extractionId: string,
    imagePath: string
  ): Promise<void> {
    try {
      // This would typically call an image processing Edge Function
      // For now, we'll mark items as processed
      const { error } = await supabase
        .from('extracted_clothing_items')
        .update({ 
          image_processing_status: 'completed'
        })
        .eq('photo_extraction_id', extractionId);

      if (error) {
        throw new Error(`Failed to update processing status: ${error.message}`);
      }
    } catch (error: any) {
      const appError = handleError(error, 'PhotoExtractionService.processItemImages');
      throw appError;
    }
  }

  /**
   * Get extraction summary statistics
   */
  static async getExtractionSummary(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('extraction_summary')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get extraction summary: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      const appError = handleError(error, 'PhotoExtractionService.getExtractionSummary');
      throw appError;
    }
  }

  /**
   * Delete extraction and all associated data
   */
  static async deleteExtraction(extractionId: string): Promise<void> {
    try {
      // Delete in order due to foreign key constraints
      await supabase
        .from('extracted_clothing_items')
        .delete()
        .eq('photo_extraction_id', extractionId);

      await supabase
        .from('photo_extractions')
        .delete()
        .eq('id', extractionId);
    } catch (error: any) {
      const appError = handleError(error, 'PhotoExtractionService.deleteExtraction');
      throw appError;
    }
  }

  /**
   * Batch approve multiple items
   */
  static async batchApproveItems(
    itemIds: string[],
    approved: boolean
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('extracted_clothing_items')
        .update({
          user_approved: approved,
          user_rejected: !approved,
          updated_at: new Date().toISOString()
        })
        .in('id', itemIds);

      if (error) {
        throw new Error(`Failed to batch approve items: ${error.message}`);
      }
    } catch (error: any) {
      const appError = handleError(error, 'PhotoExtractionService.batchApproveItems');
      throw appError;
    }
  }
}