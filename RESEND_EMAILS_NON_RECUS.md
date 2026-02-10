# 🔍 Résolution : Emails enregistrés sur Resend mais non reçus

## Problème

Les emails sont bien enregistrés sur Resend (visibles dans le dashboard), mais le destinataire ne les reçoit pas.

## ✅ Causes possibles

### 1. Domaine "from" non vérifié dans Resend (le plus probable)

**Symptôme :** Les emails sont envoyés mais ne sont pas délivrés.

**Solution :**
1. Allez sur [resend.com](https://resend.com) → **Domains**
2. Vérifiez que votre domaine (ex: `pilotys.io`) est :
   - ✅ **Ajouté**
   - ✅ **Vérifié** (tous les records DNS sont configurés)
   - ✅ **Actif** (statut "Verified")

3. Si le domaine n'est **pas vérifié** :
   - Les emails sont envoyés mais **bloqués** par les serveurs de réception
   - Vous devez configurer les records DNS dans votre registrar

**Solution temporaire pour tester :**
Utilisez `onboarding@resend.dev` (domaine de test Resend) :
- Allez sur Vercel → Settings → Environment Variables
- Modifiez `EMAIL_FROM` = `onboarding@resend.dev`
- Redéployez

### 2. Emails dans les spams

**Vérifications :**
- ✅ Vérifiez le dossier spam/courrier indésirable
- ✅ Vérifiez les filtres de votre boîte email
- ✅ Vérifiez que l'expéditeur n'est pas bloqué

### 3. Vérifier le statut dans Resend Dashboard

1. Allez sur [resend.com](https://resend.com) → **Emails**
2. Cliquez sur un email envoyé
3. Vérifiez le statut :
   - ✅ **Delivered** = Email délivré (vérifiez les spams)
   - ⚠️ **Bounced** = Email rejeté (adresse invalide ou domaine non vérifié)
   - ⚠️ **Failed** = Échec d'envoi (vérifiez la configuration)

### 4. Vérifier les logs Resend

Dans Resend Dashboard → **Emails** → Cliquez sur un email → **Logs** :
- Vérifiez les erreurs de délivrabilité
- Vérifiez les raisons de bounce si applicable

## 🔧 Solutions

### Solution 1 : Vérifier votre domaine dans Resend

1. **Resend Dashboard** → **Domains** → Cliquez sur votre domaine
2. Vérifiez que tous les records DNS sont configurés :
   - ✅ **SPF** record
   - ✅ **DKIM** records (plusieurs)
   - ✅ **DMARC** record (optionnel mais recommandé)

3. **Configurez les records DNS** dans votre registrar (ex: Cloudflare, Namecheap, etc.)
4. **Attendez la propagation DNS** (peut prendre jusqu'à 48h, généralement quelques heures)

### Solution 2 : Utiliser le domaine de test temporairement

Pour tester rapidement sans vérifier le domaine :

1. **Vercel Dashboard** → Settings → Environment Variables
2. Modifiez `EMAIL_FROM` :
   ```
   EMAIL_FROM=onboarding@resend.dev
   ```
3. **Redéployez** l'application
4. **Testez** l'envoi d'email

**Note :** `onboarding@resend.dev` est un domaine de test Resend qui fonctionne sans vérification, mais les emails peuvent quand même aller dans les spams.

### Solution 3 : Vérifier la configuration de l'adresse "from"

Vérifiez que `EMAIL_FROM` sur Vercel correspond exactement à :
- Un domaine vérifié dans Resend, OU
- `onboarding@resend.dev` pour les tests

**Format correct :**
- ✅ `noreply@pilotys.io` (si domaine vérifié)
- ✅ `onboarding@resend.dev` (domaine de test)
- ❌ `noreply@non-verifie.com` (domaine non vérifié = emails bloqués)

## 📋 Checklist de diagnostic

- [ ] Domaine vérifié dans Resend Dashboard → Domains
- [ ] Records DNS configurés (SPF, DKIM, DMARC)
- [ ] `EMAIL_FROM` correspond au domaine vérifié
- [ ] Emails vérifiés dans le dossier spam
- [ ] Statut des emails vérifié dans Resend Dashboard → Emails
- [ ] Logs Resend consultés pour les erreurs

## 🔍 Vérification dans Resend Dashboard

### Vérifier le statut d'un email

1. Allez sur **Resend Dashboard** → **Emails**
2. Cliquez sur un email récent
3. Vérifiez :
   - **Status** : Delivered / Bounced / Failed
   - **From** : Doit correspondre à un domaine vérifié
   - **To** : Adresse de destination
   - **Events** : Timeline des événements (sent, delivered, bounced, etc.)

### Vérifier le domaine

1. Allez sur **Resend Dashboard** → **Domains**
2. Cliquez sur votre domaine
3. Vérifiez :
   - **Status** : Verified / Pending / Failed
   - **DNS Records** : Tous doivent être configurés (✅ verts)
   - **Last checked** : Date de dernière vérification

## 💡 Recommandations

1. **Vérifiez toujours votre domaine** avant d'utiliser une adresse "from" personnalisée
2. **Utilisez `onboarding@resend.dev`** pour les tests de développement
3. **Vérifiez les spams** systématiquement lors des tests
4. **Consultez les logs Resend** pour comprendre les échecs de délivrabilité

## 🆘 Si le problème persiste

1. **Partagez le statut de l'email** dans Resend Dashboard (Delivered/Bounced/Failed)
2. **Partagez le statut du domaine** (Verified/Pending/Failed)
3. **Vérifiez les logs Resend** pour les erreurs spécifiques
4. **Testez avec `onboarding@resend.dev`** pour isoler le problème

