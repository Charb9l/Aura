-- Allow any authenticated user to check booking availability (read booking_time for any booking)
CREATE POLICY "Authenticated users can check slot availability"
ON public.bookings
FOR SELECT
TO authenticated
USING (true);