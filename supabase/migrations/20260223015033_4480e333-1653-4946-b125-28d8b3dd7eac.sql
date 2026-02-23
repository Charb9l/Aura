-- Remove the overly permissive policy
DROP POLICY "Authenticated users can check slot availability" ON public.bookings;

-- Create a security definer function to check booked slots without exposing PII
CREATE OR REPLACE FUNCTION public.get_booked_slots(_activity text, _booking_date date)
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(booking_time), '{}')
  FROM public.bookings
  WHERE activity = _activity
    AND booking_date = _booking_date
    AND status = 'confirmed';
$$;