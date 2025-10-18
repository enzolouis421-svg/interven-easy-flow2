-- Supprimer la contrainte devis_statut_check si elle existe
ALTER TABLE public.devis DROP CONSTRAINT IF EXISTS devis_statut_check;

-- Ajouter une nouvelle contrainte plus permissive pour le statut
ALTER TABLE public.devis ADD CONSTRAINT devis_statut_check 
CHECK (statut IN ('En attente', 'Envoyé', 'Accepté', 'Refusé'));