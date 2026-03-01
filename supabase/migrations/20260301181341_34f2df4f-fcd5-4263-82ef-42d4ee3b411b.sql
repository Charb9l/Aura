
-- Create a master locations table
CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Anyone can read locations
CREATE POLICY "Anyone can view locations"
  ON public.locations FOR SELECT
  USING (true);

-- Admins can manage locations
CREATE POLICY "Admins can insert locations"
  ON public.locations FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update locations"
  ON public.locations FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete locations"
  ON public.locations FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed with existing Lebanese cities
INSERT INTO public.locations (name) VALUES
  ('Aaley'), ('Baabda'), ('Baalbek'), ('Batroun'), ('Beit Mery'),
  ('Beiteddine'), ('Beirut'), ('Bhamdoun'), ('Bickfaya'), ('Bint Jbeil'),
  ('Broummana'), ('Byblos (Jbeil)'), ('Chekka'), ('Choueifat'), ('Damour'),
  ('Dbayeh'), ('Deir el Qamar'), ('Ehden'), ('Faqra'), ('Faraya'),
  ('Ghazir'), ('Halba'), ('Hammana'), ('Hazmieh'), ('Hermel'),
  ('Jal el Dib'), ('Jdeideh'), ('Jounieh'), ('Jezzine'), ('Kaslik'),
  ('Keserwan'), ('Kfardebian'), ('Khalde'), ('Koura'), ('Laqlouq'),
  ('Mansourieh'), ('Marjayoun'), ('Metn'), ('Mina (Tripoli)'), ('Mkalles'),
  ('Monterverdi'), ('Nabatieh'), ('Naccache'), ('Rabieh'), ('Raifoun'),
  ('Ras Beirut'), ('Saida (Sidon)'), ('Sarba'), ('Sin el Fil'), ('Sour (Tyre)'),
  ('Tabarja'), ('Tripoli'), ('Zahle'), ('Zgharta'), ('Zouk Mikael'), ('Zouk Mosbeh');
