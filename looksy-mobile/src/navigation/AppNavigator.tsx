import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ClosetScreen } from '../screens/ClosetScreen';
import { UploadScreen } from '../screens/UploadScreen';
import { ResultsScreen } from '../screens/ResultsScreen';
import { PhotoExtractionScreen } from '../screens/PhotoExtractionScreen';

// Navigation Types
export type RootStackParamList = {
  MainTabs: undefined;
  Upload: undefined;
  PhotoExtraction: undefined;
  Results: {
    outfitId: string;
    imagePath: string;
  };
};

export type MainTabParamList = {
  Home: undefined;
  Closet: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

interface MainTabsProps {
  user: any;
  onSignOut: () => void;
}

const MainTabs: React.FC<MainTabsProps> = ({ user, onSignOut }) => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🏠" focused={focused} />
          ),
        }}
      >
        {(props) => <HomeScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen
        name="Closet"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="👔" focused={focused} />
          ),
        }}
      >
        {(props) => <ClosetScreen {...props} user={user} />}
      </Tab.Screen>

      <Tab.Screen
        name="Profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="👤" focused={focused} />
          ),
        }}
      >
        {(props) => <ProfileScreen {...props} user={user} onSignOut={onSignOut} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

interface TabIconProps {
  icon: string;
  focused: boolean;
}

const TabIcon: React.FC<TabIconProps> = ({ icon, focused }) => {
  return (
    <Text style={{ 
      fontSize: focused ? 24 : 20,
      opacity: focused ? 1 : 0.6,
    }}>
      {icon}
    </Text>
  );
};

interface AppNavigatorProps {
  user: any;
  onSignOut: () => void;
}

export const AppNavigator: React.FC<AppNavigatorProps> = ({ user, onSignOut }) => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs">
          {(props) => <MainTabs {...props} user={user} onSignOut={onSignOut} />}
        </Stack.Screen>
        <Stack.Screen 
          name="Upload"
          options={{ presentation: 'modal' }}
        >
          {(props) => <UploadScreen {...props} user={user} />}
        </Stack.Screen>
        <Stack.Screen 
          name="PhotoExtraction"
          options={{ presentation: 'modal' }}
        >
          {(props) => <PhotoExtractionScreen {...props} user={user} />}
        </Stack.Screen>
        <Stack.Screen 
          name="Results"
          options={{ presentation: 'card' }}
        >
          {(props) => <ResultsScreen {...props} user={user} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};