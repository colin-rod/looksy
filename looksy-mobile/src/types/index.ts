// Core User Types
export interface User {
  id: string;
  email: string;
  user_metadata?: {
    display_name?: string;
    avatar_url?: string;
  };
}

// Navigation Types
export interface NavigationProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
    reset: (options: any) => void;
  };
  route?: {
    params?: any;
  };
}

// Screen Props Interfaces
export interface BaseScreenProps extends NavigationProps {
  user?: User | null;
}

export interface ResultsScreenParams {
  outfitId: string;
  imagePath: string;
}

export interface ClosetConfirmationParams {
  outfitId: string;
  detectedItems: DetectedClosetItem[];
}

// Analysis Types
export interface OutfitAnalysis {
  overall_score: number;
  style_category: string;
  style_score: number;
  fit_score: number;
  color_score: number;
  occasion_appropriateness: number;
  detailed_feedback: {
    strengths: string[];
    improvements: string[];
    style_alignment: string;
  };
  items_detected: DetectedItem[];
}

export interface ClinicalAnalysis extends OutfitAnalysis {
  sub_scores: {
    proportion_silhouette: number;
    fit_technical: number;
    color_harmony: number;
    pattern_texture: number;
    layering_logic: number;
    formality_occasion: number;
    footwear_cohesion: number;
  };
  garment_detection: GarmentDetection[];
  outfit_assessment: OutfitAssessment;
  recommendations: Recommendations;
  confidence_flags: string[];
  analysis_completeness: number;
}

export interface DetectedItem {
  category: string;
  description: string;
  fit_assessment: string;
}

export interface GarmentDetection {
  item_id: string;
  category: string;
  attributes: GarmentAttributes;
  confidence_scores: Record<string, number>;
}

export interface GarmentAttributes {
  fit: string;
  color: string;
  pattern: string;
  material: string;
  length?: string;
  sleeve_length?: string;
  neckline?: string;
  waistline?: string;
  hem_treatment?: string;
  layer_order?: number;
}

export interface OutfitAssessment {
  proportions: {
    top_length_ratio: number;
    silhouette_shape: string;
  };
  layering: {
    weight_order: string[];
    hem_order: string[];
  };
  color_analysis: {
    palette: string[];
    scheme: string;
    outliers: string[];
  };
  formality_level: {
    score: number;
    reasoning: string;
  };
  micro_adjustments: {
    tuck_status: string;
    sleeves: string;
    cuffs: string;
  };
}

export interface Recommendations {
  minor_adjustments: string[];
  detected_closet_items: DetectedClosetItemRecommendation[];
  closet_recommendations: string[];
  new_item_suggestions: string[];
}

export interface DetectedClosetItemRecommendation {
  category: string;
  attributes: any;
  confidence: number;
}

// Closet Types
export interface DetectedClosetItem {
  id: string;
  category: string;
  attributes: GarmentAttributes;
  confidence: number;
  existsInCloset: boolean;
  garmentDetectionId?: string;
  closetItemId?: string;
}

export interface ClosetItem {
  id: string;
  category: string;
  subcategory?: string;
  color?: string;
  pattern?: string;
  material?: string;
  brand?: string;
  size?: string;
  style_tags: string[];
  formality_level?: number;
  season_tags: string[];
  condition: string;
  notes?: string;
  image_paths: string[];
  source: string;
  source_outfit_id?: string;
  detection_confidence?: number;
  created_at: string;
  updated_at: string;
}

// Service Response Types
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AnalysisResult extends ServiceResponse<ClinicalAnalysis | OutfitAnalysis> {
  outfitId?: string;
  source?: 'openai' | 'fallback';
}

// Upload Types
export interface ImagePickerResult {
  uri: string;
  width: number;
  height: number;
  type: 'image';
}

// Processing Status Types
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Style Types
export interface StyleTheme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      light: string;
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    sizes: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
    weights: {
      normal: '400';
      medium: '500';
      semibold: '600';
      bold: '700';
    };
  };
}

// Component Props Types
export interface ScoreBarProps {
  label: string;
  score: number;
  maxScore?: number;
  color?: string;
  size?: 'small' | 'medium' | 'large';
}

export interface ItemCardProps {
  category: string;
  description?: string;
  attributes?: Partial<GarmentAttributes>;
  confidence?: number;
  onPress?: () => void;
  variant?: 'basic' | 'clinical' | 'closet';
}

export interface FeedbackGroupProps {
  title: string;
  items: string[];
  icon?: string;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Constants
export const SCORE_COLORS = {
  excellent: '#22c55e',
  good: '#f59e0b', 
  poor: '#ef4444'
} as const;

export const SCORE_THRESHOLDS = {
  excellent: 80,
  good: 60
} as const;

export const PROCESSING_MESSAGES = {
  processing: 'AI is analyzing your style...',
  preparing: 'Preparing your results...',
  completed: 'Analysis complete!'
} as const;

// Theme Types
export interface StyleTheme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      light: string;
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  typography: {
    sizes: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
    weights: {
      normal: string;
      medium: string;
      semibold: string;
      bold: string;
    };
    lineHeights: {
      tight: number;
      normal: number;
      relaxed: number;
      loose: number;
    };
  };
  accessibility: {
    minTouchTarget: number;
    focusColor: string;
    highContrastRatio: number;
  };
  animation: {
    fast: number;
    normal: number;
    slow: number;
    verySlow: number;
  };
}