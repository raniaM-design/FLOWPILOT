# Vercel Blob - Réunions longues (> 4 Mo)

Pour transcrire des audios de réunions de plus de 3–4 minutes, la limite de 4,5 Mo des API routes Vercel peut être atteinte.

## Solution : Vercel Blob

L'upload **client** via Vercel Blob contourne cette limite : le fichier est envoyé directement du navigateur vers Blob Storage (sans passer par votre API). Jusqu'à **25 Mo** supportés.

## Configuration

1. **Vercel Dashboard** → Votre projet → **Storage** → **Create Database**
2. Choisir **Blob** → Créer un Blob store (ex. `pilotys-audio`)
3. La variable `BLOB_READ_WRITE_TOKEN` est ajoutée automatiquement au projet
4. Pour le développement local : `vercel env pull` pour récupérer les variables

## Comportement

- **Fichier ≤ 4 Mo** : upload direct (FormData), plus rapide
- **Fichier > 4 Mo** : upload via Blob, puis transcription
- Le blob est **supprimé automatiquement** après récupération par l'API (minimisation des données)
- Sans Blob configuré : limite 4 Mo, message invitant à configurer `BLOB_READ_WRITE_TOKEN`

## Utilisation

Ouvrir une réunion existante → **Importer** → onglet **Audio** → sélectionner le fichier.  
La limite affichée passe à **25 Mo** quand vous êtes sur la page d'analyse d'une réunion.
