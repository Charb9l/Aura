
INSERT INTO storage.buckets (id, name, public) VALUES ('notification-images', 'notification-images', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can upload notification images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'notification-images' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view notification images" ON storage.objects FOR SELECT USING (bucket_id = 'notification-images');
