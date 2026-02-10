# 🚀 Configuration rapide de Resend

## Étape 1 : Vérifier votre fichier `.env.local`

Le fichier `.env.local` existe déjà. Vérifiez qu'il contient ces lignes :

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@pilotys.io
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Étape 2 : Obtenir votre clé API Resend

1. **Créez un compte** sur [resend.com](https://resend.com) (gratuit)
2. **Connectez-vous** et allez dans **API Keys**
3. **Cliquez sur "Create API Key"**
4. **Donnez un nom** (ex: "PILOTYS Development")
5. **Copiez la clé** (elle commence par `re_`)

## Étape 3 : Configurer `.env.local`

Ouvrez `.env.local` dans un éditeur de texte et remplacez :

```env
# Remplacez cette ligne :
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Par votre vraie clé (gardez le re_ au début) :
RESEND_API_KEY=re_VOTRE_VRAIE_CLE_ICI
```

**Pour `EMAIL_FROM` :**
- **En développement** : Utilisez `onboarding@resend.dev` (domaine de test, pas besoin de vérification)
- **En production** : Utilisez votre domaine vérifié (ex: `noreply@pilotys.io`)

**Pour `NEXT_PUBLIC_APP_URL` :**
- **En local** : `http://localhost:3000`
- **En production** : `https://pilotys.io`

## Étape 4 : Redémarrer le serveur

Après avoir modifié `.env.local`, **redémarrez votre serveur** :

```bash
# Arrêtez le serveur (Ctrl+C)
# Puis relancez :
npm run dev
```

## Étape 5 : Tester

```bash
# Vérifier la configuration
npm run test:resend

# Envoyer un email de test
npm run test:resend votre-email@example.com
```

## ⚠️ Important

- **Ne partagez jamais** votre `RESEND_API_KEY` publiquement
- Le fichier `.env.local` est dans `.gitignore` et ne sera pas commité (c'est normal)
- Pour la production sur Vercel, ajoutez ces variables dans **Vercel Dashboard → Settings → Environment Variables**

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez que `.env.local` est à la racine du projet** (même niveau que `package.json`)
2. **Vérifiez qu'il n'y a pas d'espaces** autour du `=` (ex: `RESEND_API_KEY = xxx` est incorrect)
3. **Redémarrez complètement** votre terminal et votre serveur
4. **Vérifiez les logs** du serveur pour voir si les variables sont chargées

## 📚 Documentation complète

Consultez `RESEND_SETUP.md` pour plus de détails sur :
- La vérification de domaine dans Resend
- Le dépannage avancé
- La configuration sur Vercel

