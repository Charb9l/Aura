
-- Add price column to bookings (nullable for backward compat with existing rows)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS price numeric DEFAULT NULL;

-- Add price column to booking_audit_log
ALTER TABLE public.booking_audit_log ADD COLUMN IF NOT EXISTS price numeric DEFAULT NULL;

-- Update the log_booking_deletion trigger to copy price
CREATE OR REPLACE FUNCTION public.log_booking_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.booking_audit_log (
    booking_id, activity, activity_name, booking_date, booking_time,
    full_name, email, phone, court_type, discount_type, user_id,
    deleted_by, created_at, created_by, price
  ) VALUES (
    OLD.id, OLD.activity, OLD.activity_name, OLD.booking_date, OLD.booking_time,
    OLD.full_name, OLD.email, OLD.phone, OLD.court_type, OLD.discount_type, OLD.user_id,
    auth.uid(), OLD.created_at, OLD.created_by, OLD.price
  );
  RETURN OLD;
END;
$$;
