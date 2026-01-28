# Checklist de validation des traductions PILOTYS

## Pages à vérifier

### ✅ Navigation & Header
- [x] Sidebar (navigation)
- [x] Topbar (déconnexion, préférences)
- [x] Language switcher

### ✅ Pages principales
- [x] Dashboard (`/app`)
- [x] Projets (`/app/projects`)
- [x] Décisions (`/app/decisions`)
- [x] Actions (`/app/actions`)
- [x] Réunions (`/app/meetings`)
- [x] Calendrier (`/app/calendar`)
- [x] Feuille de route (`/app/projects/[id]/roadmap`)

### ✅ Formulaires de création
- [x] Nouvelle réunion (`/app/meetings/new`)
- [x] Nouvelle décision (`/app/decisions/new`)
- [x] Nouvelle action (`/app/actions/new`)
- [x] Nouveau projet (`/app/projects/new`)

### ✅ Pages de détail
- [x] Décision (`/app/decisions/[id]`)
- [x] Projet (`/app/projects/[id]`)

### ✅ Composants réutilisables
- [x] CreateMenu (dashboard)
- [x] ActionStatusButtons
- [x] DecisionCard
- [x] ActionCard
- [x] PageHeader

## Points de vérification

### Cohérence terminologique
- ✅ "Réunion" / "Meeting" (pas "Reunion")
- ✅ "Feuille de route" / "Roadmap"
- ✅ "Décision" / "Decision"
- ✅ "Action" / "Action"
- ✅ "Échéance" / "Due date"
- ✅ "Responsable" / "Owner"

### Statuts standardisés
- ✅ "À faire" / "To do"
- ✅ "En cours" / "In progress"
- ✅ "Terminé" / "Done"
- ✅ "Bloqué" / "Blocked"
- ✅ "Brouillon" / "Draft"
- ✅ "Décidée" / "Decided"

### Registre de langue
- ✅ Vouvoiement partout (FR)
- ✅ Style professionnel (EN)
- ✅ Phrases courtes et actionnables

### Formats de dates
- ⚠️ À vérifier : utilisation de `Intl.DateTimeFormat` avec locale
- ⚠️ Jours de la semaine traduits dans le calendrier

## Notes importantes

- Les contenus utilisateurs (réunions, notes, actions) ne sont PAS traduits
- Seule l'interface est traduite
- Le glossaire (`GLOSSARY.md`) doit être respecté strictement

## Prochaines étapes

1. Vérifier les formats de dates avec `Intl.DateTimeFormat`
2. Tester le changement de langue sur toutes les pages
3. Vérifier qu'aucun texte hardcodé ne reste

