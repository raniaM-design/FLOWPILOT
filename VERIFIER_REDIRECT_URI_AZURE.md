# ✅ Vérification redirect_uri Azure AD

## 📋 Redirect URI utilisé par votre application

D'après les logs Vercel, votre application utilise :
```
https://flowpilot-app.vercel.app/api/outlook/callback
```

## ✅ Action requise : Vérifier dans Azure AD

### Étape 1 : Accéder à Azure AD

1. Allez sur **https://portal.azure.com**
2. Connectez-vous avec votre compte Azure
3. **Azure Active Directory** → **App registrations**
4. Trouvez votre application (celle avec le Client ID `2d149257...`)
5. Cliquez sur votre application

### Étape 2 : Vérifier les Redirect URIs

1. Dans le menu de gauche, cliquez sur **"Authentication"**
2. Regardez la section **"Redirect URIs"**
3. **Vérifiez** que cette URL exacte est présente :
   ```
   https://flowpilot-app.vercel.app/api/outlook/callback
   ```

### Étape 3 : Ajouter si manquant

Si cette URL n'est **pas** dans la liste :

1. Cliquez sur **"Add a platform"** → **"Web"** (si pas déjà fait)
2. Dans **"Redirect URIs"**, cliquez sur **"Add URI"**
3. **Collez exactement** cette URL :
   ```
   https://flowpilot-app.vercel.app/api/outlook/callback
   ```
4. **⚠️ IMPORTANT** :
   - Pas de trailing slash (`/` à la fin)
   - Commence par `https://` (pas `http://`)
   - Domaine exact : `flowpilot-app.vercel.app`
   - Chemin exact : `/api/outlook/callback`
5. Cliquez sur **"Save"**

### Étape 4 : Vérifier la correspondance exacte

Le redirect_uri dans Azure AD doit être **EXACTEMENT** :
```
https://flowpilot-app.vercel.app/api/outlook/callback
```

**Vérifications** :
- ✅ Commence par `https://` (pas `http://`)
- ✅ Domaine : `flowpilot-app.vercel.app` (exactement)
- ✅ Chemin : `/api/outlook/callback` (exactement)
- ✅ Pas de trailing slash à la fin
- ✅ Pas de port (`:443` ou autre)
- ✅ Pas d'espaces avant/après

### Étape 5 : Gérer les preview deployments (optionnel)

Si vous voulez aussi supporter les preview deployments sur Vercel, vous pouvez ajouter :
```
https://*.vercel.app/api/outlook/callback
```

**Note** : Azure AD ne supporte pas les wildcards (`*`), donc vous devrez :
- Soit ajouter chaque preview URL manuellement dans Azure AD
- Soit utiliser uniquement le domaine de production (`flowpilot-app.vercel.app`)

**Recommandation** : Utilisez uniquement le domaine de production pour éviter les problèmes.

## 🔍 Diagnostic

### Si l'erreur persiste après avoir ajouté le redirect_uri

1. **Attendez quelques minutes** : Les changements Azure AD peuvent prendre 1-2 minutes pour être propagés

2. **Vérifiez à nouveau** :
   - Azure Portal → App registrations → Authentication
   - Confirmez que l'URL est bien dans la liste
   - Vérifiez qu'il n'y a pas de différences (espaces, trailing slash, etc.)

3. **Vérifiez les logs Vercel** :
   - Cherchez `[outlook-connect] Redirect URI utilisé:`
   - Comparez caractère par caractère avec Azure AD

4. **Testez à nouveau** la connexion Outlook

## 📋 Checklist

- [ ] Azure Portal ouvert → App registrations → Votre application
- [ ] Section Authentication → Redirect URIs vérifiée
- [ ] URL `https://flowpilot-app.vercel.app/api/outlook/callback` présente dans la liste
- [ ] URL correspond EXACTEMENT (pas de trailing slash, bon protocole, bon domaine)
- [ ] Changements sauvegardés dans Azure AD
- [ ] Attendu 1-2 minutes pour la propagation
- [ ] Test de connexion Outlook effectué

## 🆘 Si ça ne fonctionne toujours pas

Partagez-moi :
1. **Les redirect URIs enregistrés dans Azure AD** (sans révéler d'informations sensibles)
2. **Le redirect_uri utilisé** (des logs Vercel) : `https://flowpilot-app.vercel.app/api/outlook/callback`
3. **Toute différence** que vous remarquez entre les deux

Mais normalement, si vous ajoutez exactement `https://flowpilot-app.vercel.app/api/outlook/callback` dans Azure AD, ça devrait fonctionner ! 🎉

