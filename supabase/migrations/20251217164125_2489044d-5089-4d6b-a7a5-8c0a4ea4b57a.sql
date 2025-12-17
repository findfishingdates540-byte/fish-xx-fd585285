-- Create storage bucket for catch photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('catch-photos', 'catch-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload catch photos
CREATE POLICY "Users can upload catch photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'catch-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to catch photos
CREATE POLICY "Anyone can view catch photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'catch-photos');

-- Allow users to delete their own catch photos
CREATE POLICY "Users can delete own catch photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'catch-photos' AND auth.uid()::text = (storage.foldername(name))[1]);