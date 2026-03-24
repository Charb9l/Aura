
-- Add created_by column to price_rules
ALTER TABLE public.price_rules ADD COLUMN created_by uuid;

-- Create trigger function to notify mega admins when a club admin creates a price rule
CREATE OR REPLACE FUNCTION public.notify_price_rule_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  creator_name TEXT;
  club_name_val TEXT;
BEGIN
  -- Only notify if creator is a club admin (has club_id)
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = NEW.created_by AND role = 'admin' AND club_id IS NOT NULL
  ) THEN
    SELECT full_name INTO creator_name FROM public.profiles WHERE user_id = NEW.created_by;
    SELECT c.name INTO club_name_val FROM public.clubs c
      JOIN public.user_roles ur ON ur.club_id = c.id
      WHERE ur.user_id = NEW.created_by AND ur.role = 'admin' LIMIT 1;

    INSERT INTO public.admin_notifications (type, title, body, metadata)
    VALUES (
      'price_rule_created',
      '🏷️ New Price Rule: ' || NEW.name,
      COALESCE(creator_name, 'A club admin') || ' (' || COALESCE(club_name_val, 'Unknown club') || ') created a new price rule "' || NEW.name || '".',
      jsonb_build_object('price_rule_id', NEW.id, 'created_by', NEW.created_by, 'club_name', club_name_val)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_price_rule_created
  AFTER INSERT ON public.price_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_price_rule_created();
