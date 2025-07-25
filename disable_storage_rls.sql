-- Disable RLS on storage.objects table
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Disable RLS on storage.buckets table
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;

-- Or if you want to enable RLS but with proper policies, use these:
-- Enable RLS
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to avatars bucket
-- CREATE POLICY "Public read access for avatars" ON storage.objects
-- FOR SELECT USING (bucket_id = 'avatars');

-- Create policy for authenticated users to upload to avatars bucket
-- CREATE POLICY "Authenticated users can upload to avatars" ON storage.objects
-- FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Create policy for users to update their own files in avatars bucket
-- CREATE POLICY "Users can update their own files in avatars" ON storage.objects
-- FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]); 