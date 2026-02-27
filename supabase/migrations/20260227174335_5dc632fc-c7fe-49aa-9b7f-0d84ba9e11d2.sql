
-- Create club_pictures table
CREATE TABLE public.club_pictures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.club_pictures ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view club pictures" ON public.club_pictures FOR SELECT USING (true);
CREATE POLICY "Admins can insert club pictures" ON public.club_pictures FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update club pictures" ON public.club_pictures FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete club pictures" ON public.club_pictures FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('club-pictures', 'club-pictures', true);

-- Storage policies
CREATE POLICY "Anyone can view club pictures storage" ON storage.objects FOR SELECT USING (bucket_id = 'club-pictures');
CREATE POLICY "Admins can upload club pictures" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'club-pictures' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete club pictures storage" ON storage.objects FOR DELETE USING (bucket_id = 'club-pictures' AND has_role(auth.uid(), 'admin'::app_role));
