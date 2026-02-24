-- Create storage bucket for club logos
INSERT INTO storage.buckets (id, name, public) VALUES ('club-logos', 'club-logos', true);

-- Allow anyone to view club logos (public bucket)
CREATE POLICY "Club logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'club-logos');

-- Only admins can upload club logos
CREATE POLICY "Admins can upload club logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'club-logos' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- Only admins can update club logos
CREATE POLICY "Admins can update club logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'club-logos' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- Only admins can delete club logos
CREATE POLICY "Admins can delete club logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'club-logos' AND public.has_role(auth.uid(), 'admin'::public.app_role));