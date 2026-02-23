
-- Add club_id to user_roles so admins can be assigned to a club
ALTER TABLE public.user_roles ADD COLUMN club_id UUID REFERENCES public.clubs(id) DEFAULT NULL;
