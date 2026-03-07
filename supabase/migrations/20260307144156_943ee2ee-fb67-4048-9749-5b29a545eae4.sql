
-- Customer notifications sent by admin (broadcast to all)
CREATE TABLE public.customer_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_notifications ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read
CREATE POLICY "Authenticated users can view customer notifications"
  ON public.customer_notifications FOR SELECT TO authenticated
  USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert customer notifications"
  ON public.customer_notifications FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete
CREATE POLICY "Admins can delete customer notifications"
  ON public.customer_notifications FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Read tracking table
CREATE TABLE public.customer_notification_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.customer_notifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(notification_id, user_id)
);

ALTER TABLE public.customer_notification_reads ENABLE ROW LEVEL SECURITY;

-- Users can see their own reads
CREATE POLICY "Users can view own reads"
  ON public.customer_notification_reads FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert own reads
CREATE POLICY "Users can insert own reads"
  ON public.customer_notification_reads FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all reads
CREATE POLICY "Admins can view all reads"
  ON public.customer_notification_reads FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
