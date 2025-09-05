-- Looksy MVP Database Schema - FIXED VERSION
-- Copy and paste this entire script into Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
  blurred_image_path TEXT, -- For display
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'error')),
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
  recommendation_type TEXT CHECK (recommendation_type IN ('closet_item', 'affiliate_product', 'ownership_question')),
  
  -- For closet items
  closet_item_id UUID REFERENCES closet_items(id),
  
  -- For affiliate products  
  product_data JSONB, -- {"title", "brand", "price", "url", "image_url"}
  
  -- For ownership questions
  question_text TEXT,
  improvement_area TEXT,
  
  category TEXT NOT NULL,
  match_reason TEXT, -- "Adds missing outer layer for winter style"
  match_score FLOAT CHECK (match_score >= 0 AND match_score <= 1),
  priority INTEGER DEFAULT 1, -- 1=highest priority
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Style taxonomy (MVP: 6 core styles)
CREATE TABLE style_taxonomy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL, -- "minimalist", "casual", etc.
  description TEXT,
  required_categories JSONB, -- ["top", "bottom"] 
  preferred_attributes JSONB, -- {"colors": ["neutral"], "patterns": ["solid"]}
  attribute_weights JSONB, -- {"fit": 0.3, "color": 0.4, "material": 0.3}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mock products for MVP recommendations
CREATE TABLE mock_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  brand TEXT,
  price DECIMAL(10,2),
  image_url TEXT,
  description TEXT,
  colors JSONB,
  style_tags TEXT[], -- FIXED: proper array syntax
  affiliate_url TEXT,
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

-- Insert MVP style taxonomy data (FIXED: proper JSONB syntax)
INSERT INTO style_taxonomy (name, description, required_categories, preferred_attributes, attribute_weights) VALUES
('minimalist', 'Clean, simple, neutral colors', '["top", "bottom"]', '{"colors": ["neutral", "white", "black", "gray"], "patterns": ["solid"]}', '{"fit": 0.4, "color": 0.4, "material": 0.2}'),
('casual', 'Everyday comfortable wear', '["top", "bottom"]', '{"colors": ["any"], "patterns": ["any"]}', '{"fit": 0.3, "color": 0.2, "material": 0.5}'),
('business_casual', 'Work and professional wear', '["top", "bottom", "shoes"]', '{"colors": ["neutral", "navy", "white"], "patterns": ["solid", "subtle"]}', '{"fit": 0.5, "color": 0.3, "material": 0.2}'),
('streetwear', 'Urban, trendy, bold', '["top", "bottom", "shoes"]', '{"colors": ["bold", "black", "white"], "patterns": ["graphic", "logo"]}', '{"fit": 0.2, "color": 0.4, "material": 0.4}'),
('dressy', 'Special occasions, elevated', '["top", "bottom", "shoes"]', '{"colors": ["elegant"], "patterns": ["solid", "subtle"]}', '{"fit": 0.4, "color": 0.3, "material": 0.3}'),
('athletic', 'Athleisure and workout gear', '["top", "bottom", "shoes"]', '{"colors": ["any"], "patterns": ["any"]}', '{"fit": 0.5, "color": 0.2, "material": 0.3}');

-- Insert some mock products for testing (FIXED: proper array syntax)
INSERT INTO mock_products (title, category, subcategory, brand, price, description, colors, style_tags, affiliate_url) VALUES
('Classic White Button Shirt', 'top', 'shirt', 'Uniqlo', 29.90, 'Crisp cotton button-down shirt', '{"primary": "#FFFFFF"}', ARRAY['minimalist', 'business_casual'], 'https://example.com/white-shirt'),
('Dark Wash Straight Jeans', 'bottom', 'jeans', 'Levis', 79.50, 'Classic straight-leg denim', '{"primary": "#2F4F4F"}', ARRAY['casual', 'minimalist'], 'https://example.com/jeans'),
('Black Leather Sneakers', 'shoes', 'sneakers', 'Adidas', 120.00, 'Clean leather sneakers', '{"primary": "#000000"}', ARRAY['minimalist', 'casual', 'streetwear'], 'https://example.com/sneakers'),
('Navy Blazer', 'outer', 'blazer', 'J.Crew', 198.00, 'Structured navy blazer', '{"primary": "#191970"}', ARRAY['business_casual', 'dressy'], 'https://example.com/blazer'),
('Athletic Leggings', 'bottom', 'leggings', 'Lululemon', 98.00, 'High-waisted workout leggings', '{"primary": "#000000"}', ARRAY['athletic'], 'https://example.com/leggings');