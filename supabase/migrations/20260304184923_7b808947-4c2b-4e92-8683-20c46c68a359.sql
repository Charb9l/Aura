
-- Fix: Only notify for real customer signups, not admin-created users
-- When mega admin creates a user via edge function (service_role), skip notification
CREATE OR REPLACE FUNCTION public.notify_new_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Skip if the profile was created by the service_role (admin creating another admin)
  -- Real customer signups go through the anon/authenticated role
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Also skip if user already has an admin role
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.user_id AND role = 'admin') THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.admin_notifications (type, title, body, metadata)
  VALUES (
    'new_signup',
    'New user signed up: ' || COALESCE(NEW.full_name, 'Unknown'),
    'A new customer has registered.' || E'\n' ||
    'Name: ' || COALESCE(NEW.full_name, '—') || E'\n' ||
    'Phone: ' || COALESCE(NEW.phone, '—'),
    jsonb_build_object('user_id', NEW.user_id, 'full_name', NEW.full_name)
  );
  RETURN NEW;
END;
$$;
