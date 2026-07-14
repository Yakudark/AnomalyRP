-- Apply this migration to an existing Supabase project to enable animated GIF uploads.
UPDATE storage.buckets
SET
    public = true,
    file_size_limit = 20971520,
    allowed_mime_types = ARRAY['image/gif', 'image/jpeg', 'image/png', 'image/webp']
WHERE id = 'site-images';
