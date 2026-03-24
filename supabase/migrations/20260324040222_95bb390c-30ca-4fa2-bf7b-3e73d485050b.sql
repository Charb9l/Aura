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
    deleted_by, created_at, created_by, price, booking_number
  ) VALUES (
    OLD.id, OLD.activity, OLD.activity_name, OLD.booking_date, OLD.booking_time,
    OLD.full_name, OLD.email, OLD.phone, OLD.court_type, OLD.discount_type, OLD.user_id,
    auth.uid(), OLD.created_at, OLD.created_by, OLD.price, OLD.booking_number
  );
  RETURN OLD;
END;
$$;