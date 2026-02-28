
-- Admin-managed list of sports available for player profiles
CREATE TABLE public.player_sports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.player_sports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view player sports" ON public.player_sports FOR SELECT USING (true);
CREATE POLICY "Admins can insert player sports" ON public.player_sports FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update player sports" ON public.player_sports FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete player sports" ON public.player_sports FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin-managed skill level options
CREATE TABLE public.player_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.player_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view player levels" ON public.player_levels FOR SELECT USING (true);
CREATE POLICY "Admins can insert player levels" ON public.player_levels FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update player levels" ON public.player_levels FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete player levels" ON public.player_levels FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- User selections: top 3 sports with level for each
CREATE TABLE public.player_selections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sport_id uuid NOT NULL REFERENCES public.player_sports(id) ON DELETE CASCADE,
  level_id uuid NOT NULL REFERENCES public.player_levels(id) ON DELETE CASCADE,
  rank integer NOT NULL CHECK (rank >= 1 AND rank <= 3),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, rank),
  UNIQUE(user_id, sport_id)
);
ALTER TABLE public.player_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own selections" ON public.player_selections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own selections" ON public.player_selections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own selections" ON public.player_selections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own selections" ON public.player_selections FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all selections" ON public.player_selections FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default levels
INSERT INTO public.player_levels (label, display_order) VALUES
  ('Chill.. I''m still learning', 1),
  ('I''m not the best but watch out tho', 2),
  ('Don''t you dare challenge me', 3);
