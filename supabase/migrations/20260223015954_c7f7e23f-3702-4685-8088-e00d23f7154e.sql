-- Allow users to update their own bookings (for time changes)
CREATE POLICY "Users can update their own bookings"
ON public.bookings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own bookings
CREATE POLICY "Users can delete their own bookings"
ON public.bookings
FOR DELETE
USING (auth.uid() = user_id);