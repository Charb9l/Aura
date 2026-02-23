
-- Create clubs table
CREATE TABLE public.clubs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  offerings TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

-- Everyone can view clubs (public page)
CREATE POLICY "Anyone can view clubs"
ON public.clubs
FOR SELECT
USING (true);

-- Only admins can insert/update/delete clubs
CREATE POLICY "Admins can insert clubs"
ON public.clubs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update clubs"
ON public.clubs
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete clubs"
ON public.clubs
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
