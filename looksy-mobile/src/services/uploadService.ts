import { supabase } from './supabase';
import { ImageResult } from './cameraService';
import * as FileSystem from 'expo-file-system';

export interface UploadProgress {
  progress: number; // 0-1
  stage: 'preparing' | 'uploading' | 'processing' | 'completed' | 'error';
  message: string;
}

export interface UploadResult {
  success: boolean;
  outfitId?: string;
  imagePath?: string;
  error?: string;
}

export interface ExtractionUploadResult {
  success: boolean;
  imagePath?: string;
  error?: string;
}

export class UploadService {
  
  /**
   * Upload image and create outfit record
   */
  static async uploadOutfitImage(
    userId: string,
    image: ImageResult,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    
    try {
      // Stage 1: Preparing
      onProgress?.({
        progress: 0.1,
        stage: 'preparing',
        message: 'Preparing image...'
      });
      
      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${userId}/outfits/${timestamp}_${image.fileName || 'outfit.jpg'}`;
      
      // Stage 2: Uploading to Storage
      onProgress?.({
        progress: 0.3,
        stage: 'uploading', 
        message: 'Uploading image...'
      });
      
      // Read file using FileSystem for React Native
      console.log('Reading file from URI:', image.uri);
      console.log('File size from ImagePicker:', image.fileSize);
      
      const base64String = await FileSystem.readAsStringAsync(image.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log('Base64 string length:', base64String.length);
      
      // Convert base64 to binary data
      const byteCharacters = atob(base64String);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const uint8Array = new Uint8Array(byteNumbers);
      
      console.log('Binary data size:', uint8Array.length, 'bytes');
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('private-uploads')
        .upload(fileName, uint8Array, {
          contentType: 'image/jpeg',
          upsert: false
        });
        
      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      
      onProgress?.({
        progress: 0.6,
        stage: 'processing',
        message: 'Creating outfit record...'
      });
      
      // Stage 3: Create outfit record in database
      const { data: outfitData, error: outfitError } = await supabase
        .from('outfits')
        .insert({
          user_id: userId,
          original_image_path: uploadData.path,
          processing_status: 'pending',
        })
        .select()
        .single();
        
      if (outfitError) {
        // Clean up uploaded file if outfit creation fails
        await supabase.storage
          .from('private-uploads')
          .remove([uploadData.path]);
          
        throw new Error(`Failed to create outfit record: ${outfitError.message}`);
      }
      
      onProgress?.({
        progress: 1.0,
        stage: 'completed',
        message: 'Upload complete!'
      });
      
      return {
        success: true,
        outfitId: outfitData.id,
        imagePath: uploadData.path
      };
      
    } catch (error: any) {
      console.error('Upload error:', error);
      
      onProgress?.({
        progress: 0,
        stage: 'error',
        message: error.message || 'Upload failed'
      });
      
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  }

  /**
   * Upload image for photo extraction (no outfit record creation)
   */
  static async uploadExtractionImage(
    userId: string,
    image: ImageResult,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ExtractionUploadResult> {
    
    try {
      // Stage 1: Preparing
      onProgress?.({
        progress: 0.1,
        stage: 'preparing',
        message: 'Preparing image...'
      });
      
      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${userId}/extractions/${timestamp}_${image.fileName || 'extraction.jpg'}`;
      
      // Stage 2: Uploading to Storage
      onProgress?.({
        progress: 0.3,
        stage: 'uploading', 
        message: 'Uploading image...'
      });
      
      // Read file using FileSystem for React Native
      console.log('Reading file from URI:', image.uri);
      
      const base64String = await FileSystem.readAsStringAsync(image.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log('Base64 string length:', base64String.length);
      
      // Convert base64 to binary data
      const byteCharacters = atob(base64String);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const uint8Array = new Uint8Array(byteNumbers);
      
      console.log('Binary data size:', uint8Array.length, 'bytes');
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('private-uploads')
        .upload(fileName, uint8Array, {
          contentType: 'image/jpeg',
          upsert: false
        });
        
      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }
      
      onProgress?.({
        progress: 1.0,
        stage: 'completed',
        message: 'Upload complete!'
      });
      
      return {
        success: true,
        imagePath: uploadData.path
      };
      
    } catch (error: any) {
      console.error('Extraction upload error:', error);
      
      onProgress?.({
        progress: 0,
        stage: 'error',
        message: error.message || 'Upload failed'
      });
      
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  }
  
  /**
   * Create blob from image URI for upload
   */
  private static async createImageBlob(uri: string): Promise<Blob> {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  }
  
  /**
   * Get signed URL for viewing uploaded image
   */
  static async getImageUrl(imagePath: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from('private-uploads')
        .createSignedUrl(imagePath, 3600); // 1 hour expiry
        
      if (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }
      
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting image URL:', error);
      return null;
    }
  }
  
  /**
   * Delete uploaded image
   */
  static async deleteImage(imagePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from('private-uploads')
        .remove([imagePath]);
        
      if (error) {
        console.error('Error deleting image:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }
  
  /**
   * Get upload progress for outfit processing
   */
  static async getProcessingStatus(outfitId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('outfits')
        .select('processing_status')
        .eq('id', outfitId)
        .single();
        
      if (error) {
        console.error('Error getting processing status:', error);
        return null;
      }
      
      return data.processing_status;
    } catch (error) {
      console.error('Error getting processing status:', error);
      return null;
    }
  }
}