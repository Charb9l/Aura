
-- Add brand_color column to offerings (HSL string like "30 80% 55%")
ALTER TABLE public.offerings ADD COLUMN brand_color text;

-- Seed default brand colors for existing activities
UPDATE public.offerings SET brand_color = '30 80% 55%' WHERE slug = 'basketball';
UPDATE public.offerings SET brand_color = '212 70% 55%' WHERE slug = 'tennis';
UPDATE public.offerings SET brand_color = '100 22% 60%' WHERE slug = 'pilates';
UPDATE public.offerings SET brand_color = '100 22% 60%' WHERE slug = 'aerial-yoga';
UPDATE public.offerings SET brand_color = '142 50% 35%' WHERE slug = 'gym';
