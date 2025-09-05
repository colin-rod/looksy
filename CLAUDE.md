# 👗 Looksy - Claude Development Guide

**AI-Powered Outfit Scoring & Style Recommendation App - MVP Development Guide**

---

## 🎯 Project Overview

Looksy is an AI-powered mobile app that helps users improve their style by:
1. **Taking outfit photos** and parsing them with AI vision
2. **Scoring outfits** (0-100) against personal style preferences
3. **Providing recommendations** - first from user's closet, then affiliate catalog
4. **Privacy-first approach** with face blurring and data protection
5. **Personal-only experience** (no community features in MVP)

### Core Value Proposition
- **Personalized style coaching** based on user's own preferences
- **Closet optimization** by leveraging existing wardrobe first
- **Privacy by default** with automatic face blurring
- **Progressive closet building** through smart questioning
- **Zero bug tolerance** with comprehensive testing

---

## 🏗 MVP Architecture

### System Flow
```
1. User uploads outfit photo → Private storage
2. Server-side face blurring → Blurred image for display
3. OpenAI Vision parses outfit → Structured JSON
4. Style scoring engine → 0-100 score + breakdown
5. Two-tier recommendations (closet ALWAYS overrides affiliate):
   a) Check user's closet for missing items
   b) If not in closet: "Do you own [item]?" → Quick add OR affiliate suggestions
6. Display results: Score + recommendations + closet building prompts
7. Original image deleted within 5 minutes
```

### Tech Stack - **MVP Decisions**
- **Mobile**: Expo Managed Workflow - Fast iteration, OTA updates, zero bug tolerance
- **Backend**: Supabase (simplified, no community features)
- **AI**: OpenAI Vision (GPT-4o-mini) - Cost-effective image parsing
- **Privacy**: Server-side face blurring (5min temp processing → deletion)
- **Target Devices**: iPhone 11+ / equivalent Android (80% market coverage)
- **Testing**: Self-testing only with comprehensive manual QA

---

## 🛠 Development Environment Setup

### Prerequisites
```bash
# Required tools
node --version  # 18+
npm --version   # 9+
git --version   # Any recent version

# Install global tools
npm install -g @expo/cli@latest
npm install -g supabase
```

### Development Setup
```bash
# 1. Clone and setup project
git clone <repo-url> looksy
cd looksy
npm install

# 2. Setup Supabase project
supabase login
supabase init
supabase start  # Local development

# 3. Setup environment variables
cp .env.example .env.local
# Edit .env.local with your keys:
# EXPO_PUBLIC_SUPABASE_URL=
# EXPO_PUBLIC_SUPABASE_ANON_KEY=
# SUPABASE_SERVICE_ROLE_KEY=
# OPENAI_API_KEY=

# 4. Start development
cd mobile && npm run start  # Expo dev server
```

### Recommended VS Code Extensions
```json
{
  "recommendations": [
    "expo.vscode-expo-tools",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "supabase.supabase-sql"
  ]
}
```

---

## 📁 Code Organization (Monorepo)

```
looksy/
├── mobile/                     # Expo React Native app
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── screens/           # Screen components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API calls and business logic
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # Helper functions
│   ├── app.json              # Expo configuration
│   ├── package.json
│   └── tsconfig.json
├── supabase/
│   ├── functions/            # Edge Functions
│   │   ├── process-outfit/   # Main orchestrator
│   │   ├── blur-face/        # Face blurring service
│   │   └── debug-parse/      # Development helper
│   ├── migrations/           # Database schema changes
│   ├── seed.sql             # Sample data for development
│   └── config.toml          # Supabase configuration
├── shared/                   # Shared between mobile and backend
│   ├── types/               # TypeScript interfaces
│   ├── schemas/             # JSON schemas for validation
│   └── utils/               # Common utilities
├── docs/                    # Documentation
├── .env.example             # Environment template
├── .gitignore
├── package.json             # Root package.json
├── README.md
└── CLAUDE.md               # This file
```

### File Naming Conventions
- **Components**: PascalCase (`OutfitUpload.tsx`)
- **Screens**: PascalCase (`HomeScreen.tsx`) 
- **Hooks**: camelCase starting with `use` (`useOutfitScoring.ts`)
- **Services**: camelCase (`outfitService.ts`)
- **Types**: PascalCase (`OutfitTypes.ts`)
- **Constants**: SCREAMING_SNAKE_CASE (`API_ENDPOINTS.ts`)

---

## 🗄 Database Schema (MVP)

### Core Tables

