#!/usr/bin/env python3
"""
Serveur Whisper pour PILOTYS - Version Async avec Jobs
Transcription audio sécurisée et locale avec système de jobs asynchrones
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import tempfile
import os
import logging
import threading
import uuid
import sqlite3
from functools import wraps
from datetime import datetime
from typing import Dict, Optional
import json

# Configuration des logs
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configuration CORS - Autoriser uniquement votre domaine PILOTYS
# Par défaut: localhost pour dev + domaine Vercel en production
DEFAULT_ORIGINS = "http://localhost:3000,https://*.vercel.app"
ALLOWED_ORIGINS_STR = os.getenv("ALLOWED_ORIGINS", DEFAULT_ORIGINS)
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS_STR.split(",") if origin.strip()]

# CORS strict : autoriser uniquement les origines configurées
CORS(app, origins=ALLOWED_ORIGINS, supports_credentials=True)

# Authentification - OBLIGATOIRE en production
API_KEY = os.getenv("WHISPER_API_KEY", "")
REQUIRE_AUTH = os.getenv("REQUIRE_AUTH", "true").lower() == "true"

# En production, l'authentification doit être activée
if not API_KEY and os.getenv("ENVIRONMENT", "development") == "production":
    raise ValueError("WHISPER_API_KEY est obligatoire en production")

# Configuration Whisper
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")  # tiny, base, small, medium, large
WHISPER_LANGUAGE = os.getenv("WHISPER_LANGUAGE", "fr")  # fr, en, auto (None pour auto-détection)
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE_MB", "25")) * 1024 * 1024  # 25MB par défaut

# Stockage des jobs
# Option 1: En mémoire (MVP)
JOBS_IN_MEMORY: Dict[str, Dict] = {}
JOBS_LOCK = threading.Lock()

# Option 2: SQLite (recommandé pour la production)
USE_SQLITE = os.getenv("USE_SQLITE", "true").lower() == "true"
DB_PATH = os.getenv("DB_PATH", "/tmp/whisper-jobs.db")

def init_db():
    """Initialise la base de données SQLite pour les jobs"""
    if not USE_SQLITE:
        return
    
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS jobs (
            job_id TEXT PRIMARY KEY,
            status TEXT NOT NULL,
            file_path TEXT,
            transcribed_text TEXT,
            segments TEXT,
            error_message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()
    logger.info(f"✅ Base de données SQLite initialisée: {DB_PATH}")

def get_job(job_id: str) -> Optional[Dict]:
    """Récupère un job depuis le stockage"""
    if USE_SQLITE:
        conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        cursor = conn.execute(
            "SELECT job_id, status, transcribed_text, segments, error_message FROM jobs WHERE job_id = ?",
            (job_id,)
        )
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {
                "job_id": row[0],
                "status": row[1],
                "text": row[2],
                "segments": json.loads(row[3]) if row[3] else None,
                "error": row[4],
            }
        return None
    else:
        with JOBS_LOCK:
            return JOBS_IN_MEMORY.get(job_id)

def create_job(job_id: str, file_path: str) -> None:
    """Crée un nouveau job"""
    if USE_SQLITE:
        conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        conn.execute(
            "INSERT INTO jobs (job_id, status, file_path) VALUES (?, ?, ?)",
            (job_id, "queued", file_path)
        )
        conn.commit()
        conn.close()
    else:
        with JOBS_LOCK:
            JOBS_IN_MEMORY[job_id] = {
                "status": "queued",
                "file_path": file_path,
                "text": None,
                "segments": None,
                "error": None,
            }

def update_job(job_id: str, status: str, text: Optional[str] = None, segments: Optional[list] = None, error: Optional[str] = None) -> None:
    """Met à jour un job"""
    if USE_SQLITE:
        conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        segments_json = json.dumps(segments) if segments else None
        conn.execute(
            """UPDATE jobs 
               SET status = ?, transcribed_text = ?, segments = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP 
               WHERE job_id = ?""",
            (status, text, segments_json, error, job_id)
        )
        conn.commit()
        conn.close()
    else:
        with JOBS_LOCK:
            if job_id in JOBS_IN_MEMORY:
                JOBS_IN_MEMORY[job_id].update({
                    "status": status,
                    "text": text,
                    "segments": segments,
                    "error": error,
                })

# Charger le modèle Whisper au démarrage
logger.info(f"Chargement du modèle Whisper '{WHISPER_MODEL}'...")
try:
    model = whisper.load_model(WHISPER_MODEL)
    logger.info(f"✅ Modèle Whisper '{WHISPER_MODEL}' chargé avec succès !")
except Exception as e:
    logger.error(f"❌ Erreur lors du chargement du modèle: {e}")
    raise

# Initialiser la base de données
init_db()

def require_api_key(f):
    """Décorateur pour protéger les endpoints avec une clé API"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if REQUIRE_AUTH and API_KEY:
            auth_header = request.headers.get("Authorization", "")
            if not auth_header.startswith("Bearer "):
                client_ip = request.environ.get("REMOTE_ADDR", "unknown")
                logger.warning(f"Tentative d'accès sans token Bearer [IP: {client_ip}]")
                return jsonify({"error": "Token d'authentification requis"}), 401
            
            provided_key = auth_header.split(" ")[1]
            if provided_key != API_KEY:
                # Logs sécurisés : ne logger que les premiers caractères du token
                client_ip = request.environ.get("REMOTE_ADDR", "unknown")
                logger.warning(f"Token invalide fourni [IP: {client_ip}, Token: {provided_key[:8]}...]")
                return jsonify({"error": "Token d'authentification invalide"}), 401
        
        return f(*args, **kwargs)
    return decorated_function

