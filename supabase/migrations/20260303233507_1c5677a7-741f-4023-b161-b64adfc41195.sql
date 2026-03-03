
-- Add location_id column to club_activity_prices
ALTER TABLE public.club_activity_prices
ADD COLUMN location_id uuid REFERENCES public.club_locations(id) ON DELETE CASCADE;

-- Drop old unique constraint
ALTER TABLE public.club_activity_prices
DROP CONSTRAINT IF EXISTS club_activity_prices_club_id_activity_slug_price_label_key;

-- Add new unique constraint including location_id
ALTER TABLE public.club_activity_prices
ADD CONSTRAINT club_activity_prices_club_activity_location_label_key
UNIQUE(club_id, activity_slug, location_id, price_label);
