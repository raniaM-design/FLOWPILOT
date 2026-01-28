# Plan d'Implémentation - Système d'Export PILOTYS

## Phase 1 : Fondations (Jour 1)

### 1.1 Créer la structure de dossiers

```bash
mkdir -p lib/export/monthly
mkdir -p lib/export/charts
mkdir -p lib/export/design
mkdir -p lib/export/utils
mkdir -p app/api/export/monthly/pdf
mkdir -p app/api/export/monthly/ppt
```

### 1.2 Créer les fichiers de configuration

**Fichiers à créer** :
- `lib/export/charts/chart-config.ts` - Configuration commune des graphes
- `lib/export/design/pdf-theme.ts` - Thème PDF
- `lib/export/design/ppt-theme.ts` - Thème PPT
- `lib/export/utils/file-validator.ts` - Validation signatures binaires
- `lib/export/utils/response-builder.ts` - Helpers réponses HTTP

### 1.3 Créer les types TypeScript

**Fichier** : `lib/export/monthly/types.ts`
- Types pour les données d'export
- Types pour les buffers de graphes
- Types pour les paramètres d'export

---

## Phase 2 : Chart Engine (Jour 1-2)

### 2.1 Implémenter les générateurs de graphes

**Ordre d'implémentation** :
1. `lib/export/charts/activity-chart.ts` - Graphique activité par semaine
2. `lib/export/charts/status-chart.ts` - Graphique statut des actions
3. `lib/export/charts/progress-chart.ts` - Graphique avancement projets

**Tests** :
- Générer chaque graphe avec des données mockées
- Vérifier que le buffer PNG est valide
- Vérifier les dimensions et la qualité

---

## Phase 3 : Data Builder (Jour 2)

### 3.1 Créer le data builder

**Fichier** : `lib/export/monthly/data-builder.ts`
- Utilise `buildMonthlyReviewData` existant
- Transforme les données UI → Export
- Formate les dates, nombres, textes

**Tests** :
- Vérifier la transformation des données
- Vérifier le formatage des dates
- Vérifier la structure des données pour graphes

---

## Phase 4 : PDF Generator (Jour 3-4)

### 4.1 Implémenter le générateur PDF

**Fichier** : `lib/export/monthly/pdf-generator.ts`
- Fonction principale `generateMonthlyPdf()`
- Fonctions de rendu par section :
  - `renderCoverPage()`
  - `renderExecutiveSummary()`
  - `renderKpis()`
  - `renderCharts()`
  - `renderKeyDecisions()`
  - `renderNextMonthFocus()`
  - `addFooter()`

**Tests** :
- Générer un PDF complet avec données réelles
- Vérifier la signature PDF (%PDF)
- Ouvrir dans Adobe Reader
- Vérifier la lisibilité des graphes

---

## Phase 5 : PPT Generator (Jour 4-5)

### 5.1 Implémenter le générateur PPT

**Fichier** : `lib/export/monthly/ppt-generator.ts`
- Fonction principale `generateMonthlyPpt()`
- Création des slides :
  - Slide 1 : Cover
  - Slide 2 : Executive Summary + KPIs
  - Slide 3 : Activity Chart + Status Chart
  - Slide 4 : Progress Chart + Top Projects
  - Slide 5 : Key Decisions
  - Slide 6 : Next Month Focus

**Tests** :
- Générer un PPT complet avec données réelles
- Vérifier la signature PPTX (PK)
- Ouvrir dans PowerPoint
- Vérifier la lisibilité des graphes

---

## Phase 6 : API Routes (Jour 5)

### 6.1 Créer les endpoints API

**Fichiers** :
- `app/api/export/monthly/pdf/route.ts`
- `app/api/export/monthly/ppt/route.ts`

**Fonctionnalités** :
- Validation des paramètres
- Authentification
- Appel des générateurs
- Retour binaire avec headers
- Gestion d'erreurs (JSON)

**Tests** :
- Appel HTTP avec curl/Postman
- Vérifier les headers HTTP
- Vérifier le téléchargement du fichier
- Tester les cas d'erreur (auth, validation)

---

## Phase 7 : Intégration Client (Jour 6)

