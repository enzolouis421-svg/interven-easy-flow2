# Configuration des Signatures Électroniques

## Configuration Supabase Storage

Pour que les signatures électroniques fonctionnent correctement, vous devez créer un bucket `signatures` dans Supabase Storage.

### Étapes de configuration :

1. **Accédez à votre projet Supabase**
   - Allez sur https://supabase.com
   - Connectez-vous et sélectionnez votre projet

2. **Créez le bucket "signatures"**
   - Allez dans **Storage** dans le menu de gauche
   - Cliquez sur **New bucket**
   - Nom du bucket : `signatures`
   - Cochez **Public bucket** (pour que les signatures soient accessibles)
   - Cliquez sur **Create bucket**

3. **Configurez les politiques RLS (Row Level Security)**
   - Allez dans **Storage** > **Policies**
   - Créez une politique pour permettre l'upload :
     - Policy name: `Allow authenticated users to upload signatures`
     - Allowed operation: `INSERT`
     - Policy definition: `auth.uid() = (storage.objects).owner`
   
   - Créez une politique pour permettre la lecture :
     - Policy name: `Allow public read access to signatures`
     - Allowed operation: `SELECT`
     - Policy definition: `true` (ou `auth.uid() = (storage.objects).owner` pour plus de sécurité)

## Fonctionnalités des Signatures

### ✅ Caractéristiques légales :
- **Police manuscrite** : Utilisation de polices manuscrites appropriées (Dancing Script, Kalam, Caveat)
- **Horodatage** : Date et heure automatiques sur chaque signature
- **Stockage sécurisé** : Signatures stockées dans Supabase Storage avec authentification
- **Traçabilité** : Chaque signature est liée à un utilisateur et horodatée

### 📝 Utilisation :

1. **Interventions** : Signature client directement dans le formulaire d'intervention
2. **Devis** : Signatures client et entreprise via une boîte de dialogue dédiée
3. **Enregistrement automatique** : Les signatures sont automatiquement sauvegardées lors de l'enregistrement

### 🔒 Sécurité :

- Les signatures sont stockées dans un bucket sécurisé
- Chaque signature est associée à l'ID utilisateur
- Horodatage automatique pour traçabilité légale
- Format PNG pour qualité optimale

