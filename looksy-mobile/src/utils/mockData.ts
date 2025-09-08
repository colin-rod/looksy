import { OutfitAnalysis, ClinicalAnalysis } from '../types';

/**
 * Comprehensive mock data for testing all enhanced analysis components
 * Covers various score scenarios and edge cases
 */

// High Score Analysis (90+) - Excellence with celebration
export const highScoreAnalysis: ClinicalAnalysis = {
  overall_score: 92.5,
  style_category: 'Professional Chic',
  style_score: 94,
  fit_score: 91,
  color_score: 90,
  occasion_appropriateness: 95,
  sub_scores: {
    proportion_silhouette: 93,
    fit_technical: 91,
    color_harmony: 89,
    pattern_texture: 95,
    layering_logic: 92,
    formality_occasion: 96,
    footwear_cohesion: 88
  },
  detailed_feedback: {
    strengths: [
      'Impeccable fit creates a polished, professional silhouette',
      'Color coordination demonstrates sophisticated style understanding',
      'Excellent proportional balance enhances your natural frame',
      'Perfect formality level for business professional settings'
    ],
    improvements: [
      'Consider adding a subtle statement accessory to elevate the look',
      'Experiment with texture mixing for more visual interest'
    ],
    style_alignment: 'Your outfit perfectly embodies professional chic styling with excellent attention to detail and proportion.'
  },
  garment_detection: [
    {
      item_id: 'blazer_001',
      category: 'blazer',
      attributes: {
        fit: 'tailored',
        color: 'navy',
        pattern: 'solid',
        material: 'wool blend',
        length: 'hip',
        sleeve_length: 'long'
      },
      confidence_scores: {
        category: 0.95,
        fit: 0.92,
        color: 0.98,
        pattern: 0.99
      }
    },
    {
      item_id: 'trousers_001',
      category: 'trousers',
      attributes: {
        fit: 'straight',
        color: 'charcoal',
        pattern: 'solid',
        material: 'wool',
        length: 'full',
        waistline: 'mid-rise'
      },
      confidence_scores: {
        category: 0.97,
        fit: 0.89,
        color: 0.94,
        pattern: 0.99
      }
    }
  ],
  outfit_assessment: {
    proportions: {
      top_length_ratio: 0.65,
      silhouette_shape: 'balanced'
    }
  },
  recommendations: {
    minor_adjustments: [
      'Consider a slight hem adjustment for perfect trouser length',
      'Add a structured handbag to complete the professional look'
    ],
    closet_recommendations: [
      'Your navy blazer pairs beautifully with lighter gray trousers from your closet',
      'The white silk blouse would create an elegant contrast with this outfit'
    ]
  },
  confidence_flags: [],
  analysis_completeness: 98
};

// Medium Score Analysis (60-80) - Good with room for improvement
export const mediumScoreAnalysis: ClinicalAnalysis = {
  overall_score: 72.3,
  style_category: 'Casual Contemporary',
  style_score: 75,
  fit_score: 68,
  color_score: 74,
  occasion_appropriateness: 72,
  sub_scores: {
    proportion_silhouette: 70,
    fit_technical: 65,
    color_harmony: 78,
    pattern_texture: 72,
    layering_logic: 69,
    formality_occasion: 74,
    footwear_cohesion: 76
  },
  detailed_feedback: {
    strengths: [
      'Good color coordination creates a cohesive look',
      'Appropriate casual styling for the intended setting',
      'Nice balance between comfort and style'
    ],
    improvements: [
      'Fit adjustments could significantly enhance the overall appearance',
      'Consider more structured pieces to elevate the silhouette',
      'Experiment with layering to add visual depth',
      'Accessorizing could add personality to the outfit'
    ],
    style_alignment: 'Your casual contemporary style shows good fundamentals but has potential for refinement.'
  },
  garment_detection: [
    {
      item_id: 'sweater_001',
      category: 'sweater',
      attributes: {
        fit: 'relaxed',
        color: 'burgundy',
        pattern: 'cable knit',
        material: 'cotton blend',
        neckline: 'crew'
      },
      confidence_scores: {
        category: 0.87,
        fit: 0.72,
        color: 0.91,
        pattern: 0.85
      }
    }
  ],
  outfit_assessment: {
    proportions: {
      top_length_ratio: 0.55,
      silhouette_shape: 'relaxed'
    }
  },
  recommendations: {
    minor_adjustments: [
      'Try tucking in the sweater for better proportions',
      'Consider a belt to define the waistline',
      'Add a structured jacket for more polish'
    ],
    closet_recommendations: [
      'The fitted jeans in your closet would improve the overall silhouette',
      'Adding the brown leather ankle boots would elevate this casual look'
    ]
  },
  confidence_flags: [
    'Lighting conditions may have affected color analysis accuracy'
  ],
  analysis_completeness: 85
};

