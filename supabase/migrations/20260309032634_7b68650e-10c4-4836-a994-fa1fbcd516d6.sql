
-- Partner requests table (public submissions, no auth required)
CREATE TABLE public.partner_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_name text NOT NULL,
  club_location text NOT NULL,
  contact_role text NOT NULL DEFAULT 'owner',
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  description text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public form)
CREATE POLICY "Anyone can submit partner request"
ON public.partner_requests FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Admins can view all
CREATE POLICY "Admins can view partner requests"
ON public.partner_requests FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update (status, notes)
CREATE POLICY "Admins can update partner requests"
ON public.partner_requests FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete
CREATE POLICY "Admins can delete partner requests"
ON public.partner_requests FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger: notify admins on new partner request
CREATE OR REPLACE FUNCTION public.notify_partner_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, body, metadata)
  VALUES (
    'partner_request',
    '🤝 New Partner Request: ' || NEW.club_name,
    NEW.contact_name || ' (' || NEW.contact_role || ') submitted a partnership request for "' || NEW.club_name || '" in ' || NEW.club_location || '.',
    jsonb_build_object('request_id', NEW.id, 'club_name', NEW.club_name, 'contact_name', NEW.contact_name)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_partner_request_created
  AFTER INSERT ON public.partner_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_partner_request();
