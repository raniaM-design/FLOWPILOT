# 🔒 Correction avancée de l'erreur CSRF State Mismatch (v2)

## ❌ Erreur persistante

```
{"error":"invalid_state","details":"CSRF state mismatch. The state from Microsoft does not match the stored cookie.","hint":"This could indicate a CSRF attack or expired session"}
```

## 🔍 Diagnostic amélioré

Si l'erreur persiste après la première correction (`sameSite: "none"`), cela peut indiquer :

1. **Problème d'encodage URL** : Le state pourrait être encodé différemment entre le cookie et l'URL
2. **Problème de domaine** : Le cookie pourrait être défini sur un domaine différent de celui du callback
3. **Cookie non envoyé** : Même avec `sameSite: "none"`, le cookie pourrait ne pas être envoyé
4. **Expiration** : Le cookie pourrait expirer entre la redirection et le callback

## ✅ Améliorations appliquées

### 1. Logs de diagnostic détaillés

**Fichier** : `app/api/outlook/callback/route.ts`

Ajout de logs complets pour diagnostiquer le problème :
- Comparaison des longueurs de state (stocké vs reçu)
- Preview des states pour identifier les différences
- Liste de tous les cookies disponibles
- Vérification des headers de cookie
- Informations sur le domaine et le protocole du callback

### 2. Comparaison robuste des states

Le code compare maintenant :
- State brut du cookie vs state de l'URL
- State décodé (au cas où il serait double-encodé)
- Comparaison caractère par caractère pour identifier les différences

### 3. Logs améliorés dans `/connect`

**Fichier** : `app/api/outlook/connect/route.ts`

Ajout de logs détaillés sur :
- La configuration du cookie (sameSite, secure, etc.)
- Le preview du state stocké
- L'URL Vercel et l'URL de l'application

## 🧪 Vérification avec les nouveaux logs

### 1. Vérifier les logs Vercel après connexion

**Logs de `/api/outlook/connect`** :
```
[outlook-connect] Cookie OAuth state défini: {
  hasState: true,
  stateLength: XXX,
  secure: true,
  sameSite: "none",
  statePreview: "uuid:jwt-token...",
  ...
}
```

**Logs de `/api/outlook/callback`** :
```
[outlook-callback] state validation: {
  hasStoredState: true/false,  // ← Vérifier si le cookie est présent
  storedStateLength: XXX,
  receivedStateLength: XXX,
  statesMatch: true/false,  // ← Doit être true
  storedStatePreview: "...",
  receivedStatePreview: "...",
  allCookies: [...],  // ← Vérifier si outlook_oauth_state est présent
  hasCookieHeader: true/false,
  cookieHeaderContainsState: true/false,
  callbackHost: "votre-domaine.vercel.app",
  ...
}
```

### 2. Analyser les différences

Si `statesMatch: false`, vérifiez dans les logs :

1. **Le cookie est-il présent ?**
   - `hasStoredState: false` → Le cookie n'est pas lu
   - `cookieHeaderContainsState: false` → Le cookie n'est pas envoyé par le navigateur

2. **Les longueurs correspondent-elles ?**
   - Si `storedStateLength !== receivedStateLength` → Problème d'encodage ou de troncature

3. **Les previews correspondent-ils ?**
   - Comparez `storedStatePreview` et `receivedStatePreview`
   - Si les premiers caractères diffèrent → Le state est différent dès le début

4. **Le domaine est-il correct ?**
   - Vérifiez `callbackHost` dans les logs
   - Assurez-vous qu'il correspond au domaine où le cookie a été défini

## 🔧 Solutions possibles selon le diagnostic

### Cas 1 : Cookie non présent (`hasStoredState: false`)

**Cause** : Le cookie n'est pas envoyé par le navigateur

**Solutions** :
1. Vérifier que `sameSite: "none"` et `secure: true` sont bien configurés
2. Vérifier que vous utilisez HTTPS (requis pour `sameSite: "none"`)
3. Vérifier que le domaine du cookie correspond au domaine du callback
4. Tester dans un navigateur différent (certains navigateurs bloquent les cookies third-party)

### Cas 2 : States de longueurs différentes

**Cause** : Problème d'encodage URL ou de troncature

**Solutions** :
1. Vérifier que le state n'est pas tronqué dans l'URL
2. Vérifier l'encodage URL (le state contient `:` qui pourrait être encodé)
3. Comparer les previews pour identifier où commence la différence

### Cas 3 : States de même longueur mais différents

**Cause** : Le state a été modifié ou remplacé

**Solutions** :
1. Vérifier qu'il n'y a pas plusieurs appels à `/connect` qui écrasent le cookie
2. Vérifier que le state n'est pas modifié par un middleware ou un proxy
3. Vérifier les logs pour voir si plusieurs states sont générés

## 📋 Checklist de diagnostic

- [ ] Vérifier les logs Vercel pour `/api/outlook/connect`
- [ ] Vérifier les logs Vercel pour `/api/outlook/callback`
- [ ] Comparer `storedStatePreview` et `receivedStatePreview`
- [ ] Vérifier `hasStoredState` dans les logs
- [ ] Vérifier `cookieHeaderContainsState` dans les logs
- [ ] Vérifier `callbackHost` correspond au domaine attendu
- [ ] Vérifier que `sameSite: "none"` est bien utilisé sur Vercel
- [ ] Vérifier que `secure: true` est bien utilisé sur Vercel

## 🔄 Prochaines étapes

1. **Déployer les modifications** :
   ```bash
   git add .
   git commit -m "Amélioration diagnostic CSRF state mismatch avec logs détaillés"
   git push
   ```

2. **Tester la connexion Outlook** sur Vercel

3. **Analyser les logs Vercel** avec les nouveaux détails

4. **Partager les logs** si le problème persiste pour diagnostic approfondi

## 📚 Références

- [MDN: SameSite cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [Next.js Cookies API](https://nextjs.org/docs/app/api-reference/functions/cookies)
- [Vercel Cookie Handling](https://vercel.com/docs/concepts/functions/serverless-functions/cookies)

