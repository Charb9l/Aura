-- Create featured_clubs table
CREATE TABLE public.featured_clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  featured_image_url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(club_id)
);

-- Enable RLS
ALTER TABLE public.featured_clubs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view active featured clubs"
  ON public.featured_clubs FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can view all featured clubs"
  ON public.featured_clubs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert featured clubs"
  ON public.featured_clubs FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update featured clubs"
  ON public.featured_clubs FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete featured clubs"
  ON public.featured_clubs FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for featured images
INSERT INTO storage.buckets (id, name, public)
VALUES ('featured-images', 'featured-images', true);

-- Storage policies
CREATE POLICY "Anyone can view featured images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'featured-images');

CREATE POLICY "Admins can upload featured images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'featured-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update featured images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'featured-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete featured images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'featured-images' AND has_role(auth.uid(), 'admin'::app_role));