```sql
-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'non_binary', 'prefer_not_to_say')),
  sizes JSONB, -- {"shirt": "M", "pants": "32", "shoes": "9"}
  personal_styles JSONB, -- [{"name": "Chic", "mapping": {"minimalist": 0.5, "business_casual": 0.3}}]
  privacy_settings JSONB DEFAULT '{"share_to_community": false, "blur_faces": true}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User's closet items
CREATE TABLE closet_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- top/bottom/outer/dress/shoes/bag/accessory
  subcategory TEXT,
  colors JSONB, -- {"primary": "#FF0000", "secondary": "#00FF00"}
  brand TEXT,
  size TEXT,
  tags TEXT[], -- ["casual", "work", "summer"]
  image_url TEXT,
  purchase_date DATE,
  cost DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outfit records
CREATE TABLE outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  original_image_path TEXT, -- Deleted after processing
  blurred_image_path TEXT, -- For display and community
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'error')),
  share_to_community BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ai_call_meta JSONB -- Token usage, model used, etc.
);

-- Parsed outfit items from AI
CREATE TABLE outfit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id UUID REFERENCES outfits(id) ON DELETE CASCADE,
  item_id TEXT, -- From AI parsing (e.g., "i1", "i2")
  category TEXT NOT NULL,
  subcategory TEXT,
  bbox JSONB, -- [x_min, y_min, x_max, y_max] normalized 0-1
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
  colors JSONB, -- {"primary": "#hex", "palette": ["#hex1", "#hex2"]}
  pattern TEXT,
  material TEXT,
  attributes TEXT[], -- ["short_sleeve", "crew_neck", "fitted"]
  description TEXT,
  brand_guess TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Style scores
CREATE TABLE outfit_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id UUID REFERENCES outfits(id) ON DELETE CASCADE,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  breakdown JSONB, -- {"coverage": 32, "attributes": 25, "color": 18, "confidence": 8}
  persona_alignment JSONB, -- [{"name": "Chic", "score": 0.82}]
  explanation TEXT, -- Human-friendly explanation from LLM
  improvement_areas TEXT[], -- ["missing_outer", "color_clash"]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Two-tier recommendations
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id UUID REFERENCES outfits(id) ON DELETE CASCADE,
  recommendation_type TEXT CHECK (recommendation_type IN ('closet_item', 'affiliate_product')),
  
  -- For closet items
  closet_item_id UUID REFERENCES closet_items(id),
  
  -- For affiliate products  
  product_data JSONB, -- {"title", "brand", "price", "url", "image_url", "affiliate_id"}
  
  category TEXT NOT NULL,
  match_reason TEXT, -- "Adds missing outer layer for winter style"
  match_score FLOAT CHECK (match_score >= 0 AND match_score <= 1),
  priority INTEGER DEFAULT 1, -- 1=highest priority
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Style taxonomy (system-defined styles)
CREATE TABLE style_taxonomy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL, -- "minimalist", "streetwear", etc.
  description TEXT,
  required_categories JSONB, -- ["top", "bottom"] 
  preferred_attributes JSONB, -- {"colors": ["neutral"], "patterns": ["solid"]}
  attribute_weights JSONB, -- {"fit": 0.3, "color": 0.4, "material": 0.3}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log for costs and debugging
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id UUID REFERENCES outfits(id),
  event_type TEXT NOT NULL, -- "ai_call", "face_blur", "scoring"
  details JSONB, -- API response, tokens used, duration, etc.
  cost_cents INTEGER, -- Track costs in cents
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_outfits_user_id ON outfits(user_id);
CREATE INDEX idx_outfit_items_outfit_id ON outfit_items(outfit_id);
CREATE INDEX idx_closet_items_user_id ON closet_items(user_id);
CREATE INDEX idx_recommendations_outfit_id ON recommendations(outfit_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE closet_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own closet" ON closet_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own outfits" ON outfits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view related outfit items" ON outfit_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM outfits WHERE outfits.id = outfit_items.outfit_id AND outfits.user_id = auth.uid())
);
CREATE POLICY "Users can view related scores" ON outfit_scores FOR SELECT USING (
  EXISTS (SELECT 1 FROM outfits WHERE outfits.id = outfit_scores.outfit_id AND outfits.user_id = auth.uid())
);
CREATE POLICY "Users can view related recommendations" ON recommendations FOR SELECT USING (
  EXISTS (SELECT 1 FROM outfits WHERE outfits.id = recommendations.outfit_id AND outfits.user_id = auth.uid())
);
```

---

## 🤖 AI Integration Specifications

### OpenAI Vision Prompt Template

```typescript
const OUTFIT_PARSING_PROMPT = `
Analyze this outfit photo and return ONLY valid JSON matching this exact schema:

{
  "image_id": string,
  "items": [
    {
      "item_id": string, // "i1", "i2", etc.
      "category": string, // "top" | "bottom" | "outer" | "dress" | "shoes" | "bag" | "accessory" | "hat"
      "subcategory": string, // "t_shirt", "jeans", "sneakers", etc.
      "bbox": [number, number, number, number], // [x_min, y_min, x_max, y_max] normalized 0-1
      "confidence": number, // 0-1
      "colors": {
        "primary": string, // hex color
        "secondary": string | null,
        "palette": string[] // up to 3 hex colors
      },
      "pattern": string, // "solid" | "striped" | "floral" | "geometric" | "abstract" | "logo"
      "material": string, // "cotton" | "denim" | "leather" | "wool" | "synthetic" | "unknown"
      "attributes": string[], // ["short_sleeve", "crew_neck", "fitted", "distressed", etc.]
      "description": string, // Brief description
      "brand_guess": string | null // If identifiable
    }
  ],
  "overall_style_tags": string[], // ["casual", "trendy", "minimalist", etc.]
  "quality_assessment": {
    "lighting": "good" | "poor" | "moderate",
    "clarity": "sharp" | "blurry" | "moderate", 
    "completeness": "full_outfit" | "partial" | "single_item"
  }
}

