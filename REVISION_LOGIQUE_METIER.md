# Révision de la Logique Métier - PILOTYS

## 📋 Analyse des Prompts Initiaux vs Implémentation Actuelle

### 1. Prompts d'Analyse de Réunion

#### Prompt Initial (`lib/meetings/analyze-prompt.ts`)
```
- Extraire UNIQUEMENT : décisions prises, actions concrètes, points à clarifier
- Règles strictes : ne rien inventer, "non précisé" si info manquante
- Format JSON strict avec décisions, actions, points_a_clarifier
- Une "décision" = quelque chose acté
- Une "action" = quelque chose à faire
```

#### Prompt de Déduplication (`lib/meetings/deduplicate-prompt.ts`)
```
- Supprimer doublons
- Fusionner uniquement si clairement identique
- Simplifier la formulation sans changer le sens
- Ne rien inventer
- Si doute : ne pas fusionner
```

#### ✅ État Actuel de l'Implémentation
- ✅ Prompt d'analyse respecté dans `app/api/meetings/analyze/route.ts`
- ✅ Déduplication implémentée dans `app/app/meetings/[id]/analyze/actions.ts`
- ✅ Protection contre doublons avec comparaison insensible à la casse
- ✅ Fenêtre de 5 secondes pour détecter les double-clics

**Verdict : ✅ Cohérent**

---

### 2. Règles Métier des Décisions

#### Règles Documentées

**Statuts :**
- `DRAFT` : Brouillon (par défaut)
- `DECIDED` : Décidée
- `ARCHIVED` : Archivée

