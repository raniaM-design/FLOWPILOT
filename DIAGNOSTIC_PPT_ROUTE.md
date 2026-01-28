# Diagnostic Route PPT Monthly

## Étape 1 : Tester la route minimale

La route a été hard reset pour isoler le problème.

### Test GET
```bash
curl http://localhost:3000/api/review/monthly/ppt
```

**Résultat attendu** : JSON `{"ok":true,"route":"monthly-ppt","ts":...}`

### Test POST
```bash
curl -X POST http://localhost:3000/api/review/monthly/ppt
```

**Résultat attendu** : JSON `{"ok":true,"route":"monthly-ppt","ts":...,"method":"POST"}`

---

## Si la route minimale renvoie du HTML

### Problème de routing/middleware

1. **Vérifier le middleware** (`middleware.ts`) :
   - Doit loguer `[middleware] API route matched: /api/review/monthly/ppt`
   - Doit retourner JSON 401 si non authentifié (pas de redirect HTML)

2. **Vérifier l'URL appelée côté client** :
   - Doit être exactement `/api/review/monthly/ppt` (pas `/app/review/...`)

3. **Vérifier les logs serveur** :
   - Si aucun log `[middleware]` → le middleware ne matche pas
   - Si log `[middleware]` mais HTML → problème dans le middleware

---

## Si la route minimale fonctionne (renvoie JSON)

La route est bien exécutée. Le problème vient d'un import qui crash.

### Version actuelle avec lazy imports

La route a été mise à jour avec des **lazy imports** pour éviter les crashes à l'import-time :

- ✅ Tous les imports sont maintenant dans `await import(...)` à l'intérieur de POST()
- ✅ Logs détaillés à chaque étape (`step 1`, `step 2`, etc.)
- ✅ Try/catch complet avec JSON d'erreur

### Tester la version complète

```bash
curl -X POST http://localhost:3000/api/review/monthly/ppt
```

**Logs attendus** :
```
[monthly-ppt] start
[monthly-ppt] step 1: lazy importing modules...
[monthly-ppt] step 1 ok: auth/locale imported
[monthly-ppt] step 2: checking auth...
[monthly-ppt] step 2 ok: authenticated
...
```

**Si crash à une étape** :
- Le dernier log indique où ça a crashé
- L'erreur JSON contient `details` et `stack` (en dev)

---

## Identification du module coupable

Si la route crash encore avec HTML, vérifier les logs :

1. **Si crash avant `step 1`** :
   - Problème avec les imports statiques en haut du fichier
   - Solution : déplacer tous les imports en lazy

2. **Si crash à `step 3` (buildMonthlyReviewData)** :
   - Problème avec Prisma ou buildMonthlyReviewData
   - Vérifier la connexion DB

3. **Si crash à `step 5` (chartFactory)** :
   - Problème avec chartjs-node-canvas ou canvas natif
   - Vérifier que canvas est installé : `npm list canvas`

4. **Si crash à `step 7` (generateMonthlyReviewPpt)** :
   - Problème avec PptxGenJS
   - Vérifier la version : `npm list pptxgenjs`

---

## Mode debug

Ajouter `?debug=1` pour obtenir des infos détaillées :

```bash
curl -X POST "http://localhost:3000/api/review/monthly/ppt?debug=1"
```

Retourne JSON avec :
- `size` : taille du buffer
- `firstBytesHex` : premiers bytes en hex
- `signature` : true/false
- Sauvegarde des fichiers dans `/tmp`

---

## Validation finale

Une fois que la route fonctionne :

1. **Télécharger le PPTX** depuis l'interface
2. **Ouvrir dans PowerPoint**
3. **Vérifier que le fichier s'ouvre correctement**

Si le fichier est corrompu :
- Vérifier les logs `step 9` (signature validation)
- Si signature invalide → problème dans `generateMonthlyReviewPpt`
- Vérifier que `exportPpt.ts` utilise `arraybuffer` et non `nodebuffer`

---

## Restauration version complète

Si vous avez besoin de restaurer la version complète avec lazy imports, elle est déjà dans `app/api/review/monthly/ppt/route.ts`.

Les lazy imports garantissent qu'aucun import ne crash à l'import-time, et les logs détaillés permettent d'identifier précisément où ça crash.