// Low Score Analysis (<60) - Needs significant improvement
export const lowScoreAnalysis: ClinicalAnalysis = {
  overall_score: 45.8,
  style_category: 'Eclectic Mix',
  style_score: 42,
  fit_score: 38,
  color_score: 51,
  occasion_appropriateness: 52,
  sub_scores: {
    proportion_silhouette: 40,
    fit_technical: 35,
    color_harmony: 48,
    pattern_texture: 44,
    layering_logic: 50,
    formality_occasion: 55,
    footwear_cohesion: 39
  },
  detailed_feedback: {
    strengths: [
      'Shows creativity and willingness to experiment with style',
      'Color choices demonstrate bold personality'
    ],
    improvements: [
      'Focus on fit - properly fitted garments will dramatically improve your look',
      'Simplify color palette to create more harmony',
      'Consider the occasion when selecting pieces',
      'Work on proportions to create a more balanced silhouette',
      'Invest in foundational pieces that fit well',
      'Learn basic color coordination principles'
    ],
    style_alignment: 'Your eclectic approach shows personality but needs more structure and attention to fundamentals.'
  },
  garment_detection: [
    {
      item_id: 'shirt_001',
      category: 'shirt',
      attributes: {
        fit: 'oversized',
        color: 'bright orange',
        pattern: 'striped',
        material: 'cotton'
      },
      confidence_scores: {
        category: 0.78,
        fit: 0.65,
        color: 0.88,
        pattern: 0.82
      }
    },
    {
      item_id: 'pants_001',
      category: 'pants',
      attributes: {
        fit: 'loose',
        color: 'purple',
        pattern: 'solid',
        material: 'denim'
      },
      confidence_scores: {
        category: 0.81,
        fit: 0.69,
        color: 0.75,
        pattern: 0.92
      }
    }
  ],
  outfit_assessment: {
    proportions: {
      top_length_ratio: 0.45,
      silhouette_shape: 'unstructured'
    }
  },
  recommendations: {
    minor_adjustments: [
      'Start with better fitting basics in neutral colors',
      'Focus on one statement piece at a time',
      'Consider professional styling consultation'
    ],
    closet_recommendations: [
      'Build your wardrobe with well-fitting basics in neutral tones',
      'Invest in tailoring for your existing pieces'
    ]
  },
  confidence_flags: [
    'Multiple pattern conflicts detected',
    'Color coordination needs attention',
    'Fit assessment confidence low due to garment condition'
  ],
  analysis_completeness: 72
};

