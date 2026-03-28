
DROP POLICY "Club admins can manage price rules" ON public.price_rules;

CREATE POLICY "Club admins can manage own price rules"
ON public.price_rules
AS PERMISSIVE FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.price_rule_clubs prc ON prc.price_rule_id = price_rules.id
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
      AND ur.club_id IS NOT NULL
      AND ur.club_id = prc.club_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.price_rule_clubs prc ON prc.price_rule_id = price_rules.id
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
      AND ur.club_id IS NOT NULL
      AND ur.club_id = prc.club_id
  )
);
