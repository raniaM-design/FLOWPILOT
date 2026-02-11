#!/usr/bin/env python3
"""
Serveur Whisper pour PILOTYS
Transcription audio sécurisée et locale
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import tempfile
import os
import logging
from functools import wraps
from datetime import datetime

# Configuration des logs
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configuration CORS - Autoriser uniquement votre domaine PILOTYS
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
CORS(app, origins=ALLOWED_ORIGINS)

# Authentification
API_KEY = os.getenv("WHISPER_API_KEY", "")
REQUIRE_AUTH = os.getenv("REQUIRE_AUTH", "true").lower() == "true"

# Configuration Whisper
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")  # tiny, base, small, medium, large
WHISPER_LANGUAGE = os.getenv("WHISPER_LANGUAGE", "fr")  # fr, en, auto (None pour auto-détection)
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE_MB", "25")) * 1024 * 1024  # 25MB par défaut

# Charger le modèle Whisper au démarrage
logger.info(f"Chargement du modèle Whisper '{WHISPER_MODEL}'...")
try:
    model = whisper.load_model(WHISPER_MODEL)
    logger.info(f"✅ Modèle Whisper '{WHISPER_MODEL}' chargé avec succès !")
except Exception as e:
    logger.error(f"❌ Erreur lors du chargement du modèle: {e}")
    raise

def require_api_key(f):
    """Décorateur pour protéger les endpoints avec une clé API"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if REQUIRE_AUTH and API_KEY:
            auth_header = request.headers.get("Authorization", "")
            if not auth_header.startswith("Bearer "):
                logger.warning("Tentative d'accès sans token Bearer")
                return jsonify({"error": "Token d'authentification requis"}), 401
            
            provided_key = auth_header.split(" ")[1]
            if provided_key != API_KEY:
                logger.warning(f"Token invalide fourni: {provided_key[:10]}...")
                return jsonify({"error": "Token d'authentification invalide"}), 401
        
        return f(*args, **kwargs)
    return decorated_function

@app.route("/health", methods=["GET"])
def health():
    """Endpoint de santé pour vérifier que le serveur fonctionne"""
    return jsonify({
        "status": "ok",
        "model": WHISPER_MODEL,
        "language": WHISPER_LANGUAGE,
        "timestamp": datetime.now().isoformat(),
        "authenticated": REQUIRE_AUTH and bool(API_KEY)
    })

@app.route("/transcribe", methods=["POST"])
@require_api_key
def transcribe():
    """Endpoint principal pour transcrire un fichier audio"""
    start_time = datetime.now()
    
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
    
    logger.info(f"📤 Transcription demandée: {file.filename} ({file_size / 1024 / 1024:.2f}MB)")
    
    # Sauvegarder temporairement le fichier
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp_file:
            file.save(tmp_file.name)
            tmp_path = tmp_file.name
        
        # Transcrire avec Whisper
        logger.info(f"🎙️ Démarrage de la transcription avec Whisper...")
        
        # Préparer les options de transcription
        transcribe_options = {
            "language": WHISPER_LANGUAGE if WHISPER_LANGUAGE != "auto" else None,
            "verbose": False,  # Mettre à True pour plus de détails dans les logs
        }
        
        result = model.transcribe(tmp_path, **transcribe_options)
        
        # Calculer le temps de traitement
        processing_time = (datetime.now() - start_time).total_seconds()
        
        logger.info(f"✅ Transcription terminée en {processing_time:.2f}s")
        logger.info(f"📝 Texte transcrit: {len(result['text'])} caractères")
        
        # Retourner le résultat
        return jsonify({
            "text": result["text"],
            "language": result.get("language", WHISPER_LANGUAGE),
            "segments": result.get("segments", []),
            "processing_time_seconds": round(processing_time, 2),
            "model": WHISPER_MODEL,
        })
        
    except Exception as e:
        logger.error(f"❌ Erreur lors de la transcription: {e}", exc_info=True)
        return jsonify({
            "error": f"Erreur lors de la transcription: {str(e)}"
        }), 500
        
    finally:
        # Nettoyer le fichier temporaire
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
                logger.debug(f"🗑️ Fichier temporaire supprimé: {tmp_path}")
            except Exception as e:
                logger.warning(f"Impossible de supprimer le fichier temporaire: {e}")

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
    
    logger.info(f"🚀 Démarrage du serveur Whisper PILOTYS sur {host}:{port}")
    logger.info(f"📋 Configuration:")
    logger.info(f"   - Modèle: {WHISPER_MODEL}")
    logger.info(f"   - Langue: {WHISPER_LANGUAGE}")
    logger.info(f"   - Authentification: {'Activée' if REQUIRE_AUTH and API_KEY else 'Désactivée'}")
    logger.info(f"   - Taille max fichier: {MAX_FILE_SIZE / (1024*1024):.1f}MB")
    
    app.run(host=host, port=port, debug=debug)

