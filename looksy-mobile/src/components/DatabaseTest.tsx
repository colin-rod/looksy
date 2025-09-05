import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../services/supabase';

export const DatabaseTest: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      // Test basic connection by fetching style taxonomy
      const { data, error } = await supabase
        .from('style_taxonomy')
        .select('name, description')
        .limit(3);

      if (error) {
        console.error('Database error:', error);
        setIsConnected(false);
        Alert.alert('Connection Failed', error.message);
      } else {
        console.log('Database connected! Styles found:', data);
        setIsConnected(true);
        Alert.alert('Connection Success!', `Found ${data?.length} styles in database`);
      }
    } catch (err) {
      console.error('Connection error:', err);
      setIsConnected(false);
      Alert.alert('Connection Error', 'Failed to connect to database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Database Connection Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Status: </Text>
        <Text style={[
          styles.statusText,
          { color: isConnected === null ? '#666' : isConnected ? '#22C55E' : '#EF4444' }
        ]}>
          {isConnected === null ? 'Testing...' : isConnected ? '✅ Connected' : '❌ Failed'}
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.button} 
        onPress={testConnection}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test Connection'}
        </Text>
      </TouchableOpacity>

      {isConnected && (
        <Text style={styles.successText}>
          🎉 Supabase is ready for Looksy MVP!
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    margin: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#1f2937',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  successText: {
    fontSize: 16,
    color: '#059669',
    textAlign: 'center',
    marginTop: 10,
  },
});