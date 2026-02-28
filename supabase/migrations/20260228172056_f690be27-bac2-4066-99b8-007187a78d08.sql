
-- Remove old constraints and foreign key from player_selections
ALTER TABLE public.player_selections DROP CONSTRAINT IF EXISTS player_selections_sport_id_fkey;
ALTER TABLE public.player_selections DROP CONSTRAINT IF EXISTS player_selections_user_id_rank_key;
ALTER TABLE public.player_selections DROP CONSTRAINT IF EXISTS player_selections_rank_check;

-- Add new foreign key to offerings
ALTER TABLE public.player_selections 
  ADD CONSTRAINT player_selections_sport_id_fkey 
  FOREIGN KEY (sport_id) REFERENCES public.offerings(id) ON DELETE CASCADE;

-- Drop the player_sports table (no longer needed)
DROP TABLE IF EXISTS public.player_sports;
