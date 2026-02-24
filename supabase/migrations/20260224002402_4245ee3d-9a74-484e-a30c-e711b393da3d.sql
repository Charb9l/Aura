
-- Function to check if user is a super admin (admin with no club_id)
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
      AND club_id IS NULL
  )
$$;

-- Drop existing admin delete policy
DROP POLICY IF EXISTS "Admins can delete bookings" ON public.bookings;

-- New policy: admins can delete bookings ONLY IF attendance_status is null (not yet marked),
-- OR if the admin is a super admin (can delete anything)
CREATE POLICY "Admins can delete bookings"
ON public.bookings
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND (
    attendance_status IS NULL
    OR is_super_admin(auth.uid())
  )
);
