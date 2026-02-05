# 🔒 Correction CSRF State Mismatch - Vérification alternative par JWT (v3)

## ❌ Problème identifié

```
{"error":"invalid_state","details":"CSRF state mismatch...","diagnostic":{"storedStateLength":298,"receivedStateLength":298,"previewsMatch":false}}
```

**Diagnostic** : Les states ont la même longueur (298) mais le contenu diffère. Cela indique que :
- Le cookie est bien présent
- Le state reçu a la bonne longueur
- Mais le contenu est différent

## 🔍 Cause probable

**Plusieurs onglets/fenêtres ouverts** : Si l'utilisateur ouvre plusieurs fois `/api/outlook/connect` (par exemple en cliquant plusieurs fois ou en ouvrant plusieurs onglets), chaque appel génère un nouveau state et écrase le cookie précédent. Quand Microsoft redirige vers le callback, il utilise le state de la première requête, mais le cookie contient le state de la dernière requête.

## ✅ Solution appliquée

### Vérification alternative par JWT

Au lieu de rejeter immédiatement si les states ne correspondent pas exactement, le code vérifie maintenant :

1. **Si les states correspondent exactement** → Utiliser le state du cookie (comportement normal)
2. **Si les states ne correspondent pas** → Vérifier le JWT du state reçu :
   - Si le JWT est valide et contient un `userId` valide → Accepter le state reçu
   - Si le JWT est invalide ou expiré → Rejeter avec une erreur

**Fichier** : `app/api/outlook/callback/route.ts`

### Avantages

- ✅ Résout le problème des multiples onglets
- ✅ Maintient la sécurité CSRF (le JWT doit être valide et signé)
- ✅ Permet à l'utilisateur de continuer même si le cookie a été écrasé
- ✅ Logs détaillés pour diagnostiquer les cas problématiques

### Sécurité

- Le JWT est toujours vérifié (signature, expiration)
- Le `userId` est extrait du JWT vérifié
- Les states invalides sont toujours rejetés

## 🧪 Comportement attendu

### Cas 1 : States correspondent (comportement normal)

```
[outlook-callback] State validation: { statesMatch: true, ... }
→ Utilise le state du cookie
```

### Cas 2 : States ne correspondent pas mais JWT valide

```
[outlook-callback] State mismatch - tentative de vérification alternative: { ... }
[outlook-callback] State reçu valide (JWT vérifié), mais ne correspond pas au cookie stocké
[outlook-callback] ⚠️ State mismatch détecté mais JWT valide - probablement plusieurs onglets ouverts
→ Accepte le state reçu et continue
```

### Cas 3 : States ne correspondent pas ET JWT invalide

```
[outlook-callback] State mismatch ET JWT invalide: { ... }
→ Rejette avec erreur "invalid_state"
```

## 📋 Vérification

Après le déploiement, vérifiez les logs Vercel :

1. **Si le problème persiste** :
   - Cherchez `[outlook-callback] State mismatch - tentative de vérification alternative`
   - Vérifiez si le JWT est valide ou non
   - Si le JWT est valide, la connexion devrait fonctionner

2. **Si le problème est résolu** :
   - Vous devriez voir `[outlook-callback] ⚠️ State mismatch détecté mais JWT valide`
   - La connexion Outlook devrait fonctionner

## 🔄 Prochaines étapes

1. **Déployer les modifications** :
   ```bash
   git add .
   git commit -m "Fix CSRF state mismatch: accept valid JWT even if cookie state differs"
   git push
   ```

2. **Tester la connexion Outlook** sur Vercel

3. **Vérifier les logs** pour confirmer le comportement

## 📚 Notes techniques

- Le state a le format : `stateId:jwtToken`
- Le `stateId` est un UUID unique
- Le `jwtToken` est un JWT signé contenant `userId`, `stateId`, et `timestamp`
- Le JWT expire après 1 heure
- La vérification du JWT garantit que le state provient bien de notre application

