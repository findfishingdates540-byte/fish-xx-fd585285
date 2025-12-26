-- Create storage bucket for spot photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('spot-photos', 'spot-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for spot-photos bucket
CREATE POLICY "Anyone can view spot photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'spot-photos');

CREATE POLICY "Authenticated users can upload spot photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'spot-photos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own spot photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'spot-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own spot photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'spot-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);