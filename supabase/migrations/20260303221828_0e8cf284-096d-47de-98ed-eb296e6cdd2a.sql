
-- Nudges table: tracks nudge requests between players
CREATE TABLE public.nudges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  sport_id uuid NOT NULL REFERENCES public.offerings(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT no_self_nudge CHECK (sender_id <> receiver_id)
);

-- Index for fast lookups
CREATE INDEX idx_nudges_sender ON public.nudges(sender_id, status);
CREATE INDEX idx_nudges_receiver ON public.nudges(receiver_id, status);
-- Prevent duplicate pending nudges for same pair+sport
CREATE UNIQUE INDEX idx_nudges_unique_pending ON public.nudges(sender_id, receiver_id, sport_id) WHERE status = 'pending';

ALTER TABLE public.nudges ENABLE ROW LEVEL SECURITY;

-- Sender can view their own sent nudges
CREATE POLICY "Users can view sent nudges"
  ON public.nudges FOR SELECT
  USING (auth.uid() = sender_id);

-- Receiver can view their own received nudges
CREATE POLICY "Users can view received nudges"
  ON public.nudges FOR SELECT
  USING (auth.uid() = receiver_id);

-- Authenticated users can send nudges
CREATE POLICY "Users can send nudges"
  ON public.nudges FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Receiver can update (accept/decline) nudges sent to them
CREATE POLICY "Receiver can respond to nudges"
  ON public.nudges FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Sender can delete their own pending nudges (cancel)
CREATE POLICY "Sender can cancel pending nudges"
  ON public.nudges FOR DELETE
  USING (auth.uid() = sender_id AND status = 'pending');

-- Admins can view all nudges
CREATE POLICY "Admins can view all nudges"
  ON public.nudges FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Workout buddies table: created when a nudge is accepted
CREATE TABLE public.workout_buddies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1 uuid NOT NULL,
  user_id_2 uuid NOT NULL,
  sport_id uuid NOT NULL REFERENCES public.offerings(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  nudge_id uuid REFERENCES public.nudges(id) ON DELETE SET NULL,
  CONSTRAINT no_self_buddy CHECK (user_id_1 <> user_id_2),
  CONSTRAINT ordered_ids CHECK (user_id_1 < user_id_2)
);

CREATE UNIQUE INDEX idx_buddies_unique ON public.workout_buddies(user_id_1, user_id_2, sport_id);
CREATE INDEX idx_buddies_user1 ON public.workout_buddies(user_id_1);
CREATE INDEX idx_buddies_user2 ON public.workout_buddies(user_id_2);

ALTER TABLE public.workout_buddies ENABLE ROW LEVEL SECURITY;

-- Users can see their own buddy records
CREATE POLICY "Users can view own buddies"
  ON public.workout_buddies FOR SELECT
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- System insert via trigger (or direct insert allowed if user is one of the pair)
CREATE POLICY "Users can insert buddy record"
  ON public.workout_buddies FOR INSERT
  WITH CHECK (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Users can delete their own buddy connections
CREATE POLICY "Users can remove buddy"
  ON public.workout_buddies FOR DELETE
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Admins can view all
CREATE POLICY "Admins can view all buddies"
  ON public.workout_buddies FOR SELECT
  USING (has_role(auth.uid(), 'admin'));
