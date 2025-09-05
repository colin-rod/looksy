import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { supabase } from '../services/supabase';

interface ProfileScreenProps {
  user: any;
  onSignOut: () => void;
}

const MVP_STYLES = [
  { id: 'minimalist', name: 'Minimalist', description: 'Clean, simple, neutral' },
  { id: 'casual', name: 'Casual', description: 'Everyday comfortable wear' },
  { id: 'business_casual', name: 'Business Casual', description: 'Work & professional' },
  { id: 'streetwear', name: 'Streetwear', description: 'Urban, trendy, bold' },
  { id: 'dressy', name: 'Dressy', description: 'Special occasions' },
  { id: 'athletic', name: 'Athletic', description: 'Athleisure & workout' },
];

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onSignOut }) => {
  const [displayName, setDisplayName] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, personal_styles')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine for new users
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        setDisplayName(data.display_name || '');
        
        // Extract selected styles from personal_styles JSONB
        if (data.personal_styles && Array.isArray(data.personal_styles)) {
          const styleNames = data.personal_styles.map((style: any) => style.name);
          setSelectedStyles(styleNames);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const toggleStyle = (styleId: string) => {
    setSelectedStyles(prev => 
      prev.includes(styleId)
        ? prev.filter(id => id !== styleId)
        : [...prev, styleId]
    );
  };

  const saveProfile = async () => {
    setLoading(true);
    
    try {
      // Create personal styles array with simple mappings
      const personalStyles = selectedStyles.map(styleId => ({
        name: styleId,
        mapping: { [styleId]: 1.0 } // Simple 100% mapping for MVP
      }));

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          display_name: displayName.trim(),
          personal_styles: personalStyles,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      Alert.alert('Success', 'Profile saved successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            onSignOut();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile Settings</Text>
          <Text style={styles.subtitle}>Tell us about your style preferences</Text>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              returnKeyType="done"
            />
            
            <Text style={styles.label}>Email</Text>
            <Text style={styles.emailText}>{user?.email}</Text>
          </View>
        </View>

        {/* Style Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Style Preferences</Text>
          <Text style={styles.sectionDescription}>
            Select the styles that represent you (you can choose multiple)
          </Text>
          
          <View style={styles.stylesGrid}>
            {MVP_STYLES.map((style) => (
              <TouchableOpacity
                key={style.id}
                style={[
                  styles.styleCard,
                  selectedStyles.includes(style.id) && styles.styleCardSelected
                ]}
                onPress={() => toggleStyle(style.id)}
              >
                <Text style={[
                  styles.styleName,
                  selectedStyles.includes(style.id) && styles.styleNameSelected
                ]}>
                  {style.name}
                </Text>
                <Text style={[
                  styles.styleDescription,
                  selectedStyles.includes(style.id) && styles.styleDescriptionSelected
                ]}>
                  {style.description}
                </Text>
                {selectedStyles.includes(style.id) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.buttonDisabled]}
            onPress={saveProfile}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Profile'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutButtonText}>Sign Out</Text>
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
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emailText: {
    fontSize: 16,
    color: '#6b7280',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  stylesGrid: {
    gap: 12,
  },
  styleCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    position: 'relative',
  },
  styleCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  styleName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  styleNameSelected: {
    color: '#3b82f6',
  },
  styleDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  styleDescriptionSelected: {
    color: '#1d4ed8',
  },
  checkmark: {
    position: 'absolute',
    top: 16,
    right: 16,
    fontSize: 20,
    color: '#3b82f6',
  },
  actions: {
    gap: 12,
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  signOutButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  signOutButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
});