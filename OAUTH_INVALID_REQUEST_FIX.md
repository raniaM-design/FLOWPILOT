# Correction de l'erreur OAuth `invalid_request`

## Problème identifié

Microsoft OAuth retournait `{"error":"invalid_request"}` lors de l'appel à `/api/outlook/connect`.

## Causes identifiées

1. **Guillemets dans `MICROSOFT_SCOPES`** : Le fichier `.env.local` contenait :
   ```
   MICROSOFT_SCOPES="offline_access User.Read Calendars.Read openid profile email"
   ```
   Les guillemets étaient inclus dans la valeur, ce qui rendait le paramètre `scope` invalide.

2. **Pas de nettoyage des valeurs** : Les valeurs n'étaient pas nettoyées avant d'être utilisées.

## Corrections appliquées

### 1. Correction de `.env.local`

**Avant :**
```env
MICROSOFT_SCOPES="offline_access User.Read Calendars.Read openid profile email"
```

**Après :**
```env
MICROSOFT_SCOPES=offline_access User.Read Calendars.Read openid profile email
```

### 2. Nettoyage des valeurs dans le code

#### `/api/outlook/connect/route.ts`
- Nettoyage de `redirect_uri` : retrait des trailing slashes et espaces
- Nettoyage de `scopes` : retrait des guillemets au début/fin si présents
- Ajout de logs de debug pour l'URL générée

#### `/api/outlook/callback/route.ts`
- Même nettoyage pour `redirect_uri` et `scopes`
- Utilisation de `URLSearchParams.append()` au lieu d'un objet pour plus de contrôle
- Ajout de logs de debug pour l'échange de token

### 3. Vérification des endpoints OAuth

✅ **Authorize endpoint** : `https://login.microsoftonline.com/{TENANT}/oauth2/v2.0/authorize`
✅ **Token endpoint** : `https://login.microsoftonline.com/{TENANT}/oauth2/v2.0/token`

### 4. Vérification des paramètres OAuth

✅ **Paramètres requis pour authorize** :
- `client_id` : string
- `response_type` : "code"
- `redirect_uri` : string (doit correspondre exactement à Azure)
- `response_mode` : "query"
- `scope` : string avec espaces entre scopes (pas d'array, pas de guillemets)
- `state` : string

✅ **Paramètres requis pour token** :
- `client_id` : string
- `client_secret` : string
- `code` : string (reçu du callback)
- `grant_type` : "authorization_code"
- `redirect_uri` : string (identique à celui utilisé dans authorize)
- `scope` : string (identique à celui utilisé dans authorize)

## Logs de debug ajoutés

En développement, les logs suivants sont affichés :

### `/api/outlook/connect`
```
[outlook-oauth] authorize url: https://login.microsoftonline.com/...
[outlook-oauth] params: {
  client_id: "2d149257...",
  redirect_uri: "http://localhost:3000/api/outlook/callback",
  scope: "offline_access User.Read Calendars.Read openid profile email",
  tenant: "common"
}
```

### `/api/outlook/callback`
```
[outlook-oauth] token exchange: {
  endpoint: "https://login.microsoftonline.com/.../oauth2/v2.0/token",
  redirect_uri: "http://localhost:3000/api/outlook/callback",
  scope: "offline_access User.Read Calendars.Read openid profile email",
  hasCode: true
}
```

## Vérification de `redirect_uri`

⚠️ **IMPORTANT** : Le `redirect_uri` doit correspondre **exactement** à celui enregistré dans Azure AD :

1. Pas de trailing slash (`/api/outlook/callback` et non `/api/outlook/callback/`)
2. Même protocole (`http://` en dev, `https://` en prod)
3. Même port (`:3000` en dev)
4. Même casse (tout en minuscules généralement)

## Test de l'URL générée

Pour tester manuellement l'URL OAuth :

1. Appeler `/api/outlook/connect`
2. Copier l'URL depuis les logs (ou depuis la redirection du navigateur)
3. Coller l'URL dans un navigateur
4. Vérifier que Microsoft affiche la page de login (pas d'erreur JSON)

Exemple d'URL valide :
```
https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=2d149257-da1b-40a6-bd62-322a7d09a7f6&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Foutlook%2Fcallback&response_mode=query&scope=offline_access%20User.Read%20Calendars.Read%20openid%20profile%20email&state=...
```

## Checklist de validation

- [x] `.env.local` corrigé (guillemets retirés de `MICROSOFT_SCOPES`)
- [x] Nettoyage des valeurs dans le code
- [x] Endpoints OAuth corrects
- [x] Paramètres OAuth au bon format (string, pas array)
- [x] Logs de debug ajoutés
- [ ] Serveur redémarré après modification de `.env.local`
- [ ] Route `/api/outlook/connect` redirige vers Microsoft login
- [ ] Plus d'erreur `invalid_request`

## Prochaines étapes

1. **Redémarrer le serveur** :
   ```bash
   # Arrêter (Ctrl+C)
   npm run dev
   ```

2. **Tester la connexion** :
   ```
   http://localhost:3000/api/outlook/connect
   ```

3. **Vérifier les logs** :
   - L'URL d'autorisation devrait être loggée dans le terminal
   - Copier-coller l'URL dans un navigateur pour tester manuellement

4. **Vérifier dans Azure AD** :
   - Le `redirect_uri` dans Azure doit être exactement : `http://localhost:3000/api/outlook/callback`
   - Pas de trailing slash
   - Même casse

## Note sur l'erreur Prisma

L'erreur TypeScript `Property 'outlookAccount' does not exist` sera résolue après la migration Prisma :
```bash
npx prisma migrate dev --name add_outlook_integration
```