Requirements:
- Only include clearly visible clothing/accessory items
- Use null for uncertain values, don't guess
- Set confidence < 0.7 if unsure about any attribute
- Colors must be valid hex codes
- Bbox coordinates must be normalized (0-1)
- No additional text outside JSON

Examples:
Good: {"image_id": "img1", "items": [{"item_id": "i1", ...}], ...}
Bad: Here is the analysis: {"image_id": ...}
`.trim();

// Cost-optimized API call
const callOpenAIVision = async (imageUrl: string): Promise<OutfitParseResult> => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", // Cost-effective for MVP
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: OUTFIT_PARSING_PROMPT },
          { 
            type: "image_url", 
            image_url: { 
              url: imageUrl,
              detail: "low" // Lower cost, sufficient for most cases
            }
          }
        ]
      }
    ],
    max_tokens: 1000,
    temperature: 0.1 // Consistent results
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No content in OpenAI response');

  return JSON.parse(content);
};
```

### JSON Schema Validation

```typescript
// shared/schemas/outfit-schema.ts
import Joi from 'joi';

export const OutfitParseSchema = Joi.object({
  image_id: Joi.string().required(),
  items: Joi.array().items(
    Joi.object({
      item_id: Joi.string().required(),
      category: Joi.string().valid('top', 'bottom', 'outer', 'dress', 'shoes', 'bag', 'accessory', 'hat').required(),
      subcategory: Joi.string().allow(null),
      bbox: Joi.array().items(Joi.number().min(0).max(1)).length(4).required(),
      confidence: Joi.number().min(0).max(1).required(),
      colors: Joi.object({
        primary: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/),
        secondary: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).allow(null),
        palette: Joi.array().items(Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/)).max(3)
      }).required(),
      pattern: Joi.string().allow(null),
      material: Joi.string().allow(null),
      attributes: Joi.array().items(Joi.string()),
      description: Joi.string().required(),
      brand_guess: Joi.string().allow(null)
    })
  ).required(),
  overall_style_tags: Joi.array().items(Joi.string()),
  quality_assessment: Joi.object({
    lighting: Joi.string().valid('good', 'poor', 'moderate').required(),
    clarity: Joi.string().valid('sharp', 'blurry', 'moderate').required(),
    completeness: Joi.string().valid('full_outfit', 'partial', 'single_item').required()
  }).required()
});
```

---

## 🎯 Style Scoring Engine

### MVP Style Taxonomy (Core 6 Styles)

```typescript
// MVP subset - focused and manageable
const MVP_STYLES = [
  'minimalist',      // Clean, simple, neutral colors
  'casual',          // Everyday comfortable wear
  'business_casual', // Work/professional wear
  'streetwear',      // Urban, trendy, bold
  'dressy',          // Special occasions, elevated
  'athletic'         // Athleisure, workout gear
] as const;

// Personal style mapping examples (simple MVP version)
const PERSONAL_STYLE_MAPPINGS = {
  'chic': { 
    minimalist: 0.4, 
    business_casual: 0.4, 
    dressy: 0.2 
  },
  'parisian': { 
    minimalist: 0.3, 
    dressy: 0.4, 
    business_casual: 0.3 
  },
  'edgy': {
    streetwear: 0.6,
    casual: 0.3,
    dressy: 0.1
  }
  // Users can create custom mappings through UI
};
```

### Core Algorithm

