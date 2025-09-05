-- Clinical Analysis Database Schema Extensions
-- This adds support for detailed garment detection, closet management, and clinical analysis

-- Extend outfit_scores table to support 1-100 scoring and sub-scores
DO $$
BEGIN
    -- Update score constraints to support 1-100 range instead of 0-10
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='outfit_scores' AND column_name='overall_score') THEN
        ALTER TABLE outfit_scores DROP CONSTRAINT IF EXISTS outfit_scores_overall_score_check;
        ALTER TABLE outfit_scores ADD CONSTRAINT outfit_scores_overall_score_check CHECK (overall_score >= 0 AND overall_score <= 100);
        
        ALTER TABLE outfit_scores DROP CONSTRAINT IF EXISTS outfit_scores_style_score_check;
        ALTER TABLE outfit_scores DROP CONSTRAINT IF EXISTS outfit_scores_fit_score_check;
        ALTER TABLE outfit_scores DROP CONSTRAINT IF EXISTS outfit_scores_color_score_check;
        ALTER TABLE outfit_scores DROP CONSTRAINT IF EXISTS outfit_scores_occasion_score_check;
    END IF;

    -- Add clinical sub-scores column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='outfit_scores' AND column_name='sub_scores') THEN
        ALTER TABLE outfit_scores ADD COLUMN sub_scores JSONB;
    END IF;
    
    -- Add analysis completeness and confidence flags
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='outfit_scores' AND column_name='analysis_completeness') THEN
        ALTER TABLE outfit_scores ADD COLUMN analysis_completeness INTEGER DEFAULT 100 CHECK (analysis_completeness >= 0 AND analysis_completeness <= 100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='outfit_scores' AND column_name='confidence_flags') THEN
        ALTER TABLE outfit_scores ADD COLUMN confidence_flags TEXT[];
    END IF;
END $$;

-- Create garment_detection table for detailed item analysis
CREATE TABLE IF NOT EXISTS garment_detection (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    outfit_id UUID REFERENCES outfits(id) ON DELETE CASCADE,
    item_id VARCHAR(100) NOT NULL, -- AI-generated item identifier
    category VARCHAR(50) NOT NULL, -- top, bottom, shoes, accessory, etc.
    
    -- Garment attributes
    fit_assessment VARCHAR(100),
    color VARCHAR(50),
    pattern VARCHAR(50),
    material VARCHAR(50),
    length VARCHAR(50),
    sleeve_length VARCHAR(50),
    neckline VARCHAR(50),
    waistline VARCHAR(50),
    hem_treatment VARCHAR(50),
    layer_order INTEGER,
    
    -- Confidence scores for each attribute (0.0 to 1.0)
    confidence_scores JSONB,
    
    -- Full attributes JSON for flexibility
    all_attributes JSONB,
    
    UNIQUE(outfit_id, item_id)
);

-- Create outfit_assessment table for detailed style analysis
CREATE TABLE IF NOT EXISTS outfit_assessment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    outfit_id UUID REFERENCES outfits(id) ON DELETE CASCADE UNIQUE,
    
    -- Proportions analysis
    top_length_ratio DECIMAL(5,3),
    silhouette_shape VARCHAR(100),
    
    -- Layering analysis
    weight_order TEXT[],
    hem_order TEXT[],
    
    -- Color analysis
    color_palette TEXT[],
    color_scheme VARCHAR(50),
    color_outliers TEXT[],
    
    -- Formality assessment
    formality_score INTEGER CHECK (formality_score >= 0 AND formality_score <= 100),
    formality_reasoning TEXT,
    
    -- Micro-adjustments
    tuck_status VARCHAR(100),
    sleeve_adjustments VARCHAR(100),
    cuff_adjustments VARCHAR(100),
    
    -- Full assessment JSON
    full_assessment JSONB
);

-- Create closet_items table for user's wardrobe
CREATE TABLE IF NOT EXISTS closet_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(50),
    
    -- Basic attributes
    color VARCHAR(50),
    pattern VARCHAR(50),
    material VARCHAR(50),
    brand VARCHAR(100),
    size VARCHAR(20),
    
    -- Style attributes
    style_tags TEXT[],
    formality_level INTEGER CHECK (formality_level >= 0 AND formality_level <= 100),
    season_tags TEXT[], -- spring, summer, fall, winter
    
    -- Detection confidence when auto-detected from photos
    detection_confidence DECIMAL(3,2), -- 0.0 to 1.0
    
    -- Source of the item (manual, photo_detection, purchase_link)
    source VARCHAR(50) DEFAULT 'manual',
    
    -- Physical condition and notes
    condition VARCHAR(50) DEFAULT 'good', -- excellent, good, fair, poor
    notes TEXT,
    
    -- Full attributes JSON for flexibility
    all_attributes JSONB,
    
    -- Images of the item
    image_paths TEXT[]
);

