
-- Price rules table
CREATE TABLE public.price_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free')),
  discount_value numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.price_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage price rules" ON public.price_rules
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active price rules" ON public.price_rules
  FOR SELECT USING (active = true);

-- Price rule club associations
CREATE TABLE public.price_rule_clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  price_rule_id uuid NOT NULL REFERENCES public.price_rules(id) ON DELETE CASCADE,
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(price_rule_id, club_id)
);

ALTER TABLE public.price_rule_clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage price rule clubs" ON public.price_rule_clubs
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view price rule clubs" ON public.price_rule_clubs
  FOR SELECT USING (true);

-- User promotions (assigned to specific users)
CREATE TABLE public.user_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  price_rule_id uuid REFERENCES public.price_rules(id) ON DELETE SET NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free')),
  discount_value numeric NOT NULL DEFAULT 0,
  remaining_uses integer NOT NULL DEFAULT 1,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'manual'
);

ALTER TABLE public.user_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage user promotions" ON public.user_promotions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own promotions" ON public.user_promotions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
