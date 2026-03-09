
-- Add target_user_id column for per-user notifications (NULL = broadcast to all)
ALTER TABLE public.customer_notifications ADD COLUMN target_user_id uuid DEFAULT NULL;

-- Drop the old permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view customer notifications" ON public.customer_notifications;

-- New policy: users can see broadcast notifications (target_user_id IS NULL) OR notifications targeted at them
CREATE POLICY "Users can view their notifications"
ON public.customer_notifications
FOR SELECT
TO authenticated
USING (target_user_id IS NULL OR target_user_id = auth.uid());

-- Allow admins to also see all
DROP POLICY IF EXISTS "Admins can view all customer notifications" ON public.customer_notifications;

-- Create trigger function to notify receiver when a nudge is sent
CREATE OR REPLACE FUNCTION public.notify_nudge_received()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sender_name TEXT;
  sport_name TEXT;
BEGIN
  -- Get sender name
  SELECT full_name INTO sender_name FROM public.profiles WHERE user_id = NEW.sender_id;
  -- Get sport name
  SELECT name INTO sport_name FROM public.offerings WHERE id = NEW.sport_id;

  INSERT INTO public.customer_notifications (title, body, target_user_id)
  VALUES (
    '🏓 New Nudge from ' || COALESCE(sender_name, 'Someone'),
    COALESCE(sender_name, 'A player') || ' wants to be your workout buddy for ' || COALESCE(sport_name, 'an activity') || '! Check your profile to respond.',
    NEW.receiver_id
  );
  RETURN NEW;
END;
$$;

-- Create trigger on nudges table
DROP TRIGGER IF EXISTS on_nudge_created ON public.nudges;
CREATE TRIGGER on_nudge_created
  AFTER INSERT ON public.nudges
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_nudge_received();
