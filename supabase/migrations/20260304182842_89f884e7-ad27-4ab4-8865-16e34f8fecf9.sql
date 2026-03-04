
-- Trigger: new user signup → admin notification
CREATE OR REPLACE FUNCTION public.notify_new_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
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

CREATE TRIGGER on_new_profile_notify
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_signup();

-- Trigger: booking deleted (cancelled) → admin notification
CREATE OR REPLACE FUNCTION public.notify_booking_cancelled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only notify if it was self-cancelled (not admin deletion, which goes to audit log)
  IF OLD.created_by IS NULL OR OLD.created_by = OLD.user_id THEN
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
$$;

CREATE TRIGGER on_booking_cancelled_notify
BEFORE DELETE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_booking_cancelled();
