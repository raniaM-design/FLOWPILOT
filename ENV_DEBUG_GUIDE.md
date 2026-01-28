# Guide de diagnostic des variables d'environnement

## Problème : Variables d'environnement non chargées

Si `/api/outlook/connect` retourne `{"error":"Configuration Microsoft manquante"}`, suivez ce guide.

## Étape 1 : Vérifier l'emplacement du fichier `.env.local`

Le fichier `.env.local` **DOIT** être dans le même dossier que `package.json`.

✅ **Bon emplacement :**
```
c:\Users\rania\flowpilot\
  ├── package.json
  ├── .env.local          ← ICI
  └── ...
```

❌ **Mauvais emplacement :**
```
c:\Users\rania\
  ├── .env.local          ← PAS ICI
  └── flowpilot\
      └── package.json
```

## Étape 2 : Vérifier le format du fichier `.env.local`

Le fichier doit respecter ce format exact :

```env
MICROSOFT_CLIENT_ID=votre_client_id_sans_espaces
MICROSOFT_CLIENT_SECRET=votre_secret_sans_espaces
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=http://localhost:3000/api/outlook/callback
MICROSOFT_SCOPES="offline_access User.Read Calendars.Read openid profile email"
```

**Erreurs courantes à éviter :**
- ❌ `MICROSOFT_CLIENT_ID = xxx` (espaces autour du `=`)
- ❌ `MICROSOFT_CLIENT_ID= xxx` (espace après le `=`)
- ❌ `MICROSOFT_CLIENT_ID =xxx` (espace avant le `=`)
- ❌ `MICROSOFT_CLIENT_ID=` (vide après le `=`)
- ❌ Guillemets typographiques `"` au lieu de `"`
- ❌ Ligne vide ou commentaire mal placé

**Format correct :**
- ✅ `MICROSOFT_CLIENT_ID=xxx` (pas d'espaces)
- ✅ `MICROSOFT_SCOPES="offline_access ..."` (guillemets uniquement si nécessaire pour les espaces)

## Étape 3 : Utiliser la route de debug

Une route de debug a été créée pour vérifier que les variables sont bien chargées.

### Accéder à la route de debug

1. **Démarrer le serveur de développement** (si pas déjà fait) :
   ```bash
   npm run dev
   ```

2. **Appeler la route de debug** :
   ```
   http://localhost:3000/api/_debug/env
   ```

### Interpréter la réponse

**Réponse attendue si tout est OK :**
```json
{
  "ok": true,
  "env": {
    "MICROSOFT_CLIENT_ID": true,
    "MICROSOFT_CLIENT_SECRET": true,
    "MICROSOFT_TENANT_ID": true,
    "MICROSOFT_REDIRECT_URI": true,
    "MICROSOFT_SCOPES": true
  },
  "values": {
    "MICROSOFT_CLIENT_ID": "12345678...",
    "MICROSOFT_CLIENT_SECRET": "abcd... (32 chars)",
    ...
  },
  "cwd": "C:\\Users\\rania\\flowpilot",
  "nodeEnv": "development"
}
```

**Si une variable est `false` :**
- Vérifier qu'elle existe dans `.env.local`
- Vérifier le format (pas d'espaces autour du `=`)
- **Redémarrer le serveur** après modification

## Étape 4 : Redémarrer le serveur

⚠️ **IMPORTANT** : Next.js ne recharge **PAS** automatiquement les variables d'environnement.

Après toute modification de `.env.local` :

1. **Arrêter le serveur** (Ctrl+C)
2. **Redémarrer** :
   ```bash
   npm run dev
   ```

Si vous utilisez Turbopack, vous pouvez aussi :
```bash
# Arrêter le serveur
# Supprimer le cache (optionnel)
rm -rf .next
# Redémarrer
npm run dev
```

## Étape 5 : Vérifier les logs serveur

Quand vous appelez `/api/outlook/connect`, vérifiez les logs dans le terminal :

```
[outlook-connect] env check: {
  hasClientId: true,
  hasClientSecret: true,
  hasTenantId: true,
  hasRedirectUri: true,
  hasScopes: true,
  tenantId: 'common',
  redirectUri: 'http://localhost:3000/api/outlook/callback',
  scopes: 'offline_access User.Read Calendars.Read openid profile email',
  cwd: 'C:\\Users\\rania\\flowpilot',
  clientIdPreview: '12345678...'
}
```

Si `hasClientId: false`, la variable n'est pas chargée.

## Checklist de diagnostic

- [ ] `.env.local` est dans le même dossier que `package.json`
- [ ] Le format est correct (pas d'espaces autour du `=`)
- [ ] Les valeurs ne sont pas vides après le `=`
- [ ] Le serveur a été **redémarré** après modification
- [ ] La route `/api/_debug/env` montre `MICROSOFT_CLIENT_ID: true`
- [ ] Les logs serveur montrent `hasClientId: true`

## Résolution des problèmes courants

### Problème : Variable toujours `false` après redémarrage

1. Vérifier que le fichier s'appelle bien `.env.local` (pas `.env` ou `.env.local.txt`)
2. Vérifier qu'il n'y a pas de caractères invisibles (copier-coller depuis un éditeur de texte)
3. Essayer de recréer le fichier depuis zéro

### Problème : Variables chargées mais erreur persiste

1. Vérifier que le runtime est bien `nodejs` (déjà fait dans les routes)
2. Vérifier les logs serveur pour voir quelle variable manque exactement
3. Utiliser `/api/_debug/env` pour voir l'état exact

### Problème : Variables chargées en dev mais pas en production

- En production, utiliser les variables d'environnement de la plateforme (Vercel, etc.)
- Ne pas utiliser `.env.local` en production

## Route de debug (développement uniquement)

La route `/api/_debug/env` est **uniquement accessible en développement** pour des raisons de sécurité.

En production, elle retournera `403 Forbidden`.

