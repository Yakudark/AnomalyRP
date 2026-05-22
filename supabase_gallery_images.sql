CREATE TABLE IF NOT EXISTS gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  alt_text TEXT,
  object_position_x INTEGER DEFAULT 50 NOT NULL,
  object_position_y INTEGER DEFAULT 50 NOT NULL,
  is_visible BOOLEAN DEFAULT true NOT NULL,
  order_index INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS gallery_images_visible_order_idx
ON gallery_images (is_visible, order_index, created_at);

ALTER TABLE gallery_images
ADD COLUMN IF NOT EXISTS object_position_x INTEGER DEFAULT 50 NOT NULL;

ALTER TABLE gallery_images
ADD COLUMN IF NOT EXISTS object_position_y INTEGER DEFAULT 50 NOT NULL;
