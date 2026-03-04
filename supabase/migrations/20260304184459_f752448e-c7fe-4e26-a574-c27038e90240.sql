
-- Manual loyalty point adjustments by admin
CREATE TABLE public.loyalty_point_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  points integer NOT NULL DEFAULT 0,
  reason text,
  adjusted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.loyalty_point_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all adjustments" ON public.loyalty_point_adjustments
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert adjustments" ON public.loyalty_point_adjustments
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update adjustments" ON public.loyalty_point_adjustments
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete adjustments" ON public.loyalty_point_adjustments
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own adjustments" ON public.loyalty_point_adjustments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
