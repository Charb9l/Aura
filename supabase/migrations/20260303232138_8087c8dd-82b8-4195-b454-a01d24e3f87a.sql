
-- Table to store per-club activity prices
CREATE TABLE public.club_activity_prices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  activity_slug text NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  price_label text NULL, -- e.g. "half" or "full" for basketball
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(club_id, activity_slug, price_label)
);

-- Enable RLS
ALTER TABLE public.club_activity_prices ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view club activity prices"
  ON public.club_activity_prices FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert club activity prices"
  ON public.club_activity_prices FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update club activity prices"
  ON public.club_activity_prices FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete club activity prices"
  ON public.club_activity_prices FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));
