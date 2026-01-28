# Fonctionnalité Meetings - Analyse de comptes rendus

## Configuration LLM (optionnel)

Pour utiliser un LLM pour l'analyse automatique, configurez une des variables d'environnement suivantes :

### OpenAI
```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini  # Optionnel, défaut: gpt-4o-mini
```

### Anthropic (Claude)
```bash
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022  # Optionnel, défaut: claude-3-5-sonnet-20241022
```

## Comportement

- **Avec LLM configuré** : 
  1. Utilise le prompt structuré pour extraire décisions/actions/points à clarifier
  2. Applique automatiquement une étape de déduplication et nettoyage avec le même LLM
- **Sans LLM** : Fallback sur extraction basique avec patterns regex (sans déduplication avancée)

## Format de sortie

L'API retourne toujours le même format JSON :

```json
{
  "decisions": [
    {
      "decision": "string",
      "contexte": "string",
      "impact_potentiel": "string"
    }
  ],
  "actions": [
    {
      "action": "string",
      "responsable": "string",
      "echeance": "string"
    }
  ],
  "points_a_clarifier": ["string"]
}
```

Les valeurs "non précisé" sont utilisées quand l'information n'est pas explicitement mentionnée dans le compte rendu.

