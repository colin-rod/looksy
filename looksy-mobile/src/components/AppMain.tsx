import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { AuthScreen } from '../screens/AuthScreen';
import { AppNavigator } from '../navigation/AppNavigator';

export const AppMain: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthSuccess = () => {
    // Session will be automatically updated via onAuthStateChange
  };

  const handleSignOut = () => {
    // Session will be automatically cleared via onAuthStateChange
  };

  if (loading) {
    // You could add a loading screen here
    return <View style={styles.container} />;
  }

  if (!session?.user) {
    return (
      <View style={styles.container}>
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppNavigator user={session.user} onSignOut={handleSignOut} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});