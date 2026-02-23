-- Add discount_type column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN discount_type text DEFAULT null;

-- Values will be: null (normal), '50%', 'free'