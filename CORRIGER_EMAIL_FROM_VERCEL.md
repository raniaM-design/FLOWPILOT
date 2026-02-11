# 🔧 Corriger l'adresse EMAIL_FROM sur Vercel

## ❌ Problème identifié

Les emails ne sont pas envoyés en production car l'adresse "from" est invalide : `noreply@` (incomplet) au lieu de `no-reply@pilotys.io`.

## ✅ Solution

### 1. Vérifier la configuration actuelle sur Vercel

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet **Pilotys**
3. Allez dans **Settings** → **Environment Variables**
4. Recherchez `EMAIL_FROM`

### 2. Configurer EMAIL_FROM correctement

**Pour Production :**

```
EMAIL_FROM=no-reply@pilotys.io
```

**Important :**
- ✅ Utilisez `no-reply@pilotys.io` (avec le domaine complet)
- ❌ **NE PAS** utiliser `noreply@` (sans domaine)
- ❌ **NE PAS** utiliser `noreply@pilotys.io` (sans tiret)

### 3. Vérifier que le domaine est vérifié dans Resend

1. Allez sur [Resend Dashboard](https://resend.com/domains)
2. Vérifiez que `pilotys.io` est **vérifié** (statut ✅)
3. Si le domaine n'est pas vérifié, suivez les instructions pour ajouter les enregistrements DNS

### 4. Redéployer sur Vercel

Après avoir modifié `EMAIL_FROM` :

1. **Option 1 : Redéploiement automatique**
   - Vercel redéploiera automatiquement si vous avez activé "Redeploy" lors de la modification de la variable

2. **Option 2 : Redéploiement manuel**
   - Allez dans **Deployments**
   - Cliquez sur les **3 points** du dernier déploiement
   - Sélectionnez **Redeploy**

### 5. Vérifier la configuration

Après le redéploiement, vérifiez que la configuration est correcte :

1. Visitez : `https://pilotys.io/api/debug/resend-env`
2. Vérifiez que :
   - `EMAIL_FROM`: `no-reply@pilotys.io`
   - `EMAIL_FROM_VALID`: `✅ Valide`
   - `EMAIL_FROM_DOMAIN`: `pilotys.io`
   - `domainVerified`: `true`

### 6. Tester l'envoi d'email

1. Testez la réinitialisation de mot de passe sur `https://pilotys.io/forgot-password`
2. Vérifiez les logs Vercel pour voir :
   ```
   [email] 📧 Utilisation de Resend pour l'envoi
   [email] From: no-reply@pilotys.io
   [email] ✅ Email envoyé avec succès via Resend!
   [email] Message ID: re_xxxxx
   ```
3. Vérifiez dans [Resend Dashboard → Emails](https://resend.com/emails) que l'email apparaît avec le statut "Delivered"

## 🔍 Diagnostic

### Si l'email n'est toujours pas envoyé

1. **Vérifiez les logs Vercel** :
   - Allez dans **Deployments** → **Logs**
   - Recherchez les lignes contenant `[email]`
   - Vérifiez s'il y a des erreurs

2. **Vérifiez la route de debug** :
   - Visitez `https://pilotys.io/api/debug/resend-env`
   - Vérifiez que toutes les validations sont ✅

3. **Vérifiez Resend Dashboard** :
   - Allez sur [Resend Dashboard → Emails](https://resend.com/emails)
   - Vérifiez le statut de l'email (Delivered/Bounced/Failed)
   - Si "Failed", vérifiez le message d'erreur

## 📋 Checklist de vérification

- [ ] `EMAIL_FROM` est configuré sur Vercel avec la valeur `no-reply@pilotys.io`
- [ ] Le domaine `pilotys.io` est vérifié dans Resend Dashboard
- [ ] Le projet a été redéployé sur Vercel après la modification
- [ ] La route `/api/debug/resend-env` affiche `EMAIL_FROM_VALID: ✅ Valide`
- [ ] Les logs Vercel montrent `[email] From: no-reply@pilotys.io`
- [ ] Les emails apparaissent dans Resend Dashboard avec le statut "Delivered"

## 💡 Notes importantes

- **Format de l'adresse** : Doit être au format `user@domain.com`
- **Domaine vérifié** : Le domaine doit être vérifié dans Resend pour éviter les spams
- **Redéploiement** : Les modifications de variables d'environnement nécessitent un redéploiement
- **Environnements** : Assurez-vous de configurer `EMAIL_FROM` pour **Production**, **Preview** et **Development** si nécessaire