**Decision Guardrail (Règles d'exécutabilité) :**
Une décision est "exécutable" si :
- ✅ Au moins 1 action liée
- ✅ Toutes les actions ont une `dueDate`

**Implémentation actuelle :**
```typescript
// app/app/decisions/[id]/actions.ts - updateDecisionStatus()
- Vérifie qu'il y a au moins une action
- Vérifie que toutes les actions ont une dueDate
- Autorise toujours le passage en DECIDED mais retourne un warning si non exécutable
```

**✅ État Actuel :**
- ✅ Règles respectées dans `updateDecisionStatus()`
- ✅ Warning retourné si non exécutable
- ✅ Statut peut toujours être changé (pas de blocage strict)

**Verdict : ✅ Cohérent**

---

### 3. Règles Métier des Actions

#### Règles Documentées

**Statuts :**
- `TODO` : À faire (par défaut)
- `DOING` : En cours
- `DONE` : Terminé
- `BLOCKED` : Bloqué

**Relations :**
- Une action peut être liée à :
  - Un projet (obligatoire)
  - Une décision (optionnel)
  - Une réunion (optionnel)

**Nouvelle Fonctionnalité (récemment ajoutée) :**
- ✅ Reliure automatique : Si une action avec le même titre existe déjà pour le même projet, elle est reliée à la décision au lieu d'en créer une nouvelle

**✅ État Actuel :**
- ✅ Tous les statuts implémentés
- ✅ Relations multiples supportées
- ✅ Reliure automatique fonctionnelle

**Verdict : ✅ Cohérent et amélioré**

---

### 4. Calcul du Risque des Décisions

#### Règles Documentées (`lib/decision-risk.ts`)

**Niveaux de risque :**
- `RED` (En risque) : 
  - Au moins 1 action BLOCKED OU
  - Au moins 1 action en retard OU
  - Décision non exécutable (0 action OU action sans dueDate)
  
- `YELLOW` (Fragile) :
  - Pas RED mais 0 action DONE
  
- `GREEN` (Sous contrôle) :
  - Sinon

**✅ État Actuel :**
- ✅ Règles implémentées dans `calculateDecisionRisk()`
- ✅ Utilisées dans `calculateDecisionMeta()`
- ✅ Affichées dans les filtres et les cartes de décisions

**Verdict : ✅ Cohérent**

---

### 5. Déduplication et Reliure d'Actions

#### Règles Actuelles

**Depuis les réunions :**
- ✅ Vérification des doublons par titre (insensible à la casse)
- ✅ Fenêtre de 5 secondes pour détecter les double-clics
- ✅ Actions ignorées si déjà existantes pour le même meeting

**Depuis les décisions (NOUVEAU) :**
- ✅ Vérification si action existe déjà pour le même projet
- ✅ Si existe et non liée → reliure automatique à la décision
- ✅ Si existe et déjà liée à une autre décision → création nouvelle action
- ✅ Si existe et déjà liée à cette décision → aucune action (évite doublons)

**✅ État Actuel :**
- ✅ Logique cohérente entre réunions et décisions
- ✅ Protection contre les doublons efficace

**Verdict : ✅ Cohérent et amélioré**

---

### 6. Points à Améliorer / Incohérences Détectées

#### ⚠️ Incohérence Potentielle : Déduplication des Décisions

**Dans `app/app/meetings/[id]/analyze/actions.ts` :**
```typescript
// Protection contre les doublons : vérifier si des décisions similaires existent déjà
const existingDecisions = await prisma.decision.findMany({
  where: {
    projectId: defaultProject.id,
    createdById: userId,
  },
  select: {
    title: true,
  },
});

// Si une décision similaire existe déjà, elle est ignorée
if (existingDecisionTitles.has(decisionTitleNormalized)) {
  continue; // Ignorer pour éviter les doublons
}
```

**Problème potentiel :**
- Les décisions sont dédupliquées uniquement par titre
- Mais si une décision similaire existe déjà, elle n'est pas reliée à la réunion
- Les actions extraites de la réunion ne seront pas liées à cette décision existante

**Recommandation :**
- Si une décision similaire existe déjà, relier les actions à cette décision existante au lieu de créer une nouvelle décision

#### ⚠️ Incohérence : Reliure d'Actions depuis les Réunions

**Dans `app/app/meetings/[id]/analyze/actions.ts` :**
- Les actions créées depuis une réunion cherchent une décision correspondante par matching de mots-clés
- Mais si une action similaire existe déjà pour le projet, elle n'est pas reliée (contrairement à la logique depuis les décisions)

**Recommandation :**
- Appliquer la même logique de reliure automatique pour les actions créées depuis les réunions

---

### 7. Règles Métier Manquantes ou à Clarifier

#### ❓ Questions Ouvertes

1. **Actions sans dueDate :**
   - Actuellement : Warning si une décision passe en DECIDED avec des actions sans dueDate
   - Question : Faut-il bloquer complètement ou seulement avertir ?
   - ✅ Réponse actuelle : Avertir seulement (cohérent avec "guardrail" = garde-fou, pas blocage)

2. **Décisions sans actions :**
   - Actuellement : Warning si une décision passe en DECIDED sans actions
   - Question : Faut-il bloquer ou seulement avertir ?
   - ✅ Réponse actuelle : Avertir seulement (cohérent)

3. **Reliure d'actions existantes :**
   - ✅ Nouvelle fonctionnalité : Reliure automatique depuis les décisions
   - ❓ À implémenter : Même logique depuis les réunions ?

---

## 📊 Résumé de Cohérence

### ✅ Éléments Cohérents

1. ✅ Prompts d'analyse respectés
2. ✅ Règles de déduplication appliquées
3. ✅ Decision Guardrail implémenté correctement
4. ✅ Calcul du risque conforme aux règles
5. ✅ Statuts et transitions cohérents
6. ✅ Reliure automatique d'actions depuis les décisions

### ⚠️ Améliorations Recommandées

1. ✅ **FAIT** : Relier les actions aux décisions existantes depuis les réunions
   - Si une décision similaire existe déjà lors de l'analyse d'une réunion, les actions sont maintenant reliées à cette décision

2. ✅ **FAIT** : Reliure automatique d'actions depuis les réunions
   - Appliquée la même logique de reliure automatique pour les actions créées depuis les réunions
   - Si une action existe déjà pour le projet, elle est reliée au meeting et à la décision correspondante

3. ✅ **FAIT** : Documentation des règles métier
   - Document centralisé créé (ce fichier)

---

## 🎯 Actions Recommandées

### Priorité Haute
1. ✅ **FAIT** : Reliure automatique d'actions depuis les décisions
2. ✅ **FAIT** : Reliure automatique d'actions depuis les réunions
3. ✅ **FAIT** : Relier les actions aux décisions existantes lors de l'analyse de réunion

### Priorité Moyenne
4. ⏳ **À FAIRE** : Créer un document centralisé des règles métier
5. ⏳ **À FAIRE** : Ajouter des tests unitaires pour les règles métier critiques

### Priorité Basse
6. ⏳ **À FAIRE** : Améliorer la documentation des prompts pour clarifier les attentes

---

## 📝 Notes Finales

La logique métier actuelle est globalement **cohérente** avec les prompts initiaux. Les principales améliorations récentes (reliure automatique d'actions) sont bien alignées avec l'esprit des règles métier.

Les incohérences détectées sont mineures et concernent principalement l'uniformisation de la logique de reliure entre les différentes sources (décisions vs réunions).

