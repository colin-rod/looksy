import { supabase } from './supabase';

export interface DetectedClosetItem {
  id: string;
  category: string;
  attributes: {
    color?: string;
    pattern?: string;
    material?: string;
    fit?: string;
    length?: string;
    sleeve_length?: string;
  };
  confidence: number;
  existsInCloset: boolean;
  garmentDetectionId?: string;
  closetItemId?: string;
}

export interface ClosetItem {
  id: string;
  category: string;
  subcategory?: string;
  color?: string;
  pattern?: string;
  material?: string;
  brand?: string;
  size?: string;
  style_tags: string[];
  formality_level?: number;
  season_tags: string[];
  condition: string;
  notes?: string;
  image_paths: string[];
  source: string;
  source_outfit_id?: string;
  detection_confidence?: number;
  created_at: string;
  updated_at: string;
}

export class ClosetService {
  
  /**
   * Get detected closet items for an outfit with potential matches from existing closet
   */
  static async getDetectedClosetItems(outfitId: string): Promise<DetectedClosetItem[]> {
    try {
      // Get garment detections for this outfit
      const { data: detections, error: detectionsError } = await supabase
        .from('garment_detection')
        .select(`
          id,
          item_id,
          category,
          fit_assessment,
          color,
          pattern,
          material,
          length,
          sleeve_length,
          confidence_scores,
          all_attributes
        `)
        .eq('outfit_id', outfitId);

      if (detectionsError) {
        throw new Error(`Failed to get detections: ${detectionsError.message}`);
      }

      if (!detections || detections.length === 0) {
        return [];
      }

      // For each detection, check if there's already a matching closet item
      const detectedItems: DetectedClosetItem[] = [];

      for (const detection of detections) {
        // Calculate average confidence score
        const confidenceScores = detection.confidence_scores || {};
        const avgConfidence = Object.values(confidenceScores).length > 0 
          ? Object.values(confidenceScores).reduce((a, b) => a + b, 0) / Object.values(confidenceScores).length
          : 0.5;

        // Check for existing closet item matches
        const { data: existingMatches } = await supabase
          .from('closet_item_detections')
          .select(`
            closet_item_id,
            match_confidence,
            user_confirmed,
            user_rejected,
            closet_items (
              id,
              category,
              color,
              pattern,
              material
            )
          `)
          .eq('garment_detection_id', detection.id)
          .order('match_confidence', { ascending: false })
          .limit(1);

        const existingMatch = existingMatches?.[0];

        detectedItems.push({
          id: detection.item_id,
          garmentDetectionId: detection.id,
          closetItemId: existingMatch?.closet_item_id,
          category: detection.category,
          attributes: {
            color: detection.color,
            pattern: detection.pattern,
            material: detection.material,
            fit: detection.fit_assessment,
            length: detection.length,
            sleeve_length: detection.sleeve_length,
            ...(detection.all_attributes || {})
          },
          confidence: avgConfidence,
          existsInCloset: !!existingMatch && !existingMatch.user_rejected
        });
      }

      return detectedItems;
    } catch (error: any) {
      console.error('Error getting detected closet items:', error);
      throw error;
    }
  }

