-- Create storage bucket for buddy chat media (images and voice messages)
INSERT INTO storage.buckets (id, name, public)
VALUES ('buddy-chat-media', 'buddy-chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload buddy chat media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'buddy-chat-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access
CREATE POLICY "Buddy chat media is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'buddy-chat-media');

-- Allow users to delete their own media
CREATE POLICY "Users can delete their own buddy chat media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'buddy-chat-media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);