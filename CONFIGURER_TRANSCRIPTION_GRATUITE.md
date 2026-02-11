# 🆓 Configuration de la Transcription Audio Gratuite

## Option Gratuite : Hugging Face Inference API

PILOTYS supporte maintenant la transcription audio **100% gratuite** via Hugging Face Inference API, qui utilise le même modèle Whisper qu'OpenAI.

## Configuration Gratuite (Recommandé)

### Étape 1 : Créer un compte Hugging Face

1. Allez sur [huggingface.co](https://huggingface.co)
2. Créez un compte gratuit
3. Allez dans **Settings** → **Access Tokens**
4. Cliquez sur **"New token"**
5. Donnez-lui un nom (ex: "PILOTYS Transcription")
6. Sélectionnez le rôle **"Read"** (lecture seule suffit)
7. Copiez le token (il commence par `hf_`)

### Étape 2 : Configurer la clé API

**En local** (`.env.local`) :
```env
HUGGINGFACE_API_KEY=hf_votre_token_ici
```

**Sur Vercel** :
1. Allez dans **Vercel Dashboard** → Votre projet → **Settings** → **Environment Variables**
2. Ajoutez `HUGGINGFACE_API_KEY` avec votre token Hugging Face
3. Assurez-vous qu'elle est définie pour **Production**
4. Redéployez l'application

### Étape 3 : Utiliser la transcription

C'est tout ! La transcription audio fonctionnera maintenant gratuitement via Hugging Face.

## Quota Gratuit Hugging Face

- **Gratuit** : 1000 requêtes par mois
- **Payant** : À partir de $9/mois pour plus de requêtes

Pour la plupart des utilisateurs, le quota gratuit est largement suffisant.

## Fallback Automatique

PILOTYS utilise automatiquement :
1. **Hugging Face** (gratuit) si `HUGGINGFACE_API_KEY` est configuré
2. **OpenAI** (payant) si Hugging Face n'est pas disponible et `OPENAI_API_KEY` est configuré

Vous pouvez configurer les deux pour avoir un fallback automatique.

## Comparaison des Options

| Option | Coût | Qualité | Vitesse | Quota |
|--------|------|---------|---------|-------|
| **Hugging Face** | ✅ Gratuit | ⭐⭐⭐⭐⭐ | ⚡⚡⚡ | 1000/mois |
| **OpenAI** | 💰 ~$0.006/min | ⭐⭐⭐⭐⭐ | ⚡⚡⚡⚡ | Illimité |

**Recommandation** : Utilisez Hugging Face pour commencer (gratuit), puis passez à OpenAI si vous dépassez le quota gratuit.

## Vérification

Pour vérifier que la transcription fonctionne :

1. Allez dans une réunion
2. Cliquez sur **"Importer"** → Onglet **"Audio"**
3. Uploadez un fichier audio
4. Vérifiez les logs pour voir quelle méthode est utilisée :
   - `[meetings/transcribe-audio] Utilisation de Hugging Face Whisper (gratuit)...` → Gratuit ✅
   - `[meetings/transcribe-audio] Utilisation d'OpenAI Whisper...` → Payant 💰

## Dépannage

### Erreur : "Aucune clé API configurée"

**Solution** : Configurez `HUGGINGFACE_API_KEY` (gratuit) ou `OPENAI_API_KEY` (payant).

### Erreur : "Quota Hugging Face dépassé"

**Solutions** :
1. Attendez le mois suivant (quota se réinitialise)
2. Configurez `OPENAI_API_KEY` pour utiliser OpenAI en fallback
3. Passez à un compte Hugging Face payant ($9/mois)

### La transcription est lente

**Normal** : La transcription peut prendre quelques minutes pour les fichiers longs. Hugging Face peut être un peu plus lent qu'OpenAI, mais c'est gratuit !

## Avantages de Hugging Face

✅ **100% gratuit** jusqu'à 1000 requêtes/mois
✅ **Même modèle Whisper** qu'OpenAI
✅ **Même qualité** de transcription
✅ **Pas de limite de durée** d'audio (seulement la taille du fichier)
✅ **Open source** et transparent

## Note sur l'Amélioration du Texte

L'amélioration du texte transcrit utilise toujours GPT (OpenAI ou Anthropic) si configuré. Si vous voulez aussi rendre l'amélioration gratuite, vous pouvez :
- Utiliser un modèle open source local (nécessite un serveur avec GPU)
- Utiliser Hugging Face pour l'amélioration aussi (modèles gratuits disponibles)

Pour l'instant, l'amélioration reste optionnelle - même sans GPT, vous obtenez une transcription brute de qualité.

