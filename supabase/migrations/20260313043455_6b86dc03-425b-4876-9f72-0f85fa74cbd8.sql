CREATE OR REPLACE FUNCTION public.notify_booking_cancelled()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only notify if the person deleting is the booking owner (customer self-cancellation)
  IF auth.uid() = OLD.user_id THEN
    INSERT INTO public.admin_notifications (type, title, body, metadata)
    VALUES (
      'booking_cancelled',
      OLD.full_name || ' cancelled their ' || OLD.activity_name || ' booking',
      'Booking details:' || E'\n' ||
      'Date: ' || OLD.booking_date || E'\n' ||
      'Time: ' || OLD.booking_time || E'\n' ||
      'Activity: ' || OLD.activity_name || E'\n' ||
      'Customer: ' || OLD.full_name || ' (' || OLD.email || ')',
      jsonb_build_object('booking_id', OLD.id, 'activity', OLD.activity, 'booking_date', OLD.booking_date, 'customer_name', OLD.full_name)
    );
  END IF;
  RETURN OLD;
END;
$function$;