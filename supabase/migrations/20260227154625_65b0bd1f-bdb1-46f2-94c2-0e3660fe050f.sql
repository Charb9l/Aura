
-- Create page_content table for admin-editable page content
CREATE TABLE public.page_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_slug TEXT NOT NULL UNIQUE,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;

-- Anyone can read page content (it's public-facing)
CREATE POLICY "Anyone can view page content"
ON public.page_content FOR SELECT
USING (true);

-- Only admins can modify
CREATE POLICY "Admins can insert page content"
ON public.page_content FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update page content"
ON public.page_content FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete page content"
ON public.page_content FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed default home page content
INSERT INTO public.page_content (page_slug, content) VALUES (
  'home',
  '{
    "hero_subtitle": "Movement & Mindfulness",
    "hero_title_line1": "Your Journey.",
    "hero_title_line2": "Your Space.",
    "hero_buttons": [
      {"to": "/book", "label": "Book a Session"},
      {"to": "/academy", "label": "Join Our Academies"},
      {"to": "/clubs", "label": "Clubs & Partners"},
      {"to": "/loyalty", "label": "Loyalty Program"}
    ]
  }'::jsonb
);
