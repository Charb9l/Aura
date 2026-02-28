
-- Add location_id to player_selections for matchmaking
ALTER TABLE public.player_selections 
ADD COLUMN location_id uuid REFERENCES public.club_locations(id) ON DELETE SET NULL;
