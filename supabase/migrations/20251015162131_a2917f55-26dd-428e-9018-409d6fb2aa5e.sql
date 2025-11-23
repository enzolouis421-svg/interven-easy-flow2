-- Create profiles table for basic user info
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nom TEXT,
  prenom TEXT,
  telephone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  
  INSERT INTO public.techniciens (user_id, nom, prenom, email, telephone)
  VALUES (NEW.id, '', '', NEW.email, '');
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  prenom TEXT,
  entreprise TEXT,
  email TEXT,
  telephone TEXT,
  adresse TEXT,
  ville TEXT,
  code_postal TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Clients policies
CREATE POLICY "Users can view their own clients"
  ON public.clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clients"
  ON public.clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients"
  ON public.clients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients"
  ON public.clients FOR DELETE
  USING (auth.uid() = user_id);

-- Create techniciens table
CREATE TABLE IF NOT EXISTS public.techniciens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  prenom TEXT,
  email TEXT,
  telephone TEXT,
  specialite TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.techniciens ENABLE ROW LEVEL SECURITY;

-- Techniciens policies
CREATE POLICY "Users can view their own technician profile"
  ON public.techniciens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own technician profile"
  ON public.techniciens FOR UPDATE
  USING (auth.uid() = user_id);

-- Create enum for intervention status
CREATE TYPE intervention_status AS ENUM ('a_faire', 'en_cours', 'termine');

-- Create interventions table
CREATE TABLE IF NOT EXISTS public.interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  technicien_id UUID REFERENCES public.techniciens(id) ON DELETE SET NULL,
  titre TEXT NOT NULL,
  description TEXT,
  adresse TEXT,
  materiel_utilise TEXT,
  commentaire_technicien TEXT,
  statut intervention_status DEFAULT 'a_faire',
  date_intervention TIMESTAMPTZ,
  photos TEXT[], -- Array of storage URLs
  signature_url TEXT, -- Storage URL for signature
  rapport_pdf_url TEXT, -- Storage URL for PDF report
  rapport_envoye BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;

-- Interventions policies
CREATE POLICY "Users can view their own interventions"
  ON public.interventions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interventions"
  ON public.interventions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interventions"
  ON public.interventions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interventions"
  ON public.interventions FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage buckets for photos and signatures
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('intervention-photos', 'intervention-photos', true),
  ('signatures', 'signatures', true),
  ('rapports', 'rapports', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for intervention photos
CREATE POLICY "Users can upload their own intervention photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'intervention-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own intervention photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'intervention-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view intervention photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'intervention-photos');

-- Storage policies for signatures
CREATE POLICY "Users can upload their own signatures"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'signatures' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view signatures"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'signatures');

-- Storage policies for rapports
CREATE POLICY "Users can upload their own reports"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'rapports' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view reports"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'rapports');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_techniciens_updated_at
  BEFORE UPDATE ON public.techniciens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_interventions_updated_at
  BEFORE UPDATE ON public.interventions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();