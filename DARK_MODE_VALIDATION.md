# Validation du Dark Mode PILOTYS

## Checklist de validation

### ✅ 1. Vérifier `<html class="dark">` dans DevTools

**Méthode :**
1. Ouvrir DevTools (F12)
2. Aller sur `/app/preferences/display`
3. Sélectionner "Sombre"
4. Dans l'inspecteur, vérifier que `<html>` contient `class="dark"`

**Résultat attendu :**
```html
<html lang="fr" class="dark" ...>
```

**Si ça ne fonctionne pas :**
- Vérifier la console pour des erreurs
- Vérifier que `next-themes` est installé : `npm list next-themes`
- Vérifier que le ThemeProvider est bien dans `app/providers.tsx`

---

### ✅ 2. Vérifier 5 éléments visibles qui changent

**Éléments à vérifier :**

1. **Background global (`body`)**
   - Light : fond blanc (`hsl(0 0% 100%)`)
   - Dark : fond ardoise foncé (`hsl(222.2 84% 4.9%)`)

2. **Cards (FlowCard)**
   - Light : fond blanc avec bordure claire
   - Dark : fond ardoise (`hsl(222.2 84% 6.5%)`) avec bordure sombre

3. **Sidebar (`AppSidebar`)**
   - Light : fond blanc avec bordure claire
   - Dark : fond card avec bordure sombre

4. **Topbar (`AppTopbar`)**
   - Light : fond blanc avec bordure claire
   - Dark : fond card avec bordure sombre

5. **Boutons (`Button`)**
   - Light : bouton primaire bleu clair
   - Dark : bouton primaire bleu (même couleur mais contraste différent)

**Méthode :**
1. Aller sur `/app` (dashboard)
2. Sélectionner "Sombre" dans les préférences
3. Observer visuellement chaque élément
4. Utiliser DevTools pour inspecter les couleurs calculées

**Vérification dans DevTools :**
```javascript
// Dans la console DevTools
getComputedStyle(document.body).backgroundColor
// Light: rgb(255, 255, 255)
// Dark: rgb(8, 10, 15) environ
```

---

### ✅ 3. Persistance après refresh

**Méthode :**
1. Sélectionner "Sombre" dans les préférences
2. Vérifier que l'UI est en dark mode
3. Recharger la page (F5)
4. Vérifier que l'UI reste en dark mode

**Vérifications :**
- `<html class="dark">` doit être présent dès le chargement
- Pas de flash clair → sombre
- `localStorage.getItem('theme')` doit retourner `"dark"`

**Si ça ne fonctionne pas :**
- Vérifier le script inline dans `app/app/layout.tsx`
- Vérifier que `next-themes` sauvegarde bien dans localStorage
- Vérifier la synchronisation dans `contexts/display-preferences-context.tsx`

---

### ✅ 4. Mode "Système" suit `prefers-color-scheme`

**Méthode :**
1. Sélectionner "Système" dans les préférences
2. Changer le thème système de l'OS :
   - Windows : Paramètres > Personnalisation > Couleurs > Mode d'application
   - macOS : Préférences Système > Apparence
3. Vérifier que l'UI s'adapte automatiquement

**Test dans DevTools :**
```javascript
// Simuler un changement de préférence système
window.matchMedia('(prefers-color-scheme: dark)').matches
// Doit retourner true si l'OS est en dark mode

// L'UI doit s'adapter automatiquement
```

**Vérification :**
- Si l'OS passe en dark → `<html class="dark">` apparaît
- Si l'OS passe en light → `<html class="dark">` disparaît
- Pas besoin de recharger la page

---

## Tests supplémentaires

### Test de synchronisation avec les préférences utilisateur

1. Sélectionner "Sombre" dans les préférences
2. Vérifier que `localStorage.getItem('theme')` = `"dark"`
3. Vérifier que la DB contient `displayTheme = "dark"`
4. Ouvrir un nouvel onglet
5. Vérifier que le thème est appliqué automatiquement

### Test de compatibilité avec les autres préférences

1. Activer "Mode simplifié" + "Sombre"
2. Vérifier que les deux fonctionnent ensemble
3. Activer "Densité Compact" + "Sombre"
4. Vérifier que les deux fonctionnent ensemble
5. Activer "Réduire les animations" + "Sombre"
6. Vérifier que les deux fonctionnent ensemble

---

## Commandes de débogage

### Vérifier l'état du thème
```javascript
// Dans la console DevTools
localStorage.getItem('theme')
document.documentElement.classList.contains('dark')
```

### Forcer un thème (pour tester)
```javascript
// Dans la console DevTools
document.documentElement.classList.add('dark') // Force dark
document.documentElement.classList.remove('dark') // Force light
```

### Vérifier les tokens CSS
```javascript
// Dans la console DevTools
getComputedStyle(document.documentElement).getPropertyValue('--background')
// Light: "0 0% 100%"
// Dark: "222.2 84% 4.9%"
```

---

## Problèmes courants et solutions

### Le thème ne s'applique pas
1. Vérifier que `next-themes` est installé : `npm list next-themes`
2. Vérifier que le ThemeProvider est dans `app/providers.tsx`
3. Vérifier que `suppressHydrationWarning` est sur `<html>`
4. Vérifier la console pour des erreurs

### Flash de contenu (FOUC)
1. Vérifier que le script inline est dans `app/app/layout.tsx`
2. Vérifier que `useLayoutEffect` est utilisé pour la synchronisation initiale
3. Vérifier que `disableTransitionOnChange` est activé dans ThemeProvider

### Le thème ne persiste pas
1. Vérifier que `storageKey="theme"` est dans ThemeProvider
2. Vérifier que `localStorage` n'est pas bloqué (mode privé)
3. Vérifier que la sauvegarde backend fonctionne

---

## Résultat attendu final

✅ `<html class="dark">` présent quand dark mode activé
✅ 5+ éléments visibles changent de couleur
✅ Thème persiste après refresh
✅ Mode système suit `prefers-color-scheme`
✅ Compatible avec les autres préférences

