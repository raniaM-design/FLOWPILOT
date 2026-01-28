# Guide de déploiement FlowPilot sur Vercel

## Prérequis

1. Compte Vercel (gratuit) : [vercel.com](https://vercel.com)
2. Compte Supabase (gratuit) : [supabase.com](https://supabase.com)
3. Projet Git (GitHub, GitLab, ou Bitbucket)

## Étape 1 : Préparer Supabase

### 1.1 Créer un projet Supabase
1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez l'URL du projet et la clé anonyme (anon key)

### 1.2 Exécuter le schéma SQL
1. Dans Supabase Dashboard, allez dans **SQL Editor**
2. Ouvrez le fichier `supabase/schema.sql`
3. Copiez tout le contenu et exécutez-le dans l'éditeur SQL
4. Vérifiez que les tables sont créées : `projets`, `decisions`, `actions`, `priorities`

### 1.3 Récupérer les credentials
1. Allez dans **Settings** > **API**
2. Copiez :
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public** key (clé anonyme)

## Étape 2 : Préparer le projet Git

### 2.1 Vérifier les fichiers
Assurez-vous que ces fichiers sont présents :
- ✅ `package.json`
- ✅ `next.config.ts`
- ✅ `tsconfig.json`
- ✅ `.gitignore` (doit inclure `.env.local`)

### 2.2 Commiter et pousser le code
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

## Étape 3 : Déployer sur Vercel

### 3.1 Importer le projet
1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur **Add New** > **Project**
3. Importez votre repository Git (GitHub/GitLab/Bitbucket)
4. Sélectionnez le repository FlowPilot

### 3.2 Configuration du projet
- **Framework Preset** : Next.js (détecté automatiquement)
- **Root Directory** : `./` (par défaut)
- **Build Command** : `npm run build` (par défaut)
- **Output Directory** : `.next` (par défaut)
- **Install Command** : `npm install` (par défaut)

### 3.3 Variables d'environnement
Cliquez sur **Environment Variables** et ajoutez :

| Variable | Valeur | Environnement |
|----------|--------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `votre_cle_anon_ici` | Production, Preview, Development |

**Important** : Cochez les 3 environnements (Production, Preview, Development)

### 3.4 Déployer
1. Cliquez sur **Deploy**
2. Attendez la fin du build (2-3 minutes)
3. Vercel affichera l'URL de déploiement

## Étape 4 : Checklist de validation

### 4.1 Vérification du build
- [ ] Le build se termine sans erreur
- [ ] Aucune erreur TypeScript dans les logs
- [ ] Aucune erreur ESLint bloquante

### 4.2 Vérification de l'application
- [ ] La page d'accueil (`/`) s'affiche correctement
- [ ] Le lien "Commencer" redirige vers `/login`
- [ ] La page de login s'affiche

### 4.3 Vérification de l'authentification
- [ ] Création de compte fonctionne
- [ ] Connexion fonctionne
- [ ] Redirection vers `/app` après connexion
- [ ] Redirection vers `/login` si non connecté

### 4.4 Vérification du dashboard
- [ ] Le dashboard `/app` s'affiche
- [ ] Le header "FlowPilot" et bouton logout sont visibles
- [ ] Le sélecteur de projet fonctionne
- [ ] La création de projet fonctionne
- [ ] La liste des décisions s'affiche
- [ ] L'ajout de décision fonctionne
- [ ] La liste des actions s'affiche
- [ ] L'ajout d'action fonctionne
- [ ] Le bloc priorités s'affiche (3 champs)
- [ ] La sauvegarde des priorités fonctionne

### 4.5 Vérification des données
- [ ] Les projets créés persistent après refresh
- [ ] Les décisions créées persistent après refresh
- [ ] Les actions créées persistent après refresh
- [ ] Les priorités sauvegardées persistent après refresh

### 4.6 Vérification des erreurs
- [ ] Les messages d'erreur s'affichent correctement
- [ ] Les formulaires se réinitialisent après création
- [ ] Pas d'erreurs dans la console du navigateur

## Étape 5 : Configuration post-déploiement

### 5.1 Domaines personnalisés (optionnel)
1. Allez dans **Settings** > **Domains**
2. Ajoutez votre domaine personnalisé
3. Suivez les instructions DNS

### 5.2 Variables d'environnement supplémentaires
Si vous ajoutez d'autres variables plus tard :
1. Allez dans **Settings** > **Environment Variables**
2. Ajoutez la nouvelle variable
3. Redéployez le projet (ou attendez le prochain commit)

### 5.3 Monitoring
- Vercel fournit des analytics automatiques
- Consultez **Analytics** dans le dashboard pour les métriques

## Dépannage

### Erreur : "Missing Supabase environment variables"
- Vérifiez que les variables sont bien définies dans Vercel
- Vérifiez que les variables sont cochées pour tous les environnements
- Redéployez après modification

### Erreur : "Failed to fetch" ou erreurs CORS
- Vérifiez l'URL Supabase dans les variables d'environnement
- Vérifiez que les RLS policies sont bien configurées dans Supabase

### Erreur de build TypeScript
- Vérifiez que tous les fichiers TypeScript sont valides localement
- Exécutez `npm run build` localement avant de déployer

### Les données ne persistent pas
- Vérifiez que le schéma SQL a bien été exécuté dans Supabase
- Vérifiez les RLS policies dans Supabase Dashboard > Authentication > Policies

## Commandes utiles

### Build local pour tester
```bash
npm run build
npm start
```

### Vérifier les variables d'environnement
```bash
# Dans Vercel Dashboard > Settings > Environment Variables
# Vérifiez que les variables sont présentes
```

### Logs de déploiement
- Consultez **Deployments** dans Vercel Dashboard
- Cliquez sur un déploiement pour voir les logs détaillés

## Support

- Documentation Vercel : [vercel.com/docs](https://vercel.com/docs)
- Documentation Supabase : [supabase.com/docs](https://supabase.com/docs)
- Support Vercel : [vercel.com/support](https://vercel.com/support)

