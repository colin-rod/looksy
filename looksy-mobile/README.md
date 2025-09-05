# Looksy - AI-Powered Style Analysis Mobile App

**Looksy** is a React Native mobile application that provides professional-grade style analysis using OpenAI Vision API. Upload outfit photos and receive detailed feedback on fit, color harmony, styling, and personalized recommendations.

## ✨ Features

### 🤖 AI-Powered Analysis
- **Clinical Style Scoring**: 7-weighted principle system (Proportion, Fit, Color, Pattern, Layering, Formality, Footwear)
- **Real-time OpenAI Vision API Integration**: Professional fashion analysis with GPT-4o-mini
- **Comprehensive Garment Detection**: Detailed attribute extraction with confidence scoring
- **Personalized Recommendations**: User preference-driven feedback and suggestions

### 📱 Mobile Experience
- **Camera Integration**: Native photo capture with image optimization
- **Real-time Processing**: Live status updates during analysis
- **Offline-First**: Robust error handling with graceful degradation
- **Cross-Platform**: iOS and Android support via React Native

### 👔 Closet Management
- **Smart Item Detection**: Auto-populate closet from photo analysis
- **Confirmation Workflow**: User-friendly item verification process
- **Style Tracking**: Build comprehensive wardrobe database
- **Recommendation Engine**: Closet-first styling suggestions

## 🏗️ Architecture

### Frontend Stack
- **React Native** with Expo managed workflow
- **TypeScript** for type safety
- **React Navigation** for screen management
- **Supabase Client** for backend integration

### Backend Infrastructure
- **Supabase**: Authentication, database, storage, edge functions
- **PostgreSQL**: Relational database with RLS security
- **Edge Functions**: Serverless Deno runtime for AI processing
- **OpenAI Vision API**: Professional style analysis engine

### Database Schema
```sql
-- Core Tables
├── profiles (user data & preferences)
├── outfits (photo metadata & analysis results)
├── outfit_scores (detailed scoring breakdown)
├── garment_detection (AI-detected clothing items)
├── outfit_assessment (clinical style evaluation)
├── closet_items (user wardrobe management)
├── outfit_recommendations (AI suggestions)
└── closet_item_detections (item confirmation tracking)
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and npm/yarn
- **Expo CLI**: `npm install -g @expo/cli`
- **iOS Simulator** (macOS) or **Android Emulator**
- **Supabase Account** for backend services
- **OpenAI API Key** for style analysis

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd looksy-mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Configure required variables
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database setup**
   ```bash
   # Run database migrations in Supabase SQL Editor
   # Execute files in order:
   # 1. database-schema-safe-update.sql
   # 2. database-schema-clinical-analysis.sql
   ```

5. **Configure OpenAI API**
   ```bash
   # In Supabase Dashboard > Edge Functions > Secrets
   # Add: OPENAI_API_KEY=your_openai_api_key
   ```

6. **Start development server**
   ```bash
   npx expo start
   ```

## 🛠️ Development

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── ScoreBar.tsx    # Progress bar with variants
│   ├── ItemCard.tsx    # Flexible item display
│   └── FeedbackGroup.tsx # Consistent feedback sections
├── screens/            # Application screens
│   ├── HomeScreen.tsx  # Main dashboard
│   ├── UploadScreen.tsx # Photo capture/upload
│   ├── ResultsScreen.tsx # Analysis results
│   └── ClosetConfirmationScreen.tsx # Item verification
├── services/           # API integration layer
│   ├── aiService.ts    # OpenAI analysis integration
│   ├── uploadService.ts # Image upload handling
│   └── closetService.ts # Wardrobe management
├── navigation/         # Screen routing configuration
├── theme/             # Design system (colors, spacing, typography)
├── types/             # TypeScript definitions
└── utils/             # Utility functions & error handling
```

### Key Components

#### AI Service (`src/services/aiService.ts`)
```typescript
// Trigger outfit analysis
const result = await AIService.analyzeOutfit(
  outfitId, 
  imagePath, 
  userId, 
  userStylePreferences
);

// Poll for completion
const analysis = await AIService.pollForCompletion(outfitId);
```

#### Reusable Components
```typescript
// Score visualization
<ScoreBar label="Style" score={85} size="medium" />

// Item display with variants
<ItemCard 
  category="shirt" 
  attributes={{fit: "slim", color: "blue"}}
  variant="clinical" 
/>

// Feedback sections
<FeedbackGroup 
  title="✅ What's Working" 
  items={strengths} 
/>
```

