# FlowPilot MVP - Guide de déploiement

## Étapes de déploiement

### 1. Installation des dépendances
```bash
npm install
```

### 2. Configuration Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Récupérer l'URL du projet et la clé anonyme (anon key)
3. Créer un fichier `.env.local` à la racine du projet :
```
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
```

### 3. Créer la base de données

Dans Supabase Dashboard > SQL Editor, exécuter le contenu du fichier `supabase/schema.sql`

### 4. Lancer le projet en développement
```bash
npm run dev
```

### 5. Déployer sur Vercel

1. Connecter votre repo GitHub à Vercel
2. Ajouter les variables d'environnement dans Vercel :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Déployer

## Structure du projet

- `/app` - Pages Next.js App Router
- `/components` - Composants React réutilisables
- `/lib/supabase` - Configuration Supabase (client, server, middleware)
- `/supabase` - Schéma SQL de la base de données

## Fonctionnalités MVP

✅ Landing page
✅ Authentification (login/signup) avec Supabase
✅ Dashboard protégé
✅ CRUD Projets
✅ CRUD Décisions
✅ CRUD Actions avec priorités
✅ Affichage Top 3 priorités sur le dashboard

