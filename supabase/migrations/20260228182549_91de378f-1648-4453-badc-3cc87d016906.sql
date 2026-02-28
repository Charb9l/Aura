
-- Add new columns to player_selections
ALTER TABLE public.player_selections
ADD COLUMN playstyle text,
ADD COLUMN availability jsonb NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN goals text[] NOT NULL DEFAULT '{}'::text[],
ADD COLUMN years_experience integer;

-- Clear existing selections (users will re-fill with the enhanced profile)
DELETE FROM public.player_selections;

-- Clear and re-seed player_levels with LVL 1-5
DELETE FROM public.player_levels;

INSERT INTO public.player_levels (label, display_order) VALUES
  ('LVL 1', 1),
  ('LVL 2', 2),
  ('LVL 3', 3),
  ('LVL 4', 4),
  ('LVL 5', 5);
