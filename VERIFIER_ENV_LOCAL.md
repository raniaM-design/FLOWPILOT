# 🔍 Vérification de .env.local

## Problème

Le script `npm run test:resend` indique que les variables ne sont pas chargées, même si elles sont dans `.env.local`.

## Cause

Next.js charge les variables d'environnement **uniquement au démarrage du serveur**. Si vous modifiez `.env.local` pendant que le serveur tourne, les changements ne sont **pas** pris en compte.

## ✅ Solution

### Étape 1 : Vérifier le format de `.env.local`

Ouvrez `.env.local` et assurez-vous qu'il contient **exactement** ces lignes (sans guillemets, sans espaces autour du `=`) :

```env
RESEND_API_KEY=re_SpvDdGRX_5KexVt3U8e2sy26crP2LsHP2
EMAIL_FROM=noreply@pilotys.io
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Format correct :**
- ✅ `RESEND_API_KEY=re_xxx` (pas d'espaces)
- ✅ Pas de guillemets autour des valeurs
- ✅ Une seule ligne par variable
- ✅ Pas de doublons

**Format incorrect :**
- ❌ `RESEND_API_KEY = "re_xxx"` (espaces et guillemets)
- ❌ `RESEND_API_KEY=re_xxx` suivi de `RESEND_API_KEY=re_yyy` (doublon)

### Étape 2 : Redémarrer complètement le serveur

**Important :** Next.js ne recharge **pas** automatiquement `.env.local`. Vous devez **arrêter et redémarrer** le serveur.

1. **Arrêtez le serveur** :
   - Dans le terminal où `npm run dev` tourne, appuyez sur `Ctrl+C`
   - Attendez que le serveur s'arrête complètement

2. **Redémarrez le serveur** :
   ```bash
   npm run dev
   ```

3. **Attendez** que le serveur démarre complètement (vous verrez "Ready" dans les logs)

### Étape 3 : Tester à nouveau

Dans un **nouveau terminal** (ou après le redémarrage) :

```bash
npm run test:resend
```

Vous devriez maintenant voir :
```
✅ RESEND_API_KEY: Configuré
✅ EMAIL_FROM: noreply@pilotys.io
✅ NEXT_PUBLIC_APP_URL: http://localhost:3000
```

## 🔍 Vérification manuelle

Pour vérifier que Next.js charge bien les variables, créez une route de test :

**Créer `app/api/test-env/route.ts` :**

```typescript
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    RESEND_API_KEY: process.env.RESEND_API_KEY ? "✅ Configuré" : "❌ Manquant",
    EMAIL_FROM: process.env.EMAIL_FROM || "❌ Non défini",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "❌ Non défini",
  });
}
```

Puis visitez `http://localhost:3000/api/test-env` dans votre navigateur.

## ⚠️ Notes importantes

1. **`.env.local` doit être à la racine** du projet (même niveau que `package.json`)
2. **Pas d'espaces** autour du `=`
3. **Pas de guillemets** autour des valeurs (sauf si la valeur contient des espaces)
4. **Redémarrer le serveur** après chaque modification de `.env.local`
5. Le fichier `.env.local` est dans `.gitignore` et ne sera pas commité (c'est normal)

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez l'emplacement** : `.env.local` doit être dans `C:\Users\rania\flowpilot\` (même dossier que `package.json`)

2. **Vérifiez le format** : Ouvrez `.env.local` dans un éditeur de texte et vérifiez :
   - Pas d'espaces avant/après le `=`
   - Pas de guillemets autour des valeurs
   - Pas de caractères invisibles (copiez-collez depuis le guide)

3. **Vérifiez les permissions** : Le fichier doit être lisible

4. **Essayez de supprimer et recréer** `.env.local` :
   ```powershell
   # Backup
   Copy-Item .env.local .env.local.backup
   
   # Recréer avec le bon format
   @"
   RESEND_API_KEY=re_SpvDdGRX_5KexVt3U8e2sy26crP2LsHP2
   EMAIL_FROM=noreply@pilotys.io
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   "@ | Out-File -FilePath .env.local -Encoding utf8 -NoNewline
   ```

5. **Redémarrez complètement** :
   - Fermez tous les terminaux
   - Ouvrez un nouveau terminal
   - `cd` vers le projet
   - `npm run dev`