### 7.1 Mettre à jour le client

**Fichier** : `app/app/review/ReviewHeaderActions.tsx`
- Changer les endpoints vers `/api/export/monthly/pdf` et `/api/export/monthly/ppt`
- Utiliser `downloadFromApi` existant (déjà bon)

**Tests** :
- Cliquer sur "Export PDF" → téléchargement fonctionne
- Cliquer sur "Export PPT" → téléchargement fonctionne
- Vérifier les fichiers générés

---

## Phase 8 : Tests & Validation (Jour 7)

### 8.1 Tests complets

- [ ] Génération PDF avec données réelles
- [ ] Génération PPT avec données réelles
- [ ] Graphes visibles dans PDF
- [ ] Graphes visibles dans PPT
- [ ] Design cohérent et professionnel
- [ ] Performance acceptable (< 3s)
- [ ] Pas d'erreurs Turbopack
- [ ] Pas de fichiers corrompus

### 8.2 Tests d'intégration

- [ ] Export depuis l'UI fonctionne
- [ ] Fichiers s'ouvrent correctement
- [ ] Impression PDF correcte
- [ ] Présentation PPT correcte

---

## Phase 9 : Nettoyage (Jour 8)

### 9.1 Supprimer l'ancien code

**Fichiers à supprimer** :
- `app/api/review/monthly/pdf/route.ts`
- `app/api/review/monthly/ppt/route.ts`
- `lib/review/monthly/exportPdf.ts`
- `lib/review/monthly/exportPpt.ts`
- `lib/review/monthly/renderCharts.ts`
- `lib/export/charts/chartFactory.ts` (ancien)

### 9.2 Nettoyer les dépendances

- Vérifier que toutes les dépendances sont utilisées
- Supprimer les dépendances inutiles (si ajoutées pour l'ancien système)

---

## Phase 10 : Documentation (Jour 8)

### 10.1 Documentation technique

- [ ] Documenter les fonctions principales
- [ ] Ajouter des commentaires JSDoc
- [ ] Mettre à jour le README si nécessaire

### 10.2 Documentation utilisateur

- [ ] Guide d'utilisation pour l'équipe produit
- [ ] Exemples de fichiers générés

---

## Checklist Globale

### Code
- [ ] Tous les imports sont statiques
- [ ] Pas de dépendance React/Recharts côté export
- [ ] Gestion d'erreurs complète
- [ ] Validation des signatures binaires
- [ ] Headers HTTP corrects

### Qualité
- [ ] Code lisible et maintenable
- [ ] Tests unitaires pour les générateurs
- [ ] Tests d'intégration pour les endpoints
- [ ] Performance acceptable

### Design
- [ ] Design cohérent PILOTYS
- [ ] Graphes visibles et lisibles
- [ ] Mise en page professionnelle
- [ ] Compatible impression/présentation

---

## Estimation Totale

**Temps estimé** : 8 jours de développement
- Phase 1-2 : 1 jour (fondations + charts)
- Phase 3-4 : 2 jours (data builder + PDF)
- Phase 5-6 : 2 jours (PPT + API)
- Phase 7-8 : 2 jours (intégration + tests)
- Phase 9-10 : 1 jour (nettoyage + doc)

**Ressources** :
- 1 développeur senior Next.js/Node.js
- Accès à la base de données pour tests
- Adobe Reader et PowerPoint pour validation

---

## Risques & Mitigation

### Risque 1 : Performance
**Mitigation** : Génération parallèle des graphes, cache des données

### Risque 2 : Qualité des graphes
**Mitigation** : Tests avec données réelles, validation visuelle

### Risque 3 : Compatibilité fichiers
**Mitigation** : Validation signatures binaires, tests avec logiciels standards

### Risque 4 : Erreurs Turbopack
**Mitigation** : Tous les imports statiques, pas de template strings

---

## Prochaines Étapes

1. **Valider l'architecture** avec l'équipe
2. **Créer les fichiers de base** (Phase 1)
3. **Implémenter progressivement** (Phases 2-6)
4. **Tester et valider** (Phase 7-8)
5. **Déployer en production** après validation complète

