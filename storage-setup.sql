-- Looksy Storage Buckets Setup
-- IMPORTANT: Create buckets via Supabase Dashboard Storage section instead of SQL
-- Then run only the policies below in SQL Editor

-- Storage policies for private uploads bucket
CREATE POLICY "Users can upload own images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'private-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'private-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'private-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for user display images bucket
CREATE POLICY "Users can view own display images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user-display-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can insert own display images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-display-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);