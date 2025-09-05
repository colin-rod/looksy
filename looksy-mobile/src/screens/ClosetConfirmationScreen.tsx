import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ClosetService, DetectedClosetItem } from '../services/closetService';

interface ClosetConfirmationScreenProps {
  route: {
    params: {
      outfitId: string;
      detectedItems: DetectedClosetItem[];
    };
  };
  navigation: any;
  user: any;
}

export const ClosetConfirmationScreen: React.FC<ClosetConfirmationScreenProps> = ({
  route,
  navigation,
  user,
}) => {
  const { outfitId, detectedItems } = route.params;
  const [items, setItems] = useState<DetectedClosetItem[]>(detectedItems || []);
  const [loading, setLoading] = useState(false);
  const [confirmations, setConfirmations] = useState<{ [key: string]: boolean | null }>({});

  useEffect(() => {
    loadDetectedItems();
  }, []);

  const loadDetectedItems = async () => {
    if (!detectedItems || detectedItems.length === 0) {
      try {
        setLoading(true);
        const detected = await ClosetService.getDetectedClosetItems(outfitId);
        setItems(detected);
      } catch (error) {
        console.error('Error loading detected items:', error);
        Alert.alert('Error', 'Failed to load detected closet items');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleConfirmation = (itemId: string, confirmed: boolean) => {
    setConfirmations(prev => ({
      ...prev,
      [itemId]: confirmed,
    }));
  };

  const handleSaveConfirmations = async () => {
    try {
      setLoading(true);
      
      // Save confirmations to database
      for (const item of items) {
        const confirmation = confirmations[item.id];
        if (confirmation !== null) {
          await ClosetService.updateClosetItemConfirmation(
            item.id,
            confirmation,
            user.id
          );
        }
      }

      // Create new closet items for confirmed detections that don't exist
      const confirmedNewItems = items.filter(item => 
        confirmations[item.id] === true && !item.existsInCloset
      );
      
      if (confirmedNewItems.length > 0) {
        await ClosetService.createClosetItemsFromDetections(
          confirmedNewItems,
          user.id,
          outfitId
        );
      }

      Alert.alert(
        'Success',
        'Your closet has been updated with the confirmed items!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving confirmations:', error);
      Alert.alert('Error', 'Failed to save confirmations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigation.goBack();
  };

  const getConfirmationStyle = (itemId: string, isConfirmed: boolean) => {
    const confirmation = confirmations[itemId];
    if (confirmation === null) {
      return styles.neutralButton;
    }
    return confirmation === isConfirmed ? styles.activeButton : styles.inactiveButton;
  };

  const getConfirmationTextStyle = (itemId: string, isConfirmed: boolean) => {
    const confirmation = confirmations[itemId];
    if (confirmation === null) {
      return styles.neutralButtonText;
    }
    return confirmation === isConfirmed ? styles.activeButtonText : styles.inactiveButtonText;
  };

  const confirmedCount = Object.values(confirmations).filter(c => c === true).length;
  const rejectedCount = Object.values(confirmations).filter(c => c === false).length;
  const totalCount = items.length;

  if (loading && items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading detected items...</Text>
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
          <Text style={styles.title}>Confirm Closet Items</Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>🔍 Items Detected</Text>
          <Text style={styles.instructionsText}>
            We found these items in your outfit. Please confirm which ones are actually from your closet to help us improve recommendations.
          </Text>
          
          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Progress: {confirmedCount + rejectedCount} of {totalCount} reviewed
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${((confirmedCount + rejectedCount) / totalCount) * 100}%` }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Detected Items */}
        <View style={styles.itemsList}>
          {items.map((item, index) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemCategory}>{item.category}</Text>
                {item.existsInCloset && (
                  <View style={styles.existsBadge}>
                    <Text style={styles.existsBadgeText}>In Closet</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.attributesContainer}>
                {item.attributes.color && (
                  <Text style={styles.attributeText}>Color: {item.attributes.color}</Text>
                )}
                {item.attributes.pattern && (
                  <Text style={styles.attributeText}>Pattern: {item.attributes.pattern}</Text>
                )}
                {item.attributes.material && (
                  <Text style={styles.attributeText}>Material: {item.attributes.material}</Text>
                )}
                {item.attributes.fit && (
                  <Text style={styles.attributeText}>Fit: {item.attributes.fit}</Text>
                )}
              </View>
              
              <View style={styles.confidenceContainer}>
                <Text style={styles.confidenceText}>
                  Detection Confidence: {Math.round(item.confidence * 100)}%
                </Text>
              </View>

              <Text style={styles.confirmationQuestion}>
                Is this item from your closet?
              </Text>
              
              <View style={styles.confirmationButtons}>
                <TouchableOpacity
                  style={getConfirmationStyle(item.id, true)}
                  onPress={() => handleConfirmation(item.id, true)}
                >
                  <Text style={getConfirmationTextStyle(item.id, true)}>
                    ✓ Yes, it's mine
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={getConfirmationStyle(item.id, false)}
                  onPress={() => handleConfirmation(item.id, false)}
                >
                  <Text style={getConfirmationTextStyle(item.id, false)}>
                    ✗ Not mine
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>Skip for Now</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.saveButton,
              (confirmedCount + rejectedCount === 0) && styles.saveButtonDisabled
            ]} 
            onPress={handleSaveConfirmations}
            disabled={loading || (confirmedCount + rejectedCount === 0)}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.saveButtonText}>
                Save ({confirmedCount} confirmed)
              </Text>
            )}
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
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
  instructionsContainer: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
    marginBottom: 16,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 13,
    color: '#1e40af',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#dbeafe',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  itemsList: {
    marginBottom: 32,
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemCategory: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    textTransform: 'capitalize',
  },
  existsBadge: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  existsBadgeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  attributesContainer: {
    marginBottom: 12,
  },
  attributeText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  confidenceContainer: {
    marginBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  confidenceText: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  confirmationQuestion: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  neutralButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  activeButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  inactiveButton: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  neutralButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  activeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  inactiveButtonText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
  skipButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  skipButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});