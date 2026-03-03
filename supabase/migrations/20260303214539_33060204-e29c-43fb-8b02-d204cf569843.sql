
-- Add activity column to club_locations to associate each location with a specific activity
ALTER TABLE public.club_locations ADD COLUMN activity text;

-- Update existing locations to have a default activity value (null means club-wide, legacy)
COMMENT ON COLUMN public.club_locations.activity IS 'The activity this location belongs to (e.g. Tennis, Basketball Academy). NULL for legacy club-wide locations.';
