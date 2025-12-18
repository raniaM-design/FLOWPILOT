# FlowPilot

Application de gestion de projets, décisions et actions construite avec Next.js et Supabase.

## Configuration

### Variables d'environnement

Créez un fichier `.env.local` à la racine du projet avec les variables suivantes :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_ici
```

**Comment obtenir ces valeurs :**
1. Créez un projet sur [supabase.com](https://supabase.com)
2. Allez dans Settings > API
3. Copiez l'URL du projet et la clé anonyme (anon key)

## Getting Started

First, install dependencies and set up environment variables:

```bash
npm install
# Créez .env.local avec vos credentials Supabase
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Déploiement sur Vercel

Pour déployer FlowPilot sur Vercel, consultez le guide complet :

📖 **[VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)** - Guide détaillé de déploiement

### Résumé rapide

1. **Préparer Supabase**
   - Créer un projet sur [supabase.com](https://supabase.com)
   - Exécuter le schéma SQL (`supabase/schema.sql`)
   - Récupérer l'URL et la clé anonyme

2. **Déployer sur Vercel**
   - Importer le projet depuis Git
   - Ajouter les variables d'environnement :
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Déployer

3. **Valider**
   - Utiliser la checklist : **[DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md)**

## Documentation

- [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) - Guide de déploiement complet
- [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) - Checklist de validation
- [supabase/schema.sql](./supabase/schema.sql) - Schéma de base de données

## Support

- Documentation Vercel : [vercel.com/docs](https://vercel.com/docs)
- Documentation Supabase : [supabase.com/docs](https://supabase.com/docs)
