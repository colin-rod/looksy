-- Photo Extraction and Closet Population Database Schema
-- This adds support for automated closet population from photos

-- Store original photos and their processing metadata
CREATE TABLE IF NOT EXISTS photo_extractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Image information
    original_image_path TEXT NOT NULL,
    extraction_type VARCHAR(50) DEFAULT 'outfit', -- 'outfit' or 'individual_items'
    
    -- Processing status and results
    processing_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    extracted_items_count INTEGER DEFAULT 0,
    approved_items_count INTEGER DEFAULT 0,
    
    -- AI processing metadata
    processing_metadata JSONB,
    -- Example: {
    --   "image_dimensions": {"width": 1024, "height": 768},
    --   "processing_time_ms": 5000,
    --   "ai_model_used": "gpt-4o-mini",
    --   "total_items_detected": 5,
    --   "high_confidence_items": 3,
    --   "lighting_quality": "good",
    --   "background_complexity": "moderate"
    -- }
    
    -- User interaction
    user_reviewed BOOLEAN DEFAULT FALSE,
    user_review_date TIMESTAMP WITH TIME ZONE,
    user_notes TEXT
);

-- Store individual clothing items extracted from photos
CREATE TABLE IF NOT EXISTS extracted_clothing_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    photo_extraction_id UUID REFERENCES photo_extractions(id) ON DELETE CASCADE,
    
    -- AI-generated item identifier
    item_id VARCHAR(100), -- AI-generated unique identifier within the photo
    
    -- Bounding box for item isolation (percentages 0-100)
    bounding_box JSONB NOT NULL,
    -- Example: {"x1": 20.5, "y1": 15.2, "x2": 45.8, "y2": 75.3}
    
    -- Item details from AI
    item_category VARCHAR(50) NOT NULL,
    ai_description TEXT NOT NULL,
    item_attributes JSONB,
    -- Example: {
    --   "color": "navy blue",
    --   "pattern": "solid",
    --   "material": "cotton",
    --   "brand": "estimated_brand",
    --   "size_estimate": "M",
    --   "style_tags": ["casual", "business-casual"],
    --   "formality_level": 65,
    --   "season_tags": ["spring", "summer", "fall"]
    -- }
    
    -- AI confidence scores
    confidence_scores JSONB,
    -- Example: {
    --   "detection": 0.92,
    --   "isolation": 0.85, 
    --   "attributes": 0.78
    -- }
    
    -- Overall extraction quality
    extraction_confidence DECIMAL(3,2), -- Overall 0.0-1.0 confidence
    
    -- Image processing results
    cropped_image_path TEXT, -- Path to isolated/cropped item image
    image_processing_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    
    -- User approval and feedback
    user_approved BOOLEAN DEFAULT FALSE,
    user_rejected BOOLEAN DEFAULT FALSE,
    user_edited_attributes JSONB, -- User modifications to AI attributes
    user_feedback TEXT,
    
    -- Link to created closet item (if approved)
    created_closet_item_id UUID REFERENCES closet_items(id) ON DELETE SET NULL,
    
    UNIQUE(photo_extraction_id, item_id)
);

-- Extend existing closet_items table for extraction integration
DO $$
BEGIN
    -- Add extraction source tracking if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='closet_items' AND column_name='extraction_source_id') THEN
        ALTER TABLE closet_items ADD COLUMN extraction_source_id UUID REFERENCES photo_extractions(id) ON DELETE SET NULL;
    END IF;
    
    -- Add extracted item reference if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='closet_items' AND column_name='extracted_item_id') THEN
        ALTER TABLE closet_items ADD COLUMN extracted_item_id UUID REFERENCES extracted_clothing_items(id) ON DELETE SET NULL;
    END IF;
    
    -- Add AI-generated description if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='closet_items' AND column_name='ai_description') THEN
        ALTER TABLE closet_items ADD COLUMN ai_description TEXT;
    END IF;
    
    -- Add bounding box data for reference if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='closet_items' AND column_name='extraction_metadata') THEN
        ALTER TABLE closet_items ADD COLUMN extraction_metadata JSONB;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_photo_extractions_user_id ON photo_extractions(user_id);
CREATE INDEX IF NOT EXISTS idx_photo_extractions_status ON photo_extractions(processing_status);
CREATE INDEX IF NOT EXISTS idx_photo_extractions_created_at ON photo_extractions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_extracted_items_extraction_id ON extracted_clothing_items(photo_extraction_id);
CREATE INDEX IF NOT EXISTS idx_extracted_items_category ON extracted_clothing_items(item_category);
CREATE INDEX IF NOT EXISTS idx_extracted_items_approved ON extracted_clothing_items(user_approved);
CREATE INDEX IF NOT EXISTS idx_extracted_items_confidence ON extracted_clothing_items(extraction_confidence);

-- Add index on closet_items for extraction tracking
CREATE INDEX IF NOT EXISTS idx_closet_items_extraction_source ON closet_items(extraction_source_id);
CREATE INDEX IF NOT EXISTS idx_closet_items_extracted_item ON closet_items(extracted_item_id);

-- Enable RLS on new tables
ALTER TABLE photo_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_clothing_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for photo_extractions
DROP POLICY IF EXISTS "Users can manage their photo extractions" ON photo_extractions;
CREATE POLICY "Users can manage their photo extractions" ON photo_extractions
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all photo extractions" ON photo_extractions;
CREATE POLICY "Service role can manage all photo extractions" ON photo_extractions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for extracted_clothing_items
DROP POLICY IF EXISTS "Users can view their extracted items" ON extracted_clothing_items;
CREATE POLICY "Users can view their extracted items" ON extracted_clothing_items
    FOR SELECT USING (
        photo_extraction_id IN (SELECT id FROM photo_extractions WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can update their extracted items" ON extracted_clothing_items;
CREATE POLICY "Users can update their extracted items" ON extracted_clothing_items
    FOR UPDATE USING (
        photo_extraction_id IN (SELECT id FROM photo_extractions WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Service role can manage all extracted items" ON extracted_clothing_items;
CREATE POLICY "Service role can manage all extracted items" ON extracted_clothing_items
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_photo_extractions_updated_at ON photo_extractions;
CREATE TRIGGER update_photo_extractions_updated_at 
    BEFORE UPDATE ON photo_extractions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_extracted_items_updated_at ON extracted_clothing_items;
CREATE TRIGGER update_extracted_items_updated_at 
    BEFORE UPDATE ON extracted_clothing_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for easy extraction summary
CREATE OR REPLACE VIEW extraction_summary AS
SELECT 
    pe.id,
    pe.user_id,
    pe.created_at,
    pe.processing_status,
    pe.extracted_items_count,
    pe.approved_items_count,
    pe.processing_metadata,
    COUNT(eci.id) as total_extracted_items,
    COUNT(CASE WHEN eci.user_approved = true THEN 1 END) as approved_count,
    COUNT(CASE WHEN eci.created_closet_item_id IS NOT NULL THEN 1 END) as closet_items_created,
    AVG(eci.extraction_confidence) as avg_confidence
FROM photo_extractions pe
LEFT JOIN extracted_clothing_items eci ON pe.id = eci.photo_extraction_id
GROUP BY pe.id, pe.user_id, pe.created_at, pe.processing_status, 
         pe.extracted_items_count, pe.approved_items_count, pe.processing_metadata;

-- Grant access to the view
GRANT SELECT ON extraction_summary TO authenticated, service_role;