
-- Playstyles config table
CREATE TABLE public.playstyles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  value text NOT NULL UNIQUE,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.playstyles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view playstyles" ON public.playstyles FOR SELECT USING (true);
CREATE POLICY "Admins can insert playstyles" ON public.playstyles FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update playstyles" ON public.playstyles FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete playstyles" ON public.playstyles FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default playstyles
INSERT INTO public.playstyles (label, value, display_order) VALUES
  ('Casual', 'casual', 0),
  ('Competitive', 'competitive', 1),
  ('Very Competitive', 'very_competitive', 2);

-- Goals config table
CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  value text NOT NULL UNIQUE,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view goals" ON public.goals FOR SELECT USING (true);
CREATE POLICY "Admins can insert goals" ON public.goals FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update goals" ON public.goals FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete goals" ON public.goals FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default goals
INSERT INTO public.goals (label, value, display_order) VALUES
  ('Fitness', 'fitness', 0),
  ('Competition', 'competition', 1),
  ('Social', 'social', 2),
  ('Training', 'training', 3);

-- Availability periods config table
CREATE TABLE public.availability_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  value text NOT NULL UNIQUE,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.availability_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view availability_periods" ON public.availability_periods FOR SELECT USING (true);
CREATE POLICY "Admins can insert availability_periods" ON public.availability_periods FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update availability_periods" ON public.availability_periods FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete availability_periods" ON public.availability_periods FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default periods
INSERT INTO public.availability_periods (label, value, display_order) VALUES
  ('Morning', 'morning', 0),
  ('Afternoon', 'afternoon', 1),
  ('Night', 'night', 2);
