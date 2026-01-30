# Guide de Réinitialisation de Mot de Passe

## Option 1 : Réinitialisation via Email (Recommandé)

### Étapes

1. Allez sur `/forgot-password` sur votre application
2. Entrez votre email : `rania.moutawafiq@hotmail.fr`
3. Cliquez sur "Envoyer le lien de réinitialisation"
4. Vérifiez votre boîte mail (y compris les spams)
5. Cliquez sur le lien reçu (valide 1 heure)
6. Définissez un nouveau mot de passe

### Si vous ne recevez pas l'email

Vérifiez que les variables SMTP sont configurées sur Vercel :
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`

## Option 2 : Réinitialisation Manuelle (Script)

Si vous avez besoin de réinitialiser le mot de passe immédiatement sans attendre la configuration SMTP :

### En local

```bash
# Assurez-vous que DATABASE_URL est configurée dans .env.local
npm run reset-password rania.moutawafiq@hotmail.fr VotreNouveauMotDePasse123
```

### Sur Vercel (via Vercel CLI)

```bash
# Installer Vercel CLI si nécessaire
npm i -g vercel

# Se connecter
vercel login

# Lier le projet
vercel link

# Exécuter le script avec les variables d'environnement Vercel
vercel env pull .env.local
npm run reset-password rania.moutawafiq@hotmail.fr VotreNouveauMotDePasse123
```

### Directement sur la base de données PostgreSQL

Si vous avez un accès direct à votre base de données Neon/PostgreSQL :

1. Connectez-vous à votre base de données
2. Générez un hash bcrypt pour votre nouveau mot de passe :

```bash
# En Node.js
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('VotreNouveauMotDePasse123', 10).then(hash => console.log(hash));"
```

3. Mettez à jour la base de données :

```sql
UPDATE "User" 
SET "passwordHash" = 'VOTRE_HASH_GENERE_CI_DESSUS' 
WHERE email = 'rania.moutawafiq@hotmail.fr';
```

## Sécurité

⚠️ **Important** :
- Les mots de passe sont hashés avec bcrypt (10 rounds)
- Ils ne sont jamais stockés en clair
- Utilisez un mot de passe fort (minimum 8 caractères, avec majuscules, minuscules, chiffres)
- Changez votre mot de passe régulièrement

## Dépannage

### Erreur : "Aucun utilisateur trouvé"
- Vérifiez que l'email est exactement : `rania.moutawafiq@hotmail.fr`
- L'email est sensible à la casse dans la recherche mais stocké en minuscules

### Erreur : "Le mot de passe doit contenir au moins 8 caractères"
- Utilisez un mot de passe d'au moins 8 caractères

### Erreur de connexion à la base de données
- Vérifiez que `DATABASE_URL` est correctement configurée
- Testez la connexion avec : `npm run db:check`