// Perfect Score Analysis (95+) - Exceptional styling
export const perfectScoreAnalysis: ClinicalAnalysis = {
  overall_score: 97.2,
  style_category: 'Editorial Elegance',
  style_score: 98,
  fit_score: 96,
  color_score: 97,
  occasion_appropriateness: 98,
  sub_scores: {
    proportion_silhouette: 98,
    fit_technical: 96,
    color_harmony: 97,
    pattern_texture: 99,
    layering_logic: 95,
    formality_occasion: 98,
    footwear_cohesion: 97
  },
  detailed_feedback: {
    strengths: [
      'Flawless fit creates an impeccable silhouette that enhances your natural proportions',
      'Masterful color coordination demonstrates advanced style sophistication',
      'Perfect balance of texture and pattern creates visual interest without overwhelming',
      'Exemplary understanding of occasion-appropriate dressing',
      'Every detail contributes to a cohesive, polished aesthetic'
    ],
    improvements: [
      'Your styling is exceptional - perhaps consider sharing your expertise!',
      'Experiment with avant-garde accessories for editorial edge'
    ],
    style_alignment: 'Your outfit represents the pinnacle of editorial elegance with museum-quality styling execution.'
  },
  garment_detection: [
    {
      item_id: 'dress_001',
      category: 'dress',
      attributes: {
        fit: 'tailored',
        color: 'emerald',
        pattern: 'solid',
        material: 'silk',
        length: 'midi',
        neckline: 'v-neck'
      },
      confidence_scores: {
        category: 0.99,
        fit: 0.98,
        color: 0.99,
        pattern: 1.0
      }
    },
    {
      item_id: 'coat_001',
      category: 'coat',
      attributes: {
        fit: 'structured',
        color: 'camel',
        pattern: 'solid',
        material: 'wool cashmere',
        length: 'knee'
      },
      confidence_scores: {
        category: 0.98,
        fit: 0.97,
        color: 0.99,
        pattern: 1.0
      }
    }
  ],
  outfit_assessment: {
    proportions: {
      top_length_ratio: 0.68,
      silhouette_shape: 'hourglass enhanced'
    }
  },
  recommendations: {
    minor_adjustments: [
      'This outfit is styling perfection - no adjustments needed!'
    ],
    closet_recommendations: [
      'Your gold jewelry collection would add the perfect finishing touch',
      'The nude heels would create an elegant, elongating line'
    ]
  },
  confidence_flags: [],
  analysis_completeness: 100
};

// Edge Case: Incomplete Analysis
export const incompleteAnalysis: OutfitAnalysis = {
  overall_score: 68.5,
  style_category: 'Casual',
  style_score: 70,
  fit_score: 65,
  color_score: 72,
  occasion_appropriateness: 67,
  detailed_feedback: {
    strengths: [
      'Comfortable styling approach',
      'Good color choices'
    ],
    improvements: [
      'Consider more structured pieces',
      'Work on proportions'
    ],
    style_alignment: 'Casual style with room for growth.'
  },
  items_detected: [
    {
      category: 'shirt',
      description: 'Light blue button-up shirt',
      fit_assessment: 'slightly loose'
    },
    {
      category: 'jeans',
      description: 'Dark wash denim jeans',
      fit_assessment: 'good fit'
    }
  ]
};

// Edge Case: Null/Empty Analysis
export const nullAnalysis = null;

// Edge Case: Minimal Data Analysis
export const minimalAnalysis: OutfitAnalysis = {
  overall_score: 0,
  style_category: '',
  style_score: 0,
  fit_score: 0,
  color_score: 0,
  occasion_appropriateness: 0,
  detailed_feedback: {
    strengths: [],
    improvements: [],
    style_alignment: ''
  },
  items_detected: []
};

// Test scenarios array for easy iteration
export const testScenarios = [
  { name: 'High Score (92.5)', data: highScoreAnalysis },
  { name: 'Medium Score (72.3)', data: mediumScoreAnalysis },
  { name: 'Low Score (45.8)', data: lowScoreAnalysis },
  { name: 'Perfect Score (97.2)', data: perfectScoreAnalysis },
  { name: 'Incomplete Analysis', data: incompleteAnalysis },
  { name: 'Null Analysis', data: nullAnalysis },
  { name: 'Minimal Data', data: minimalAnalysis }
];

// Utility function to get random test data
export const getRandomTestAnalysis = (): ClinicalAnalysis | OutfitAnalysis | null => {
  const scenarios = [highScoreAnalysis, mediumScoreAnalysis, lowScoreAnalysis, perfectScoreAnalysis];
  return scenarios[Math.floor(Math.random() * scenarios.length)];
};

// Utility function to get test data by score range
export const getTestAnalysisByScoreRange = (range: 'high' | 'medium' | 'low' | 'perfect'): ClinicalAnalysis => {
  switch (range) {
    case 'perfect': return perfectScoreAnalysis;
    case 'high': return highScoreAnalysis;
    case 'medium': return mediumScoreAnalysis;
    case 'low': return lowScoreAnalysis;
    default: return mediumScoreAnalysis;
  }
};