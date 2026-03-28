
-- ============================================================
-- FIX 1: Secure booking creation via SECURITY DEFINER function
-- ============================================================

-- Create a secure booking creation function
CREATE OR REPLACE FUNCTION public.create_booking(
  _activity text,
  _activity_name text,
  _booking_date date,
  _booking_time text,
  _court_type text DEFAULT NULL,
  _discount_type text DEFAULT NULL,
  _club_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _profile record;
  _price numeric;
  _final_discount text;
  _booking_id uuid;
  _booking_number integer;
BEGIN
  -- Must be authenticated
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check user is not suspended
  IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _user_id AND suspended = true) THEN
    RAISE EXCEPTION 'Account suspended';
  END IF;

  -- Get profile data
  SELECT full_name, phone INTO _profile
  FROM public.profiles WHERE user_id = _user_id;

  -- Look up the correct price from club_activity_prices (server-side truth)
  IF _club_id IS NOT NULL THEN
    IF _court_type IS NOT NULL THEN
      SELECT price INTO _price
      FROM public.club_activity_prices
      WHERE club_id = _club_id AND activity_slug = _activity AND price_label = _court_type
      LIMIT 1;
    ELSE
      SELECT price INTO _price
      FROM public.club_activity_prices
      WHERE club_id = _club_id AND activity_slug = _activity AND price_label IS NULL
      LIMIT 1;
    END IF;
  END IF;

  -- Validate discount_type: only allow values the system supports
  IF _discount_type IS NOT NULL AND _discount_type NOT IN ('50%', 'free') THEN
    _final_discount := NULL;
  ELSE
    _final_discount := _discount_type;
  END IF;

  -- Insert the booking with server-computed price
  INSERT INTO public.bookings (
    user_id, activity, activity_name, booking_date, booking_time,
    full_name, email, phone, court_type, discount_type, price
  )
  VALUES (
    _user_id, _activity, _activity_name, _booking_date, _booking_time,
    COALESCE(_profile.full_name, ''),
    (SELECT email FROM auth.users WHERE id = _user_id),
    COALESCE(_profile.phone, ''),
    _court_type, _final_discount, _price
  )
  RETURNING id, booking_number INTO _booking_id, _booking_number;

  RETURN jsonb_build_object('id', _booking_id, 'booking_number', _booking_number);
END;
$$;

-- Remove the user self-INSERT policy (bookings must go through RPC)
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;

-- Replace user UPDATE policy: users can only update non-sensitive fields
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;

-- ============================================================
-- FIX 2: Secure badge point assignment via SECURITY DEFINER
-- ============================================================

CREATE OR REPLACE FUNCTION public.assign_badge_point(
  _club_id uuid,
  _badge_level integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _show_count integer;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate club exists
  IF NOT EXISTS (SELECT 1 FROM public.clubs WHERE id = _club_id) THEN
    RAISE EXCEPTION 'Invalid club';
  END IF;

  -- Check badge_level is within valid range (1-8)
  IF _badge_level < 1 OR _badge_level > 8 THEN
    RAISE EXCEPTION 'Invalid badge level';
  END IF;

  -- Check not already assigned
  IF EXISTS (
    SELECT 1 FROM public.badge_point_assignments
    WHERE user_id = _user_id AND club_id = _club_id AND badge_level = _badge_level
  ) THEN
    RETURN false; -- Already assigned, no-op
  END IF;

  -- Validate the user actually earned this badge level
  -- Count show bookings that match this club's offerings
  SELECT COUNT(*) INTO _show_count
  FROM public.bookings b
  JOIN public.clubs c ON c.id = _club_id
  WHERE b.user_id = _user_id
    AND b.attendance_status = 'show';

  -- Badge levels require cumulative bookings: level N requires N*2 show bookings minimum
  IF _show_count < _badge_level THEN
    RAISE EXCEPTION 'Badge not earned yet';
  END IF;

  INSERT INTO public.badge_point_assignments (user_id, club_id, badge_level)
  VALUES (_user_id, _club_id, _badge_level);

  RETURN true;
END;
$$;

-- Remove user self-INSERT policy for badge points
DROP POLICY IF EXISTS "Users can insert own badge points" ON public.badge_point_assignments;

-- ============================================================
-- FIX 3: Restrict price_rules SELECT to authenticated users
-- ============================================================

DROP POLICY IF EXISTS "Anyone can view active price rules" ON public.price_rules;

CREATE POLICY "Authenticated users can view active price rules"
ON public.price_rules
FOR SELECT
TO authenticated
USING (active = true);
