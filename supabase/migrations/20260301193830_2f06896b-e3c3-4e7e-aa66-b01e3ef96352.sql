
-- Table to persist badge point assignments from habit tracker levels
CREATE TABLE public.badge_point_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  badge_level INTEGER NOT NULL, -- 1, 2, or 3
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Each user can only assign one point per badge level
ALTER TABLE public.badge_point_assignments 
  ADD CONSTRAINT unique_user_badge_level UNIQUE (user_id, badge_level);

-- Enable RLS
ALTER TABLE public.badge_point_assignments ENABLE ROW LEVEL SECURITY;

-- Users can view their own assignments
CREATE POLICY "Users can view own badge points"
  ON public.badge_point_assignments FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own assignments
CREATE POLICY "Users can insert own badge points"
  ON public.badge_point_assignments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY "Admins can view all badge points"
  ON public.badge_point_assignments FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
