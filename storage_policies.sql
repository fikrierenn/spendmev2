-- =====================================================
-- STORAGE GÜVENLİK POLİTİKALARI
-- =====================================================

-- Avatars bucket için RLS politikaları
CREATE POLICY "Avatar public access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars' AND auth.role() = 'anon');

CREATE POLICY "Avatar authenticated upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Avatar authenticated update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Avatar authenticated delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND 
  auth.role() = 'authenticated' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Bucket oluştur (eğer yoksa)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket ayarlarını güncelle
UPDATE storage.buckets
SET public = true
WHERE id = 'avatars';