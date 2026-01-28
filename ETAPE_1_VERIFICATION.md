# ✅ ÉTAPE 1 — Vérification pré-déploiement

## 📊 Résultat du build

✅ **BUILD RÉUSSI** — `npm run build` passe sans erreur

```
✔ Generated Prisma Client
✓ Compiled successfully
✓ Generating static pages
```

---

## 🔐 Variables d'environnement nécessaires

### **OBLIGATOIRES pour la production**

#### 1. Base de données
```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
```
- **Actuellement** : SQLite (`file:./prisma/dev.db`)
- **Objectif** : Postgres (Neon / Supabase / Railway)
- **Statut** : ❌ À configurer

---

#### 2. Authentification JWT
```env
FLOWPILOT_JWT_SECRET="votre-secret-jwt-tres-long-et-aleatoire-minimum-32-caracteres"
```
- **Usage** : Signature et vérification des tokens de session
- **Statut** : ❌ À générer (obligatoire en prod)
- **Génération** : Utiliser `openssl rand -base64 32` ou un générateur en ligne

---

#### 3. Microsoft Outlook / Graph API
```env
MICROSOFT_CLIENT_ID="votre-client-id-azure"
MICROSOFT_CLIENT_SECRET="votre-client-secret-azure"
MICROSOFT_TENANT_ID="common"
MICROSOFT_REDIRECT_URI="https://votre-domaine.vercel.app/api/outlook/callback"
MICROSOFT_SCOPES="openid profile offline_access User.Read Calendars.Read email"
MICROSOFT_TOKEN_ENCRYPTION_KEY="votre-cle-chiffrement-32-caracteres-minimum"
```
- **Usage** : Intégration Outlook pour synchronisation calendrier
- **Statut** : ⚠️ À vérifier (peut être déjà configuré localement)
- **Note** : `MICROSOFT_TENANT_ID="common"` permet comptes pro + personnels

---

#### 4. URL de l'application (pour exports PDF/PPT)
```env
APP_URL="https://votre-domaine.vercel.app"
# OU
NEXT_PUBLIC_APP_URL="https://votre-domaine.vercel.app"
```
- **Usage** : Génération d'exports PDF/PPT depuis le serveur
- **Statut** : ❌ À configurer après déploiement Vercel
- **Priorité** : `APP_URL` (server-side) > `NEXT_PUBLIC_APP_URL` (public)

---

### **OPTIONNELLES**

```env
NODE_ENV="production"  # Défini automatiquement par Vercel
PORT="3000"            # Défini automatiquement par Vercel
```

---

## 📋 Checklist pré-déploiement

### ✅ Complété
- [x] Build local réussi (`npm run build`)
- [x] Prisma Client généré
- [x] TypeScript compile sans erreur
- [x] Routes Next.js générées correctement

### ❌ À faire
- [ ] Créer base Postgres (Neon / Supabase / Railway)
- [ ] Récupérer `DATABASE_URL` Postgres
- [ ] Générer `FLOWPILOT_JWT_SECRET` (32+ caractères)
- [ ] Vérifier/créer Azure App Registration pour Outlook
- [ ] Récupérer `MICROSOFT_CLIENT_ID` et `MICROSOFT_CLIENT_SECRET`
- [ ] Générer `MICROSOFT_TOKEN_ENCRYPTION_KEY` (32+ caractères)
- [ ] Configurer `MICROSOFT_REDIRECT_URI` avec URL Vercel finale

---

## 🔍 Secrets manquants à générer

### 1. `FLOWPILOT_JWT_SECRET`
**Commande pour générer** :
```bash
# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Ou utiliser un générateur en ligne : https://randomkeygen.com/
```
**Format** : Chaîne aléatoire de 32+ caractères (base64 recommandé)

---

### 2. `MICROSOFT_TOKEN_ENCRYPTION_KEY`
**Commande pour générer** :
```bash
# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Ou utiliser un générateur en ligne : https://randomkeygen.com/
```
**Format** : Chaîne aléatoire de 32+ caractères (sera hashé en SHA-256)

---

## 📝 Notes importantes

1. **Ne JAMAIS commiter** les secrets dans Git
2. **Vercel** : Ajouter toutes ces variables dans Settings > Environment Variables
3. **Postgres** : La migration SQLite → Postgres sera faite à l'ÉTAPE 3
4. **Outlook** : Si déjà configuré localement, réutiliser les mêmes credentials Azure

---

## ➡️ Prochaine étape

**ÉTAPE 2 — Base Postgres** : Créer la base de données distante et récupérer la `DATABASE_URL`

