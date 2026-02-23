-- Add attendance_status to bookings: null = pending, 'show', 'no_show'
ALTER TABLE public.bookings
ADD COLUMN attendance_status text DEFAULT null;

-- Allow admins to update bookings (for marking show/no_show)
CREATE POLICY "Admins can update bookings"
ON public.bookings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));