
-- Table to track former users/admins (audit trail when details change or admin is deleted)
CREATE TABLE public.former_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text,
  email text NOT NULL,
  phone text,
  user_type text NOT NULL DEFAULT 'customer', -- 'customer' or 'admin'
  club_id uuid REFERENCES public.clubs(id) ON DELETE SET NULL,
  club_name text, -- denormalized for historical record
  started_at timestamp with time zone, -- when they started (original created_at)
  ended_at timestamp with time zone NOT NULL DEFAULT now(), -- when this record was created (i.e. they were changed/removed)
  reason text, -- 'edited', 'deleted', etc.
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.former_users ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage former users
CREATE POLICY "Admins can view former users"
ON public.former_users
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert former users"
ON public.former_users
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
