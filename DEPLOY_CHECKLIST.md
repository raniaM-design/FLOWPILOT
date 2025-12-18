# Checklist de déploiement FlowPilot

## ✅ Pré-déploiement

### Supabase
- [ ] Projet Supabase créé
- [ ] Schéma SQL exécuté (`supabase/schema.sql`)
- [ ] Tables créées : `projets`, `decisions`, `actions`, `priorities`
- [ ] RLS policies activées
- [ ] URL du projet copiée
- [ ] Clé anonyme (anon key) copiée

### Code
- [ ] Code commité et poussé sur Git
- [ ] `.env.local` dans `.gitignore` (ne pas commiter les secrets)
- [ ] `package.json` à jour
- [ ] Build local fonctionne : `npm run build`

## ✅ Déploiement Vercel

### Configuration projet
- [ ] Projet importé depuis Git
- [ ] Framework détecté : Next.js
- [ ] Root directory : `./`
- [ ] Build command : `npm run build`
- [ ] Output directory : `.next`

### Variables d'environnement
- [ ] `NEXT_PUBLIC_SUPABASE_URL` ajoutée
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` ajoutée
- [ ] Variables cochées pour Production
- [ ] Variables cochées pour Preview
- [ ] Variables cochées pour Development

### Build
- [ ] Déploiement lancé
- [ ] Build réussi sans erreurs
- [ ] URL de déploiement obtenue

## ✅ Tests fonctionnels

### Pages publiques
- [ ] Landing page (`/`) s'affiche
- [ ] Page login (`/login`) s'affiche
- [ ] Formulaire login fonctionne

### Authentification
- [ ] Création de compte fonctionne
- [ ] Connexion fonctionne
- [ ] Redirection `/app` après connexion
- [ ] Redirection `/login` si non connecté
- [ ] Déconnexion fonctionne

### Dashboard (`/app`)
- [ ] Dashboard s'affiche
- [ ] Header "FlowPilot" visible
- [ ] Bouton logout visible

### Projets
- [ ] Sélecteur de projet s'affiche
- [ ] Création de projet fonctionne
- [ ] Projet créé apparaît dans la liste
- [ ] Description du projet s'affiche

### Décisions
- [ ] Liste des décisions s'affiche
- [ ] Formulaire "Ajouter une décision" fonctionne
- [ ] Décision créée apparaît dans la liste
- [ ] Décisions persistent après refresh

### Actions
- [ ] Liste des actions s'affiche
- [ ] Formulaire "Ajouter une action" fonctionne
- [ ] Champ priorité fonctionne (1-10)
- [ ] Action créée apparaît dans la liste
- [ ] Badge de priorité s'affiche
- [ ] Actions persistent après refresh

### Priorités
- [ ] Bloc priorités s'affiche (3 champs)
- [ ] Dropdowns contiennent les actions disponibles
- [ ] Sélection d'actions fonctionne
- [ ] Bouton "Enregistrer les priorités" fonctionne
- [ ] Priorités sauvegardées persistent après refresh
- [ ] Maximum 3 priorités respecté

## ✅ Tests techniques

### Performance
- [ ] Page se charge rapidement (< 3s)
- [ ] Pas d'erreurs dans la console navigateur
- [ ] Images/assets se chargent correctement

### Responsive
- [ ] Interface fonctionne sur desktop
- [ ] Interface fonctionne sur mobile
- [ ] Grille responsive (2 colonnes → 1 colonne)

### Sécurité
- [ ] Variables d'environnement non exposées côté client
- [ ] RLS policies Supabase actives
- [ ] Utilisateur ne peut voir que ses propres données

### Données
- [ ] Connexion Supabase fonctionne
- [ ] Requêtes SQL fonctionnent
- [ ] Données persistées en base
- [ ] Pas de fuite de données entre utilisateurs

## ✅ Post-déploiement

### Monitoring
- [ ] Analytics Vercel activés
- [ ] Logs de déploiement consultés
- [ ] Pas d'erreurs dans les logs

### Documentation
- [ ] URL de production notée
- [ ] Variables d'environnement documentées
- [ ] Accès Supabase sauvegardé

### Optionnel
- [ ] Domaine personnalisé configuré
- [ ] SSL/HTTPS vérifié (automatique sur Vercel)
- [ ] Redirections configurées si nécessaire

## 🐛 En cas d'erreur

### Build échoue
1. Vérifier les logs dans Vercel Dashboard
2. Tester le build local : `npm run build`
3. Vérifier les erreurs TypeScript/ESLint

### Variables d'environnement manquantes
1. Vérifier dans Settings > Environment Variables
2. Vérifier que toutes les variables sont cochées
3. Redéployer après modification

### Erreurs Supabase
1. Vérifier l'URL et la clé dans Vercel
2. Vérifier les RLS policies dans Supabase
3. Vérifier que le schéma SQL est exécuté

### Données ne persistent pas
1. Vérifier les RLS policies dans Supabase
2. Vérifier que l'utilisateur est bien authentifié
3. Vérifier les logs Supabase Dashboard > Logs

