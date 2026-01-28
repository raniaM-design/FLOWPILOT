# Correction des variables d'environnement Outlook

## Problème identifié
L'erreur `{"error":"Configuration Microsoft manquante"}` était due à :
1. Absence de `runtime = "nodejs"` sur les routes API (Edge runtime par défaut)
2. Lecture de `process.env` possiblement au mauvais moment
3. Messages d'erreur peu informatifs

## Corrections appliquées

### 1. Runtime Node.js forcé sur toutes les routes Outlook
Ajouté en haut de chaque route :
```typescript
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
```

Fichiers modifiés :
- `app/api/outlook/connect/route.ts`
- `app/api/outlook/callback/route.ts`
- `app/api/outlook/events/route.ts`
- `app/api/outlook/import/route.ts`
- `app/api/outlook/status/route.ts`

### 2. Vérification des variables dans les handlers
- Toutes les lectures de `process.env.MICROSOFT_*` sont maintenant dans les handlers (GET/POST)
- Aucune lecture au top-level du fichier

### 3. Messages d'erreur améliorés
Les erreurs retournent maintenant :
```json
{
  "error": "Configuration Microsoft manquante",
  "missing": ["MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET"],
  "details": "Variables d'environnement manquantes: MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET"
}
```

### 4. Logs de debug en développement
Ajout de logs temporaires (uniquement en `NODE_ENV === "development"`) :
```typescript
console.log("[outlook-connect] env check:", {
  hasClientId: !!clientId,
  hasClientSecret: !!clientSecret,
  hasTenantId: !!process.env.MICROSOFT_TENANT_ID,
  hasRedirectUri: !!process.env.MICROSOFT_REDIRECT_URI,
  hasScopes: !!process.env.MICROSOFT_SCOPES,
  tenantId,
  redirectUri,
  scopes,
});
```

### 5. Vérification des variables requises
- `/api/outlook/connect` : Vérifie `MICROSOFT_CLIENT_ID` (minimum requis)
- `/api/outlook/callback` : Vérifie `MICROSOFT_CLIENT_ID` et `MICROSOFT_CLIENT_SECRET`
- `lib/outlook/graph.ts` : Vérifie les variables lors du refresh token

## Test

1. Vérifier que `.env.local` contient bien :
```env
MICROSOFT_CLIENT_ID=votre_client_id
MICROSOFT_CLIENT_SECRET=votre_client_secret
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=http://localhost:3000/api/outlook/callback
MICROSOFT_SCOPES="offline_access User.Read Calendars.Read openid profile email"
```

2. Redémarrer le serveur Next.js :
```bash
npm run dev
```

3. Appeler `/api/outlook/connect` :
- Devrait rediriger vers `login.microsoftonline.com`
- Les logs dans le terminal devraient afficher `[outlook-connect] env check: { hasClientId: true, ... }`

4. Si erreur persistante :
- Vérifier les logs dans le terminal pour voir quelles variables sont manquantes
- Vérifier que le fichier est bien `.env.local` (pas `.env`)
- Vérifier qu'il n'y a pas d'espaces autour des `=` dans `.env.local`
- Redémarrer le serveur après modification de `.env.local`

## Notes importantes

- Les erreurs TypeScript liées à `prisma.outlookAccount` seront résolues après la migration Prisma
- Les variables d'environnement doivent être préfixées par `MICROSOFT_` (pas `NEXT_PUBLIC_`)
- Le runtime Node.js est maintenant forcé, ce qui garantit l'accès aux variables d'environnement

