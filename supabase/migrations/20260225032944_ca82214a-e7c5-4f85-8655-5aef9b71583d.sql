
-- Create club_locations table for academy locations
CREATE TABLE public.club_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.club_locations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view club locations" ON public.club_locations FOR SELECT USING (true);
CREATE POLICY "Admins can insert club locations" ON public.club_locations FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update club locations" ON public.club_locations FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete club locations" ON public.club_locations FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