```typescript
// shared/utils/scoring-engine.ts

interface ScoringWeights {
  categoryBalance: number; // 40% - Having complete outfit pieces
  styleAlignment: number;  // 30% - Matching personal style preferences  
  colorHarmony: number;    // 20% - Color coordination
  confidenceAdjustment: number; // 10% - AI detection confidence
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  categoryBalance: 0.4,
  styleAlignment: 0.3,
  colorHarmony: 0.2,
  confidenceAdjustment: 0.1
};

export const calculateOutfitScore = async (
  outfitItems: OutfitItem[],
  userProfile: UserProfile,
  styleTaxonomy: StyleTaxonomy[]
): Promise<ScoringResult> => {
  
  // 1. Category Balance Score (0-40 points)
  const categoryScore = calculateCategoryBalance(outfitItems, userProfile.preferred_categories);
  
  // 2. Style Alignment Score (0-30 points) 
  const styleScore = calculateStyleAlignment(outfitItems, userProfile.personal_styles, styleTaxonomy);
  
  // 3. Color Harmony Score (0-20 points)
  const colorScore = calculateColorHarmony(outfitItems);
  
  // 4. Confidence Adjustment (0-10 points)
  const confidenceScore = calculateConfidenceScore(outfitItems);
  
  const totalScore = Math.round(categoryScore + styleScore + colorScore + confidenceScore);
  
  return {
    overall_score: Math.min(100, Math.max(0, totalScore)),
    breakdown: {
      category_balance: Math.round(categoryScore),
      style_alignment: Math.round(styleScore), 
      color_harmony: Math.round(colorScore),
      confidence_adjustment: Math.round(confidenceScore)
    },
    improvement_areas: identifyImprovementAreas(outfitItems, userProfile),
    persona_alignment: calculatePersonaAlignment(styleScore, userProfile.personal_styles)
  };
};

// Category balance: reward complete outfits, penalize missing essentials
const calculateCategoryBalance = (items: OutfitItem[], preferredCategories?: string[]): number => {
  const categories = new Set(items.map(item => item.category));
  const requiredCategories = ['top', 'bottom']; // Minimum for a complete outfit
  const bonusCategories = ['shoes', 'outer']; // Additional points
  
  let score = 0;
  
  // Base points for required categories
  requiredCategories.forEach(category => {
    if (categories.has(category)) score += 15; // 30 points total
  });
  
  // Bonus points for complete outfit
  bonusCategories.forEach(category => {
    if (categories.has(category)) score += 5; // 10 points total
  });
  
  return Math.min(40, score);
};

// Style alignment: match against user's personal style preferences
const calculateStyleAlignment = (
  items: OutfitItem[], 
  personalStyles: PersonalStyle[],
  taxonomy: StyleTaxonomy[]
): number => {
  if (!personalStyles?.length) return 15; // Default neutral score
  
  let totalAlignment = 0;
  
  personalStyles.forEach(personalStyle => {
    const styleScore = calculateSingleStyleAlignment(items, personalStyle, taxonomy);
    const weight = personalStyle.weight || 1;
    totalAlignment += styleScore * weight;
  });
  
  return Math.min(30, totalAlignment / personalStyles.length * 30);
};

// Color harmony: analyze color coordination
const calculateColorHarmony = (items: OutfitItem[]): number => {
  const colors = items.flatMap(item => [
    item.colors.primary,
    ...(item.colors.palette || [])
  ]).filter(Boolean);
  
  if (colors.length < 2) return 10; // Single color gets neutral score
  
  // Simple harmony rules (can be enhanced)
  const harmonyScore = analyzeColorHarmony(colors);
  return Math.round(harmonyScore * 20);
};

// Confidence adjustment based on AI detection confidence
const calculateConfidenceScore = (items: OutfitItem[]): number => {
  const avgConfidence = items.reduce((sum, item) => sum + item.confidence, 0) / items.length;
  return Math.round(avgConfidence * 10);
};
```

### Two-Tier Recommendation Engine (MVP Strategy)

```typescript
// services/recommendation-service.ts

export const generateRecommendations = async (
  outfitId: string,
  scoringResult: ScoringResult,
  userCloset: ClosetItem[],
  userProfile: UserProfile
): Promise<Recommendation[]> => {
  
  const recommendations: Recommendation[] = [];
  const improvementAreas = scoringResult.improvement_areas;
  
  for (const area of improvementAreas) {
    // Tier 1: ALWAYS check user's closet first (closet overrides affiliate)
    const closetRecommendations = findClosetRecommendations(area, userCloset, userProfile);
    
    if (closetRecommendations.length > 0) {
      // Found items in closet - use those exclusively
      recommendations.push(...closetRecommendations);
    } else {
      // No closet items - check if user owns item through smart questioning
      const questionPrompt = generateOwnershipQuestion(area);
      recommendations.push({
        type: 'ownership_question',
        question: questionPrompt,
        improvement_area: area,
        quick_add_template: createQuickAddTemplate(area),
        priority: 1
      });
      
      // Also provide affiliate suggestions as backup
      const affiliateRecommendations = await findAffiliateRecommendations(area, userProfile);
      recommendations.push(...affiliateRecommendations.map(rec => ({...rec, priority: 2})));
    }
  }
  
  // Sort: Closet items first, questions second, affiliate last
  return recommendations
    .sort((a, b) => (a.priority - b.priority) || (b.match_score - a.match_score))
    .slice(0, 5);
};

const findClosetRecommendations = (
  improvementArea: string,
  closet: ClosetItem[],
  profile: UserProfile  
): Recommendation[] => {
  
  const recommendations: Recommendation[] = [];
  
  // Example: if missing outer layer, find jackets/coats in closet
  if (improvementArea === 'missing_outer') {
    const outerItems = closet.filter(item => 
      item.category === 'outer' && 
      isSeasonAppropriate(item, getCurrentSeason())
    );
    
    outerItems.forEach(item => {
      recommendations.push({
        type: 'closet_item',
        closet_item_id: item.id,
        category: item.category,
        match_reason: `Add your ${item.name} for a complete layered look`,
        match_score: calculateClosetItemMatch(item, improvementArea, profile),
        priority: 1
      });
    });
  }
  
  return recommendations;
};

// Progressive closet building through smart questions
const generateOwnershipQuestion = (improvementArea: string): string => {
  const questionMap = {
    'missing_outer': 'Do you own a jacket, blazer, or cardigan that would work with this outfit?',
    'missing_shoes': 'Do you have shoes that would complement this look?',
    'color_clash': 'Do you own a similar item in a more coordinating color?',
    'missing_accessory': 'Do you have a belt, bag, or jewelry that could enhance this outfit?'
  };
  
  return questionMap[improvementArea] || `Do you own items that could improve the ${improvementArea} aspect?`;
};

// Simple closet item creation (Option A - minimal friction)
const createQuickAddTemplate = (improvementArea: string) => ({
  category: getCategoryFromArea(improvementArea),
  fields: [
    { name: 'name', type: 'text', placeholder: 'e.g. Black leather jacket' },
    { name: 'primary_color', type: 'color_picker', placeholder: 'Primary color' },
    { name: 'tags', type: 'tag_input', placeholder: 'casual, work, formal' }
  ],
  optional_fields: ['brand', 'size', 'photo'] // Can be added later
});

// MVP: Mock affiliate recommendations (generic structure)
const findAffiliateRecommendations = async (
  improvementArea: string,
  profile: UserProfile
): Promise<Recommendation[]> => {
  
  // Generic mock data structure (not tied to specific affiliate APIs)
  const mockProducts = await getMockProductRecommendations(improvementArea, profile);
  
  return mockProducts.map(product => ({
    type: 'affiliate_product',
    product_data: {
      title: product.title,
      category: product.category,
      price: product.price,
      image_url: product.image_url,
      generic_url: product.url, // Generic for MVP
      description: product.description
    },
    match_reason: product.match_reason,
    match_score: product.match_score,
    priority: 2 // Always lower priority than closet items
  }));
};
```

