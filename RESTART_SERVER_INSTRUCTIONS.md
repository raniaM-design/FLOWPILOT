# Instructions de redémarrage du serveur

## ⚠️ IMPORTANT : Redémarrer après modification de .env.local

Next.js ne recharge **PAS** automatiquement les variables d'environnement. Vous devez **toujours** redémarrer le serveur après avoir modifié `.env.local`.

## Étapes de redémarrage propre

### 1. Arrêter le serveur
- Appuyez sur `Ctrl+C` dans le terminal où le serveur tourne
- Attendez que le processus s'arrête complètement

### 2. (Optionnel) Nettoyer le cache
Si vous avez des problèmes persistants, supprimez le cache Next.js :

```bash
# Windows PowerShell
Remove-Item -Recurse -Force .next

# Ou manuellement : supprimez le dossier .next
```

### 3. Redémarrer le serveur
```bash
npm run dev
```

### 4. Vérifier que les variables sont chargées
Ouvrez dans votre navigateur :
```
http://localhost:3000/api/_debug/env
```

Vous devriez voir :
```json
{
  "ok": true,
  "env": {
    "MICROSOFT_CLIENT_ID": true,
    "MICROSOFT_CLIENT_SECRET": true,
    "MICROSOFT_TENANT_ID": true,
    "MICROSOFT_REDIRECT_URI": true,
    "MICROSOFT_SCOPES": true
  }
}
```

Si toutes les valeurs sont `true`, les variables sont bien chargées !

### 5. Tester la connexion Outlook
Une fois les variables chargées, testez :
```
http://localhost:3000/api/outlook/connect
```

Cela devrait rediriger vers `login.microsoftonline.com` (pas d'erreur JSON).

## Checklist

- [ ] Serveur arrêté (Ctrl+C)
- [ ] Cache nettoyé (optionnel, seulement si problème persiste)
- [ ] Serveur redémarré (`npm run dev`)
- [ ] Route `/api/_debug/env` montre toutes les variables à `true`
- [ ] Route `/api/outlook/connect` redirige vers Microsoft

## Note pour Turbopack

Si vous utilisez Turbopack (Next.js 13+), le redémarrage est toujours nécessaire pour les variables d'environnement, même si Turbopack recharge automatiquement le code.

