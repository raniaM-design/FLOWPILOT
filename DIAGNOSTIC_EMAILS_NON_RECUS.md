# 🔍 Diagnostic : Emails non reçus malgré domaine vérifié

## Situation

- ✅ Domaine vérifié dans Resend Dashboard
- ✅ Emails enregistrés sur Resend (visibles dans le dashboard)
- ❌ Emails non reçus par le destinataire

## 🔍 Vérifications à faire

### 1. Vérifier l'adresse "from" utilisée en production

**Sur Vercel :**
1. Allez sur `https://pilotys.io/api/debug/resend-env` (ou votre domaine)
2. Vérifiez que `EMAIL_FROM` correspond exactement à votre domaine vérifié :
   - ✅ `noreply@pilotys.io` (si `pilotys.io` est vérifié)
   - ❌ `noreply@autre-domaine.com` (domaine différent)
   - ❌ `onboarding@resend.dev` (domaine de test)

**Important :** L'adresse "from" doit correspondre **exactement** au domaine vérifié dans Resend.

### 2. Vérifier le statut des emails dans Resend Dashboard

1. Allez sur **Resend Dashboard** → **Emails**
2. Cliquez sur un email récent envoyé depuis le site
3. Vérifiez :
   - **Status** : Delivered / Bounced / Failed / Pending
   - **From** : Doit être `noreply@pilotys.io` (ou votre domaine vérifié)
   - **Events** : Timeline complète (sent → delivered / bounced)

**Si le statut est "Delivered" :**
- L'email a été délivré au serveur de réception
- Vérifiez le dossier spam
- Vérifiez les filtres de votre boîte email

**Si le statut est "Bounced" :**
- L'email a été rejeté
- Vérifiez les logs Resend pour la raison (domaine non vérifié, adresse invalide, etc.)

### 3. Vérifier les logs Vercel

1. **Vercel Dashboard** → Deployments → Dernier déploiement → Logs
2. Cherchez les logs `[email]` lors d'un envoi d'email
3. Vérifiez :
   - `[email] From: noreply@pilotys.io` → Doit correspondre au domaine vérifié
   - `[email] ✅ Email envoyé avec succès via Resend!` → Envoi réussi
   - `[email] Message ID: ...` → ID de l'email dans Resend

### 4. Vérifier les spams et filtres

**Vérifications :**
- ✅ Dossier spam/courrier indésirable
- ✅ Filtres de votre boîte email (Gmail, Outlook, etc.)
- ✅ Règles de blocage automatique
- ✅ Liste noire d'expéditeurs

**Pour Gmail :**
- Vérifiez l'onglet "Spam"
- Vérifiez "Tous les messages" (recherchez "pilotys" ou "noreply@pilotys.io")

**Pour Outlook :**
- Vérifiez "Courrier indésirable"
- Vérifiez les règles de filtrage

### 5. Vérifier la configuration Vercel

**Variables d'environnement sur Vercel :**
- `EMAIL_FROM` doit être exactement `noreply@pilotys.io` (sans guillemets, sans espaces)
- `RESEND_API_KEY` doit être correcte
- Variables définies pour **Production**

**Redéploiement :**
- Après modification de `EMAIL_FROM`, **redéployez** l'application

## 🔧 Solutions

### Solution 1 : Vérifier que EMAIL_FROM correspond au domaine vérifié

**Sur Vercel :**
1. Settings → Environment Variables
2. Vérifiez que `EMAIL_FROM` = `noreply@pilotys.io` (exactement, sans guillemets)
3. Si différent, modifiez et redéployez

### Solution 2 : Vérifier les logs Resend pour les bounces

1. **Resend Dashboard** → **Emails** → Cliquez sur un email
2. Regardez la section **Events** ou **Logs**
3. Si "Bounced", vérifiez la raison :
   - "Domain not verified" → Vérifiez que le domaine est bien vérifié
   - "Invalid recipient" → Adresse email invalide
   - "Mailbox full" → Boîte pleine
   - Autre → Consultez les détails

### Solution 3 : Tester avec une autre adresse email

Testez l'envoi vers :
- Une autre adresse email (Gmail, Outlook, etc.)
- Votre propre adresse email
- Une adresse de test

Cela permet d'isoler si c'est un problème spécifique à une adresse ou général.

### Solution 4 : Vérifier la réputation du domaine

Si le domaine est vérifié mais les emails vont dans les spams :
- Vérifiez la réputation du domaine dans Resend Dashboard
- Vérifiez que les records DNS (SPF, DKIM, DMARC) sont correctement configurés
- Attendez quelques jours pour que la réputation s'améliore

## 📋 Checklist de diagnostic

- [ ] Route de debug testée (`/api/debug/resend-env`) - vérifier `EMAIL_FROM`
- [ ] Statut des emails vérifié dans Resend Dashboard → Emails
- [ ] Logs Vercel vérifiés pour voir l'adresse "from" utilisée
- [ ] Dossier spam vérifié
- [ ] Filtres email vérifiés
- [ ] Test avec une autre adresse email
- [ ] `EMAIL_FROM` sur Vercel correspond exactement au domaine vérifié
- [ ] Application redéployée après modification de `EMAIL_FROM`

## 🆘 Informations à partager pour diagnostic

Si le problème persiste, partagez :
1. **Statut de l'email** dans Resend Dashboard (Delivered/Bounced/Failed)
2. **Adresse "from"** utilisée (visible dans les logs Vercel ou Resend)
3. **Résultat de `/api/debug/resend-env`** sur votre site
4. **Logs Resend** (Events/Logs de l'email)
5. **Type de boîte email** du destinataire (Gmail, Outlook, etc.)

## 💡 Note importante

Même avec un domaine vérifié, les emails peuvent :
- Aller dans les spams (réputation du domaine, contenu, etc.)
- Être bloqués par des filtres stricts
- Prendre quelques minutes à arriver

Vérifiez toujours les spams et attendez quelques minutes avant de conclure que l'email n'est pas arrivé.

