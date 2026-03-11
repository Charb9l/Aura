
-- Academy registrations table
CREATE TABLE public.academy_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  club_name text NOT NULL,
  location_id uuid REFERENCES public.club_locations(id) ON DELETE SET NULL,
  location_name text,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  age integer,
  experience text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.academy_registrations ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own registrations
CREATE POLICY "Anyone can submit academy registration"
  ON public.academy_registrations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admins can view all
CREATE POLICY "Admins can view academy registrations"
  ON public.academy_registrations FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update (status changes)
CREATE POLICY "Admins can update academy registrations"
  ON public.academy_registrations FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete
CREATE POLICY "Admins can delete academy registrations"
  ON public.academy_registrations FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to notify admin on new registration
CREATE OR REPLACE FUNCTION public.notify_academy_registration()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (type, title, body, metadata)
  VALUES (
    'academy_registration',
    '🎓 New Academy Registration: ' || NEW.full_name,
    NEW.full_name || ' registered for ' || NEW.club_name || COALESCE(' at ' || NEW.location_name, '') || '.' || E'\n' ||
    'Email: ' || NEW.email || E'\n' ||
    'Phone: ' || NEW.phone,
    jsonb_build_object('registration_id', NEW.id, 'club_id', NEW.club_id, 'club_name', NEW.club_name, 'full_name', NEW.full_name)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_academy_registration
  AFTER INSERT ON public.academy_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_academy_registration();