---

## 🔒 Privacy & Face Blurring (MVP Decision: Server-Side)

### Why Server-Side for MVP?
- **Development Speed**: Days vs weeks of native platform work
- **Consistency**: Same results across all devices
- **Reliability**: No dependency on device capabilities
- **Zero Bug Tolerance**: Single implementation to test/debug
- **Privacy Trade-off**: 5-minute temporary processing vs permanent local storage

### Server-Side Face Blurring (Supabase Edge Function)

```typescript
// supabase/functions/blur-face/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Using MediaPipe for face detection in serverless environment
import { FaceDetection } from 'https://esm.sh/@mediapipe/face_detection@0.4.1646424915'

serve(async (req) => {
  try {
    const { image_path, user_id, blur_level = 15 } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // 1. Download image from private bucket
    const { data: imageData, error: downloadError } = await supabase.storage
      .from('private-uploads')
      .download(image_path)
    
    if (downloadError) throw downloadError
    
    // 2. Convert to buffer for processing
    const imageBuffer = await imageData.arrayBuffer()
    
    // 3. Detect faces using MediaPipe
    const faceDetection = new FaceDetection({
      modelAssetPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4.1646424915',
      minDetectionConfidence: 0.5,
      minSuppressionThreshold: 0.3
    })
    
    const faces = await detectFaces(imageBuffer, faceDetection)
    
    // 4. Apply blur to detected face regions
    const blurredImageBuffer = await applyFaceBlur(imageBuffer, faces, blur_level)
    
    // 5. Upload blurred image to display bucket (no community in MVP)
    const blurredFileName = `blurred_${Date.now()}_${image_path.split('/').pop()}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-display-images')
      .upload(`${user_id}/${blurredFileName}`, blurredImageBuffer, {
        contentType: 'image/jpeg',
        upsert: false
      })
    
    if (uploadError) throw uploadError
    
    return new Response(JSON.stringify({ 
      success: true,
      blurred_image_path: uploadData.path,
      faces_detected: faces.length 
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Face blurring error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

// Helper function to detect faces
const detectFaces = async (imageBuffer: ArrayBuffer, detector: FaceDetection) => {
  // Implementation depends on MediaPipe integration
  // Returns array of face bounding boxes
  // This is a simplified version - actual implementation would be more complex
  return []
}

// Helper function to apply Gaussian blur to face regions
const applyFaceBlur = async (imageBuffer: ArrayBuffer, faces: any[], blurLevel: number) => {
  // Use Canvas API or image processing library to blur face regions
  // Return blurred image buffer
  return imageBuffer
}
```

### Privacy Flow Implementation (MVP - No Community)

```typescript
// services/privacy-service.ts

export class PrivacyService {
  
  static async processImageWithPrivacy(
    userId: string,
    imagePath: string
  ): Promise<{original_path: string, blurred_path: string}> {
    
    // 1. Always blur faces for display
    const blurResult = await this.blurFaces(imagePath, userId)
    
    // 2. Store blurred version for user display only (no community in MVP)
    const blurredPath = blurResult.blurred_image_path
    
    // 3. Schedule original deletion after AI processing (5min max)
    await this.scheduleOriginalDeletion(imagePath, 300)
    
    return {
      original_path: imagePath,
      blurred_path: blurredPath
    }
  }
  
  static async deleteOriginalImage(imagePath: string): Promise<void> {
    const supabase = createClient(/* ... */)
    
    await supabase.storage
      .from('private-uploads')
      .remove([imagePath])
      
    console.log(`Deleted original image: ${imagePath}`)
  }
  
  static async handleUserDataDeletion(userId: string): Promise<void> {
    // GDPR compliance: delete all user data
    const supabase = createClient(/* ... */)
    
    // Delete from all tables with CASCADE
    await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)
      
    // Delete storage files
    const { data: files } = await supabase.storage
      .from('private-uploads')
      .list(`${userId}/`)
      
    if (files?.length) {
      const filePaths = files.map(f => `${userId}/${f.name}`)
      await supabase.storage.from('private-uploads').remove(filePaths)
    }
  }
}
```

---

## 🧪 Testing Strategy (Zero Bug Tolerance)

### MVP Testing Approach
- **Self-testing only** with comprehensive manual QA
- **No external beta testers** until confident in stability
- **Extensive error handling** with user-friendly messages
- **OTA updates via Expo** for immediate fixes if needed

### Unit Testing Setup

```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native
```

```json
// jest.config.js
{
  "preset": "jest-expo",
  "setupFilesAfterEnv": [
    "@testing-library/jest-native/extend-expect",
    "<rootDir>/src/test-utils/setup.ts"
  ],
  "testMatch": [
    "**/__tests__/**/*.{js,ts,tsx}",
    "**/*.(test|spec).{js,ts,tsx}"
  ],
  "collectCoverageFrom": [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/test-utils/**"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 70,
      "lines": 70,
      "statements": 70
    }
  }
}
```

### Testing Examples

```typescript
// src/utils/__tests__/scoring-engine.test.ts

import { calculateOutfitScore } from '../scoring-engine'
import { mockOutfitItems, mockUserProfile, mockStyleTaxonomy } from '../../test-utils/mocks'

describe('Scoring Engine', () => {
  
  test('should give high score for complete, well-coordinated outfit', async () => {
    const completeOutfit = [
      mockOutfitItems.whiteShirt,
      mockOutfitItems.blackJeans, 
      mockOutfitItems.whiteSneakers
    ]
    
    const result = await calculateOutfitScore(
      completeOutfit,
      mockUserProfile.minimalist,
      mockStyleTaxonomy
    )
    
    expect(result.overall_score).toBeGreaterThan(75)
    expect(result.breakdown.category_balance).toBeGreaterThan(25)
    expect(result.improvement_areas).toHaveLength(0)
  })
  
  test('should suggest outer layer for incomplete outfit', async () => {
    const incompleteOutfit = [
      mockOutfitItems.whiteShirt,
      mockOutfitItems.blackJeans
      // Missing shoes and outer layer
    ]
    
    const result = await calculateOutfitScore(
      incompleteOutfit,
      mockUserProfile.minimalist,
      mockStyleTaxonomy
    )
    
    expect(result.improvement_areas).toContain('missing_shoes')
    expect(result.overall_score).toBeLessThan(60)
  })
})

// src/components/__tests__/OutfitUpload.test.tsx

import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { OutfitUpload } from '../OutfitUpload'

describe('OutfitUpload Component', () => {
  
  test('should handle image selection and upload', async () => {
    const mockOnUpload = jest.fn()
    
    const { getByTestId } = render(
      <OutfitUpload onUpload={mockOnUpload} />
    )
    
    const uploadButton = getByTestId('upload-button')
    fireEvent.press(uploadButton)
    
    // Mock image picker response
    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          uri: expect.any(String),
          type: 'image'
        })
      )
    })
  })
  
  test('should show loading state during upload', () => {
    const { getByTestId, queryByTestId } = render(
      <OutfitUpload uploading={true} />
    )
    
    expect(getByTestId('upload-loading')).toBeTruthy()
    expect(queryByTestId('upload-button')).toBeFalsy()
  })
})
```

### Integration Testing

```typescript
// src/services/__tests__/outfit.integration.test.ts

import { supabase } from '../supabase'
import { OutfitService } from '../outfit-service'

describe('Outfit Service Integration', () => {
  
  beforeEach(async () => {
    // Setup test data
    await supabase.from('profiles').upsert(testUserProfile)
    await supabase.from('closet_items').upsert(testClosetItems)
  })
  
  afterEach(async () => {
    // Cleanup test data
    await supabase.from('outfits').delete().eq('user_id', testUserId)
  })
  
  test('should process complete outfit flow', async () => {
    // 1. Upload image
    const uploadResult = await OutfitService.uploadImage(testUserId, testImageBlob)
    expect(uploadResult.success).toBe(true)
    
    // 2. Process outfit (mocked AI response)
    const processResult = await OutfitService.processOutfit(uploadResult.outfit_id)
    expect(processResult.score).toBeGreaterThan(0)
    
    // 3. Check database state
    const { data: outfit } = await supabase
      .from('outfits')
      .select('*, outfit_items(*), outfit_scores(*)')
      .eq('id', uploadResult.outfit_id)
      .single()
      
    expect(outfit.processing_status).toBe('completed')
    expect(outfit.outfit_items).toHaveLength(3)
    expect(outfit.outfit_scores).toHaveLength(1)
  })
})
```

### Manual QA Checklist

```markdown
## MVP Gate Testing Checklist

### Gate 0: Setup & Auth
- [ ] App launches in Expo Go without errors
- [ ] User can sign up with email
- [ ] User can sign in with existing account
- [ ] Profile creation form works
- [ ] Data persists across app restarts

### Gate 1: Profile & Closet Management  
- [ ] User can add personal styles
- [ ] User can add closet items with photos
- [ ] User can edit/delete closet items
- [ ] Privacy settings can be toggled
- [ ] Profile data saves correctly

### Gate 2: Image Upload & Face Blurring
- [ ] Camera capture works on iOS/Android
- [ ] Photo library selection works
- [ ] Images upload to private storage
- [ ] Face blurring produces blurred images
- [ ] Original images are deleted after processing
- [ ] Error handling for failed uploads

### Gate 3: AI Parsing & Scoring
- [ ] Uploaded outfits are parsed by AI
- [ ] JSON validation catches malformed responses
- [ ] Outfit items appear in database
- [ ] Style scoring produces reasonable scores (0-100)
- [ ] Score breakdown shows component scores
- [ ] Low-confidence items are handled appropriately

### Gate 4: Two-Tier Recommendations
- [ ] System checks closet items first
- [ ] Closet recommendations show owned items
- [ ] Affiliate recommendations show when no closet items
- [ ] Recommendations are relevant to outfit gaps
- [ ] At least 3 recommendations per outfit
- [ ] UI displays recommendations clearly

### Gate 5: End-to-End MVP
- [ ] Complete flow: signup → upload → score → recommendations
- [ ] Processing completes within 30 seconds
- [ ] Errors are handled gracefully with user feedback
- [ ] App performance is acceptable on mid-range devices
- [ ] No crashes during normal usage

### Performance Targets
- [ ] Image upload: < 10 seconds
- [ ] AI processing: < 20 seconds  
- [ ] App startup: < 5 seconds
- [ ] Navigation: < 1 second response time
- [ ] Memory usage: < 200MB on device
```

---

## 📋 MVP Development Roadmap (8 Weeks)

### Week 0: Foundation Setup (3 days)
**Goal**: Development environment ready
- [ ] Create Supabase project and configure
- [ ] Setup Expo project with TypeScript
- [ ] Configure environment variables and secrets
- [ ] Setup Git repository and CI/CD basics
- [ ] Create initial project structure

**Success Criteria**: 
- App runs in Expo Go
- Supabase connection established
- TypeScript compilation works

---

### Week 1: Authentication & Profiles (5 days)
**Goal**: Users can create accounts and profiles
- [ ] Implement Supabase Auth integration
- [ ] Create signup/signin screens
- [ ] Build profile creation/editing UI
- [ ] Add personal style selection
- [ ] Implement basic navigation

**Success Criteria**:
- User signup/signin works end-to-end
- Profile data persists in database
- RLS policies protect user data

---

### Week 2: Closet Management (5 days) 
**Goal**: Users can manage their closet items
- [ ] Create closet item add/edit forms
- [ ] Implement image upload for closet items
- [ ] Build closet browsing UI
- [ ] Add categorization and tagging
- [ ] Enable closet item search/filter

**Success Criteria**:
- Users can add 10+ closet items
- Images upload and display correctly
- Closet browsing is intuitive

---

### Week 3: Image Upload & Processing (5 days)
**Goal**: Outfit photos can be uploaded and processed
- [ ] Implement camera/photo library integration
- [ ] Create presigned upload flow
- [ ] Build face blurring Edge Function
- [ ] Add upload progress/status UI
- [ ] Handle upload errors gracefully

**Success Criteria**:
- Images upload to private storage
- Face blurring works on test images
- Originals are deleted post-processing

---

### Week 4: AI Integration & Parsing (5 days)
**Goal**: AI can parse outfit photos into structured data
- [ ] Integrate OpenAI Vision API
- [ ] Implement JSON schema validation
- [ ] Create outfit parsing Edge Function
- [ ] Build AI response error handling
- [ ] Add retry logic for failed calls

**Success Criteria**:
- 80% of test images parse successfully
- JSON validation catches malformed responses
- Outfit items stored in database correctly

---

### Week 5: Style Scoring Engine (5 days)
**Goal**: Outfits receive meaningful scores
- [ ] Implement scoring algorithm
- [ ] Create style taxonomy data
- [ ] Build persona alignment logic
- [ ] Add score explanation generation
- [ ] Create scoring UI components

**Success Criteria**:
- Scores are consistent and logical
- Score breakdowns are helpful
- Personal styles affect scoring appropriately

---

### Week 6: Two-Tier Recommendations & Closet Building (5 days)
**Goal**: Smart closet building through ownership questions
- [ ] Build closet item matching logic (closet ALWAYS overrides)
- [ ] Create ownership questioning system
- [ ] Implement quick-add closet item flow (Option A: minimal)
- [ ] Create mock affiliate product database (generic)
- [ ] Build recommendations UI with progressive closet building

**Success Criteria**:
- Closet items recommended with 100% priority
- Ownership questions generate closet items
- Quick-add flow has minimal friction
- 3+ relevant recommendations per outfit

---

### Week 7: Integration & Polish (5 days)
**Goal**: End-to-end experience works smoothly
- [ ] Connect all features into complete flow
- [ ] Add loading states and error messages
- [ ] Implement offline handling
- [ ] Polish UI/UX based on testing
- [ ] Add analytics tracking

**Success Criteria**:
- Complete user flow works without crashes
- Error handling provides clear feedback
- UI is intuitive and responsive

---

### Week 8: Comprehensive QA & Polish (5 days)
**Goal**: Zero-bug MVP ready for personal use
- [ ] Conduct exhaustive self-testing on target devices
- [ ] Test edge cases and error conditions
- [ ] Polish UI/UX based on self-testing feedback
- [ ] Optimize performance for iPhone 11+ targets
- [ ] Prepare comprehensive error handling

**Success Criteria**:
- Complete personal workflow works flawlessly
- All error conditions handled gracefully
- Performance targets met (iPhone 11+ equivalent)
- Zero critical bugs before any external sharing

---

## 🚀 Immediate Next Steps (MVP-Focused)

### Priority 1: Environment Setup (Expo Managed)
```bash
# 1. Initialize Supabase project
supabase init looksy-mvp
supabase start

# 2. Create Expo project (managed workflow for speed)
npx create-expo-app@latest looksy-mobile --template blank-typescript

# 3. Install core dependencies
cd looksy-mobile
npm install @supabase/supabase-js expo-camera expo-image-picker
npm install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context
```

### Priority 2: Database Schema (MVP Subset)
```sql
-- Run in Supabase SQL editor
-- Start with core tables only (users, profiles, outfits, closet_items)
-- Copy the complete schema from the Database section above
-- Focus on closet-first recommendation tables
```

### Priority 3: Basic Navigation Structure (Personal App)
```typescript
// mobile/src/navigation/AppNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack'

const Stack = createNativeStackNavigator()

export const AppNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="Auth" component={AuthScreen} />
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Upload" component={UploadScreen} />
    <Stack.Screen name="Results" component={ResultsScreen} />
    <Stack.Screen name="Closet" component={ClosetScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    {/* No community screens in MVP */}
  </Stack.Navigator>
)
```

---

## 💰 Cost Management

### OpenAI Vision Costs (MVP Scale)
- **Model**: GPT-4o-mini (cost-effective)
- **Resolution**: Low-detail mode ($0.001695 per image)
- **Expected Usage**: 1,000 images/month during MVP
- **Monthly Cost**: ~$1.70 for AI processing

### Supabase Costs
- **Free Tier**: 500MB database, 1GB file storage
- **Pro Tier**: $25/month when scaling beyond free tier
- **Expected**: Free tier sufficient for MVP testing

### Total MVP Costs (Within Budget)
- **Development**: $0-25/month (free tiers, personal use)
- **Self-Testing**: $25-50/month (limited usage)
- **Initial Personal Use**: $50-100/month (before any sharing)
- **Budget Confirmed**: ✅ All within your $50-200/month expectations

---

## 📖 Additional Resources

### Documentation Links
- [Expo Documentation](https://docs.expo.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI Vision API](https://platform.openai.com/docs/guides/vision)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)

### Code Examples Repository
All code examples and templates will be maintained in:
```
docs/examples/
├── edge-functions/
├── mobile-components/
├── database-queries/
└── testing-templates/
```

### Support & Questions
For development questions or issues:
1. Check this CLAUDE.md guide first
2. Review relevant documentation links
3. Test with minimal reproducible examples
4. Document solutions back into this guide

---

---

## 📋 MVP Decision Summary

### ✅ Confirmed Decisions
- **Mobile**: Expo Managed Workflow (rapid iteration + OTA updates)
- **Privacy**: Server-side face blurring (5min processing → deletion)  
- **Styles**: Core 6 taxonomy subset (minimalist, casual, business_casual, streetwear, dressy, athletic)
- **Recommendations**: Closet ALWAYS overrides affiliate suggestions
- **Closet Building**: Smart questioning + quick-add (Option A: minimal friction)
- **Community**: None in MVP (personal use only)
- **Commerce**: Generic mock data (not tied to specific affiliates)
- **Testing**: Self-testing only with zero bug tolerance
- **Devices**: iPhone 11+ / equivalent Android targets
- **Budget**: $50-200/month confirmed acceptable

### 🎯 MVP Success Metrics
- Complete personal outfit scoring workflow
- Progressive closet inventory building
- Zero critical bugs in core functionality
- 30-second max processing time (flexible)
- Intuitive UI requiring no explanation

---

**Ready to build your personal style coach! 👗✨**

*Last updated: September 2025 - MVP Refined Edition*