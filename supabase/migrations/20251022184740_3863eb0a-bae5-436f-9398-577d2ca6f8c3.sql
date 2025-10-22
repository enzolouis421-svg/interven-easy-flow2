-- Add signature fields to devis table
ALTER TABLE public.devis 
ADD COLUMN IF NOT EXISTS client_signature_url TEXT,
ADD COLUMN IF NOT EXISTS company_signature_url TEXT,
ADD COLUMN IF NOT EXISTS date_signature TIMESTAMP WITH TIME ZONE;