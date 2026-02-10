# 📊 Configuration du système d'analytics

## ✅ Ce qui a été créé

### 1. Modèle de base de données
- **Modèle `PageView`** dans `prisma/schema.prisma`
- Stocke les vues de pages avec :
  - `userId` : Utilisateur connecté (null si anonyme)
  - `path` : Chemin de la page visitée
  - `referer` : Page d'origine
  - `userAgent` : Navigateur utilisé
  - `ipAddress` : Adresse IP (pour statistiques anonymes)
  - `createdAt` : Date et heure de la vue

### 2. API Routes
- **`/api/analytics/track`** : Enregistre une vue de page
- **`/api/analytics/stats`** : Récupère les statistiques (réservé aux admins)

### 3. Composant de tracking
- **`PageViewTracker`** : Composant React qui track automatiquement les vues
- Intégré dans `app/app/layout.tsx`
- Track toutes les pages de l'application automatiquement

### 4. Dashboard Admin
- Statistiques de vues ajoutées au dashboard admin (`/admin`)
- Affiche :
  - Vues totales
  - Visiteurs uniques
  - Vues anonymes
  - Pages les plus visitées
  - Utilisateurs les plus actifs

## 🚀 Installation

### Étape 1 : Appliquer la migration

```bash
# Générer le client Prisma avec le nouveau modèle
npx prisma generate

# Appliquer la migration (en production)
npx prisma migrate deploy

# Ou créer une migration (en développement)
npx prisma migrate dev --name add_page_views
```

### Étape 2 : Vérifier que tout fonctionne

1. **Naviguez sur votre application** - les vues seront automatiquement trackées
2. **Allez sur `/admin`** - vous devriez voir les statistiques de vues
3. **Vérifiez les logs** - aucune erreur ne devrait apparaître

## 📋 Fonctionnalités

### Tracking automatique
- Toutes les pages de l'application sont trackées automatiquement
- Les utilisateurs connectés sont identifiés
- Les visiteurs anonymes sont aussi trackés

### Statistiques disponibles
- **Vues totales** : Nombre total de pages vues
- **Visiteurs uniques** : Nombre d'utilisateurs distincts
- **Vues anonymes** : Nombre de vues sans utilisateur connecté
- **Pages les plus visitées** : Top 10 des pages
- **Utilisateurs les plus actifs** : Top 10 des utilisateurs avec le plus de vues

### Sécurité
- Seuls les administrateurs peuvent voir les statistiques
- Les données sont stockées de manière sécurisée
- L'IP est stockée uniquement pour statistiques anonymes

## 🔍 Utilisation

### Voir les statistiques
1. Connectez-vous en tant qu'administrateur
2. Allez sur `/admin`
3. Faites défiler jusqu'à la section "Statistiques de vues"

### API pour développeurs

#### Enregistrer une vue manuellement
```typescript
await fetch("/api/analytics/track", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    path: "/app/projects",
    referer: document.referrer,
  }),
});
```

#### Récupérer les statistiques
```typescript
const response = await fetch("/api/analytics/stats?days=30");
const stats = await response.json();
```

## ⚠️ Notes importantes

- Le tracking est **automatique** - pas besoin de configuration supplémentaire
- Les statistiques sont **anonymisées** pour les visiteurs non connectés
- Les données sont **conservées indéfiniment** - vous pouvez ajouter une purge automatique si nécessaire
- Le tracking ne bloque **jamais** l'application - les erreurs sont silencieuses

