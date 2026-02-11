# 🔧 Résolution : Erreur "restricted_api_key" avec Resend

## Problème

Vous recevez l'erreur suivante lors de l'envoi d'emails via Resend :

```json
{
  "name": "restricted_api_key",
  "message": "This API key is restricted to only send emails",
  "statusCode": 401
}
```

## Cause

Cette erreur indique que votre clé API Resend est **restreinte** et n'a pas les permissions nécessaires pour envoyer des emails, ou qu'elle est mal configurée.

## ✅ Solutions

### Solution 1 : Vérifier et créer une nouvelle clé API (Recommandé)

1. **Allez sur Resend Dashboard** :
   - Connectez-vous sur [resend.com](https://resend.com)
   - Allez dans **API Keys** (menu de gauche)

2. **Vérifiez votre clé API actuelle** :
   - Regardez la clé que vous utilisez dans vos variables d'environnement
   - Vérifiez ses permissions

3. **Créez une nouvelle clé API** :
   - Cliquez sur **"Create API Key"**
   - Donnez-lui un nom (ex: "PILOTYS Production")
   - **IMPORTANT** : Assurez-vous que la clé a la permission **"Send Emails"** activée
   - Ne créez PAS une clé "restricted" - utilisez une clé complète

4. **Copiez la nouvelle clé** :
   - La clé commence par `re_`
   - Copiez-la complètement (elle ne sera affichée qu'une seule fois)

5. **Mettez à jour vos variables d'environnement** :
   - **Local** : Mettez à jour `.env.local` :
     ```env
     RESEND_API_KEY=re_VOTRE_NOUVELLE_CLE_ICI
     ```
   - **Vercel** : Allez dans Vercel Dashboard → Settings → Environment Variables
     - Modifiez `RESEND_API_KEY` avec la nouvelle clé
     - Assurez-vous qu'elle est définie pour **Production**

6. **Redéployez** :
   - Si vous êtes sur Vercel, redéployez l'application
   - Si vous êtes en local, redémarrez le serveur (`npm run dev`)

### Solution 2 : Vérifier le format de la clé API

Assurez-vous que votre clé API :
- ✅ Commence par `re_`
- ✅ N'a pas d'espaces avant ou après
- ✅ N'est pas entre guillemets dans `.env.local` ou Vercel
- ✅ Est complète (pas tronquée)

**Format correct** :
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Format incorrect** :
```env
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # ❌ Guillemets
RESEND_API_KEY= re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx   # ❌ Espace avant
RESEND_API_KEY=re_xxx                              # ❌ Clé tronquée
```

### Solution 3 : Utiliser une clé API complète (non restreinte)

Si vous avez créé une clé API "restricted" par erreur :

1. **Dans Resend Dashboard → API Keys** :
   - Supprimez l'ancienne clé restreinte (optionnel)
   - Créez une nouvelle clé avec **toutes les permissions** (pas seulement "Send Emails")

2. **Utilisez cette nouvelle clé** dans vos variables d'environnement

## 🔍 Vérification

### 1. Vérifier que la clé est bien chargée

**En local** :
```bash
# Vérifiez que la clé est dans .env.local
cat .env.local | grep RESEND_API_KEY
```

**Sur Vercel** :
- Visitez `https://votre-domaine.vercel.app/api/debug/resend-env`
- Vérifiez que `RESEND_API_KEY` affiche "✅ Configuré"

### 2. Tester l'envoi d'email

**En local** :
```bash
npm run test:resend votre-email@example.com
```

**Sur Vercel** :
- Utilisez la fonctionnalité "Mot de passe oublié" sur votre site
- Vérifiez les logs Vercel pour voir si l'email est envoyé

### 3. Vérifier les logs

Dans les logs Vercel ou locaux, vous devriez voir :
```
[email] ✅ Resend détecté (RESEND_API_KEY configuré)
[email] 📧 Utilisation de Resend pour l'envoi
[email] ✅ Email envoyé avec succès via Resend!
```

Si vous voyez toujours l'erreur "restricted_api_key", la clé API n'est pas correcte.

## 📋 Checklist de résolution

- [ ] Clé API créée dans Resend Dashboard → API Keys
- [ ] Clé API a la permission "Send Emails" (ou toutes les permissions)
- [ ] Clé API commence par `re_`
- [ ] Clé API complète (pas tronquée)
- [ ] `RESEND_API_KEY` configurée dans `.env.local` (local) ou Vercel (production)
- [ ] Pas de guillemets autour de la clé dans les variables d'environnement
- [ ] Application redéployée après modification de la clé (Vercel)
- [ ] Serveur redémarré après modification de `.env.local` (local)
- [ ] Route `/api/debug/resend-env` affiche "✅ Configuré" pour `RESEND_API_KEY`
- [ ] Test d'envoi d'email réussi

## 🆘 Si le problème persiste

1. **Vérifiez votre compte Resend** :
   - Assurez-vous que votre compte est actif
   - Vérifiez que vous n'avez pas atteint les limites d'envoi

2. **Contactez le support Resend** :
   - Si le problème persiste, contactez le support Resend avec :
     - Le message d'erreur complet
     - Le type de clé API que vous utilisez
     - Votre ID de compte Resend

3. **Vérifiez les logs détaillés** :
   - Les logs Vercel devraient maintenant afficher plus d'informations sur l'erreur
   - Recherchez les lignes commençant par `[email] ❌`

## 💡 Note importante

Les clés API Resend peuvent être :
- **Complètes** : Accès à toutes les fonctionnalités
- **Restreintes** : Accès limité à certaines fonctionnalités

Pour PILOTYS, utilisez une clé API **complète** ou une clé restreinte avec au minimum la permission **"Send Emails"**.