### Style System
The app uses a centralized theme system for consistent styling:

```typescript
// Theme usage
import { theme, getScoreColor } from '../theme';

const styles = {
  container: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
  }
};
```

## 🧪 Testing

### Test Commands
```bash
# Run unit tests
npm test

# Run E2E tests (if configured)
npm run test:e2e

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

### Test OpenAI Integration
Use the built-in debug screen (`HomeScreen > Test OpenAI API`) to verify:
- API key configuration
- Model availability (gpt-4o-mini)
- Edge function deployment

## 📦 Deployment

### Mobile App Deployment
```bash
# Build for production
npx expo build:ios    # iOS build
npx expo build:android # Android build

# Or use EAS Build for managed workflow
npx eas build --platform ios
npx eas build --platform android
```

### Backend Deployment
Edge functions are automatically deployed to Supabase:
```bash
# Deploy edge functions
supabase functions deploy analyze-outfit
supabase functions deploy test-openai
```

## 🔧 Configuration

### Environment Variables
```bash
# Required
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Supabase Edge Functions (set in dashboard)
OPENAI_API_KEY=sk-your-openai-key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### OpenAI Configuration
The app uses GPT-4o-mini for optimal cost/performance balance:
- **Max Tokens**: 2000 for comprehensive analysis
- **Temperature**: 0.7 for consistent yet creative responses
- **Model**: gpt-4o-mini (vision-enabled)

## 🤝 Contributing

### Development Workflow
1. **Fork the repository** and create a feature branch
2. **Follow coding standards**: TypeScript, ESLint, Prettier
3. **Add tests** for new functionality
4. **Update documentation** for API changes
5. **Submit pull request** with detailed description

### Code Standards
- **TypeScript**: Strict type checking enabled
- **Component Architecture**: Functional components with hooks
- **Error Handling**: Comprehensive error boundaries
- **Performance**: Optimized rendering with useMemo/useCallback
- **Accessibility**: WCAG 2.1 compliance where applicable

## 📚 API Reference

### Core Analysis Flow
```typescript
// 1. Upload photo
const uploadResult = await UploadService.uploadOutfitImage(imageUri, userId);

// 2. Trigger analysis
const analysisResult = await AIService.analyzeOutfit(
  uploadResult.outfitId,
  uploadResult.imagePath,
  userId,
  ['minimalist', 'professional']
);

// 3. Process results
if (analysisResult.success) {
  // Display clinical analysis results
  const scores = analysisResult.analysis.sub_scores;
  const recommendations = analysisResult.analysis.recommendations;
}
```

### Clinical Analysis Response
```typescript
interface ClinicalAnalysis {
  overall_score: number;           // 1-100 overall rating
  sub_scores: {
    proportion_silhouette: number; // Body proportion analysis
    fit_technical: number;         // Garment construction quality
    color_harmony: number;         // Color coordination
    pattern_texture: number;       // Pattern/texture balance
    layering_logic: number;        // Layer weight/order
    formality_occasion: number;    // Appropriateness score
    footwear_cohesion: number;     // Shoe integration
  };
  garment_detection: GarmentDetection[]; // Individual item analysis
  recommendations: Recommendations;       // Actionable suggestions
  confidence_flags: string[];           // Analysis limitations
}
```

## 🐛 Troubleshooting

### Common Issues

#### OpenAI API Fallback
**Symptom**: Analysis shows "Using fallback analysis"
**Solution**: 
- Verify OpenAI API key in Supabase Edge Function secrets
- Check API key has sufficient credits
- Ensure gpt-4o-mini model access

#### Image Upload Failures
**Symptom**: 0-byte images in Supabase Storage
**Solution**:
- Check Supabase storage permissions
- Verify RLS policies allow authenticated uploads
- Ensure image picker permissions granted

#### Database Connection Errors
**Symptom**: "Failed to insert/update" errors
**Solution**:
- Run database migration scripts
- Check RLS policies for user permissions
- Verify Supabase connection configuration

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for the Vision API enabling professional style analysis
- **Supabase** for comprehensive backend-as-a-service platform
- **Expo** for streamlined React Native development
- **React Native Community** for excellent tooling and libraries

---

**Built with ❤️ by the Looksy Team**

For questions, feature requests, or support, please open an issue or contact us at [contact@looksy.app](mailto:contact@looksy.app).