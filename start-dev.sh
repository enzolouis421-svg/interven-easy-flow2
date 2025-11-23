#!/bin/bash

# Script pour démarrer l'application sur le port 5000
# Ce script libère le port 5000 si nécessaire

echo "🚀 Démarrage de l'application sur le port 5000..."

# Vérifier si le port 5000 est occupé
PORT_5000_PID=$(lsof -ti:5000 2>/dev/null)

if [ ! -z "$PORT_5000_PID" ]; then
    echo "⚠️  Le port 5000 est occupé par le processus PID: $PORT_5000_PID"
    echo "Tentative de libération du port..."
    
    # Tuer le processus qui occupe le port 5000 (sauf si c'est ControlCenter système)
    PROCESS_NAME=$(ps -p $PORT_5000_PID -o comm= 2>/dev/null)
    
    if [ "$PROCESS_NAME" != "ControlCenter" ]; then
        kill -9 $PORT_5000_PID 2>/dev/null
        echo "✅ Port 5000 libéré"
    else
        echo "⚠️  Le port 5000 est occupé par ControlCenter (service macOS)"
        echo "💡 Solution: Désactivez temporairement AirPlay Receiver dans les Préférences Système > Partage"
        echo "   Ou utilisez un autre port en modifiant vite.config.ts"
        exit 1
    fi
fi

# Attendre un peu pour que le port soit libéré
sleep 1

# Démarrer l'application
export PATH="$PWD/node-v20.10.0-darwin-arm64/bin:$PATH"
npm run dev
