-- Create company_settings table for storing business information
CREATE TABLE IF NOT EXISTS public.company_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom_entreprise TEXT NOT NULL,
  siret TEXT,
  adresse TEXT,
  code_postal TEXT,
  ville TEXT,
  telephone TEXT,
  email TEXT,
  logo_url TEXT,
  conditions_generales TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create devis table for quotes
CREATE TABLE IF NOT EXISTS public.devis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  numero_devis TEXT NOT NULL,
  date_devis TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  date_validite TIMESTAMP WITH TIME ZONE,
  statut TEXT NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'envoye', 'accepte', 'refuse', 'expire')),
  lignes JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_ht DECIMAL(10,2) NOT NULL DEFAULT 0,
  tva DECIMAL(10,2) NOT NULL DEFAULT 20,
  total_ttc DECIMAL(10,2) NOT NULL DEFAULT 0,
  conditions TEXT,
  notes TEXT,
  signature_url TEXT,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devis ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_settings
CREATE POLICY "Users can view their own company settings"
  ON public.company_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own company settings"
  ON public.company_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company settings"
  ON public.company_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own company settings"
  ON public.company_settings FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for devis
CREATE POLICY "Users can view their own devis"
  ON public.devis FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own devis"
  ON public.devis FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own devis"
  ON public.devis FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own devis"
  ON public.devis FOR DELETE
  USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_devis_updated_at
  BEFORE UPDATE ON public.devis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();