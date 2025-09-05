import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { CameraService, ImageResult } from '../services/cameraService';
import { UploadService, UploadProgress } from '../services/uploadService';
import { AIService } from '../services/aiService';

interface UploadScreenProps {
  navigation: any;
  user: any;
}

export const UploadScreen: React.FC<UploadScreenProps> = ({ navigation, user }) => {
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

  const handleSelectImage = async () => {
    try {
      const image = await CameraService.selectImage();
      
      if (image) {
        // Validate image
        const validation = CameraService.validateImage(image);
        if (!validation.isValid) {
          Alert.alert('Invalid Image', validation.message);
          return;
        }
        
        setSelectedImage(image);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) return;
    
    setUploading(true);
    setUploadProgress({
      progress: 0,
      stage: 'preparing',
      message: 'Starting upload...'
    });

    try {
      const result = await UploadService.uploadOutfitImage(
        user.id,
        selectedImage,
        setUploadProgress
      );

      if (result.success && result.outfitId && result.imagePath) {
        setUploadProgress({
          progress: 0.8,
          stage: 'processing',
          message: 'Starting AI analysis...'
        });

        try {
          // Get user's style preferences for analysis context
          const userStylePreferences = await AIService.getUserStylePreferences(user.id);
          
          // Trigger AI analysis
          const analysisResult = await AIService.analyzeOutfit(
            result.outfitId,
            result.imagePath,
            user.id,
            userStylePreferences
          );

          if (analysisResult.success) {
            // Navigate to results screen
            navigation.navigate('Results', {
              outfitId: result.outfitId,
              imagePath: result.imagePath
            });
            
            // Reset state
            setSelectedImage(null);
            setUploadProgress(null);
          } else {
            Alert.alert('Analysis Failed', analysisResult.error || 'Please try again.');
          }
        } catch (analysisError: any) {
          console.error('Analysis error:', analysisError);
          Alert.alert('Analysis Error', 'Failed to analyze outfit. Please try again.');
        }
      } else {
        Alert.alert('Upload Failed', result.error || 'Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Upload Error', error.message || 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRetakePhoto = () => {
    setSelectedImage(null);
    setUploadProgress(null);
  };

  const getProgressBarWidth = () => {
    return uploadProgress ? `${Math.round(uploadProgress.progress * 100)}%` : '0%';
  };

  const getProgressColor = () => {
    if (!uploadProgress) return '#3b82f6';
    
    switch (uploadProgress.stage) {
      case 'error': return '#ef4444';
      case 'completed': return '#22c55e';
      default: return '#3b82f6';
    }
  };

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
          <Text style={styles.title}>Upload Outfit</Text>
        </View>

        {/* Upload Area */}
        <View style={styles.uploadArea}>
          {selectedImage ? (
            // Show selected image
            <View style={styles.imagePreview}>
              <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
              
              {!uploading && (
                <TouchableOpacity style={styles.retakeButton} onPress={handleRetakePhoto}>
                  <Text style={styles.retakeButtonText}>Change Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            // Show upload prompt
            <TouchableOpacity style={styles.uploadPrompt} onPress={handleSelectImage}>
              <View style={styles.uploadIcon}>
                <Text style={styles.uploadIconText}>📷</Text>
              </View>
              <Text style={styles.uploadTitle}>Add Your Outfit Photo</Text>
              <Text style={styles.uploadSubtitle}>
                Take a photo or choose from your library
              </Text>
              <View style={styles.uploadButton}>
                <Text style={styles.uploadButtonText}>Select Photo</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Upload Progress */}
        {uploadProgress && (
          <View style={styles.progressSection}>
            <Text style={styles.progressTitle}>
              {uploadProgress.message}
            </Text>
            
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    width: getProgressBarWidth(),
                    backgroundColor: getProgressColor()
                  }
                ]} 
              />
            </View>
            
            <Text style={styles.progressPercentage}>
              {Math.round(uploadProgress.progress * 100)}%
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        {selectedImage && !uploading && !uploadProgress && (
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.analyzeButton}
              onPress={handleUpload}
            >
              <Text style={styles.analyzeButtonText}>
                📊 Analyze My Outfit
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>📝 Photo Tips</Text>
          <View style={styles.tips}>
            <Text style={styles.tip}>• Stand in good lighting</Text>
            <Text style={styles.tip}>• Show your full outfit clearly</Text>
            <Text style={styles.tip}>• Face the camera straight on</Text>
            <Text style={styles.tip}>• Avoid busy backgrounds</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
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
  uploadArea: {
    marginBottom: 32,
  },
  uploadPrompt: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  uploadIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  uploadIconText: {
    fontSize: 48,
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  uploadButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  imagePreview: {
    alignItems: 'center',
  },
  previewImage: {
    width: 300,
    height: 400,
    borderRadius: 16,
    marginBottom: 20,
  },
  retakeButton: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  retakeButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  progressSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  actions: {
    marginBottom: 32,
  },
  analyzeButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tipsSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  tips: {
    gap: 8,
  },
  tip: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
  },
});