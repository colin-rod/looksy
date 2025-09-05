import { NavigatorScreenParams } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { ResultsScreenParams, ClosetConfirmationParams } from '../types';

// Main Stack Navigator
export type RootStackParamList = {
  Auth: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  Results: ResultsScreenParams;
  ClosetConfirmation: ClosetConfirmationParams;
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Upload: undefined;
  Closet: undefined;
  Profile: undefined;
};

// Screen Navigation Props
export type AuthScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Auth'>;
export type HomeScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Home'>;
export type UploadScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Upload'>;
export type ClosetScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Closet'>;
export type ProfileScreenNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Profile'>;
export type ResultsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Results'>;
export type ClosetConfirmationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ClosetConfirmation'>;

// Screen Names Constants
export const SCREEN_NAMES = {
  // Root Stack
  AUTH: 'Auth',
  MAIN_TABS: 'MainTabs',
  RESULTS: 'Results',
  CLOSET_CONFIRMATION: 'ClosetConfirmation',
  
  // Main Tabs
  HOME: 'Home',
  UPLOAD: 'Upload',
  CLOSET: 'Closet',
  PROFILE: 'Profile',
} as const;

// Navigation utilities
export type ScreenName = keyof RootStackParamList | keyof MainTabParamList;

export interface NavigationHelpers {
  navigateToResults: (params: ResultsScreenParams) => void;
  navigateToClosetConfirmation: (params: ClosetConfirmationParams) => void;
  navigateToHome: () => void;
  goBack: () => void;
  resetToAuth: () => void;
}

// Common navigation actions
export const navigationActions = {
  resetToAuth: {
    index: 0,
    routes: [{ name: SCREEN_NAMES.AUTH }],
  },
  resetToHome: {
    index: 0,
    routes: [{ name: SCREEN_NAMES.MAIN_TABS, params: { screen: SCREEN_NAMES.HOME } }],
  },
};