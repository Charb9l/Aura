
-- Create hero_pictures table
CREATE TABLE public.hero_pictures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hero_pictures ENABLE ROW LEVEL SECURITY;

-- Anyone can view hero pictures (needed for landing page)
CREATE POLICY "Anyone can view hero pictures"
  ON public.hero_pictures FOR SELECT
  USING (true);

-- Only admins can manage hero pictures
CREATE POLICY "Admins can insert hero pictures"
  ON public.hero_pictures FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update hero pictures"
  ON public.hero_pictures FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete hero pictures"
  ON public.hero_pictures FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for hero pictures
INSERT INTO storage.buckets (id, name, public) VALUES ('hero-pictures', 'hero-pictures', true);

-- Storage policies
CREATE POLICY "Anyone can view hero pictures storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'hero-pictures');

CREATE POLICY "Admins can upload hero pictures"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'hero-pictures' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete hero pictures storage"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'hero-pictures' AND public.has_role(auth.uid(), 'admin'::app_role));
