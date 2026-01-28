# Correction du callback OAuth Microsoft

## Problème identifié

Le callback `/api/outlook/callback` renvoyait `{"error":"missing_params","details":"Missing code or state parameter"}`.

## Causes possibles

1. **Callback appelé directement** : Le callback ne doit être appelé que par Microsoft après le login, pas directement
2. **State non transmis** : Le state peut ne pas être correctement transmis depuis Microsoft
3. **Cookie non accessible** : Le cookie peut ne pas être accessible dans le callback
4. **URL mal parsée** : Les paramètres peuvent ne pas être correctement extraits de l'URL

## Corrections appliquées

### 1. Génération du state améliorée

**Avant :**
```typescript
const state = await sign({ userId, timestamp: Date.now() }, "1h");
```

**Après :**
```typescript
const stateId = randomUUID();
const stateToken = await sign({ userId, stateId, timestamp: Date.now() }, "1h");
const state = `${stateId}:${stateToken}`;
```

- Utilise `crypto.randomUUID()` pour un identifiant unique
- Combine UUID + JWT signé pour double sécurité
- Format : `uuid:jwt_token`

### 2. Configuration du cookie améliorée

```typescript
cookieStore.set("outlook_oauth_state", state, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/", // Explicitement défini
  maxAge: 3600, // 1 heure
});
```

### 3. Logs de debug complets

Ajout de logs détaillés en développement pour diagnostiquer :

#### Dans `/api/outlook/connect` :
```typescript
console.log("[outlook-connect] state généré:", {
  stateId,
  stateLength: state.length,
  cookieSet: true,
});
```

#### Dans `/api/outlook/callback` :
```typescript
console.log("[outlook-callback] URL complète:", request.url);
console.log("[outlook-callback] Query params:", Object.fromEntries(request.nextUrl.searchParams));
console.log("[outlook-callback] params:", {
  hasCode: !!code,
  hasState: !!state,
  hasError: !!error,
  codeLength: code?.length || 0,
  stateLength: state?.length || 0,
});
console.log("[outlook-callback] state validation:", {
  hasStoredState: !!storedState,
  storedStateLength: storedState?.length || 0,
  receivedStateLength: state.length,
  statesMatch: storedState === state,
});
```

### 4. Gestion d'erreurs améliorée

#### Erreurs distinctes pour chaque cas :

**Code manquant :**
```json
{
  "error": "missing_code",
  "details": "Missing 'code' parameter in callback URL",
  "got": { "code": null, "state": "..." },
  "hint": "The callback should only be called by Microsoft after user login"
}
```

**State manquant :**
```json
{
  "error": "missing_state",
  "details": "Missing 'state' parameter in callback URL",
  "got": { "code": "...", "state": null },
  "hint": "The state should be returned by Microsoft from the authorize request"
}
```

**Cookie state manquant :**
```json
{
  "error": "missing_state_cookie",
  "details": "State cookie not found. The OAuth flow must start with /api/outlook/connect",
  "hint": "Do not call /api/outlook/callback directly. Start with /api/outlook/connect"
}
```

**State mismatch :**
```json
{
  "error": "invalid_state",
  "details": "CSRF state mismatch. The state from Microsoft does not match the stored cookie.",
  "hint": "This could indicate a CSRF attack or expired session"
}
```

### 5. Validation du state améliorée

```typescript
// Extraire stateId et token du format "uuid:token"
const [stateId, stateToken] = storedState.split(":");
if (!stateId || !stateToken) {
  return NextResponse.json({ error: "invalid_state_format", ... });
}

// Vérifier le token JWT
const decodedState = await verify(stateToken);
const userId = decodedState.userId;
```

## Flux OAuth correct

1. **Utilisateur clique "Connecter Outlook"**
   - Appel à `/api/outlook/connect`
   - Génération d'un state unique
   - Stockage dans cookie httpOnly
   - Redirection vers Microsoft avec state dans l'URL

2. **Utilisateur se connecte sur Microsoft**
   - Microsoft authentifie l'utilisateur
   - Microsoft redirige vers `/api/outlook/callback?code=...&state=...`

3. **Callback reçoit code + state**
   - Vérifie que code et state sont présents
   - Compare state avec le cookie
   - Échange code contre tokens
   - Stocke tokens en DB
   - Redirige vers `/app/integrations/outlook?connected=1`

## ⚠️ IMPORTANT : Ne pas tester le callback directement

**❌ Ne pas faire :**
```
http://localhost:3000/api/outlook/callback
```

**✅ Faire :**
```
http://localhost:3000/api/outlook/connect
```

Le callback doit être appelé **uniquement** par Microsoft après le login.

## Diagnostic

Si vous obtenez `missing_params` :

1. **Vérifier les logs** dans le terminal :
   ```
   [outlook-callback] URL complète: http://localhost:3000/api/outlook/callback?...
   [outlook-callback] params: { hasCode: true, hasState: true, ... }
   ```

2. **Si `hasCode: false`** :
   - Le callback a été appelé directement (pas par Microsoft)
   - Commencer le flux avec `/api/outlook/connect`

3. **Si `hasState: false`** :
   - Microsoft n'a pas renvoyé le state
   - Vérifier la configuration Azure AD
   - Vérifier que l'URL authorize contient bien le state

4. **Si `hasStoredState: false`** :
   - Le cookie n'a pas été créé ou a expiré
   - Vérifier que le flux commence bien par `/api/outlook/connect`
   - Vérifier que les cookies sont activés dans le navigateur

## Test du flux complet

1. **Démarrer le serveur** :
   ```bash
   npm run dev
   ```

2. **Appeler `/api/outlook/connect`** :
   ```
   http://localhost:3000/api/outlook/connect
   ```

3. **Vérifier les logs** :
   - Devrait voir `[outlook-connect] state généré`
   - Devrait voir `[outlook-oauth] authorize url`

4. **Se connecter sur Microsoft** :
   - Microsoft devrait rediriger vers `/api/outlook/callback?code=...&state=...`

5. **Vérifier les logs du callback** :
   - Devrait voir `[outlook-callback] params: { hasCode: true, hasState: true }`
   - Devrait voir `[outlook-callback] State validated successfully`
   - Devrait voir `[outlook-callback] OAuth flow completed successfully`

6. **Résultat attendu** :
   - Redirection vers `/app/integrations/outlook?connected=1`
   - Plus d'erreur `missing_params`

## Checklist

- [x] State généré avec UUID + JWT
- [x] Cookie configuré avec `path: "/"`
- [x] Logs de debug complets
- [x] Gestion d'erreurs améliorée
- [x] Validation du state améliorée
- [ ] Tester le flux complet depuis `/api/outlook/connect`
- [ ] Vérifier que le callback reçoit bien code + state
- [ ] Vérifier la redirection finale