  /**
   * Update closet item confirmation status
   */
  static async updateClosetItemConfirmation(
    itemId: string, 
    confirmed: boolean, 
    userId: string
  ): Promise<void> {
    try {
      // First get the garment detection record
      const { data: detections, error: detectionError } = await supabase
        .from('garment_detection')
        .select('id, outfit_id')
        .eq('item_id', itemId)
        .single();

      if (detectionError || !detections) {
        throw new Error(`Detection not found for item ${itemId}`);
      }

      // Check if there's already a closet_item_detection record
      const { data: existingDetection } = await supabase
        .from('closet_item_detections')
        .select('id, closet_item_id')
        .eq('garment_detection_id', detections.id)
        .single();

      if (existingDetection) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('closet_item_detections')
          .update({
            user_confirmed: confirmed,
            user_rejected: !confirmed
          })
          .eq('id', existingDetection.id);

        if (updateError) {
          throw new Error(`Failed to update confirmation: ${updateError.message}`);
        }
      } else {
        // This will be handled when creating new closet items
        console.log(`No existing detection record for item ${itemId}, will create on confirmation`);
      }
    } catch (error: any) {
      console.error('Error updating closet item confirmation:', error);
      throw error;
    }
  }

  /**
   * Create new closet items from confirmed detections
   */
  static async createClosetItemsFromDetections(
    confirmedItems: DetectedClosetItem[],
    userId: string,
    outfitId: string
  ): Promise<void> {
    try {
      const closetItemInserts = confirmedItems.map(item => ({
        user_id: userId,
        category: item.category,
        color: item.attributes.color,
        pattern: item.attributes.pattern,
        material: item.attributes.material,
        size: 'Unknown', // Could be enhanced with size detection
        style_tags: [],
        season_tags: ['all-season'],
        condition: 'good',
        source: 'photo_detection',
        source_outfit_id: outfitId,
        detection_confidence: item.confidence,
        image_paths: []
      }));

      const { data: newClosetItems, error: insertError } = await supabase
        .from('closet_items')
        .insert(closetItemInserts)
        .select('id');

      if (insertError) {
        throw new Error(`Failed to create closet items: ${insertError.message}`);
      }

      // Create closet_item_detection links
      if (newClosetItems) {
        const detectionLinks = confirmedItems.map((item, index) => ({
          garment_detection_id: item.garmentDetectionId,
          closet_item_id: newClosetItems[index].id,
          match_confidence: item.confidence,
          user_confirmed: true,
          user_rejected: false
        }));

        const { error: linkError } = await supabase
          .from('closet_item_detections')
          .insert(detectionLinks);

        if (linkError) {
          console.error('Failed to create detection links:', linkError);
          // Don't throw - items were created successfully
        }
      }
    } catch (error: any) {
      console.error('Error creating closet items from detections:', error);
      throw error;
    }
  }

  /**
   * Get user's closet items
   */
  static async getUserClosetItems(userId: string, category?: string): Promise<ClosetItem[]> {
    try {
      let query = supabase
        .from('closet_items')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get closet items: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      console.error('Error getting user closet items:', error);
      throw error;
    }
  }

  /**
   * Add manual closet item
   */
  static async addClosetItem(
    userId: string,
    item: Partial<ClosetItem>
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('closet_items')
        .insert({
          user_id: userId,
          category: item.category,
          subcategory: item.subcategory,
          color: item.color,
          pattern: item.pattern,
          material: item.material,
          brand: item.brand,
          size: item.size,
          style_tags: item.style_tags || [],
          formality_level: item.formality_level,
          season_tags: item.season_tags || ['all-season'],
          condition: item.condition || 'good',
          notes: item.notes,
          image_paths: item.image_paths || [],
          source: 'manual'
        })
        .select('id')
        .single();

      if (error) {
        throw new Error(`Failed to add closet item: ${error.message}`);
      }

      return data.id;
    } catch (error: any) {
      console.error('Error adding closet item:', error);
      throw error;
    }
  }

  /**
   * Update closet item
   */
  static async updateClosetItem(
    itemId: string,
    updates: Partial<ClosetItem>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('closet_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) {
        throw new Error(`Failed to update closet item: ${error.message}`);
      }
    } catch (error: any) {
      console.error('Error updating closet item:', error);
      throw error;
    }
  }

  /**
   * Delete closet item
   */
  static async deleteClosetItem(itemId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('closet_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        throw new Error(`Failed to delete closet item: ${error.message}`);
      }
    } catch (error: any) {
      console.error('Error deleting closet item:', error);
      throw error;
    }
  }

  /**
   * Get closet recommendations for an outfit
   */
  static async getClosetRecommendations(outfitId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('outfit_recommendations')
        .select(`
          *,
          closet_items (
            id,
            category,
            color,
            pattern,
            material,
            brand,
            image_paths
          )
        `)
        .eq('outfit_id', outfitId)
        .eq('recommendation_type', 'closet_item')
        .order('confidence', { ascending: false });

      if (error) {
        throw new Error(`Failed to get closet recommendations: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      console.error('Error getting closet recommendations:', error);
      throw error;
    }
  }
}