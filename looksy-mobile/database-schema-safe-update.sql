-- First, let's check the current outfits table structure
-- Run this query first to see what columns exist:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'outfits';

-- Add missing style_preferences column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS style_preferences TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add missing columns to outfits table one by one with error handling
DO $$
BEGIN
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='outfits' AND column_name='user_id') THEN
        ALTER TABLE outfits ADD COLUMN user_id UUID;
        -- Add foreign key constraint
        ALTER TABLE outfits ADD CONSTRAINT fk_outfits_user_id FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
    
    -- Add analysis_result column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='outfits' AND column_name='analysis_result') THEN
        ALTER TABLE outfits ADD COLUMN analysis_result JSONB;
    END IF;
    
    -- Add analyzed_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='outfits' AND column_name='analyzed_at') THEN
        ALTER TABLE outfits ADD COLUMN analyzed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Update existing outfit records to have user_id (if they don't already)
-- This is a temporary fix - you may need to adjust based on your data
UPDATE outfits 
SET user_id = (
    SELECT id FROM profiles 
    WHERE profiles.id::text = split_part(original_image_path, '/', 1)
    LIMIT 1
)
WHERE user_id IS NULL 
AND original_image_path IS NOT NULL;

-- Create outfit_scores table if it doesn't exist
CREATE TABLE IF NOT EXISTS outfit_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  outfit_id UUID REFERENCES outfits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  overall_score DECIMAL(3,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 10),
  style_score DECIMAL(3,2) NOT NULL CHECK (style_score >= 0 AND style_score <= 10),
  fit_score DECIMAL(3,2) NOT NULL CHECK (fit_score >= 0 AND fit_score <= 10),
  color_score DECIMAL(3,2) NOT NULL CHECK (color_score >= 0 AND color_score <= 10),
  occasion_score DECIMAL(3,2) NOT NULL CHECK (occasion_score >= 0 AND occasion_score <= 10),
  feedback JSONB,
  detected_items JSONB
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_outfit_scores_outfit_id ON outfit_scores(outfit_id);
CREATE INDEX IF NOT EXISTS idx_outfit_scores_user_id ON outfit_scores(user_id);

-- Enable RLS on outfit_scores
ALTER TABLE outfit_scores ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for outfit_scores
DROP POLICY IF EXISTS "Users can view their own scores" ON outfit_scores;
CREATE POLICY "Users can view their own scores" ON outfit_scores
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own scores" ON outfit_scores;  
CREATE POLICY "Users can insert their own scores" ON outfit_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all scores" ON outfit_scores;
CREATE POLICY "Service role can manage all scores" ON outfit_scores
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');