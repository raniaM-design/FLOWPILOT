# 🏠 Déploiement de votre propre Serveur Whisper pour PILOTYS

## Vue d'ensemble

Ce guide vous explique comment déployer votre propre serveur Whisper pour transcrire les audios de réunion **100% localement et gratuitement**, avec un contrôle total sur vos données.

## Avantages

✅ **100% gratuit** après le déploiement initial
✅ **Sécurité maximale** : vos données ne quittent jamais votre infrastructure
✅ **Contrôle total** : vous gérez le modèle, les performances, la confidentialité
✅ **Pas de limites** : transcrire autant d'audios que vous voulez
✅ **Hébergement sécurisé** : données hébergées en Europe/France si configuré

## Architecture

```
PILOTYS (Vercel) → Votre Serveur Whisper → Transcription → PILOTYS
```

Votre serveur Whisper peut être hébergé sur :
- Votre propre serveur (VPS, cloud privé)
- Un serveur dédié (Scaleway, Hetzner, AWS, etc.)
- Un conteneur Docker (facile à déployer)

## Option 1 : Déploiement avec Docker (Recommandé - Le plus simple)

### Prérequis

- Un serveur avec Docker installé
- Au moins 4GB de RAM (8GB recommandé)
- GPU optionnel mais recommandé pour la vitesse

### Étape 1 : Créer le serveur Whisper

Créez un fichier `whisper-server.py` sur votre serveur :

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import tempfile
import os

app = Flask(__name__)
CORS(app)  # Autoriser les requêtes depuis PILOTYS

# Charger le modèle Whisper au démarrage
print("Chargement du modèle Whisper...")
model = whisper.load_model("base")  # ou "small", "medium", "large"
print("Modèle Whisper chargé !")

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": "whisper-base"})

@app.route("/transcribe", methods=["POST"])
def transcribe():
    if "file" not in request.files:
        return jsonify({"error": "Aucun fichier fourni"}), 400
    
    file = request.files["file"]
    
    # Sauvegarder temporairement le fichier
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp_file:
        file.save(tmp_file.name)
        tmp_path = tmp_file.name
    
    try:
        # Transcrire avec Whisper
        result = model.transcribe(tmp_path, language="fr")
        
        return jsonify({
            "text": result["text"],
            "language": result["language"],
            "segments": result.get("segments", [])
        })
    finally:
        # Nettoyer le fichier temporaire
        os.unlink(tmp_path)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
```

### Étape 2 : Créer un Dockerfile

Créez un fichier `Dockerfile` :

```dockerfile
FROM python:3.11-slim

# Installer les dépendances système
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Installer les dépendances Python
RUN pip install --no-cache-dir \
    openai-whisper \
    flask \
    flask-cors

# Copier le serveur
COPY whisper-server.py /app/whisper-server.py

WORKDIR /app

# Exposer le port
EXPOSE 8000

# Démarrer le serveur
CMD ["python", "whisper-server.py"]
```

### Étape 3 : Déployer avec Docker

```bash
# Construire l'image
docker build -t pilotys-whisper .

# Lancer le conteneur
docker run -d \
  --name pilotys-whisper \
  -p 8000:8000 \
  --restart unless-stopped \
  pilotys-whisper
```

### Étape 4 : Configurer PILOTYS

Dans vos variables d'environnement (`.env.local` ou Vercel) :

```env
WHISPER_API_URL=http://votre-serveur-ip:8000
# Ou avec un domaine :
WHISPER_API_URL=https://whisper.votre-domaine.com

# Optionnel : clé API pour sécuriser l'accès
WHISPER_API_KEY=votre_cle_secrete_ici
```

## Option 2 : Déploiement avec Python directement

### Sur votre serveur Linux

```bash
# Installer Python et les dépendances
sudo apt-get update
sudo apt-get install -y python3-pip ffmpeg

# Installer Whisper
pip3 install openai-whisper flask flask-cors

# Créer le fichier whisper-server.py (voir Option 1)

# Lancer avec systemd (pour qu'il démarre automatiquement)
sudo nano /etc/systemd/system/whisper.service
```

Contenu de `/etc/systemd/system/whisper.service` :

```ini
[Unit]
Description=PILOTYS Whisper Server
After=network.target

[Service]
Type=simple
User=votre-utilisateur
WorkingDirectory=/chemin/vers/whisper
ExecStart=/usr/bin/python3 /chemin/vers/whisper/whisper-server.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Puis :

```bash
sudo systemctl enable whisper
sudo systemctl start whisper
```

## Option 3 : Déploiement sur Vercel (avec limitations)

**Note** : Vercel a des limitations de temps d'exécution (10s pour Hobby, 60s pour Pro). Whisper peut prendre plus de temps pour les longs audios.

Pour Vercel, utilisez plutôt une API route qui appelle votre serveur Whisper externe.

## Sécurité

### 1. Authentification (Recommandé)

Modifiez `whisper-server.py` pour ajouter une authentification :

