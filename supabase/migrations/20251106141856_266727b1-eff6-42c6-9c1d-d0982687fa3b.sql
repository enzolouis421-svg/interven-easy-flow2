-- Remove duplicate foreign key constraints
ALTER TABLE public.devis
DROP CONSTRAINT IF EXISTS fk_devis_client;

ALTER TABLE public.factures
DROP CONSTRAINT IF EXISTS fk_factures_client;

ALTER TABLE public.factures
DROP CONSTRAINT IF EXISTS fk_factures_devis;

ALTER TABLE public.interventions
DROP CONSTRAINT IF EXISTS fk_interventions_client;

ALTER TABLE public.interventions
DROP CONSTRAINT IF EXISTS fk_interventions_technicien;