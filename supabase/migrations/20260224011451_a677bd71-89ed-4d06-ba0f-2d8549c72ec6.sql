
-- Create offerings table
CREATE TABLE public.offerings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.offerings ENABLE ROW LEVEL SECURITY;

-- Anyone can view offerings (needed for booking page)
CREATE POLICY "Anyone can view offerings"
  ON public.offerings FOR SELECT
  USING (true);

-- Admins can manage offerings
CREATE POLICY "Admins can insert offerings"
  ON public.offerings FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update offerings"
  ON public.offerings FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete offerings"
  ON public.offerings FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for offering logos
INSERT INTO storage.buckets (id, name, public) VALUES ('offering-logos', 'offering-logos', true);

CREATE POLICY "Anyone can view offering logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'offering-logos');

CREATE POLICY "Admins can upload offering logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'offering-logos' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update offering logos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'offering-logos' AND public.has_role(auth.uid(), 'admin'::app_role));

-- Seed existing offerings
INSERT INTO public.offerings (name, slug) VALUES
  ('Tennis Court', 'tennis'),
  ('Basketball Court', 'basketball'),
  ('Aerial Yoga (Kids)', 'aerial-yoga'),
  ('Reformer Pilates', 'pilates');
