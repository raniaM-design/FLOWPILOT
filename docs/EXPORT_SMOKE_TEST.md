# Export Monthly - Smoke Test Manual

## URLs de Test

### PDF
- `/api/export/monthly/pdf?month=2025-12&locale=fr`
- `/api/export/monthly/pdf?month=2025-11&locale=en`
- `/api/export/monthly/pdf?month=2025-10&locale=fr&projectId=xxx` (si projet existe)

### PPTX
- `/api/export/monthly/ppt?month=2025-12&locale=fr`
- `/api/export/monthly/ppt?month=2025-11&locale=en`
- `/api/export/monthly/ppt?month=2025-10&locale=fr&projectId=xxx` (si projet existe)

## Checklist de Test

### ✅ Téléchargement
- [ ] Le fichier se télécharge automatiquement
- [ ] Le nom du fichier est correct (`pilotys-monthly-YYYY-MM.pdf` ou `.pptx`)
- [ ] Le fichier n'est pas vide (taille > 0)

### ✅ Ouverture
- [ ] **PDF** : S'ouvre dans Adobe Reader / Chrome PDF viewer sans warning
- [ ] **PPTX** : S'ouvre dans PowerPoint / Keynote / Google Slides sans warning
- [ ] Aucun message d'erreur "fichier corrompu"

### ✅ Contenu PDF
- [ ] Header avec titre "Monthly Review — YYYY-MM"
- [ ] Date de génération affichée
- [ ] Executive Summary avec bullets
- [ ] Section KPIs avec grille 2x3
- [ ] **Graphique activité** visible (bar chart)
- [ ] **Graphique statut** visible (donut chart)
- [ ] **Graphique avancement projets** visible (bar chart horizontal)
- [ ] Section "Décisions clés" avec table
- [ ] Section "Focus mois suivant" avec bullets
- [ ] Numérotation des pages en footer

### ✅ Contenu PPTX
- [ ] Slide 1 : Cover avec header PILOTYS, titre, executive summary
- [ ] Slide 2 : KPIs en grille 2x3
- [ ] Slide 3 : **Graphique activité** (full width) + **Graphique statut** et **Graphique avancement** (côte à côte)
- [ ] Slide 4 : Décisions clés (colonne gauche) + Focus mois suivant (colonne droite)
- [ ] Tous les graphiques sont visibles et lisibles

### ✅ Erreurs
- [ ] Si `month` manquant → JSON `{ error: "MISSING_MONTH", message: "..." }`
- [ ] Si `locale` invalide → JSON `{ error: "INVALID_LOCALE", message: "..." }`
- [ ] Si non authentifié → JSON `{ error: "UNAUTHORIZED", message: "..." }`
- [ ] **Jamais de HTML** retourné (même en cas d'erreur)

### ✅ Logs Serveur
- [ ] Succès : `[EXPORT_OK] { kind: "monthly_pdf", month: "2025-12", locale: "fr", ms: 1234, bytes: 45678 }`
- [ ] Échec : `[EXPORT_FAIL] { kind: "monthly_pdf", month: "2025-12", locale: "fr", ms: 567, message: "..." }`

### ✅ Performance
- [ ] Export PDF < 3s (vérifier `ms` dans logs)
- [ ] Export PPTX < 3s (vérifier `ms` dans logs)

## Commandes de Test

### Test rapide (curl)
```bash
# PDF
curl -o test.pdf "http://localhost:3000/api/export/monthly/pdf?month=2025-12&locale=fr"

# PPTX
curl -o test.pptx "http://localhost:3000/api/export/monthly/ppt?month=2025-12&locale=fr"
```

### Vérification signature binaire
```bash
# PDF doit commencer par %PDF
head -c 4 test.pdf

# PPTX doit commencer par PK
head -c 2 test.pptx | od -An -tx1
```

### Vérification taille
```bash
# Vérifier que le fichier n'est pas vide
ls -lh test.pdf test.pptx
```

## Tests d'Erreur

### Test 1 : Month manquant
```bash
curl "http://localhost:3000/api/export/monthly/pdf?locale=fr"
# Attendu: JSON { error: "MISSING_MONTH", message: "..." }
```

### Test 2 : Locale invalide
```bash
curl "http://localhost:3000/api/export/monthly/pdf?month=2025-12&locale=de"
# Attendu: JSON { error: "INVALID_LOCALE", message: "..." }
```

### Test 3 : Non authentifié
```bash
# Sans cookie de session
curl "http://localhost:3000/api/export/monthly/pdf?month=2025-12&locale=fr"
# Attendu: JSON { error: "UNAUTHORIZED", message: "..." }
```

## Validation Automatique

### Vérifier les imports statiques
```bash
npm run export:check
# Attendu: [OK] No dynamic imports in X export files
```

## Notes

- Les tests doivent être effectués avec des données réelles en base
- Vérifier les logs serveur pour les timings et erreurs
- Tester avec différents mois (mois courant, mois passé, mois futur)
- Tester avec et sans `projectId`

