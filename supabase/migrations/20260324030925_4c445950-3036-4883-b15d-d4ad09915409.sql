-- Allow club admins to manage price_rules via is_super_admin OR has admin role with club_id
DROP POLICY IF EXISTS "Admins can manage price rules" ON public.price_rules;

CREATE POLICY "Super admins can manage price rules"
ON public.price_rules FOR ALL
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Club admins can manage price rules"
ON public.price_rules FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin' AND club_id IS NOT NULL))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin' AND club_id IS NOT NULL));

-- Allow club admins to manage price_rule_clubs
DROP POLICY IF EXISTS "Admins can manage price rule clubs" ON public.price_rule_clubs;

CREATE POLICY "Super admins can manage price rule clubs"
ON public.price_rule_clubs FOR ALL
TO authenticated
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Club admins can manage own price rule clubs"
ON public.price_rule_clubs FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin' AND club_id = price_rule_clubs.club_id))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin' AND club_id = price_rule_clubs.club_id));