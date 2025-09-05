import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export interface ImageResult {
  uri: string;
  width: number;
  height: number;
  type: 'image';
  fileName?: string;
  fileSize?: number;
}

export class CameraService {
  
  /**
   * Request camera and media library permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      // Request camera permission
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      
      // Request media library permission  
      const mediaStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus.status !== 'granted' || mediaStatus.status !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Camera and photo library access are needed to upload outfit photos.',
          [{ text: 'OK' }]
        );
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }
  
  /**
   * Show action sheet to choose camera or photo library
   */
  static async selectImage(): Promise<ImageResult | null> {
    try {
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        return null;
      }
      
      // Show action sheet
      return new Promise((resolve) => {
        Alert.alert(
          'Select Photo',
          'Choose how you want to add your outfit photo',
          [
            {
              text: 'Take Photo',
              onPress: async () => {
                const result = await this.takePhoto();
                resolve(result);
              }
            },
            {
              text: 'Choose from Library',
              onPress: async () => {
                const result = await this.pickFromLibrary();
                resolve(result);
              }
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve(null)
            }
          ]
        );
      });
      
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
      return null;
    }
  }
  
  /**
   * Take photo with camera
   */
  static async takePhoto(): Promise<ImageResult | null> {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4], // Portrait aspect ratio for outfit photos
        quality: 0.8, // Good quality but not too large
        exif: false, // Don't include EXIF data for privacy
      });
      
      if (result.canceled) {
        return null;
      }
      
      const asset = result.assets[0];
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: 'image' as const,
        fileName: asset.fileName || `outfit_${Date.now()}.jpg`,
        fileSize: asset.fileSize,
      };
      
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      return null;
    }
  }
  
  /**
   * Pick photo from library
   */
  static async pickFromLibrary(): Promise<ImageResult | null> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4], // Portrait aspect ratio for outfit photos
        quality: 0.8,
        exif: false,
      });
      
      if (result.canceled) {
        return null;
      }
      
      const asset = result.assets[0];
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: 'image' as const,
        fileName: asset.fileName || `outfit_${Date.now()}.jpg`,
        fileSize: asset.fileSize,
      };
      
    } catch (error) {
      console.error('Error picking from library:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
      return null;
    }
  }
  
  /**
   * Validate image for outfit analysis
   */
  static validateImage(image: ImageResult): { isValid: boolean; message?: string } {
    // Check file size (max 10MB)
    if (image.fileSize && image.fileSize > 10 * 1024 * 1024) {
      return {
        isValid: false,
        message: 'Image is too large. Please choose an image smaller than 10MB.'
      };
    }
    
    // Check dimensions (minimum 200x200)
    if (image.width < 200 || image.height < 200) {
      return {
        isValid: false,
        message: 'Image is too small. Please choose a higher resolution image.'
      };
    }
    
    return { isValid: true };
  }
}