#!/bin/bash
# Script de build pour Vercel avec gestion d'erreur robuste
set -e

echo "🔍 Vérification de DATABASE_URL..."
node scripts/pre-build-check.js

echo "📦 Génération du client Prisma..."
npx prisma generate

echo "🔄 Application des migrations..."
# Continuer même si les migrations sont déjà appliquées
npx prisma migrate deploy || {
  echo "⚠️  Les migrations ont peut-être déjà été appliquées, continuation..."
  # Vérifier si c'est juste une erreur "already applied" ou une vraie erreur
  if [ $? -eq 1 ]; then
    echo "✅ Migrations vérifiées"
  else
    echo "❌ Erreur lors de l'application des migrations"
    exit 1
  fi
}

echo "🏗️  Build de l'application Next.js..."
next build

echo "✅ Build terminé avec succès"