-- Create outfit_recommendations table for AI suggestions
CREATE TABLE IF NOT EXISTS outfit_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    outfit_id UUID REFERENCES outfits(id) ON DELETE CASCADE,
    
    -- Types: minor_adjustment, closet_item, new_purchase
    recommendation_type VARCHAR(50) NOT NULL,
    
    -- For minor adjustments
    adjustment_description TEXT,
    
    -- For closet recommendations  
    closet_item_id UUID REFERENCES closet_items(id) ON DELETE SET NULL,
    
    -- For new purchase suggestions
    item_category VARCHAR(50),
    item_description TEXT,
    estimated_price_range VARCHAR(50),
    
    -- AI confidence in this recommendation
    confidence DECIMAL(3,2),
    
    -- User feedback on recommendation
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    user_notes TEXT,
    
    -- Full recommendation data
    full_recommendation JSONB
);

-- Create closet_item_detections table to link detected items to closet
CREATE TABLE IF NOT EXISTS closet_item_detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    garment_detection_id UUID REFERENCES garment_detection(id) ON DELETE CASCADE,
    closet_item_id UUID REFERENCES closet_items(id) ON DELETE CASCADE,
    
    -- Confidence that the detected garment matches this closet item
    match_confidence DECIMAL(3,2),
    
    -- User confirmation status
    user_confirmed BOOLEAN DEFAULT FALSE,
    user_rejected BOOLEAN DEFAULT FALSE,
    
    UNIQUE(garment_detection_id, closet_item_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_garment_detection_outfit_id ON garment_detection(outfit_id);
CREATE INDEX IF NOT EXISTS idx_garment_detection_category ON garment_detection(category);

CREATE INDEX IF NOT EXISTS idx_outfit_assessment_outfit_id ON outfit_assessment(outfit_id);

CREATE INDEX IF NOT EXISTS idx_closet_items_user_id ON closet_items(user_id);
CREATE INDEX IF NOT EXISTS idx_closet_items_category ON closet_items(category);

CREATE INDEX IF NOT EXISTS idx_outfit_recommendations_outfit_id ON outfit_recommendations(outfit_id);
CREATE INDEX IF NOT EXISTS idx_outfit_recommendations_type ON outfit_recommendations(recommendation_type);

CREATE INDEX IF NOT EXISTS idx_closet_item_detections_garment ON closet_item_detections(garment_detection_id);
CREATE INDEX IF NOT EXISTS idx_closet_item_detections_closet ON closet_item_detections(closet_item_id);

-- Enable RLS on all new tables
ALTER TABLE garment_detection ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_assessment ENABLE ROW LEVEL SECURITY;
ALTER TABLE closet_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE closet_item_detections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for garment_detection
DROP POLICY IF EXISTS "Users can view their outfit detections" ON garment_detection;
CREATE POLICY "Users can view their outfit detections" ON garment_detection
    FOR SELECT USING (
        outfit_id IN (SELECT id FROM outfits WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Service role can manage all detections" ON garment_detection;
CREATE POLICY "Service role can manage all detections" ON garment_detection
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for outfit_assessment  
DROP POLICY IF EXISTS "Users can view their outfit assessments" ON outfit_assessment;
CREATE POLICY "Users can view their outfit assessments" ON outfit_assessment
    FOR SELECT USING (
        outfit_id IN (SELECT id FROM outfits WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Service role can manage all assessments" ON outfit_assessment;
CREATE POLICY "Service role can manage all assessments" ON outfit_assessment
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for closet_items
DROP POLICY IF EXISTS "Users can manage their closet" ON closet_items;
CREATE POLICY "Users can manage their closet" ON closet_items
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for outfit_recommendations
DROP POLICY IF EXISTS "Users can view their recommendations" ON outfit_recommendations;
CREATE POLICY "Users can view their recommendations" ON outfit_recommendations
    FOR SELECT USING (
        outfit_id IN (SELECT id FROM outfits WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can update their recommendation feedback" ON outfit_recommendations;
CREATE POLICY "Users can update their recommendation feedback" ON outfit_recommendations
    FOR UPDATE USING (
        outfit_id IN (SELECT id FROM outfits WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Service role can manage all recommendations" ON outfit_recommendations;
CREATE POLICY "Service role can manage all recommendations" ON outfit_recommendations
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for closet_item_detections
DROP POLICY IF EXISTS "Users can view their closet detections" ON closet_item_detections;
CREATE POLICY "Users can view their closet detections" ON closet_item_detections
    FOR SELECT USING (
        closet_item_id IN (SELECT id FROM closet_items WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can confirm their closet detections" ON closet_item_detections;
CREATE POLICY "Users can confirm their closet detections" ON closet_item_detections
    FOR UPDATE USING (
        closet_item_id IN (SELECT id FROM closet_items WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Service role can manage all closet detections" ON closet_item_detections;
CREATE POLICY "Service role can manage all closet detections" ON closet_item_detections
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create trigger to update closet_items updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_closet_items_updated_at ON closet_items;
CREATE TRIGGER update_closet_items_updated_at 
    BEFORE UPDATE ON closet_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();