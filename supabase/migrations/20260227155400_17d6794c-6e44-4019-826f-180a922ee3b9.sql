
-- Add page_slug column to hero_pictures so pictures can be associated with different pages
ALTER TABLE public.hero_pictures ADD COLUMN page_slug TEXT NOT NULL DEFAULT 'home';

-- Set all existing pictures to 'home' (they are already home pictures)
-- The default handles this, but being explicit
UPDATE public.hero_pictures SET page_slug = 'home' WHERE page_slug IS NULL;

-- Create an index for efficient lookups by page
CREATE INDEX idx_hero_pictures_page_slug ON public.hero_pictures(page_slug);
