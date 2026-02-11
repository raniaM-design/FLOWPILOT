FROM python:3.11-slim

# Métadonnées
LABEL maintainer="PILOTYS"
LABEL description="Serveur Whisper pour transcription audio sécurisée"

# Variables d'environnement
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive

# Installer les dépendances système
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

# Créer un utilisateur non-root pour la sécurité
RUN useradd -m -u 1000 whisper && \
    mkdir -p /app && \
    chown -R whisper:whisper /app

# Définir le répertoire de travail
WORKDIR /app

# Installer les dépendances Python
RUN pip install --no-cache-dir \
    openai-whisper \
    flask \
    flask-cors \
    gunicorn

# Copier les fichiers du serveur
COPY whisper-server.py /app/whisper-server.py
COPY whisper-server-async.py /app/whisper-server-async.py

# Créer le répertoire pour la base de données
RUN mkdir -p /app/data && \
    chown -R whisper:whisper /app

# Changer de propriétaire
RUN chown whisper:whisper /app/whisper-server.py /app/whisper-server-async.py && \
    chmod +x /app/whisper-server.py /app/whisper-server-async.py

# Passer à l'utilisateur non-root
USER whisper

# Exposer le port
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# Démarrer avec Gunicorn pour la production
# Pour le développement, utilisez: python whisper-server.py
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "300", "--access-logfile", "-", "--error-logfile", "-", "whisper-server:app"]

