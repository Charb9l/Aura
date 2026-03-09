
-- Re-add admin SELECT policy for customer_notifications
CREATE POLICY "Admins can view all customer notifications"
ON public.customer_notifications
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
