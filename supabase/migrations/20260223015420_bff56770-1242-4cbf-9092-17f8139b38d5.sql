-- Create audit log table for booking deletions
CREATE TABLE public.booking_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  activity text NOT NULL,
  activity_name text NOT NULL,
  booking_date date NOT NULL,
  booking_time text NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  court_type text,
  discount_type text,
  user_id uuid NOT NULL,
  deleted_by uuid NOT NULL,
  deleted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL
);

ALTER TABLE public.booking_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.booking_audit_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to log deletions with the deleting admin's id
CREATE OR REPLACE FUNCTION public.log_booking_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.booking_audit_log (
    booking_id, activity, activity_name, booking_date, booking_time,
    full_name, email, phone, court_type, discount_type, user_id,
    deleted_by, created_at
  ) VALUES (
    OLD.id, OLD.activity, OLD.activity_name, OLD.booking_date, OLD.booking_time,
    OLD.full_name, OLD.email, OLD.phone, OLD.court_type, OLD.discount_type, OLD.user_id,
    auth.uid(), OLD.created_at
  );
  RETURN OLD;
END;
$$;

CREATE TRIGGER on_booking_delete
BEFORE DELETE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.log_booking_deletion();