ALTER TABLE public.price_rules
  ADD COLUMN max_total_uses integer DEFAULT NULL,
  ADD COLUMN uses_per_customer integer NOT NULL DEFAULT 1;