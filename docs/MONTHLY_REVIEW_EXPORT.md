# Monthly Review Export - Documentation

## Configuration requise

### Dépendances

Les exports PDF/PPT utilisent Chart.js côté serveur pour générer les graphiques :

- `chart.js` : Bibliothèque de graphiques
- `chartjs-node-canvas` : Rendu server-side de Chart.js en PNG

Ces dépendances sont installées automatiquement avec `npm install`.

## Architecture

### 1. Génération des graphiques côté serveur

**Fichier** : `lib/export/charts/chartFactory.ts`

Les graphiques sont générés directement côté serveur sans navigateur ni DOM :

- **`generateActivityChart()`** : Graphique en barres pour l'activité par semaine
  - Type : Bar chart
  - Dimensions : 1200x500px
  - Séries : Réunions, Actions, Décisions

- **`generateActionStatusChart()`** : Graphique en donut pour la répartition des statuts
  - Type : Doughnut chart
  - Dimensions : 1200x500px
  - Statuts : Done, In Progress, Blocked, Overdue, Todo

- **`generateProjectProgressChart()`** : Graphique en barres horizontales pour l'avancement
  - Type : Horizontal bar chart
  - Dimensions : 1200x500px
  - Affiche jusqu'à 10 projets avec leur pourcentage de complétion

Tous les graphiques :
- Ont un fond blanc
- Utilisent les couleurs cohérentes PILOTYS
- Retournent un Buffer PNG directement utilisable

### 2. Génération PDF/PPT

Les générateurs PDF et PPT utilisent les buffers PNG générés :

- **PDF** : `lib/review/monthly/exportPdf.ts`
  - Utilise `pdf.addImage()` avec data URI base64
  - Gère gracieusement les erreurs (affiche un texte si le graphique est indisponible)

- **PPT** : `lib/review/monthly/exportPpt.ts`
  - Utilise `slide.addImage()` avec data URI base64
  - Gère gracieusement les erreurs (affiche un texte si le graphique est indisponible)

### 3. Routes API

Les routes API génèrent les graphiques avant de créer les fichiers :

- `/api/review/monthly/pdf` → `app/api/review/monthly/pdf/route.ts`
  - Génère les 3 graphiques avec `chartFactory`
  - Passe les buffers à `generateMonthlyReviewPdf()`

- `/api/review/monthly/ppt` → `app/api/review/monthly/ppt/route.ts`
  - Génère les 3 graphiques avec `chartFactory`
  - Passe les buffers à `generateMonthlyReviewPpt()`

En cas d'erreur lors de la génération d'un graphique :
- L'erreur est loggée dans la console
- Le processus continue (ne crash pas)
- Un message texte est affiché à la place du graphique dans le PDF/PPT

## Avantages de cette approche

✅ **Fiabilité** : Pas de dépendance au rendu React/DOM
✅ **Performance** : Génération directe sans navigateur
✅ **Stabilité** : Fonctionne en dev et en prod de manière identique
✅ **Simplicité** : Pas de timing fragile ou de problèmes de chargement
✅ **Maintenabilité** : Code server-side simple et testable

## Dépannage

### Les graphiques ne s'affichent pas dans les exports

1. **Vérifier les logs** :
   - Les erreurs de génération sont loggées dans la console
   - Vérifier que les données sont présentes dans `MonthlyReviewExportData`

2. **Vérifier les dépendances** :
   ```bash
   npm install chart.js chartjs-node-canvas
   ```

3. **Vérifier les données** :
   - Les graphiques nécessitent des données dans `data.charts.*`
   - Si les données sont vides, un graphique vide sera généré

### Erreur lors de la génération d'un graphique

- L'erreur est loggée mais n'interrompt pas le processus
- Un message texte remplace le graphique dans le PDF/PPT
- Vérifier les logs pour identifier la cause

## Notes techniques

- Les graphiques sont générés avec une résolution de 1200x500px
- Les couleurs utilisent la palette PILOTYS cohérente
- Les buffers PNG sont directement injectés dans les fichiers PDF/PPT
- Aucune dépendance au navigateur ou au DOM
