
-- Bug 2: Update get_booked_slots to also filter by activity_name (scopes slots per club)
CREATE OR REPLACE FUNCTION public.get_booked_slots(_activity text, _booking_date date, _activity_name text DEFAULT NULL)
 RETURNS text[]
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT COALESCE(array_agg(booking_time), '{}')
  FROM public.bookings
  WHERE activity = _activity
    AND booking_date = _booking_date
    AND status = 'confirmed'
    AND (_activity_name IS NULL OR activity_name = _activity_name);
$$;
