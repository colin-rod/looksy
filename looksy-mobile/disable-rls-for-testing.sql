-- Temporarily disable RLS for testing
-- RUN THIS ONLY FOR DEVELOPMENT/TESTING

-- Disable RLS on photo extraction tables
ALTER TABLE photo_extractions DISABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_items DISABLE ROW LEVEL SECURITY;

-- Disable RLS on storage (if needed)
-- Note: You may need to also adjust storage policies in Supabase dashboard

-- TO RE-ENABLE RLS LATER:
-- ALTER TABLE photo_extractions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE extracted_items ENABLE ROW LEVEL SECURITY;