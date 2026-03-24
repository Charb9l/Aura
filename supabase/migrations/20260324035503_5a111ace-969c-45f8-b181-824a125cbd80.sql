CREATE OR REPLACE FUNCTION public.adjust_loyalty_points(
  _user_id uuid,
  _club_id uuid,
  _points integer,
  _reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow: negative deductions (reward redemption) or welcome bonus (+1)
  IF _points > 1 THEN
    RAISE EXCEPTION 'Users can only deduct points or add welcome bonus';
  END IF;

  -- Caller must be the user themselves
  IF auth.uid() != _user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Verify the club exists
  IF NOT EXISTS (SELECT 1 FROM public.clubs WHERE id = _club_id) THEN
    RAISE EXCEPTION 'Invalid club';
  END IF;

  -- For welcome bonus (+1), ensure it hasn't been claimed for this club already
  IF _points > 0 THEN
    IF EXISTS (
      SELECT 1 FROM public.loyalty_point_adjustments
      WHERE user_id = _user_id AND club_id = _club_id AND reason = 'Welcome bonus: profile photo + MyPlayer setup'
    ) THEN
      RAISE EXCEPTION 'Welcome bonus already claimed for this club';
    END IF;
  END IF;

  INSERT INTO public.loyalty_point_adjustments (user_id, club_id, points, reason, adjusted_by)
  VALUES (_user_id, _club_id, _points, _reason, _user_id);
END;
$$;