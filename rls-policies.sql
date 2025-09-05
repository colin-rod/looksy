-- Row Level Security Policies for Looksy MVP
-- Run this AFTER the main schema

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE closet_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Closet items: Users can only access their own closet
CREATE POLICY "Users can manage own closet" ON closet_items FOR ALL USING (auth.uid() = user_id);

-- Outfits: Users can only access their own outfits
CREATE POLICY "Users can manage own outfits" ON outfits FOR ALL USING (auth.uid() = user_id);

-- Outfit items: Users can only access items from their own outfits
CREATE POLICY "Users can view related outfit items" ON outfit_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM outfits WHERE outfits.id = outfit_items.outfit_id AND outfits.user_id = auth.uid())
);
CREATE POLICY "Users can insert related outfit items" ON outfit_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM outfits WHERE outfits.id = outfit_items.outfit_id AND outfits.user_id = auth.uid())
);

-- Outfit scores: Users can only access scores from their own outfits
CREATE POLICY "Users can view related scores" ON outfit_scores FOR SELECT USING (
  EXISTS (SELECT 1 FROM outfits WHERE outfits.id = outfit_scores.outfit_id AND outfits.user_id = auth.uid())
);
CREATE POLICY "Users can insert related scores" ON outfit_scores FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM outfits WHERE outfits.id = outfit_scores.outfit_id AND outfits.user_id = auth.uid())
);

-- Recommendations: Users can only access recommendations from their own outfits
CREATE POLICY "Users can view related recommendations" ON recommendations FOR SELECT USING (
  EXISTS (SELECT 1 FROM outfits WHERE outfits.id = recommendations.outfit_id AND outfits.user_id = auth.uid())
);
CREATE POLICY "Users can insert related recommendations" ON recommendations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM outfits WHERE outfits.id = recommendations.outfit_id AND outfits.user_id = auth.uid())
);

-- Audit logs: Users can only view their own logs
CREATE POLICY "Users can view own audit logs" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM outfits WHERE outfits.id = audit_logs.outfit_id AND outfits.user_id = auth.uid())
);

-- Style taxonomy and mock products: Read-only for all authenticated users
CREATE POLICY "Authenticated users can read style taxonomy" ON style_taxonomy FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read mock products" ON mock_products FOR SELECT USING (auth.role() = 'authenticated');

-- Function to handle profile creation automatically
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, privacy_settings)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    '{"share_to_community": false, "blur_faces": true}'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on profiles
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();