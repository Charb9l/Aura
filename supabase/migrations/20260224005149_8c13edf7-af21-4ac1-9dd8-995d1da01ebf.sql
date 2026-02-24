
-- Add created_by to bookings to track who created each booking
ALTER TABLE public.bookings ADD COLUMN created_by uuid;

-- Add created_by to booking_audit_log for historical tracking
ALTER TABLE public.booking_audit_log ADD COLUMN created_by uuid;

-- Allow admins to insert bookings (for any user)
CREATE POLICY "Admins can insert bookings"
ON public.bookings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update the deletion trigger to also copy created_by
CREATE OR REPLACE FUNCTION public.log_booking_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.booking_audit_log (
    booking_id, activity, activity_name, booking_date, booking_time,
    full_name, email, phone, court_type, discount_type, user_id,
    deleted_by, created_at, created_by
  ) VALUES (
    OLD.id, OLD.activity, OLD.activity_name, OLD.booking_date, OLD.booking_time,
    OLD.full_name, OLD.email, OLD.phone, OLD.court_type, OLD.discount_type, OLD.user_id,
    auth.uid(), OLD.created_at, OLD.created_by
  );
  RETURN OLD;
END;
$function$;
