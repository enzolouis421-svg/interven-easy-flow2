# Configuration du Port 5000

## Problème : Port 5000 occupé par ControlCenter

Si vous rencontrez l'erreur "Port 5000 is already in use", c'est probablement parce que **AirPlay Receiver** (ControlCenter) utilise ce port sur macOS.

## Solutions

### Solution 1 : Désactiver AirPlay Receiver (Recommandé)

1. Ouvrez **Préférences Système** (ou **Réglages Système** sur macOS Ventura+)
2. Allez dans **Partage** (ou **Général > Partage**)
3. Décochez **AirPlay Receiver** (ou **Récepteur AirPlay**)
4. Relancez l'application avec `npm run dev`

### Solution 2 : Utiliser le script de démarrage

Le script `start-dev.sh` tentera automatiquement de libérer le port :

```bash
./start-dev.sh
```

### Solution 3 : Modifier le port dans vite.config.ts

Si vous ne pouvez pas désactiver AirPlay Receiver, modifiez `vite.config.ts` :

```typescript
server: {
  host: "::",
  port: 5001, // ou un autre port disponible
  strictPort: false,
},
```

## Vérification

Pour vérifier quel processus utilise le port 5000 :

```bash
lsof -i :5000
```

Pour tuer un processus spécifique (remplacez PID par le numéro du processus) :

```bash
kill -9 PID
```

**⚠️ Attention** : Ne tuez pas ControlCenter, c'est un service système macOS important.