```python
from functools import wraps

API_KEY = os.getenv("WHISPER_API_KEY", "")

def require_api_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if API_KEY:
            auth_header = request.headers.get("Authorization", "")
            if not auth_header.startswith("Bearer ") or auth_header.split(" ")[1] != API_KEY:
                return jsonify({"error": "Non autorisé"}), 401
        return f(*args, **kwargs)
    return decorated_function

@app.route("/transcribe", methods=["POST"])
@require_api_key
def transcribe():
    # ... code existant
```

### 2. HTTPS (Recommandé)

Utilisez un reverse proxy avec SSL (Nginx, Caddy) :

```nginx
server {
    listen 443 ssl;
    server_name whisper.votre-domaine.com;
    
    ssl_certificate /chemin/vers/cert.pem;
    ssl_certificate_key /chemin/vers/key.pem;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. Firewall

Limitez l'accès à votre serveur Whisper :

```bash
# Autoriser uniquement depuis Vercel (ou votre IP)
sudo ufw allow from VERCEL_IP to any port 8000
sudo ufw enable
```

## Modèles Whisper disponibles

| Modèle | Taille | RAM requise | Vitesse | Qualité |
|--------|--------|-------------|---------|---------|
| tiny | 39MB | ~1GB | ⚡⚡⚡⚡⚡ | ⭐⭐⭐ |
| base | 74MB | ~1GB | ⚡⚡⚡⚡ | ⭐⭐⭐⭐ |
| small | 244MB | ~2GB | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ |
| medium | 769MB | ~5GB | ⚡⚡ | ⭐⭐⭐⭐⭐ |
| large | 1550MB | ~10GB | ⚡ | ⭐⭐⭐⭐⭐ |

**Recommandation** : Commencez avec `base` (bon équilibre vitesse/qualité).

Pour changer le modèle, modifiez dans `whisper-server.py` :
```python
model = whisper.load_model("base")  # Changez "base" par le modèle souhaité
```

## Performance

### Avec CPU uniquement
- **base** : ~1-2x la durée de l'audio (30 min d'audio = 30-60 min de traitement)
- **small** : ~2-3x la durée de l'audio

### Avec GPU (NVIDIA)
- **base** : ~0.1x la durée de l'audio (30 min = 3 min de traitement)
- **small** : ~0.2x la durée de l'audio

**Recommandation** : Utilisez un GPU si vous avez beaucoup de transcriptions.

## Coûts d'hébergement

### Option économique (CPU uniquement)
- **VPS européen** : à partir de ~4–6€/mois (4GB RAM)
- **Scaleway** : ~6€/mois (4GB RAM)
- **Hetzner** : ~4€/mois (4GB RAM)

### Option performante (avec GPU)
- **Vast.ai** : ~0.20€/heure (GPU partagé)
- **RunPod** : ~0.30€/heure (GPU dédié)
- **AWS EC2 g4dn** : ~0.50€/heure

Pour un usage modéré (quelques heures de transcription/mois), un VPS CPU suffit.

## Test de votre serveur

```bash
# Vérifier que le serveur répond
curl http://votre-serveur:8000/health

# Tester la transcription (remplacez par votre fichier audio)
curl -X POST \
  -F "file=@test-audio.mp3" \
  http://votre-serveur:8000/transcribe
```

## Configuration dans PILOTYS

Une fois votre serveur déployé, configurez dans PILOTYS :

**En local** (`.env.local`) :
```env
WHISPER_API_URL=http://localhost:8000
# Ou avec votre domaine :
WHISPER_API_URL=https://whisper.votre-domaine.com

# Optionnel : clé API pour sécuriser
WHISPER_API_KEY=votre_cle_secrete_ici

# Optionnel : modèle à utiliser
WHISPER_MODEL=base
WHISPER_LANGUAGE=fr
```

**Sur Vercel** :
- Ajoutez `WHISPER_API_URL` avec l'URL de votre serveur
- Ajoutez `WHISPER_API_KEY` si vous avez activé l'authentification
- Redéployez l'application

## Monitoring

Ajoutez des logs dans votre serveur Whisper pour surveiller :

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route("/transcribe", methods=["POST"])
def transcribe():
    logger.info(f"Transcription demandée: {request.files['file'].filename}")
    # ... reste du code
    logger.info(f"Transcription terminée: {len(result['text'])} caractères")
```

## Dépannage

### Le serveur ne répond pas

1. Vérifiez que le service tourne : `sudo systemctl status whisper`
2. Vérifiez les logs : `sudo journalctl -u whisper -f`
3. Vérifiez le firewall : `sudo ufw status`

### Transcription lente

1. Utilisez un modèle plus petit (`tiny` ou `base`)
2. Ajoutez un GPU si possible
3. Optimisez la qualité audio avant l'envoi

### Erreur "Out of memory"

1. Utilisez un modèle plus petit
2. Augmentez la RAM du serveur
3. Traitez les fichiers par petits morceaux

## Support

Si vous avez besoin d'aide pour déployer votre serveur Whisper, consultez :
- Documentation Whisper : https://github.com/openai/whisper
- Documentation Flask : https://flask.palletsprojects.com/

