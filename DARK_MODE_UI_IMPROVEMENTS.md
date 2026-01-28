# Améliorations Dark Mode - Validation Visuelle

## ✅ Modifications effectuées

### 1. Composants corrigés

#### `components/dashboard/focus-today.tsx`
**Avant :**
- Gradients agressifs : `bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30`
- Couleurs hardcodées : `bg-white`, `text-slate-900`, `text-slate-600`
- Barre de progression avec gradient : `bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500`

**Après :**
- Tokens shadcn : `bg-card`, `text-foreground`, `text-muted-foreground`
- Barre highlight subtile : `bg-primary/20 dark:bg-primary/10`
- Icônes avec tokens : `bg-primary`, `text-primary-foreground`
- Cards internes : `bg-card`, `border-border`

#### `components/dashboard/week-actions.tsx`
**Avant :**
- `bg-white`, `text-slate-900`, `text-slate-600`
- `bg-slate-50/50`, `border-slate-200/60`

**Après :**
- `bg-card`, `text-foreground`, `text-muted-foreground`
- `bg-muted/30`, `border-border`

#### `components/user-menu.tsx`
**Avant :**
- `text-slate-900`, `text-slate-500`

**Après :**
- `text-popover-foreground`, `text-muted-foreground`

#### `components/ui/flow-card.tsx`
**Avant :**
- Shadows identiques en light et dark

**Après :**
- Shadows réduites en dark mode :
  - `default`: `shadow-sm dark:shadow-none`
  - `elevated`: `shadow-md dark:shadow-sm`
  - `outlined`: `shadow-sm dark:shadow-none`

---

## ✅ Checklist de validation visuelle

### Dashboard (`/app`)

#### ✅ 1. Action principale (FocusToday)
- [ ] **Light mode** : Card avec bordure subtile, fond blanc, highlight bleu doux
- [ ] **Dark mode** : Card avec fond `bg-card` (ardoise), bordure visible, highlight très subtil
- [ ] **Pas de gradient** en dark mode
- [ ] **Texte lisible** : `text-foreground` et `text-muted-foreground` bien contrastés

#### ✅ 2. Autres priorités (FocusToday)
- [ ] **Light mode** : Fond gris très clair (`bg-muted/30`)
- [ ] **Dark mode** : Fond légèrement plus clair que le background (`bg-muted/30`)
- [ ] **Hover** : Transition douce, pas de flash

#### ✅ 3. Actions de la semaine (WeekActions)
- [ ] **Light mode** : Cards avec bordure subtile
- [ ] **Dark mode** : Cards avec fond `bg-card`, bordure visible
- [ ] **Empty state** : Icône et texte bien contrastés

### Menu utilisateur (Dropdown)

#### ✅ 4. DropdownMenu
- [ ] **Light mode** : Fond blanc, texte noir
- [ ] **Dark mode** : Fond `bg-popover` (ardoise), texte `text-popover-foreground`
- [ ] **Email** : `text-popover-foreground` bien lisible
- [ ] **Plan actuel** : `text-muted-foreground` pour les labels secondaires
- [ ] **Séparateurs** : Visibles mais subtils (`bg-muted`)

### Sidebar

#### ✅ 5. AppSidebar
- [ ] **Light mode** : Fond blanc, bordure claire
- [ ] **Dark mode** : Fond `bg-card`, bordure `border-border` visible
- [ ] **Navigation active** : `bg-accent`, `text-accent-foreground`
- [ ] **Navigation hover** : Transition douce

### Cards générales

#### ✅ 6. FlowCard variants
- [ ] **default** : Shadow réduite en dark (`dark:shadow-none`)
- [ ] **elevated** : Shadow modérée en dark (`dark:shadow-sm`)
- [ ] **outlined** : Shadow supprimée en dark (`dark:shadow-none`)
- [ ] **Borders** : Toujours visibles en dark (`border-border`)

---

## 🎨 Principes appliqués

### 1. Tokens shadcn uniquement
- ✅ `bg-background` pour le fond global
- ✅ `bg-card` pour les surfaces (cards, sidebar, topbar)
- ✅ `bg-popover` pour les dropdowns
- ✅ `text-foreground` pour le texte principal
- ✅ `text-muted-foreground` pour le texte secondaire
- ✅ `border-border` pour toutes les bordures

