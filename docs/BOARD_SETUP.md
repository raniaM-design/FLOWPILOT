# Board (Tableau blanc type Miro) - Setup

## Migration Prisma

Pour créer la table `Board` en base de données :

```bash
npx prisma migrate dev --name add_board_model
```

Si la migration existe déjà (dossier `prisma/migrations/20260219100000_add_board_model`) :

```bash
npx prisma migrate deploy
```

Puis régénérer le client Prisma :

```bash
npx prisma generate
```

## Fichiers créés/modifiés

| Fichier | Description |
|---------|-------------|
| `prisma/schema.prisma` | Modèle `Board` (id, projectId, data JSON, updatedAt) |
| `prisma/migrations/20260219100000_add_board_model/` | Migration SQL |
| `app/api/projects/[id]/board/route.ts` | API GET (charger) et PUT (sauvegarder) |
| `app/app/projects/[id]/board/project-board.tsx` | Composant React avec tldraw + bouton Sauvegarder |
| `app/app/projects/[id]/board/page.tsx` | Page serveur (inchangée) |

## Utilisation

1. Accéder à un projet → onglet **Board**
2. Dessiner, ajouter du texte, des formes (rectangles = post-its)
3. Cliquer sur **Sauvegarder** pour enregistrer en base
4. Recharger la page → les données sont rechargées automatiquement
