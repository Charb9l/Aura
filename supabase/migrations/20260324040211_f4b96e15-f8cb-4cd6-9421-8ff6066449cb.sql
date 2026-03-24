-- Create a sequence starting at 1001
CREATE SEQUENCE IF NOT EXISTS public.booking_number_seq START WITH 1001;

-- Add booking_number column with auto-increment default
ALTER TABLE public.bookings ADD COLUMN booking_number integer UNIQUE DEFAULT nextval('public.booking_number_seq');

-- Backfill existing bookings in chronological order
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) + 1000 AS num
  FROM public.bookings
  WHERE booking_number IS NULL
)
UPDATE public.bookings b SET booking_number = n.num FROM numbered n WHERE b.id = n.id;

-- Also add to audit log for historical reference
ALTER TABLE public.booking_audit_log ADD COLUMN booking_number integer;

-- Set the sequence to continue after the highest existing number
SELECT setval('public.booking_number_seq', COALESCE((SELECT MAX(booking_number) FROM public.bookings), 1000));