def process_transcription(job_id: str, file_path: str):
    """Traite la transcription dans un thread séparé"""
    try:
        logger.info(f"🎙️ [Job {job_id}] Démarrage de la transcription...")
        update_job(job_id, "processing")
        
        # Préparer les options de transcription
        transcribe_options = {
            "language": WHISPER_LANGUAGE if WHISPER_LANGUAGE != "auto" else None,
            "verbose": False,
        }
        
        # Transcrire avec Whisper
        result = model.transcribe(file_path, **transcribe_options)
        
        # Sauvegarder le résultat
        update_job(
            job_id,
            "done",
            text=result["text"],
            segments=result.get("segments", [])
        )
        
        # Logs sécurisés : ne pas logger le contenu transcrit
        logger.info(f"✅ [Job {job_id}] Transcription terminée: {len(result['text'])} caractères (contenu non loggé pour sécurité)")
        
        # Supprimer le fichier audio immédiatement après transcription
        try:
            if os.path.exists(file_path):
                os.unlink(file_path)
                logger.info(f"🗑️ [Job {job_id}] Fichier audio supprimé: {file_path}")
        except Exception as e:
            logger.warning(f"⚠️ [Job {job_id}] Impossible de supprimer le fichier: {e}")
            
    except Exception as e:
        logger.error(f"❌ [Job {job_id}] Erreur lors de la transcription: {e}", exc_info=True)
        update_job(job_id, "error", error=str(e))
        
        # Supprimer le fichier même en cas d'erreur
        try:
            if os.path.exists(file_path):
                os.unlink(file_path)
        except Exception:
            pass

@app.route("/health", methods=["GET"])
def health():
    """Endpoint de santé pour vérifier que le serveur fonctionne"""
    return jsonify({
        "status": "ok",
        "model": WHISPER_MODEL,
        "language": WHISPER_LANGUAGE,
        "timestamp": datetime.now().isoformat(),
        "authenticated": REQUIRE_AUTH and bool(API_KEY),
        "storage": "sqlite" if USE_SQLITE else "memory"
    })