### 2. Shadows réduites en dark
- ✅ `shadow-sm` → `dark:shadow-none` ou `dark:shadow-sm`
- ✅ Préférer les bordures pour la séparation visuelle
- ✅ Éviter les effets "flashy"

### 3. Pas de gradients en dark
- ✅ Supprimer tous les `bg-gradient-*` en dark mode
- ✅ Utiliser des surfaces unies avec tokens
- ✅ Highlight subtil avec `bg-primary/10` ou `bg-primary/20`

### 4. Contrastes confortables
- ✅ Fond sombre (`222.2 84% 4.9%`) + surfaces légèrement plus claires (`222.2 84% 6.5%`)
- ✅ Texte principal (`210 40% 98%`) bien contrasté
- ✅ Texte secondaire (`215 20.2% 65.1%`) lisible mais discret

---

## 🔍 Tests à effectuer

### Test 1 : Dashboard complet
1. Aller sur `/app`
2. Activer le dark mode
3. Vérifier :
   - ✅ Pas de cartes blanches "flashy"
   - ✅ Fond sombre harmonieux
   - ✅ Cards avec fond `bg-card` (ardoise)
   - ✅ Bordures visibles mais subtiles
   - ✅ Texte bien contrasté

### Test 2 : Menu utilisateur
1. Cliquer sur l'avatar
2. Vérifier :
   - ✅ Dropdown avec fond `bg-popover`
   - ✅ Texte `text-popover-foreground` lisible
   - ✅ Labels secondaires en `text-muted-foreground`
   - ✅ Séparateurs visibles

### Test 3 : Navigation sidebar
1. Vérifier :
   - ✅ Fond `bg-card` (pas blanc)
   - ✅ Bordure `border-border` visible
   - ✅ État actif avec `bg-accent`
   - ✅ Hover doux

### Test 4 : Cards dans différentes pages
1. Aller sur `/app/decisions`, `/app/actions`, `/app/projects`
2. Vérifier :
   - ✅ Toutes les cards utilisent `bg-card`
   - ✅ Shadows réduites ou supprimées en dark
   - ✅ Bordures visibles
   - ✅ Pas de gradients agressifs

---

## 📝 Notes techniques

### Classes Tailwind à éviter en dark mode
- ❌ `bg-white` → ✅ `bg-card`
- ❌ `text-black`, `text-slate-900` → ✅ `text-foreground`
- ❌ `text-slate-600`, `text-slate-500` → ✅ `text-muted-foreground`
- ❌ `bg-gradient-*` → ✅ `bg-card` + `border-border`
- ❌ `shadow-lg`, `shadow-xl` → ✅ `shadow-sm` ou `dark:shadow-none`

### Classes Tailwind recommandées
- ✅ `bg-background` : Fond global
- ✅ `bg-card` : Surfaces (cards, sidebar, topbar)
- ✅ `bg-popover` : Dropdowns, menus
- ✅ `bg-muted/30` : Surfaces secondaires
- ✅ `text-foreground` : Texte principal
- ✅ `text-muted-foreground` : Texte secondaire
- ✅ `border-border` : Bordures
- ✅ `bg-primary/10` : Highlights subtils

---

## 🎯 Résultat attendu

### Light mode
- Fond blanc propre
- Cards avec bordures subtiles
- Shadows légères pour la profondeur
- Gradients doux acceptables (mais pas agressifs)

### Dark mode
- Fond ardoise sombre (`222.2 84% 4.9%`)
- Cards avec fond légèrement plus clair (`222.2 84% 6.5%`)
- Bordures visibles pour la séparation
- Shadows réduites ou supprimées
- **Aucun gradient agressif**
- **Aucune carte blanche "flashy"**
- Contrastes confortables et harmonieux

---

## ✅ Validation finale

- [ ] Dashboard visuellement harmonieux en dark mode
- [ ] Menu utilisateur avec tokens shadcn
- [ ] Sidebar avec fond `bg-card`
- [ ] Cards sans gradients agressifs
- [ ] Shadows réduites en dark
- [ ] Bordures visibles mais subtiles
- [ ] Texte bien contrasté partout
- [ ] Pas de cartes blanches "flashy"

