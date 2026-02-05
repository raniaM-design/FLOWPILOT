# 🔒 Correction de l'erreur CSRF State Mismatch

## ❌ Erreur

```
{"error":"invalid_state","details":"CSRF state mismatch. The state from Microsoft does not match the stored cookie.","hint":"This could indicate a CSRF attack or expired session"}
```

## 🔍 Cause

Cette erreur se produit lorsque le cookie `outlook_oauth_state` n'est pas correctement envoyé lors de la redirection depuis Microsoft vers votre application Vercel.

**Problème principal** : Le cookie était configuré avec `sameSite: "lax"`, ce qui empêche le cookie d'être envoyé lors d'une redirection cross-site depuis `login.microsoftonline.com` vers votre application Vercel.

## ✅ Solution appliquée

### 1. Modification de la configuration du cookie

**Fichier** : `app/api/outlook/connect/route.ts`

Le cookie utilise maintenant :
- `sameSite: "none"` sur Vercel (pour permettre les redirections cross-site)
- `secure: true` sur Vercel (requis pour `sameSite: "none"`)
- `sameSite: "lax"` en développement local (pour compatibilité)

```typescript
// Pour les redirections OAuth cross-site depuis Microsoft, utiliser sameSite: "none" avec secure: true
const sameSiteValue = (isVercel || useSecure) ? "none" : "lax";

cookieStore.set("outlook_oauth_state", state, {
  httpOnly: true,
  secure: useSecure ?? false,
  sameSite: sameSiteValue as "lax" | "none" | "strict",
  path: "/",
  maxAge: 3600, // 1 heure
});
```

### 2. Amélioration des logs de diagnostic

**Fichier** : `app/api/outlook/callback/route.ts`

Ajout de logs détaillés pour diagnostiquer les problèmes de cookie :
- Preview du state stocké vs reçu
- Liste de tous les cookies disponibles
- Informations sur l'environnement (Vercel, NODE_ENV)

## 🧪 Vérification

### 1. Vérifier les logs Vercel

Après le déploiement, vérifiez les logs lors de la connexion Outlook :

1. **Logs de `/api/outlook/connect`** :
   ```
   [outlook-connect] Cookie OAuth state défini: {
     hasState: true,
     stateLength: XXX,
     secure: true,
     sameSite: "none",
     isVercel: true,
     ...
   }
   ```

2. **Logs de `/api/outlook/callback`** :
   ```
   [outlook-callback] state validation: {
     hasStoredState: true,
     storedStateLength: XXX,
     receivedStateLength: XXX,
     statesMatch: true,  // ← Doit être true
     ...
   }
   ```

### 2. Si le problème persiste

Si `statesMatch: false` ou `hasStoredState: false`, vérifiez :

1. **Le cookie est-il présent ?**
   - Regardez `allCookies` dans les logs pour voir si `outlook_oauth_state` est présent

2. **Le domaine du cookie est-il correct ?**
   - Le cookie doit être défini sur le même domaine que votre application Vercel
   - Vérifiez que vous n'utilisez pas un sous-domaine différent

3. **Le cookie expire-t-il trop vite ?**
   - Le `maxAge` est de 3600 secondes (1 heure)
   - Si la redirection prend plus d'une heure, le cookie expirera

4. **Y a-t-il plusieurs instances Vercel ?**
   - Si vous avez plusieurs déploiements (preview, production), assurez-vous d'utiliser le bon domaine

## 📋 Checklist de vérification

- [ ] Le code a été déployé sur Vercel
- [ ] Les logs montrent `sameSite: "none"` sur Vercel
- [ ] Les logs montrent `secure: true` sur Vercel
- [ ] Les logs de callback montrent `hasStoredState: true`
- [ ] Les logs de callback montrent `statesMatch: true`
- [ ] La connexion Outlook fonctionne sans erreur CSRF

## 🔄 Prochaines étapes

1. **Déployer les modifications** :
   ```bash
   git add .
   git commit -m "Fix CSRF state mismatch: use sameSite none for OAuth cookies on Vercel"
   git push
   ```

2. **Tester la connexion Outlook** sur Vercel

3. **Vérifier les logs Vercel** pour confirmer que le cookie est bien lu

## 📚 Références

- [MDN: SameSite cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [Next.js Cookies API](https://nextjs.org/docs/app/api-reference/functions/cookies)

