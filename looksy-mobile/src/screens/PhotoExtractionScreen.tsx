import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { CameraService, ImageResult } from '../services/cameraService';
import { PhotoExtractionService, ExtractionResult, ExtractedClothingItem } from '../services/photoExtractionService';
import { UploadService, UploadProgress } from '../services/uploadService';
import { BoundingBoxOverlay, useBoundingBoxDimensions, getItemColor } from '../components/BoundingBoxOverlay';

interface PhotoExtractionScreenProps {
  navigation: any;
  user: any;
}

type ExtractionStep = 'select' | 'extracting' | 'review' | 'completed';

export const PhotoExtractionScreen: React.FC<PhotoExtractionScreenProps> = ({ navigation, user }) => {
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);
  const [currentStep, setCurrentStep] = useState<ExtractionStep>('select');
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [extractedItems, setExtractedItems] = useState<ExtractedClothingItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  
  const { getResponsiveDimensions } = useBoundingBoxDimensions();

  const handleSelectImage = async () => {
    try {
      const image = await CameraService.selectImage();
      
      if (image) {
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

  const handleExtractItems = async () => {
    if (!selectedImage) return;
    
    setProcessing(true);
    setCurrentStep('extracting');
    setUploadProgress(null);

    try {
      // First upload the image to get a storage path
      const uploadResult = await UploadService.uploadExtractionImage(
        user.id,
        selectedImage,
        setUploadProgress
      );

      if (!uploadResult.success || !uploadResult.imagePath) {
        throw new Error(uploadResult.error || 'Failed to upload image');
      }

      // Now extract items using the uploaded image path
      const result = await PhotoExtractionService.extractItems(
        uploadResult.imagePath,
        user.id,
        'outfit'
      );

      if (result.success && result.extraction_id) {
        setExtractionResult(result);
        
        // Fetch the extracted items from database
        const items = await PhotoExtractionService.getExtractedItems(result.extraction_id);
        setExtractedItems(items);
        setCurrentStep('review');
      } else {
        Alert.alert('Extraction Failed', 'Failed to extract items from photo. Please try again.');
        setCurrentStep('select');
      }
    } catch (error: any) {
      console.error('Extraction error:', error);
      Alert.alert('Extraction Error', error.message || 'Please try again.');
      setCurrentStep('select');
    } finally {
      setProcessing(false);
      setUploadProgress(null);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItemIds(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const selectAllItems = () => {
    setSelectedItemIds(extractedItems.map(item => item.id));
  };

  const deselectAllItems = () => {
    setSelectedItemIds([]);
  };

  const handleAddToCloset = async () => {
    if (selectedItemIds.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item to add to your closet.');
      return;
    }

    if (!extractionResult?.extraction_id) return;

    setProcessing(true);

    try {
      // First approve the selected items
      await PhotoExtractionService.batchApproveItems(selectedItemIds, true);

      // Create closet items from approved extracted items
      const closetItemIds = await PhotoExtractionService.createClosetItemsFromExtracted(
        extractionResult.extraction_id,
        user.id,
        selectedItemIds
      );

      setCurrentStep('completed');
      
      Alert.alert(
        'Success!', 
        `Added ${closetItemIds.length} items to your closet.`,
        [
          {
            text: 'View Closet',
            onPress: () => navigation.navigate('MainTabs', { screen: 'Closet' })
          },
          {
            text: 'Extract Another Photo',
            onPress: handleReset
          }
        ]
      );
    } catch (error: any) {
      console.error('Error adding to closet:', error);
      Alert.alert('Error', 'Failed to add items to closet. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setCurrentStep('select');
    setExtractionResult(null);
    setExtractedItems([]);
    setSelectedItemIds([]);
    setUploadProgress(null);
    setProcessing(false);
  };

  const renderExtractedItem = ({ item, index }: { item: ExtractedClothingItem, index: number }) => {
    const isSelected = selectedItemIds.includes(item.id);
    const confidence = Math.round((item.extraction_confidence || 0) * 100);
    const itemColor = getItemColor(index);
    
    return (
      <TouchableOpacity
        style={[
          styles.extractedItem, 
          isSelected && styles.extractedItemSelected,
          { borderLeftColor: itemColor.border, borderLeftWidth: 4 }
        ]}
        onPress={() => toggleItemSelection(item.id)}
      >
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Text style={[styles.itemCategory, { color: itemColor.border }]}>{item.item_category}</Text>
            <Text style={styles.itemDescription} numberOfLines={2}>
              {item.ai_description}
            </Text>
          </View>
          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceText}>{confidence}%</Text>
            <View style={[styles.confidenceBar, { backgroundColor: itemColor.border }]}>
              <View style={[styles.confidenceBarFill, { width: `${confidence}%` }]} />
            </View>
          </View>
        </View>
        
        {item.item_attributes && (
          <View style={styles.itemAttributes}>
            <Text style={styles.attributeText}>Color: {item.item_attributes.color}</Text>
            <Text style={styles.attributeText}>Material: {item.item_attributes.material}</Text>
            <Text style={styles.attributeText}>Pattern: {item.item_attributes.pattern}</Text>
          </View>
        )}
        
        <View style={[styles.selectionIndicator, { backgroundColor: itemColor.bg }]}>
          <Text style={[styles.selectionText, { color: itemColor.border }]}>
            {isSelected ? '✓ Selected' : 'Tap to select'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSelectStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>📸 Photo Extraction</Text>
      <Text style={styles.stepSubtitle}>
        Upload a photo to automatically detect and extract clothing items for your closet
      </Text>

      <View style={styles.uploadArea}>
        {selectedImage ? (
          <View style={styles.imagePreview}>
            <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
            
            <View style={styles.imageActions}>
              <TouchableOpacity style={styles.changeButton} onPress={() => setSelectedImage(null)}>
                <Text style={styles.changeButtonText}>Change Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.extractButton} 
                onPress={handleExtractItems}
                disabled={processing}
              >
                <Text style={styles.extractButtonText}>
                  {processing ? 'Extracting...' : 'Extract Items'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadPrompt} onPress={handleSelectImage}>
            <View style={styles.uploadIcon}>
              <Text style={styles.uploadIconText}>📷</Text>
            </View>
            <Text style={styles.uploadTitle}>Select Photo</Text>
            <Text style={styles.uploadSubtitle}>
              Choose a photo with clothing items to extract
            </Text>
            <View style={styles.uploadButton}>
              <Text style={styles.uploadButtonText}>Browse Photos</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>💡 Best Results Tips</Text>
        <View style={styles.tips}>
          <Text style={styles.tip}>• Use photos with good lighting</Text>
          <Text style={styles.tip}>• Items should be clearly visible</Text>
          <Text style={styles.tip}>• Avoid cluttered backgrounds</Text>
          <Text style={styles.tip}>• One or multiple items work great</Text>
        </View>
      </View>
    </View>
  );

  const renderExtractingStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingTitle}>
          {uploadProgress ? uploadProgress.message : 'Extracting Items...'}
        </Text>
        <Text style={styles.loadingSubtitle}>
          {uploadProgress && uploadProgress.stage === 'uploading' 
            ? 'Uploading your photo to the cloud'
            : uploadProgress && uploadProgress.stage === 'processing'
            ? 'AI is analyzing your photo and identifying clothing items'
            : 'AI is analyzing your photo and identifying clothing items'
          }
        </Text>
        
        {uploadProgress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    width: `${Math.round(uploadProgress.progress * 100)}%`,
                    backgroundColor: uploadProgress.stage === 'error' ? '#ef4444' : '#3b82f6'
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round(uploadProgress.progress * 100)}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderReviewStep = () => {
    if (!selectedImage || !extractionResult) return null;
    
    // Calculate responsive dimensions for the image
    const imageAspectRatio = selectedImage.width && selectedImage.height 
      ? selectedImage.width / selectedImage.height 
      : 3 / 4; // Default aspect ratio
    
    const { containerWidth, containerHeight } = getResponsiveDimensions(imageAspectRatio, 300);

    // Convert extracted items to bounding box format
    const boundingBoxItems = extractedItems.map(item => ({
      id: item.id,
      bounding_box: item.bounding_box,
      item_category: item.item_category,
      ai_description: item.ai_description,
      extraction_confidence: item.extraction_confidence,
    }));

    return (
      <ScrollView 
        style={styles.reviewContainer} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepContainer}>
          <View style={styles.reviewHeader}>
            <Text style={styles.stepTitle}>👕 Items Found</Text>
            <Text style={styles.stepSubtitle}>
              {extractedItems.length} items detected. Tap items on the image or in the list to select them.
            </Text>
            
            <View style={styles.selectionControls}>
              <TouchableOpacity style={styles.controlButton} onPress={selectAllItems}>
                <Text style={styles.controlButtonText}>Select All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton} onPress={deselectAllItems}>
                <Text style={styles.controlButtonText}>Deselect All</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Image with Bounding Boxes */}
          <View style={styles.imageWithBoundingBoxes}>
            <View style={[styles.boundingBoxImageContainer, { width: containerWidth, height: containerHeight }]}>
              <Image 
                source={{ uri: selectedImage.uri }} 
                style={[styles.boundingBoxImage, { width: containerWidth, height: containerHeight }]}
                resizeMode="contain"
              />
              <BoundingBoxOverlay
                items={boundingBoxItems}
                imageWidth={selectedImage.width || 1}
                imageHeight={selectedImage.height || 1}
                containerWidth={containerWidth}
                containerHeight={containerHeight}
                onItemPress={toggleItemSelection}
                selectedItemIds={selectedItemIds}
                showLabels={true}
              />
            </View>
          </View>

          {/* Items List */}
          <View style={styles.itemsSection}>
            <Text style={styles.itemsSectionTitle}>Detected Items</Text>
            <FlatList
              data={extractedItems}
              renderItem={renderExtractedItem}
              keyExtractor={(item) => item.id}
              style={styles.itemsList}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false} // Disable scroll since parent ScrollView handles it
            />
          </View>

          <View style={styles.reviewActions}>
            <TouchableOpacity style={styles.backButton} onPress={handleReset}>
              <Text style={styles.backButtonText}>Start Over</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.addToClosetButton, selectedItemIds.length === 0 && styles.addToClosetButtonDisabled]}
              onPress={handleAddToCloset}
              disabled={processing || selectedItemIds.length === 0}
            >
              <Text style={styles.addToClosetButtonText}>
                {processing ? 'Adding...' : `Add ${selectedItemIds.length} Items to Closet`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderCompletedStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.completedContainer}>
        <Text style={styles.completedIcon}>🎉</Text>
        <Text style={styles.completedTitle}>Items Added Successfully!</Text>
        <Text style={styles.completedSubtitle}>
          {selectedItemIds.length} clothing items have been added to your closet
        </Text>
        
        <View style={styles.completedActions}>
          <TouchableOpacity 
            style={styles.viewClosetButton}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Closet' })}
          >
            <Text style={styles.viewClosetButtonText}>View My Closet</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.extractAnotherButton}
            onPress={handleReset}
          >
            <Text style={styles.extractAnotherButtonText}>Extract Another Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.headerBackButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Photo Extraction</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 'select' && renderSelectStep()}
        {currentStep === 'extracting' && renderExtractingStep()}
        {currentStep === 'review' && renderReviewStep()}
        {currentStep === 'completed' && renderCompletedStep()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerBackButton: {
    marginRight: 16,
  },
  headerBackButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  
  // Upload Area
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  uploadIconText: {
    fontSize: 40,
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
  
  // Image Preview
  imagePreview: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
  },
  previewImage: {
    width: 280,
    height: 360,
    borderRadius: 16,
    marginBottom: 20,
  },
  imageActions: {
    flexDirection: 'row',
    gap: 12,
  },
  changeButton: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  changeButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  extractButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  extractButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 20,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBarContainer: {
    width: '80%',
    height: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  
  // Review
  reviewContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40, // Small padding for better scroll experience
  },
  reviewHeader: {
    marginBottom: 24,
  },
  imageWithBoundingBoxes: {
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  boundingBoxImageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  boundingBoxImage: {
    borderRadius: 12,
  },
  itemsSection: {
    marginBottom: 24,
  },
  itemsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  selectionControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  controlButton: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  controlButtonText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  itemsList: {
    // Removed maxHeight constraint to allow all items to be visible
    // Parent ScrollView handles scrolling
  },
  extractedItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  extractedItemSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  confidenceContainer: {
    alignItems: 'center',
    marginLeft: 16,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  confidenceBar: {
    width: 40,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceBarFill: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  itemAttributes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  attributeText: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  selectionIndicator: {
    alignItems: 'center',
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
    marginBottom: 24,
  },
  backButton: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  addToClosetButton: {
    flex: 2,
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addToClosetButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  addToClosetButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  
  // Completed
  completedContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  completedIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  completedSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  completedActions: {
    gap: 16,
    width: '100%',
  },
  viewClosetButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewClosetButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  extractAnotherButton: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  extractAnotherButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  
  // Tips
  tipsSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  tips: {
    gap: 6,
  },
  tip: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});