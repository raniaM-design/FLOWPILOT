# 🎙️ Serveur Whisper Async pour PILOTYS

Version asynchrone avec système de jobs pour une meilleure robustesse sur Vercel.

## 🚀 Démarrage rapide

### 1. Utiliser le serveur async

Le serveur async (`whisper-server-async.py`) est maintenant le serveur par défaut dans `docker-compose.yml`.

```bash
cd whisper-server
docker-compose up -d
```

### 2. Configuration

Éditez `.env` ou `docker-compose.yml` :

```env
# Clé API obligatoire en production
WHISPER_API_KEY=votre_cle_secrete_ici

# CORS strict - Remplacez par votre domaine PILOTYS
ALLOWED_ORIGINS=https://votre-domaine-pilotys.vercel.app,http://localhost:3000

# Stockage SQLite (recommandé)
USE_SQLITE=true
DB_PATH=/app/data/whisper-jobs.db
```

### 3. Vérifier que ça fonctionne

```bash
# Health check
curl http://localhost:8000/health

# Tester avec authentification
curl -X POST \
  -H "Authorization: Bearer votre_cle_secrete" \
  -F "file=@test-audio.mp3" \
  http://localhost:8000/transcribe

# Récupérer le statut
curl -X GET \
  -H "Authorization: Bearer votre_cle_secrete" \
  http://localhost:8000/transcribe/JOB_ID
```

## 🔄 API Async

### POST /transcribe

Démarre une transcription asynchrone.

**Request:**
```bash
POST /transcribe
Authorization: Bearer YOUR_API_KEY
Content-Type: multipart/form-data

file: [fichier audio]
```

**Response:**
```json
{
  "job_id": "uuid-du-job",
  "status": "queued"
}
```

### GET /transcribe/:job_id

Récupère le statut d'une transcription.

**Request:**
```bash
GET /transcribe/JOB_ID
Authorization: Bearer YOUR_API_KEY
```

**Response (queued/processing):**
```json
{
  "job_id": "uuid-du-job",
  "status": "processing"
}
```

**Response (done):**
```json
{
  "job_id": "uuid-du-job",
  "status": "done",
  "text": "Texte transcrit...",
  "segments": [...]
}
```

**Response (error):**
```json
{
  "job_id": "uuid-du-job",
  "status": "error",
  "error": "Message d'erreur"
}
```

## 🔒 Sécurité

✅ **Bearer token obligatoire** : Tous les endpoints (sauf `/health`) nécessitent `Authorization: Bearer YOUR_API_KEY`

✅ **CORS strict** : Seules les origines configurées dans `ALLOWED_ORIGINS` sont autorisées

✅ **Logs sécurisés** : Le contenu transcrit n'est jamais loggé, seulement les métadonnées

✅ **Validation taille** : Limite de 25MB par défaut (configurable)

## 📊 Stockage des jobs

- **SQLite** (recommandé) : Persiste les jobs même après redémarrage
- **Mémoire** : Jobs perdus au redémarrage (développement uniquement)

## 🐛 Dépannage

### Le serveur ne démarre pas

```bash
# Voir les logs
docker-compose logs -f whisper-server

# Vérifier les permissions
docker-compose exec whisper-server ls -la /app/data
```

### Erreur "Token d'authentification requis"

Vérifiez que :
1. `WHISPER_API_KEY` est configuré
2. `REQUIRE_AUTH=true` (ou non défini, true par défaut)
3. Vous envoyez `Authorization: Bearer YOUR_API_KEY` dans les headers

### Erreur CORS

Vérifiez que votre domaine PILOTYS est dans `ALLOWED_ORIGINS` :
```env
ALLOWED_ORIGINS=https://votre-domaine-pilotys.vercel.app,http://localhost:3000
```

