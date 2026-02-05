# 🔧 Correction de l'erreur MICROSOFT_SCOPES

## 🎯 Problème
```
{"error":"Configuration invalide","details":"MICROSOFT_SCOPES contient des caractères invalides"}
```

## ✅ Solution

### Étape 1 : Vérifier MICROSOFT_SCOPES sur Vercel

1. **Vercel Dashboard** → Votre projet → **Settings** → **Environment Variables**
2. Cherchez `MICROSOFT_SCOPES`
3. Vérifiez sa valeur

### Étape 2 : Format correct

**Format attendu** (sans guillemets) :
```
openid profile offline_access User.Read Calendars.Read email
```

**Caractères autorisés** :
- Lettres (a-z, A-Z)
- Chiffres (0-9)
- Points (.)
- Underscores (_)
- Tirets (-)
- Slashes (/)
- Espaces (pour séparer les scopes)

**Caractères interdits** :
- Guillemets (`"` ou `'`)
- Sauts de ligne
- Caractères spéciaux non listés ci-dessus

### Étape 3 : Corriger sur Vercel

#### Option A : Via Dashboard Vercel

1. **Vercel Dashboard** → Votre projet → **Settings** → **Environment Variables**
2. Trouvez `MICROSOFT_SCOPES`
3. Cliquez sur **"Edit"**
4. Remplacez la valeur par :
   ```
   openid profile offline_access User.Read Calendars.Read email
   ```
5. **⚠️ IMPORTANT** : Pas de guillemets autour de la valeur
6. Cliquez sur **"Save"**

#### Option B : Via CLI

```bash
# Supprimer l'ancienne valeur
vercel env rm MICROSOFT_SCOPES production

# Ajouter la nouvelle valeur (sans guillemets)
vercel env add MICROSOFT_SCOPES production
# Quand demandé, collez: openid profile offline_access User.Read Calendars.Read email

# Répétez pour Preview et Development si nécessaire
vercel env add MICROSOFT_SCOPES preview
vercel env add MICROSOFT_SCOPES development
```

### Étape 4 : Vérifier

Après avoir corrigé, vérifiez que :

1. **Pas de guillemets** dans la valeur sur Vercel
2. **Pas de sauts de ligne** dans la valeur
3. **Format correct** : `scope1 scope2 scope3` (séparés par des espaces)

### Étape 5 : Redéployer

1. **Vercel Dashboard** → **Deployments** → **Redeploy**
2. Ou poussez un commit pour déclencher un nouveau déploiement

## 🔍 Diagnostic

Si l'erreur persiste après correction :

1. **Vérifiez les logs Vercel** :
   - Deployments → Functions → Runtime Logs
   - Cherchez `[outlook-connect] Invalid SCOPES format`
   - Regardez les détails : `invalidChars`, `scopesPreview`

2. **Testez avec l'endpoint de debug** :
   ```
   https://votre-app.vercel.app/api/_debug/env
   ```
   Vérifiez la valeur de `MICROSOFT_SCOPES` affichée

## 📋 Exemples

### ✅ Correct
```
openid profile offline_access User.Read Calendars.Read email
```

### ❌ Incorrect (avec guillemets)
```
"openid profile offline_access User.Read Calendars.Read email"
```

### ❌ Incorrect (sur plusieurs lignes)
```
openid profile
offline_access
User.Read
```

### ❌ Incorrect (avec caractères spéciaux)
```
openid profile offline_access User.Read! Calendars.Read email
```

## 🆘 Si ça ne fonctionne toujours pas

Partagez-moi :
1. La valeur exacte de `MICROSOFT_SCOPES` sur Vercel (sans révéler d'informations sensibles)
2. Les logs Vercel contenant `[outlook-connect] Invalid SCOPES format`
3. Le résultat de `/api/_debug/env` (si accessible)

