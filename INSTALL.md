# Guide d'installation AirNex

## 🚀 Installation rapide

### 1. Installer les dépendances

```bash
npm install
# ou
bun install
```

### 2. Configurer Supabase

1. Créez un compte sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez votre URL et vos clés API
4. Dans Storage, créez un bucket nommé `files` avec les permissions publiques en lecture

### 3. Configurer la base de données

Créez un fichier `.env` à la racine :

```env
# Supabase (variables Vite - REQUIS)
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=votre_cle_anon_supabase
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role_supabase

# Database (utilisez la connection string de Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# OpenAI (pour les fonctionnalités IA)
OPENAI_API_KEY=sk-votre_cle_openai

# App (optionnel)
VITE_APP_URL=http://localhost:5000
```

### 4. Initialiser Prisma

```bash
# Générer le client Prisma
npm run db:generate

# Appliquer le schéma à la base de données
npm run db:push
```

### 5. Lancer l'application

```bash
npm run dev
```

L'application sera accessible sur [http://localhost:5000](http://localhost:5000)

## 📝 Notes importantes

- **OpenAI** : Vous devez avoir une clé API OpenAI valide pour utiliser les fonctionnalités d'extraction et de recommandation IA
- **Supabase Storage** : Assurez-vous que le bucket `files` est créé et configuré correctement
- **Base de données** : Le schéma Prisma sera automatiquement appliqué lors de `db:push`

## 🐛 Dépannage

### Erreur "Module not found"
Assurez-vous d'avoir installé toutes les dépendances avec `npm install`

### Erreur de connexion à la base de données
Vérifiez votre `DATABASE_URL` dans le fichier `.env`

### Erreur Supabase
Vérifiez que vos clés API Supabase sont correctes et que le bucket `files` existe











