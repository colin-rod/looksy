import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { TestService } from '../services/testService';

interface HomeScreenProps {
  navigation: any; // We'll properly type this later with navigation types
  user: any; // Current user data
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, user }) => {
  const handleUploadOutfit = () => {
    navigation.navigate('Upload');
  };

  const handleViewCloset = () => {
    navigation.navigate('Closet');
  };

  const handleViewProfile = () => {
    navigation.navigate('Profile');
  };

  const handlePhotoExtraction = () => {
    navigation.navigate('PhotoExtraction');
  };

  const handleTestOpenAI = async () => {
    const result = await TestService.testOpenAI();
    console.log('OpenAI Test Result:', result);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Hello, {user?.user_metadata?.display_name || 'Stylist'}! 👋
          </Text>
          <Text style={styles.subtitle}>Ready to score your outfit?</Text>
        </View>

        {/* Main Action - Upload Outfit */}
        <View style={styles.mainSection}>
          <TouchableOpacity style={styles.uploadButton} onPress={handleUploadOutfit}>
            <View style={styles.uploadIcon}>
              <Text style={styles.uploadIconText}>📷</Text>
            </View>
            <Text style={styles.uploadTitle}>Score My Outfit</Text>
            <Text style={styles.uploadDescription}>
              Take a photo and get AI-powered style feedback
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={handleViewCloset}>
              <Text style={styles.actionIcon}>👔</Text>
              <Text style={styles.actionTitle}>My Closet</Text>
              <Text style={styles.actionDescription}>
                Manage your wardrobe
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={handlePhotoExtraction}>
              <Text style={styles.actionIcon}>✂️</Text>
              <Text style={styles.actionTitle}>Extract Items</Text>
              <Text style={styles.actionDescription}>
                Add clothes from photos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={handleViewProfile}>
              <Text style={styles.actionIcon}>⚙️</Text>
              <Text style={styles.actionTitle}>Profile</Text>
              <Text style={styles.actionDescription}>
                Style preferences
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Debug Section */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Debug</Text>
          <TouchableOpacity style={[styles.actionCard, {width: '100%'}]} onPress={handleTestOpenAI}>
            <Text style={styles.actionIcon}>🔧</Text>
            <Text style={styles.actionTitle}>Test OpenAI API</Text>
            <Text style={styles.actionDescription}>
              Check if OpenAI integration is working
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity Placeholder */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Outfits</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📸</Text>
            <Text style={styles.emptyStateText}>
              No outfits scored yet
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Upload your first outfit to get started!
            </Text>
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
    marginBottom: 32,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6b7280',
  },
  mainSection: {
    marginBottom: 32,
  },
  uploadButton: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  uploadIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadIconText: {
    fontSize: 36,
  },
  uploadTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  uploadDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  quickActions: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  recentSection: {
    marginBottom: 32,
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});