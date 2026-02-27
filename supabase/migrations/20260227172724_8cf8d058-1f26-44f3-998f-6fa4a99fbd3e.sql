
-- Create academy_pictures table
CREATE TABLE public.academy_pictures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  picture_type TEXT NOT NULL DEFAULT 'carousel', -- 'bubble' or 'carousel'
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.academy_pictures ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view academy pictures"
  ON public.academy_pictures FOR SELECT USING (true);

CREATE POLICY "Admins can insert academy pictures"
  ON public.academy_pictures FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update academy pictures"
  ON public.academy_pictures FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete academy pictures"
  ON public.academy_pictures FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for academy pictures
INSERT INTO storage.buckets (id, name, public) VALUES ('academy-pictures', 'academy-pictures', true);

-- Storage policies
CREATE POLICY "Anyone can view academy pictures storage"
  ON storage.objects FOR SELECT USING (bucket_id = 'academy-pictures');

CREATE POLICY "Admins can upload academy pictures"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'academy-pictures' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update academy pictures storage"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'academy-pictures' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete academy pictures storage"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'academy-pictures' AND has_role(auth.uid(), 'admin'::app_role));
