-- Add foreign key constraints for client_id columns
ALTER TABLE public.devis
ADD CONSTRAINT fk_devis_client
FOREIGN KEY (client_id)
REFERENCES public.clients(id)
ON DELETE CASCADE;

ALTER TABLE public.factures
ADD CONSTRAINT fk_factures_client
FOREIGN KEY (client_id)
REFERENCES public.clients(id)
ON DELETE CASCADE;

ALTER TABLE public.interventions
ADD CONSTRAINT fk_interventions_client
FOREIGN KEY (client_id)
REFERENCES public.clients(id)
ON DELETE CASCADE;

-- Add foreign key constraint for technicien_id
ALTER TABLE public.interventions
ADD CONSTRAINT fk_interventions_technicien
FOREIGN KEY (technicien_id)
REFERENCES public.techniciens(id)
ON DELETE SET NULL;

-- Add foreign key constraint for devis_id in factures
ALTER TABLE public.factures
ADD CONSTRAINT fk_factures_devis
FOREIGN KEY (devis_id)
REFERENCES public.devis(id)
ON DELETE SET NULL;