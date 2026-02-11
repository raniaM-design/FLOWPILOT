# 🎤 Transcription Audio de Réunions dans PILOTYS

## Fonctionnalité

PILOTYS peut maintenant transcrire vos enregistrements audio de réunion (même de mauvaise qualité) et les transformer automatiquement en comptes rendus professionnels structurés.

## Comment ça fonctionne

1. **Upload de l'audio** : Uploadez votre fichier audio depuis la section compte rendu de réunion
2. **Transcription** : L'IA transcrit l'audio en texte (même si la qualité audio n'est pas parfaite)
3. **Amélioration** : Le texte transcrit est nettoyé et amélioré pour devenir un compte rendu professionnel
4. **Structuration** : Le compte rendu est organisé en sections (Décisions, Actions, Points à clarifier, etc.)
5. **Analyse** : Vous pouvez ensuite utiliser l'analyse automatique de PILOTYS pour extraire les décisions et actions

## Formats audio supportés

- **MP3** (.mp3)
- **WAV** (.wav)
- **WebM** (.webm)
- **OGG** (.ogg)
- **M4A** (.m4a)
- **MP4** (.mp4) - si contient de l'audio

**Taille maximale** : 25MB par fichier

## Configuration requise

### Option 1 : Hugging Face (GRATUIT - Recommandé) 🆓

La transcription audio peut être **100% gratuite** via Hugging Face Inference API qui utilise le même modèle Whisper qu'OpenAI.

**Pour activer la version gratuite :**

1. **Créez un compte Hugging Face** sur [huggingface.co](https://huggingface.co) (gratuit)
2. **Générez un token API** :
   - Allez dans **Settings** → **Access Tokens**
   - Cliquez sur **"New token"**
   - Donnez-lui un nom (ex: "PILOTYS Transcription")
   - Sélectionnez le rôle **"Read"**
   - Copiez le token (il commence par `hf_`)
3. **Configurez le token dans vos variables d'environnement** :
   
   **En local** (`.env.local`) :
   ```env
   HUGGINGFACE_API_KEY=hf_votre_token_ici
   ```
   
   **Sur Vercel** :
   - Allez dans **Vercel Dashboard** → Votre projet → **Settings** → **Environment Variables**
   - Ajoutez `HUGGINGFACE_API_KEY` avec votre token
   - Assurez-vous qu'elle est définie pour **Production**
   - Redéployez l'application

**Quota gratuit Hugging Face** : 1000 requêtes par mois (largement suffisant pour la plupart des utilisateurs)

### Option 2 : OpenAI (Payant)

Si vous préférez utiliser OpenAI directement ou si vous dépassez le quota Hugging Face :

1. **Créez un compte OpenAI** sur [platform.openai.com](https://platform.openai.com)
2. **Générez une clé API** :
   - Allez dans **API Keys**
   - Cliquez sur **"Create new secret key"**
   - Copiez la clé (elle commence par `sk-`)
3. **Configurez la clé** :
   ```env
   OPENAI_API_KEY=sk-votre_cle_api_ici
   OPENAI_MODEL=gpt-4o-mini  # Optionnel, défaut: gpt-4o-mini
   ```

**Coûts OpenAI** :
- **Whisper (transcription)** : ~$0.006 par minute d'audio
- **GPT-4o-mini (amélioration)** : ~$0.15 par 1M tokens

**Exemple** : Une réunion de 30 minutes coûte environ **$0.18** avec OpenAI.

### Fallback Automatique

PILOTYS utilise automatiquement :
1. **Hugging Face** (gratuit) si `HUGGINGFACE_API_KEY` est configuré
2. **OpenAI** (payant) si Hugging Face n'est pas disponible et `OPENAI_API_KEY` est configuré

Vous pouvez configurer les deux pour avoir un fallback automatique.

## Comment utiliser

### Depuis une réunion existante

1. Allez dans **Réunions** → Ouvrez une réunion
2. Cliquez sur **"Analyser"** ou allez dans l'onglet **"Analyse"**
3. Dans la section compte rendu, cliquez sur **"Importer"**
4. Sélectionnez l'onglet **"Audio"**
5. Cliquez pour sélectionner votre fichier audio
6. Attendez la transcription (quelques minutes selon la durée)
7. Le compte rendu professionnel apparaît automatiquement dans l'éditeur
8. Cliquez sur **"Analyser"** pour extraire les décisions et actions

### Depuis une nouvelle réunion

1. Créez une nouvelle réunion
2. Dans le champ compte rendu, cliquez sur **"Importer"**
3. Sélectionnez l'onglet **"Audio"**
4. Uploadez votre fichier audio
5. Le compte rendu est généré automatiquement

## Qualité de l'audio

### Audio de bonne qualité
- ✅ Parole claire et distincte
- ✅ Peu de bruit de fond
- ✅ Un seul locuteur ou locuteurs bien séparés
- ✅ Pas d'écho ou de réverbération

### Audio de qualité moyenne (fonctionne aussi)
- ⚠️ Quelques bruits de fond
- ⚠️ Parole parfois peu claire
- ⚠️ Plusieurs locuteurs qui se chevauchent
- ⚠️ Qualité audio réduite

**PILOTYS peut traiter même les audios de qualité moyenne** grâce à l'amélioration automatique du texte transcrit.

## Amélioration automatique

Après la transcription, PILOTYS améliore automatiquement le texte pour :

- ✅ Supprimer les hésitations ("euh", "hum")
- ✅ Corriger les erreurs de transcription
- ✅ Améliorer la ponctuation et la structure
- ✅ Organiser en sections professionnelles
- ✅ Structurer les décisions et actions
- ✅ Rendre le texte lisible et professionnel

## Exemple de résultat

**Transcription brute** :
```
euh bonjour tout le monde alors euh on va commencer la réunion donc euh on a décidé de euh lancer le projet X parce que euh c'est important pour le client donc euh Jean va préparer le document pour vendredi
```

**Compte rendu professionnel généré** :
```html
<h2>Décisions prises</h2>
<p>Lancement du projet X pour répondre aux besoins du client.</p>

<h2>Actions à réaliser</h2>
<ul>
  <li>Préparer le document de présentation (Jean - Échéance : vendredi)</li>
</ul>
```

## Limitations

- **Taille maximale** : 25MB par fichier
- **Durée** : Pas de limite de durée, mais les fichiers très longs peuvent prendre plusieurs minutes à traiter
- **Langue** : Optimisé pour le français, mais fonctionne avec d'autres langues
- **Qualité minimale** : L'audio doit contenir de la parole audible (même de qualité moyenne)

## Dépannage

### Erreur : "OPENAI_API_KEY non configurée"

**Solution** : Configurez votre clé API OpenAI dans les variables d'environnement (voir section Configuration ci-dessus).

### Erreur : "Fichier trop volumineux"

**Solution** : Réduisez la taille du fichier audio ou utilisez un format plus compressé (MP3).

### Erreur : "Aucun texte transcrit"

**Solution** : 
- Vérifiez que l'audio contient bien de la parole
- Vérifiez que le volume est suffisant
- Essayez avec un autre fichier audio

### La transcription est de mauvaise qualité

**Solution** : 
- L'amélioration automatique devrait corriger la plupart des erreurs
- Vous pouvez toujours éditer manuellement le compte rendu généré
- Utilisez l'analyse automatique pour extraire les décisions et actions

## Astuces

1. **Enregistrez directement** : Utilisez votre téléphone ou un enregistreur pour capturer les réunions
2. **Qualité audio** : Même si l'audio n'est pas parfait, PILOTYS peut le traiter
3. **Durée** : Les réunions longues peuvent prendre quelques minutes à transcrire, c'est normal
4. **Édition** : Vous pouvez toujours éditer le compte rendu généré avant l'analyse
5. **Analyse automatique** : Après la transcription, utilisez l'analyse automatique pour extraire les décisions et actions

## Support

Si vous rencontrez des problèmes :
1. Vérifiez que `OPENAI_API_KEY` est bien configurée
2. Vérifiez les logs Vercel pour voir les erreurs détaillées
3. Contactez le support si le problème persiste

