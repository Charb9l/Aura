
-- Add location_ids array column
ALTER TABLE public.player_selections ADD COLUMN location_ids uuid[] NOT NULL DEFAULT '{}';

-- Migrate existing single location_id data
UPDATE public.player_selections 
SET location_ids = ARRAY[location_id] 
WHERE location_id IS NOT NULL;

-- Drop old column and its foreign key
ALTER TABLE public.player_selections DROP COLUMN location_id;
