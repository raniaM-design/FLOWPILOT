#!/bin/bash
# Script pour appliquer les migrations Prisma après le build sur Vercel
# Ce script sera exécuté automatiquement par Vercel après le build

echo "🔄 Application des migrations Prisma..."

# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate deploy

echo "✅ Migrations appliquées avec succès"

