# 🔍 Vérification Resend sur Vercel

## Problème

Les emails fonctionnent en local mais pas en production sur Vercel.

## ✅ Vérifications à faire

### 1. Variables d'environnement sur Vercel

Allez dans **Vercel Dashboard** → Votre projet → **Settings** → **Environment Variables**

Vérifiez que ces variables sont configurées pour **Production** (et éventuellement Preview/Development) :

- ✅ `RESEND_API_KEY` = `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- ✅ `EMAIL_FROM` = `noreply@pilotys.io` (ou votre domaine vérifié)
- ✅ `NEXT_PUBLIC_APP_URL` = `https://pilotys.io` (ou votre domaine de production)

**Important :**
- Les variables doivent être définies pour **Production**
- `RESEND_API_KEY` ne doit PAS avoir de guillemets
- `EMAIL_FROM` doit être un domaine vérifié dans Resend

### 2. Vérifier le domaine dans Resend

1. Allez sur [resend.com](https://resend.com) → **Domains**
2. Vérifiez que votre domaine (ex: `pilotys.io`) est :
   - ✅ Ajouté
   - ✅ Vérifié (records DNS configurés)
   - ✅ Actif

3. Si le domaine n'est pas vérifié, utilisez temporairement `onboarding@resend.dev` pour tester

### 3. Vérifier les logs Vercel

1. Allez dans **Vercel Dashboard** → Votre projet → **Deployments**
2. Cliquez sur le dernier déploiement
3. Ouvrez l'onglet **Logs** ou **Functions**
4. Cherchez les logs commençant par `[email]` ou `[auth/forgot-password]`

**Logs à chercher :**
- `[email] ✅ Resend détecté (RESEND_API_KEY configuré)` → Bon signe
- `[email] ⚠️ Resend non configuré` → `RESEND_API_KEY` manquant
- `[email] 📧 Utilisation de Resend pour l'envoi` → Resend est utilisé
- `[email] ✅ Email envoyé avec succès via Resend!` → Succès
- `[email] ❌ Erreur lors de l'envoi via Resend` → Erreur à investiguer

### 4. Créer une route de debug pour Vercel

Créez `app/api/debug/resend-env/route.ts` pour vérifier les variables en production :

```typescript
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    RESEND_API_KEY: process.env.RESEND_API_KEY ? "✅ Configuré" : "❌ Manquant",
    EMAIL_FROM: process.env.EMAIL_FROM || "❌ Non défini",
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || "❌ Non défini",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "❌ Non défini",
    APP_URL: process.env.APP_URL || "❌ Non défini",
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
  });
}
```

Puis visitez `https://votre-domaine.vercel.app/api/debug/resend-env` pour voir les variables chargées.

### 5. Redéployer après modification des variables

**Important :** Après avoir ajouté/modifié des variables d'environnement sur Vercel, vous devez **redéployer** :

1. Allez dans **Deployments**
2. Cliquez sur **Redeploy** sur le dernier déploiement
3. Ou poussez un nouveau commit

Les variables d'environnement ne sont chargées qu'au moment du build/déploiement.

## 🔧 Solutions courantes

### Problème : `RESEND_API_KEY` non chargée

**Solution :**
1. Vérifiez que la variable est définie pour **Production** sur Vercel
2. Redéployez l'application
3. Vérifiez les logs pour confirmer le chargement

### Problème : `EMAIL_FROM` non vérifié dans Resend

**Solution :**
1. Vérifiez votre domaine dans Resend Dashboard
2. Si non vérifié, utilisez temporairement `onboarding@resend.dev`
3. Ou configurez les records DNS pour vérifier votre domaine

### Problème : Erreur "Domain not verified"

**Solution :**
1. Allez dans Resend → Domains
2. Vérifiez que votre domaine est vérifié
3. Si non, suivez les instructions DNS dans Resend
4. Attendez la propagation DNS (peut prendre quelques heures)

### Problème : Les emails partent mais ne sont pas reçus

**Vérifications :**
1. Vérifiez le dossier spam
2. Vérifiez les logs Resend dans le dashboard Resend
3. Vérifiez que l'adresse email de destination est valide

## 📋 Checklist de vérification

- [ ] `RESEND_API_KEY` configurée sur Vercel (Production)
- [ ] `EMAIL_FROM` configurée sur Vercel (Production)
- [ ] `NEXT_PUBLIC_APP_URL` configurée sur Vercel (Production)
- [ ] Domaine vérifié dans Resend Dashboard
- [ ] Application redéployée après modification des variables
- [ ] Logs Vercel vérifiés pour les erreurs
- [ ] Route de debug testée (`/api/debug/resend-env`)

## 🆘 Si ça ne fonctionne toujours pas

1. **Vérifiez les logs Vercel** pour voir l'erreur exacte
2. **Vérifiez les logs Resend** dans le dashboard Resend
3. **Testez avec la route de debug** pour voir les variables chargées
4. **Vérifiez que le domaine est bien vérifié** dans Resend

## 📞 Support

Si le problème persiste après toutes ces vérifications, partagez :
- Les logs Vercel (section `[email]`)
- Le résultat de `/api/debug/resend-env`
- Les logs Resend du dashboard

