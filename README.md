# AirNex - Analyse Carbone Automatisée

SaaS d'analyse carbone automatisée pour toute entreprise, tous secteurs confondus (BTP, industrie, transport, logistique, services, commerce, tech...).

## 🚀 Fonctionnalités

- **Import automatique** : Importez vos factures PDF, images, CSV, Excel
- **Extraction IA** : Extraction automatique des données grâce à l'IA (OpenAI)
- **Classification intelligente** : Classification automatique des activités selon les scopes GHG Protocol
- **Calculs précis** : Calculs d'émissions avec facteurs d'émission ADEME
- **Dashboard interactif** : Visualisations avec Recharts, graphiques, tendances
- **Recommandations IA** : Recommandations personnalisées pour réduire vos émissions
- **Rapports professionnels** : Génération automatique de bilans carbone, rapports ESG et CSRD
- **Mode démo** : Explorez AirNex sans créer de compte

## 🛠️ Stack Technique

- **Frontend** : Vite + React, TypeScript, TailwindCSS, Shadcn/UI, React Router
- **Backend** : Supabase (PostgreSQL + Storage + Auth + Edge Functions), Prisma ORM
- **IA** : OpenAI (GPT-4) pour extraction, classification, recommandations
- **Graphiques** : Recharts
- **PDF** : PDFKit pour génération de rapports

## 📦 Installation

### Prérequis

- Node.js 20+
- PostgreSQL (ou compte Supabase)
- Compte OpenAI (pour l'IA)

### Étapes

1. **Cloner le projet**
```bash
git clone <repository-url>
cd airnex
```

2. **Installer les dépendances**
```bash
npm install
# ou
bun install
```

3. **Configurer les variables d'environnement**

Créez un fichier `.env` à la racine :

```env
# Supabase (variables Vite)
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=votre_cle_anon_supabase
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role_supabase

# Database (utilisez la connection string de Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# OpenAI
OPENAI_API_KEY=sk-votre_cle_openai

# App (optionnel)
VITE_APP_URL=http://localhost:5000
```

4. **Configurer Supabase**

- Créez un projet Supabase
- Créez un bucket "files" dans Storage avec les permissions appropriées
- Configurez les politiques RLS si nécessaire

5. **Initialiser la base de données**

```bash
# Générer le client Prisma
npm run db:generate

# Appliquer les migrations
npm run db:push
# ou
npm run db:migrate
```

6. **Lancer le serveur de développement**

```bash
npm run dev
```

L'application sera accessible sur [http://localhost:5000](http://localhost:5000)

## 📁 Structure du projet

```
/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── auth/              # Pages d'authentification
│   ├── dashboard/         # Pages du dashboard
│   ├── demo/              # Mode démo
│   └── layout.tsx         # Layout principal
├── components/            # Composants React
│   ├── dashboard/         # Composants dashboard
│   ├── demo/              # Composants démo
│   └── ui/                # Composants Shadcn/UI
├── lib/                   # Utilitaires et configurations
│   ├── prisma.ts          # Client Prisma
│   ├── supabase/          # Clients Supabase
│   ├── openai.ts          # Intégration OpenAI
│   ├── emission-factors.ts # Facteurs d'émission
│   └── pdf-generator.ts   # Génération PDF
├── prisma/                # Schéma Prisma
│   └── schema.prisma
└── public/                # Fichiers statiques
```

## 🎨 Identité visuelle

- **Bleu primaire** : #2E6AEC
- **Vert impact** : #53C259
- **Gris anthracite** : #2E323A
- **Fond crème clair** : #FAFAF5

## 🔐 Authentification

L'authentification est gérée par Supabase Auth. Les utilisateurs peuvent :
- S'inscrire avec email/mot de passe
- Se connecter
- Gérer leur profil
- Inviter des membres d'équipe

## 📊 Utilisation

### 1. Créer un compte

Accédez à `/auth` et créez un compte. Vous serez automatiquement créé comme administrateur de votre entreprise.

### 2. Importer des données

Allez dans `/dashboard/upload` et importez vos factures, fichiers CSV ou Excel. L'IA extraira automatiquement les données.

### 3. Visualiser vos émissions

Le dashboard principal (`/dashboard`) affiche :
- Émissions totales
- Répartition par scope (1, 2, 3)
- Évolution mensuelle
- Émissions par catégorie

### 4. Recevoir des recommandations

La page `/dashboard/recommendations` affiche des recommandations personnalisées générées par l'IA pour réduire vos émissions.

### 5. Générer des rapports

Allez dans `/dashboard/reports` pour générer :
- Bilans carbone
- Rapports ESG
- Rapports CSRD

## 🧪 Mode Démo

Accédez à `/demo` pour explorer AirNex avec des données fictives, sans créer de compte.

## 🚢 Déploiement

### Vercel (recommandé)

1. Connectez votre repository à Vercel
2. Configurez les variables d'environnement
3. Déployez !

### Autres plateformes

AirNex peut être déployé sur n'importe quelle plateforme supportant Next.js :
- Netlify
- Railway
- AWS
- Google Cloud

## 📝 Licence

Propriétaire - Tous droits réservés

## 🤝 Support

Pour toute question ou problème, ouvrez une issue sur le repository.

---

Développé avec ❤️ pour un avenir plus durable
