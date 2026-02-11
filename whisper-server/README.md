# 🎙️ Serveur Whisper pour PILOTYS

Serveur de transcription audio sécurisé utilisant OpenAI Whisper, hébergé sur votre propre infrastructure.

## 🚀 Démarrage rapide avec Docker

### 1. Cloner ou copier ce dossier sur votre serveur

```bash
cd whisper-server
```

### 2. Créer le fichier `.env`

```bash
cp .env.example .env
```

Éditez `.env` et configurez :
- `WHISPER_API_KEY` : Générez une clé secrète (ex: `openssl rand -hex 32`)
- `ALLOWED_ORIGINS` : Ajoutez votre domaine PILOTYS

### 3. Lancer avec Docker Compose

```bash
docker-compose up -d
```

Le serveur sera accessible sur `http://votre-serveur:8000`

### 4. Vérifier que ça fonctionne

```bash
curl http://localhost:8000/health
```

Vous devriez voir :
```json
{
  "status": "ok",
  "model": "base",
  "language": "fr",
  "timestamp": "2024-...",
  "authenticated": true
}
```

## 🔧 Configuration dans PILOTYS

Dans vos variables d'environnement PILOTYS (`.env.local` ou Vercel) :

```env
WHISPER_API_URL=http://votre-serveur-ip:8000
# Ou avec un domaine :
WHISPER_API_URL=https://whisper.votre-domaine.com

# La clé API que vous avez configurée dans .env
WHISPER_API_KEY=votre_cle_secrete_ici
```

## 📋 Options de déploiement

### Option 1 : Docker Compose (Recommandé)

Déjà configuré ! Utilisez `docker-compose up -d`

### Option 2 : Docker seul

```bash
docker build -t pilotys-whisper .
docker run -d \
  --name pilotys-whisper \
  -p 8000:8000 \
  -e WHISPER_MODEL=base \
  -e WHISPER_API_KEY=votre_cle \
  -e ALLOWED_ORIGINS=https://votre-domaine.vercel.app \
  pilotys-whisper
```

### Option 3 : Python directement

```bash
pip install -r requirements.txt
python whisper-server.py
```

## 🔒 Sécurité

### Authentification

Le serveur utilise une clé API Bearer token. Configurez `WHISPER_API_KEY` dans `.env`.

### CORS

Limitez les origines autorisées avec `ALLOWED_ORIGINS` dans `.env`.

### HTTPS

Utilisez un reverse proxy (Nginx, Caddy) avec SSL pour sécuriser les communications.

## 📊 Modèles disponibles

| Modèle | Taille | RAM | Vitesse | Qualité |
|--------|--------|-----|---------|---------|
| tiny | 39MB | ~1GB | ⚡⚡⚡⚡⚡ | ⭐⭐⭐ |
| base | 74MB | ~1GB | ⚡⚡⚡⚡ | ⭐⭐⭐⭐ |
| small | 244MB | ~2GB | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ |
| medium | 769MB | ~5GB | ⚡⚡ | ⭐⭐⭐⭐⭐ |
| large | 1550MB | ~10GB | ⚡ | ⭐⭐⭐⭐⭐ |

Changez `WHISPER_MODEL` dans `.env` pour utiliser un autre modèle.

## 🐛 Dépannage

### Le serveur ne démarre pas

```bash
# Voir les logs
docker-compose logs -f

# Vérifier les ressources
docker stats pilotys-whisper
```

### Transcription lente

- Utilisez un modèle plus petit (`tiny` ou `base`)
- Ajoutez un GPU si possible
- Augmentez les workers dans `docker-compose.yml`

### Erreur "Out of memory"

- Utilisez un modèle plus petit
- Augmentez la RAM allouée dans `docker-compose.yml`
- Réduisez le nombre de workers

## 📝 Logs

Les logs sont disponibles via :

```bash
docker-compose logs -f whisper-server
```

## 🔄 Mise à jour

```bash
docker-compose pull
docker-compose up -d --build
```

## 📚 Documentation complète

Voir `DEPLOY_WHISPER_SERVER.md` à la racine du projet pour plus de détails.

