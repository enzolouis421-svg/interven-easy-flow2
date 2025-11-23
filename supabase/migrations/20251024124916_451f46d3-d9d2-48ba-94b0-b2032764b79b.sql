-- Create factures table
CREATE TABLE IF NOT EXISTS public.factures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  devis_id UUID REFERENCES public.devis(id) ON DELETE SET NULL,
  client_id UUID NOT NULL,
  reference TEXT NOT NULL DEFAULT '',
  date_emission TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  date_echeance TIMESTAMP WITH TIME ZONE,
  lignes_prestation JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_ht NUMERIC NOT NULL DEFAULT 0,
  total_tva NUMERIC NOT NULL DEFAULT 0,
  total_ttc NUMERIC NOT NULL DEFAULT 0,
  montant_paye NUMERIC NOT NULL DEFAULT 0,
  statut TEXT NOT NULL DEFAULT 'Non payée',
  conditions_paiement TEXT DEFAULT 'Paiement à réception de facture',
  notes TEXT,
  client_nom TEXT,
  company_signature_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.factures ENABLE ROW LEVEL SECURITY;

-- Create policies for factures
CREATE POLICY "Users can view their own factures" 
ON public.factures 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own factures" 
ON public.factures 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own factures" 
ON public.factures 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own factures" 
ON public.factures 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_factures_updated_at
BEFORE UPDATE ON public.factures
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();