@app.route("/transcribe", methods=["POST"])
@require_api_key
def transcribe():
    """Endpoint pour démarrer une transcription (retourne un job_id)"""
    # Vérifier qu'un fichier a été fourni
    if "file" not in request.files:
        logger.error("Aucun fichier fourni dans la requête")
        return jsonify({"error": "Aucun fichier fourni"}), 400
    
    file = request.files["file"]
    
    if file.filename == "":
        logger.error("Nom de fichier vide")
        return jsonify({"error": "Nom de fichier vide"}), 400
    
    # Vérifier la taille du fichier
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    
    if file_size > MAX_FILE_SIZE:
        logger.error(f"Fichier trop volumineux: {file_size} bytes (max: {MAX_FILE_SIZE})")
        return jsonify({
            "error": f"Fichier trop volumineux. Taille maximale: {MAX_FILE_SIZE / (1024*1024):.1f}MB"
        }), 400
    
    # Générer un job_id unique
    job_id = str(uuid.uuid4())
    
    # Logs sécurisés : ne pas logger le contenu du fichier
    client_ip = request.environ.get("REMOTE_ADDR", "unknown")
    logger.info(f"📤 [Job {job_id}] Nouvelle transcription demandée: {file.filename} ({file_size / 1024 / 1024:.2f}MB) [IP: {client_ip}]")
    
    # Sauvegarder temporairement le fichier
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp_file:
            file.save(tmp_file.name)
            tmp_path = tmp_file.name
        
        # Créer le job
        create_job(job_id, tmp_path)
        
        # Démarrer la transcription dans un thread séparé
        thread = threading.Thread(target=process_transcription, args=(job_id, tmp_path))
        thread.daemon = True
        thread.start()
        
        logger.info(f"✅ [Job {job_id}] Job créé et traitement démarré")
        
        return jsonify({
            "job_id": job_id,
            "status": "queued"
        })
        
    except Exception as e:
        logger.error(f"❌ [Job {job_id}] Erreur lors de la création du job: {e}", exc_info=True)
        return jsonify({
            "error": f"Erreur lors de la création du job: {str(e)}"
        }), 500

@app.route("/transcribe/<job_id>", methods=["GET"])
@require_api_key
def get_transcription_status(job_id: str):
    """Endpoint pour récupérer le statut d'une transcription"""
    job = get_job(job_id)
    
    if not job:
        logger.warning(f"Job {job_id} introuvable")
        return jsonify({"error": "Job introuvable"}), 404
    
    response = {
        "job_id": job_id,
        "status": job["status"],
    }
    
    if job["status"] == "done":
        response["text"] = job["text"]
        if job["segments"]:
            response["segments"] = job["segments"]
    elif job["status"] == "error":
        response["error"] = job["error"]
    
    return jsonify(response)

@app.route("/models", methods=["GET"])
@require_api_key
def list_models():
    """Liste les modèles Whisper disponibles"""
    available_models = ["tiny", "base", "small", "medium", "large"]
    return jsonify({
        "available_models": available_models,
        "current_model": WHISPER_MODEL,
        "model_info": {
            "tiny": {"size": "39MB", "ram": "~1GB", "speed": "⚡⚡⚡⚡⚡", "quality": "⭐⭐⭐"},
            "base": {"size": "74MB", "ram": "~1GB", "speed": "⚡⚡⚡⚡", "quality": "⭐⭐⭐⭐"},
            "small": {"size": "244MB", "ram": "~2GB", "speed": "⚡⚡⚡", "quality": "⭐⭐⭐⭐⭐"},
            "medium": {"size": "769MB", "ram": "~5GB", "speed": "⚡⚡", "quality": "⭐⭐⭐⭐⭐"},
            "large": {"size": "1550MB", "ram": "~10GB", "speed": "⚡", "quality": "⭐⭐⭐⭐⭐"},
        }
    })

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    debug = os.getenv("DEBUG", "false").lower() == "true"
    
    logger.info(f"🚀 Démarrage du serveur Whisper PILOTYS (Async) sur {host}:{port}")
    logger.info(f"📋 Configuration:")
    logger.info(f"   - Modèle: {WHISPER_MODEL}")
    logger.info(f"   - Langue: {WHISPER_LANGUAGE}")
    logger.info(f"   - Authentification: {'Activée' if REQUIRE_AUTH and API_KEY else 'Désactivée'}")
    logger.info(f"   - Taille max fichier: {MAX_FILE_SIZE / (1024*1024):.1f}MB")
    logger.info(f"   - Stockage jobs: {'SQLite' if USE_SQLITE else 'Mémoire'}")
    
    app.run(host=host, port=port, debug=debug)

