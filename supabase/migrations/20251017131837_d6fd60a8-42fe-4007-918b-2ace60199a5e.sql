-- Modifier la table devis pour correspondre à la nouvelle structure
ALTER TABLE devis DROP COLUMN IF EXISTS numero_devis;
ALTER TABLE devis DROP COLUMN IF EXISTS date_devis;
ALTER TABLE devis DROP COLUMN IF EXISTS date_validite;
ALTER TABLE devis DROP COLUMN IF EXISTS lignes;
ALTER TABLE devis DROP COLUMN IF EXISTS total_ht;
ALTER TABLE devis DROP COLUMN IF EXISTS tva;
ALTER TABLE devis DROP COLUMN IF EXISTS total_ttc;
ALTER TABLE devis DROP COLUMN IF EXISTS conditions;
ALTER TABLE devis DROP COLUMN IF EXISTS signature_url;
ALTER TABLE devis DROP COLUMN IF EXISTS pdf_url;

-- Ajouter les nouvelles colonnes
ALTER TABLE devis ADD COLUMN IF NOT EXISTS reference TEXT NOT NULL DEFAULT '';
ALTER TABLE devis ADD COLUMN IF NOT EXISTS client_nom TEXT;
ALTER TABLE devis ADD COLUMN IF NOT EXISTS date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
ALTER TABLE devis ADD COLUMN IF NOT EXISTS validite_jours INTEGER NOT NULL DEFAULT 30;
ALTER TABLE devis ADD COLUMN IF NOT EXISTS pret_envoi BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE devis ADD COLUMN IF NOT EXISTS lignes_prestation JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE devis ADD COLUMN IF NOT EXISTS total_ht NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE devis ADD COLUMN IF NOT EXISTS total_tva NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE devis ADD COLUMN IF NOT EXISTS total_ttc NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE devis ADD COLUMN IF NOT EXISTS montant NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE devis ADD COLUMN IF NOT EXISTS conditions_paiement TEXT DEFAULT 'Paiement à réception de facture';
ALTER TABLE devis ADD COLUMN IF NOT EXISTS delai_realisation TEXT;

-- Modifier la colonne statut
ALTER TABLE devis ALTER COLUMN statut SET DEFAULT 'En attente';

-- Créer un index sur la référence
CREATE INDEX IF NOT EXISTS idx_devis_reference ON devis(reference);

-- Mettre à jour le trigger pour le champ updated_at (s'il existe déjà)
DROP TRIGGER IF EXISTS update_devis_updated_at ON devis;
CREATE TRIGGER update_devis_updated_at
  BEFORE UPDATE ON devis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();